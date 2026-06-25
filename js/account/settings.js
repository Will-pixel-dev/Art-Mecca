/**
 * Account Settings
 * Handles password changes, email changes, and profile updates
 */

class AccountSettings {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    async init() {
        // Check authentication
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;

            if (!user) {
                window.location.href = '/pages/auth/login.html';
                return;
            }

            await this.loadUserData();
            this.setupEventListeners();
            this.setupNavigation();
            this.setupPasswordStrength();
            this.populateForm();
        });
    }

    async loadUserData() {
        try {
            const doc = await db.collection('users').doc(this.currentUser.uid).get();
            if (doc.exists) {
                this.userData = doc.data();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    populateForm() {
        // Profile
        document.getElementById('displayName').value = this.userData?.fullname || '';
        document.getElementById('username').value = this.userData?.username || '';
        document.getElementById('bio').value = this.userData?.bio || '';
        document.getElementById('bioCount').textContent = (this.userData?.bio || '').length;

        // Email
        document.getElementById('currentEmail').value = this.currentUser.email || '';

        // Privacy
        document.getElementById('showEmail').checked = this.userData?.showEmail || false;
        document.getElementById('privateProfile').checked = this.userData?.privateProfile || false;
        document.getElementById('showNSFW').checked = this.userData?.nsfwPreferences?.enabled || false;

        // Notifications
        document.getElementById('emailNotifications').checked = this.userData?.notifications?.email !== false;
        document.getElementById('pushNotifications').checked = this.userData?.notifications?.push || false;
        document.getElementById('likeNotifications').checked = this.userData?.notifications?.likes !== false;
        document.getElementById('commentNotifications').checked = this.userData?.notifications?.comments !== false;
        document.getElementById('shadowNotifications').checked = this.userData?.notifications?.shadows !== false;
    }

    setupNavigation() {
        const links = document.querySelectorAll('.settings-nav-link');
        const sections = document.querySelectorAll('.settings-section');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Update active link
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show corresponding section
                const sectionId = link.dataset.section;
                sections.forEach(s => s.classList.remove('active'));
                document.getElementById(sectionId).classList.add('active');

                // Update URL hash
                history.pushState(null, '', `#${sectionId}`);
            });
        });

        // Handle hash on load
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const targetLink = document.querySelector(`[data-section="${hash}"]`);
            if (targetLink) {
                targetLink.click();
            }
        }
    }

    setupEventListeners() {
        // Password toggle buttons
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    btn.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            });
        });

        // Bio character count
        document.getElementById('bio')?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('bioCount').textContent = count;
            if (count > 500) {
                e.target.value = e.target.value.substring(0, 500);
                document.getElementById('bioCount').textContent = 500;
            }
        });

        // Update Profile
        document.getElementById('updateProfileBtn')?.addEventListener('click', () => {
            this.updateProfile();
        });

        // Change Password
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
            this.changePassword();
        });

        // Change Email
        document.getElementById('changeEmailBtn')?.addEventListener('click', () => {
            this.changeEmail();
        });

        // Save Notifications
        document.getElementById('saveNotificationsBtn')?.addEventListener('click', () => {
            this.saveNotifications();
        });

        // Save Privacy
        document.getElementById('savePrivacyBtn')?.addEventListener('click', () => {
            this.savePrivacy();
        });

        // Delete Account
        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
            this.deleteAccount();
        });

        // Deactivate Account
        document.getElementById('deactivateAccountBtn')?.addEventListener('click', () => {
            this.deactivateAccount();
        });

        // Export Data
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            this.exportData();
        });
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('newPassword');
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');

        if (!passwordInput) return;

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = this.calculatePasswordStrength(password);

            // Update bar
            strengthBar.innerHTML = `<div class="fill" style="width: ${strength}%; background: ${this.getStrengthColor(strength)};"></div>`;

            // Update text
            strengthText.textContent = this.getStrengthLabel(strength);
            strengthText.style.color = this.getStrengthColor(strength);
        });
    }

    calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        return Math.min(strength, 100);
    }

    getStrengthColor(strength) {
        if (strength < 40) return '#ef4444';
        if (strength < 70) return '#f59e0b';
        return '#10b981';
    }

    getStrengthLabel(strength) {
        if (strength < 40) return 'Weak';
        if (strength < 70) return 'Medium';
        return 'Strong';
    }

    // ========== PROFILE ==========

    async updateProfile() {
        const displayName = document.getElementById('displayName').value.trim();
        const username = document.getElementById('username').value.trim();
        const bio = document.getElementById('bio').value.trim();

        if (!displayName) {
            this.showToast('Please enter a display name', 'error');
            return;
        }

        if (!username) {
            this.showToast('Please enter a username', 'error');
            return;
        }

        if (bio.length > 500) {
            this.showToast('Bio must be 500 characters or less', 'error');
            return;
        }

        try {
            await db.collection('users').doc(this.currentUser.uid).update({
                fullname: displayName,
                username: username,
                bio: bio,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update display name in auth
            await this.currentUser.updateProfile({ displayName: displayName });

            this.showToast('✅ Profile updated successfully!');
            this.loadUserData();

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Error updating profile: ' + error.message, 'error');
        }
    }

    // ========== PASSWORD ==========

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword) {
            this.showToast('Please enter your current password', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showToast('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        // Re-authenticate user
        try {
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.currentUser.email,
                currentPassword
            );
            await this.currentUser.reauthenticateWithCredential(credential);

            // Change password
            await this.currentUser.updatePassword(newPassword);

            this.showToast('✅ Password changed successfully!');

            // Clear fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';

        } catch (error) {
            console.error('Error changing password:', error);
            if (error.code === 'auth/wrong-password') {
                this.showToast('Current password is incorrect', 'error');
            } else {
                this.showToast('Error changing password: ' + error.message, 'error');
            }
        }
    }

    // ========== EMAIL ==========

    async changeEmail() {
        const newEmail = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('emailPassword').value;

        if (!newEmail) {
            this.showToast('Please enter a new email address', 'error');
            return;
        }

        if (!password) {
            this.showToast('Please enter your password to confirm', 'error');
            return;
        }

        if (newEmail === this.currentUser.email) {
            this.showToast('New email is the same as current email', 'error');
            return;
        }

        try {
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.currentUser.email,
                password
            );
            await this.currentUser.reauthenticateWithCredential(credential);

            // Change email
            await this.currentUser.updateEmail(newEmail);

            // Update in Firestore
            await db.collection('users').doc(this.currentUser.uid).update({
                email: newEmail,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showToast('✅ Email changed successfully! Please verify your new email.');
            document.getElementById('currentEmail').value = newEmail;
            document.getElementById('newEmail').value = '';
            document.getElementById('emailPassword').value = '';

            // Send verification email
            await this.currentUser.sendEmailVerification();

        } catch (error) {
            console.error('Error changing email:', error);
            if (error.code === 'auth/wrong-password') {
                this.showToast('Password is incorrect', 'error');
            } else if (error.code === 'auth/email-already-in-use') {
                this.showToast('This email is already in use', 'error');
            } else {
                this.showToast('Error changing email: ' + error.message, 'error');
            }
        }
    }

    // ========== NOTIFICATIONS ==========

    async saveNotifications() {
        const preferences = {
            email: document.getElementById('emailNotifications').checked,
            push: document.getElementById('pushNotifications').checked,
            likes: document.getElementById('likeNotifications').checked,
            comments: document.getElementById('commentNotifications').checked,
            shadows: document.getElementById('shadowNotifications').checked
        };

        try {
            await db.collection('users').doc(this.currentUser.uid).update({
                notifications: preferences,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showToast('✅ Notification preferences saved!');

        } catch (error) {
            console.error('Error saving notifications:', error);
            this.showToast('Error saving preferences', 'error');
        }
    }

    // ========== PRIVACY ==========

    async savePrivacy() {
        const settings = {
            showEmail: document.getElementById('showEmail').checked,
            privateProfile: document.getElementById('privateProfile').checked,
            nsfwPreferences: {
                enabled: document.getElementById('showNSFW').checked,
                showBlurred: true
            }
        };

        try {
            await db.collection('users').doc(this.currentUser.uid).update({
                showEmail: settings.showEmail,
                privateProfile: settings.privateProfile,
                nsfwPreferences: settings.nsfwPreferences,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showToast('✅ Privacy settings saved!');

        } catch (error) {
            console.error('Error saving privacy settings:', error);
            this.showToast('Error saving privacy settings', 'error');
        }
    }

    // ========== DANGER ZONE ==========

    async deleteAccount() {
        if (!confirm('⚠️ Are you sure you want to delete your account? This action is PERMANENT and cannot be undone!')) {
            return;
        }

        if (!confirm('All your artwork, comments, and data will be permanently deleted. Are you absolutely sure?')) {
            return;
        }

        try {
            // Get user's artwork
            const artworks = await db.collection('artworks')
                .where('artistId', '==', this.currentUser.uid)
                .get();

            // Delete all artwork
            const batch = db.batch();
            artworks.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Delete user document
            batch.delete(db.collection('users').doc(this.currentUser.uid));

            await batch.commit();

            // Delete user authentication
            await this.currentUser.delete();

            this.showToast('Account deleted successfully');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);

        } catch (error) {
            console.error('Error deleting account:', error);
            if (error.code === 'auth/requires-recent-login') {
                this.showToast('Please log out and log back in to confirm your identity', 'error');
            } else {
                this.showToast('Error deleting account: ' + error.message, 'error');
            }
        }
    }

    async deactivateAccount() {
        if (!confirm('Are you sure you want to deactivate your account? You can reactivate it later.')) {
            return;
        }

        try {
            await db.collection('users').doc(this.currentUser.uid).update({
                status: 'deactivated',
                deactivatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Sign out
            await firebase.auth().signOut();

            this.showToast('Account deactivated successfully');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);

        } catch (error) {
            console.error('Error deactivating account:', error);
            this.showToast('Error deactivating account', 'error');
        }
    }

    async exportData() {
        try {
            this.showToast('Preparing your data...');

            // Get user data
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();

            // Get artworks
            const artworks = await db.collection('artworks')
                .where('artistId', '==', this.currentUser.uid)
                .get();

            const artworkData = artworks.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Get likes
            const likes = await db.collection('likes')
                .where('userId', '==', this.currentUser.uid)
                .get();

            const likeData = likes.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Build export object
            const exportData = {
                user: {
                    ...userData,
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    exportDate: new Date().toISOString()
                },
                artworks: artworkData,
                likes: likeData,
                totalArtworks: artworkData.length,
                totalLikes: likeData.length
            };

            // Create download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `art-mecca-data-${this.currentUser.uid}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast('✅ Data exported successfully!');

        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data', 'error');
        }
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * Admin: Reset user password
     * @param {string} email - User's email address
     */
    static async adminResetPassword(email) {
        if (!confirm(`Send password reset email to ${email}?`)) return;

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            alert('✅ Password reset email sent!');
        } catch (error) {
            console.error('Error sending reset email:', error);
            alert('Error: ' + error.message);
        }
    }

    /**
     * Admin: Change user email
     * @param {string} userId - User's UID
     * @param {string} newEmail - New email address
     */
    static async adminChangeEmail(userId, newEmail) {
        // This requires admin SDK - typically done via Cloud Function
        alert('This requires a Firebase Cloud Function with admin SDK. Contact developer.');
    }

    // ========== UTILITY ==========

    showToast(message, type = 'success') {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'toast-notification show';
            if (type === 'error') {
                toast.classList.add('error');
            } else {
                toast.classList.remove('error');
            }

            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        } else {
            alert(message);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.accountSettings = new AccountSettings();
});
