/**
 * Avatar Manager - Universal Profile Picture System
 * Handles loading, caching, and displaying user avatars across the entire site
 */

class AvatarManager {
    constructor(options = {}) {
        this.userId = null;
        this.userData = null;
        this.avatarUrl = null;
        this.cacheKey = 'avatar_data';
        this.isOwnProfile = false;
        this.avatarContainer = options.containerSelector || '.nav-avatar-container';
        this.avatarSize = options.size || 'md'; // Changed default to 'sm' for smaller avatar
        this.dropdownItems = options.dropdownItems || [];
        this.isModerator = false;

        // Initialize Firebase auth listener
        this.initAuth();
    }

    /**
     * Initialize authentication listener
     */
    initAuth() {
        if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
            console.warn('Firebase auth not available, retrying...');
            setTimeout(() => this.initAuth(), 500);
            return;
        }

        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.userId = user.uid;
                await this.loadUserData();
                await this.checkModeratorStatus();
                this.renderAllAvatars();
                this.setupAvatarClickHandlers();
            } else {
                // User not logged in - show default or nothing
                this.renderLoggedOutState();
            }
        });
    }

    /**
     * Check if user is a moderator or admin
     */
    async checkModeratorStatus() {
        if (!this.userId) return false;

        try {
            const doc = await db.collection('users').doc(this.userId).get();
            if (doc.exists) {
                const data = doc.data();
                this.isModerator = data.role === 'admin' || data.role === 'moderator' || data.isModerator === true;
                return this.isModerator;
            }
            return false;
        } catch (error) {
            console.error('Error checking moderator status:', error);
            return false;
        }
    }

    /**
     * Load user data from Firestore with caching
     */
    async loadUserData() {
        if (!this.userId) return;

        // Check cache first
        const cached = this.getCachedData();
        if (cached && cached.userId === this.userId) {
            this.userData = cached.data;
            this.avatarUrl = cached.data.profilePicture || null;
            return;
        }

        try {
            const doc = await db.collection('users').doc(this.userId).get();
            if (doc.exists) {
                this.userData = doc.data();
                this.avatarUrl = this.userData.profilePicture || null;
                this.cacheData(this.userId, this.userData);
            } else {
                // User doc doesn't exist yet, create one
                await this.createUserDocument();
                // Reload data
                const newDoc = await db.collection('users').doc(this.userId).get();
                if (newDoc.exists) {
                    this.userData = newDoc.data();
                    this.avatarUrl = this.userData.profilePicture || null;
                    this.cacheData(this.userId, this.userData);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    /**
     * Create user document if it doesn't exist
     */
    async createUserDocument() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            await db.collection('users').doc(user.uid).set({
                fullname: user.displayName || user.email?.split('@')[0] || 'Artist',
                username: user.email?.split('@')[0] || 'artist',
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    artworks: 0,
                    followers: 0,
                    following: 0,
                    totalLikes: 0
                },
                bio: 'Hello! I am an artist on Art Mecca.',
                role: 'user',
                isAdult: false,
                ageVerified: false,
                socialLinks: {},
                heroBackground: '',
                heroOverlay: '',
                badge: null,
                profilePicture: ''
            });
            console.log('✅ User document created with avatar support!');
        } catch (error) {
            console.error('Error creating user:', error);
        }
    }

    /**
     * Cache user data in localStorage
     */
    cacheData(userId, data) {
        try {
            const cacheData = {
                userId: userId,
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            // localStorage full or unavailable
            console.warn('Could not cache avatar data:', error);
        }
    }

    /**
     * Get cached user data
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;

            const data = JSON.parse(cached);
            // Check if cache is older than 5 minutes
            if (Date.now() - data.timestamp > 5 * 60 * 1000) {
                return null;
            }
            return data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Clear cached data
     */
    clearCache() {
        localStorage.removeItem(this.cacheKey);
    }

    /**
     * Get user's display name or fallback
     */
    getDisplayName() {
        if (!this.userData) return 'User';
        return this.userData.fullname || this.userData.username || 'User';
    }

    /**
     * Get user's initials for fallback avatar
     */
    getInitials() {
        const name = this.getDisplayName();
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Get avatar URL
     */
    getAvatarUrl() {
        return this.avatarUrl || null;
    }

    /**
     * Render avatar in all containers on the page
     */
    renderAllAvatars() {
        const containers = document.querySelectorAll(this.avatarContainer);
        containers.forEach(container => {
            this.renderAvatar(container);
        });

        // Also render any specific avatar containers with IDs
        const specificContainers = document.querySelectorAll('[data-avatar-container]');
        specificContainers.forEach(container => {
            this.renderAvatar(container);
        });
    }

    /**
     * Render avatar in a specific container
     */
    renderAvatar(container) {
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        // If user is logged in, show avatar
        if (this.userId && this.userData) {
            this.buildAvatarElement(container);
        } else {
            // Show login link or nothing
            this.buildLoggedOutElement(container);
        }
    }

    /**
     * Build the avatar HTML element
     */
    buildAvatarElement(container) {
        const avatarUrl = this.getAvatarUrl();
        const initials = this.getInitials();
        const displayName = this.getDisplayName();
        const size = container.dataset.size || this.avatarSize;

        // Wrapper div - now with smaller size
        const wrapper = document.createElement('div');
        wrapper.className = `avatar-wrapper avatar-${size}`;
        wrapper.title = displayName;
        wrapper.dataset.userId = this.userId;
        wrapper.style.cursor = 'pointer';

        // Avatar image or initials
        if (avatarUrl) {
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.alt = displayName;
            img.loading = 'lazy';
            img.onerror = () => {
                // If image fails to load, show initials
                wrapper.innerHTML = `<span class="avatar-initials">${initials}</span>`;
            };
            wrapper.appendChild(img);
        } else {
            const initialsSpan = document.createElement('span');
            initialsSpan.className = 'avatar-initials';
            initialsSpan.textContent = initials;
            wrapper.appendChild(initialsSpan);
        }

        container.appendChild(wrapper);

        // Store reference for dropdown
        container.dataset.userId = this.userId;
    }

    /**
     * Build logged out state
     */
    buildLoggedOutElement(container) {
        const wrapper = document.createElement('div');
        wrapper.className = `avatar-wrapper avatar-${this.avatarSize}`;
        wrapper.style.cursor = 'pointer';
        wrapper.title = 'Login';

        const link = document.createElement('a');
        link.href = '/pages/auth/login.html';
        link.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-decoration:none;color:white;';
        link.innerHTML = '<i class="fas fa-user" style="font-size:0.8rem;opacity:0.6;"></i>';

        wrapper.appendChild(link);
        container.appendChild(wrapper);
    }

    /**
     * Render logged out state in all containers
     */
    renderLoggedOutState() {
        const containers = document.querySelectorAll(this.avatarContainer);
        containers.forEach(container => {
            this.buildLoggedOutElement(container);
        });
    }

    /**
     * Setup click handlers for avatar dropdown
     */
    setupAvatarClickHandlers() {
        const containers = document.querySelectorAll(this.avatarContainer);
        containers.forEach(container => {
            const wrapper = container.querySelector('.avatar-wrapper');
            if (wrapper) {
                // Remove existing click listeners
                const newWrapper = wrapper.cloneNode(true);
                wrapper.parentNode.replaceChild(newWrapper, wrapper);

                newWrapper.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(container);
                });
            }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest(this.avatarContainer)) {
                document.querySelectorAll('.avatar-dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    /**
     * Toggle avatar dropdown
     */
    toggleDropdown(container) {
        // Remove any existing dropdown
        const existingDropdown = container.querySelector('.avatar-dropdown');
        if (existingDropdown) {
            existingDropdown.classList.toggle('active');
            return;
        }

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'avatar-dropdown active';

        // Username
        const username = document.createElement('div');
        username.className = 'dropdown-username';
        username.textContent = `@${this.userData?.username || 'user'}`;
        dropdown.appendChild(username);

        // Divider
        const divider1 = document.createElement('div');
        divider1.className = 'dropdown-divider';
        dropdown.appendChild(divider1);

        // My Profile link
        const profileItem = document.createElement('a');
        profileItem.className = 'dropdown-item';
        profileItem.href = `/pages/community/profiles.html?user=${this.userId}`;
        profileItem.innerHTML = '<i class="fas fa-user"></i> My Profile';
        dropdown.appendChild(profileItem);

        // My Uploads link
        const uploadsItem = document.createElement('a');
        uploadsItem.className = 'dropdown-item';
        uploadsItem.href = '/pages/community/my-uploads.html';
        uploadsItem.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> My Uploads';
        dropdown.appendChild(uploadsItem);

        // Account Settings link
        const settingsItem = document.createElement('a');
        settingsItem.className = 'dropdown-item';
        settingsItem.href = '/pages/account/settings.html';
        settingsItem.innerHTML = '<i class="fas fa-cog"></i> Account Settings';
        dropdown.appendChild(settingsItem);

        // Moderation Dashboard (only for mods/admins)
        if (this.isModerator) {
            const modItem = document.createElement('a');
            modItem.className = 'dropdown-item';
            modItem.href = '/pages/admin/moderation.html';
            modItem.innerHTML = '<i class="fas fa-shield-alt"></i> Moderation Dashboard';
            modItem.style.borderLeft = '3px solid #fe67ea';
            modItem.style.background = 'rgba(254, 103, 234, 0.05)';
            dropdown.appendChild(modItem);
        }

        // Divider before logout
        const divider2 = document.createElement('div');
        divider2.className = 'dropdown-divider';
        dropdown.appendChild(divider2);

        // Logout button (now in dropdown)
        const logoutItem = document.createElement('button');
        logoutItem.className = 'dropdown-item';
        logoutItem.style.color = '#ef4444';
        logoutItem.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutItem.addEventListener('click', () => {
            this.handleLogout();
        });
        dropdown.appendChild(logoutItem);

        container.appendChild(dropdown);

        // Position dropdown
        const rect = container.getBoundingClientRect();
        dropdown.style.top = 'calc(100% + 12px)';
        dropdown.style.right = '0';
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await firebase.auth().signOut();
            this.clearCache();
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Update avatar across all containers
     * Call this after uploading a new profile picture
     */
    async updateAvatar(newUrl) {
        this.avatarUrl = newUrl;
        if (this.userData) {
            this.userData.profilePicture = newUrl;
            this.cacheData(this.userId, this.userData);
        }
        this.renderAllAvatars();
        this.setupAvatarClickHandlers();

        // Dispatch event for other components to listen
        const event = new CustomEvent('avatarUpdated', {
            detail: { userId: this.userId, avatarUrl: newUrl }
        });
        document.dispatchEvent(event);
    }

    /**
     * Upload a new profile picture
     */
    async uploadProfilePicture(file) {
        if (!this.userId) {
            console.error('No user ID found');
            return null;
        }

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return null;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File must be less than 5MB');
            return null;
        }

        try {
            // Show loading state
            const loadingMsg = document.getElementById('uploadLoading');
            if (loadingMsg) {
                loadingMsg.style.display = 'block';
                loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading avatar...';
            }

            // Upload to Firebase Storage
            const storageRef = firebase.storage().ref();
            const filePath = `avatars/${this.userId}/profile-picture.jpg`;
            const uploadTask = storageRef.child(filePath).put(file);

            const snapshot = await uploadTask;
            const downloadURL = await snapshot.ref.getDownloadURL();

            // Update Firestore
            await db.collection('users').doc(this.userId).update({
                profilePicture: downloadURL
            });

            // Update local data
            await this.updateAvatar(downloadURL);

            if (loadingMsg) {
                loadingMsg.style.display = 'none';
            }

            this.showToast('✅ Profile picture updated successfully!');
            return downloadURL;

        } catch (error) {
            console.error('Error uploading avatar:', error);
            const loadingMsg = document.getElementById('uploadLoading');
            if (loadingMsg) loadingMsg.style.display = 'none';
            this.showToast('Error uploading profile picture', 'error');
            return null;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        let toast = document.getElementById('customToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'customToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(26, 26, 46, 0.95);
                backdrop-filter: blur(12px);
                color: white;
                padding: 12px 24px;
                border-radius: 12px;
                z-index: 9999;
                font-weight: 500;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        if (type === 'error') {
            toast.style.borderColor = 'rgba(239,68,68,0.3)';
            toast.style.boxShadow = '0 8px 32px rgba(239,68,68,0.2)';
        } else {
            toast.style.borderColor = 'rgba(16,185,129,0.3)';
            toast.style.boxShadow = '0 8px 32px rgba(16,185,129,0.2)';
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if we should auto-init
    if (typeof window.autoInitAvatar === 'undefined' || window.autoInitAvatar !== false) {
        // Wait a moment for Firebase to be ready
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
                window.avatarManager = new AvatarManager();
            } else {
                console.warn('Firebase not ready, avatar manager will retry...');
                // Retry after 2 seconds
                setTimeout(() => {
                    if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
                        window.avatarManager = new AvatarManager();
                    }
                }, 2000);
            }
        }, 500);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarManager;
}
