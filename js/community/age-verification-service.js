/**
 * Age Verification Service
 * Uses third-party provider (Sumsub/Jumio/Trulioo) with Unilink/QR code approach
 * Option 1: Simple redirect-based verification
 */

class AgeVerificationService {
    constructor() {
        this.provider = null;
        this.verificationInProgress = false;
        this.init();
    }

    init() {
        // Check if user is logged in
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
        });

        // Listen for verification callbacks
        this.setupCallbackListener();
    }

    /**
     * Configure the age verification provider
     * @param {string} provider - 'sumsub', 'jumio', 'trulioo', or 'custom'
     * @param {object} config - Provider-specific configuration
     */
    configure(provider, config = {}) {
        this.provider = provider;
        this.config = config;
        console.log(`Age Verification configured with ${provider}`);
    }

    /**
     * Start age verification process
     * @param {string} redirectUrl - Where to redirect after verification
     */
    async startVerification(redirectUrl = window.location.href) {
        if (!this.currentUser) {
            alert('Please login first to verify your age.');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        if (this.verificationInProgress) {
            return;
        }

        // Check if already verified
        const isVerified = await this.isUserVerified(this.currentUser.uid);
        if (isVerified) {
            alert('✅ You are already age verified!');
            return;
        }

        this.verificationInProgress = true;

         try {
        // Generate verification token
        const verificationToken = await this.generateVerificationToken(this.currentUser.uid);

        // Create verification link with callback URL
        const callbackUrl = window.CONFIG?.WEBHOOK_URL || 'https://artmecca.com/api/verification-callback';
        const verificationLink = this.getVerificationLink(verificationToken, callbackUrl);

        // Open in new tab
        window.open(verificationLink, '_blank');

        // Show waiting message
        this.showWaitingMessage();
        } catch (error) {
            console.error('Error starting verification:', error);
            alert('Failed to start age verification. Please try again.');
            this.verificationInProgress = false;
        }
    }

    /**
     * Get verification link based on provider
     */
    getVerificationLink(token, redirectUrl) {
        // Get user's email for pre-filling
        const email = this.currentUser.email || '';
        const name = this.currentUser.displayName || '';

        switch (this.provider) {
            case 'sumsub':
                // Sumsub Unilink approach
                return `https://api.sumsub.com/verify/unilink/${token}?redirect=${encodeURIComponent(redirectUrl)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&userId=${this.currentUser.uid}` ;

            case 'jumio':
                // Jumio's simple verification link
                return `https://verify.jumio.com/start?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`;

            case 'trulioo':
                // Trulioo's verification link
                return `https://verify.trulioo.com/start?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`;

            case 'custom':
                // Custom provider URL
                return `${this.config.baseUrl}/verify?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`;

            default:
                throw new Error('No verification provider configured');
        }
    }

    /**
     * Generate a verification token and store in Firestore
     */
    async generateVerificationToken(userId) {
        const token = this.generateRandomToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

        try {
            await firebase.firestore()
                .collection('users')
                .doc(userId)
                .collection('verification')
                .doc('pending')
                .set({
                    token: token,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    expiresAt: expiresAt,
                    status: 'pending',
                    provider: this.provider
                });

            return token;
        } catch (error) {
            console.error('Error generating verification token:', error);
            throw new Error('Failed to generate verification token');
        }
    }

    /**
     * Generate a random token
     */
    generateRandomToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    /**
     * Check if user is already verified
     */
    async isUserVerified(userId) {
        try {
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(userId)
                .get();

            if (userDoc.exists) {
                const data = userDoc.data();
                return data.isAdult === true && data.ageVerified === true;
            }
            return false;
        } catch (error) {
            console.error('Error checking verification status:', error);
            return false;
        }
    }

    /**
     * Setup callback listener for verification completion
     * This listens for redirects from the verification provider
     */
    setupCallbackListener() {
        // Check if we're returning from verification
        const urlParams = new URLSearchParams(window.location.search);
        const verificationStatus = urlParams.get('verification');
        const token = urlParams.get('token');

        if (verificationStatus === 'success' && token) {
            this.handleVerificationSuccess(token);
        } else if (verificationStatus === 'failed') {
            this.handleVerificationFailed();
        }

        // Also listen for postMessage events (for popup-based verification)
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'verification_complete') {
                this.handleVerificationSuccess(event.data.token);
            }
        });
    }

    /**
     * Handle successful verification
     */
    async handleVerificationSuccess(token) {
        try {
            // Find the user associated with this token
            const snapshot = await firebase.firestore()
                .collectionGroup('verification')
                .where('token', '==', token)
                .where('status', '==', 'pending')
                .get();

            if (snapshot.empty) {
                console.warn('No pending verification found for token:', token);
                return;
            }

            const doc = snapshot.docs[0];
            const userId = doc.ref.parent.parent.id; // Get the user ID from the path

            // Update user document
            await firebase.firestore()
                .collection('users')
                .doc(userId)
                .update({
                    isAdult: true,
                    ageVerified: true,
                    ageVerifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    verificationMethod: this.provider || 'third_party',
                    verificationToken: token,
                    nsfwPreferences: {
                        enabled: true,
                        showBlurred: false
                    },
                    nsfwContent: {
                        canView: true,
                        canCreate: true
                    }
                });

            // Mark verification as completed
            await doc.ref.update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Store session verification
            sessionStorage.setItem('nsfw_age_verified', 'true');

            this.verificationInProgress = false;

            // Show success message
            this.showToast('✅ Age verified successfully! You now have access to mature content.');

            // Reload page to refresh content
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Error handling verification success:', error);
            this.showToast('Error verifying age. Please try again.', 'error');
        }
    }

    /**
     * Handle verification failure
     */
    handleVerificationFailed() {
        this.verificationInProgress = false;
        this.showToast('❌ Age verification failed. Please try again.', 'error');
    }

    /**
     * Show waiting message while verification is in progress
     */
    showWaitingMessage() {
        const message = document.createElement('div');
        message.id = 'verification-waiting';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        message.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
            <h3 style="margin-bottom: 0.5rem;">Age Verification in Progress</h3>
            <p style="color: #6b7280;">Please complete the verification in the popup window.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button onclick="document.getElementById('verification-waiting').remove()"
                        style="padding: 0.5rem 1.5rem; background: #e5e7eb; border: none; border-radius: 0.5rem; cursor: pointer;">
                    Close
                </button>
                <button onclick="window.location.reload()"
                        style="padding: 0.5rem 1.5rem; background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    I've Verified
                </button>
            </div>
        `;
        document.body.appendChild(message);

        // Auto-remove after 30 seconds (user should be back by then)
        setTimeout(() => {
            const el = document.getElementById('verification-waiting');
            if (el) el.remove();
        }, 30000);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Force re-verification for existing users
     */
    async forceReVerification(userId) {
        try {
            // Clear existing verification
            await firebase.firestore()
                .collection('users')
                .doc(userId)
                .update({
                    isAdult: false,
                    ageVerified: false,
                    ageVerifiedAt: null
                });

            sessionStorage.removeItem('nsfw_age_verified');

            // Start new verification
            await this.startVerification();

        } catch (error) {
            console.error('Error forcing re-verification:', error);
            throw error;
        }
    }
}

// Initialize the service globally
document.addEventListener('DOMContentLoaded', () => {
    window.ageVerification = new AgeVerificationService();

    // Configure with your chosen provider
    // For Sumsub:
    // window.ageVerification.configure('sumsub', {
    //     apiKey: 'YOUR_SUMSUB_API_KEY',
    //     // ... other config
    // });

    // For Jumio:
    // window.ageVerification.configure('jumio', {
    //     apiKey: 'YOUR_JUMIO_API_KEY',
    //     // ... other config
    // });

    // For Trulioo:
    // window.ageVerification.configure('trulioo', {
    //     apiKey: 'YOUR_TRULIOO_API_KEY',
    //     // ... other config
    // });

    // For custom provider:
    // window.ageVerification.configure('custom', {
    //     baseUrl: 'https://your-verification-service.com'
    // });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
