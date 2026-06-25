// Notifications System - Works with dynamic navbar
let notificationsInitialized = false;

class NotificationsSystem {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.unsubscribe = null;
        this.init();
    }

    async init() {
        console.log('🔔 NotificationsSystem initializing...');

        // Wait for Firebase auth to be ready
        firebase.auth().onAuthStateChanged(async (user) => {
            console.log('🔔 Auth state changed:', user ? `Logged in as ${user.uid}` : 'Not logged in');

            if (!user) {
                this.currentUser = null;
                this.hideNotificationUI();
                return;
            }

            this.currentUser = user;
            this.showNotificationUI();
            await this.loadNotifications();
            this.setupEventListeners();
            this.startListening();
        });
    }

    showNotificationUI() {
        const badge = document.getElementById('notificationBadge');
        const dropdown = document.getElementById('notificationDropdown');
        const btn = document.getElementById('notificationBtn');

        if (badge) badge.style.display = 'flex';
        if (btn) btn.style.display = 'flex';
    }

    hideNotificationUI() {
        const badge = document.getElementById('notificationBadge');
        const dropdown = document.getElementById('notificationDropdown');

        if (badge) badge.style.display = 'none';
        if (dropdown) dropdown.style.display = 'none';
    }

    async loadNotifications() {
        if (!this.currentUser) return;

        try {
            // Try to get from authManager first
            if (typeof authManager !== 'undefined' && authManager.getNotifications) {
                this.notifications = await authManager.getNotifications(this.currentUser.uid, 20);
            } else {
                // Fallback: direct Firestore query
                this.notifications = await this.fetchNotificationsFromFirestore();
            }

            this.updateBadge();
            this.updateDropdown();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async fetchNotificationsFromFirestore() {
        const db = firebase.firestore();
        const snapshot = await db.collection('users')
            .doc(this.currentUser.uid)
            .collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            read: doc.data().read || false
        }));
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    updateDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        const list = document.getElementById('notificationList');
        if (!dropdown || !list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        // Show only latest 5 in dropdown
        const latest = this.notifications.slice(0, 5);
        list.innerHTML = latest.map(notif => this.renderNotificationItem(notif)).join('');

        // Re-attach click handlers to new items
        this.attachNotificationClickHandlers();
    }

    renderNotificationItem(notification) {
        const type = notification.type || 'like';
        const data = notification.data || {};
        const timeAgo = this.formatTimeAgo(notification.createdAt);
        const unreadClass = notification.read ? '' : 'unread';

        let iconClass = 'like';
        let iconHtml = '<i class="fas fa-heart"></i>';
        let text = 'New notification';
        let link = '#';

        switch(type) {
            case 'like':
                iconClass = 'like';
                iconHtml = '<i class="fas fa-heart"></i>';
                text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> liked your artwork`;
                link = `/pages/community/artwork-detail.html?id=${data.artworkId || ''}`;
                break;
            case 'cheer':
                iconClass = 'cheer';
                iconHtml = '<i class="fas fa-glass-cheers"></i>';
                text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> cheered for your artwork`;
                link = `/pages/community/artwork-detail.html?id=${data.artworkId || ''}`;
                break;
            case 'shadow':
                iconClass = 'shadow';
                iconHtml = '<i class="fas fa-eye"></i>';
                text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> started shadowing you`;
                link = `/pages/community/profile.html?user=${data.userId || ''}`;
                break;
            case 'comment':
                iconClass = 'comment';
                iconHtml = '<i class="fas fa-comment"></i>';
                text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> commented on your artwork`;
                link = `/pages/community/artwork-detail.html?id=${data.artworkId || ''}`;
                break;
        }

        return `
            <a href="${link}" class="notification-item ${unreadClass}" data-id="${notification.id}" data-read="${notification.read}">
                <div class="notification-icon ${iconClass}">
                    ${iconHtml}
                </div>
                <div class="notification-content">
                    <div class="notification-text">${text}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            </a>
        `;
    }

    attachNotificationClickHandlers() {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.removeEventListener('click', this.handleNotificationClick);
            item.addEventListener('click', this.handleNotificationClick.bind(this));
        });
    }

    async handleNotificationClick(e) {
        const item = e.currentTarget;
        const notificationId = item.dataset.id;
        const isRead = item.dataset.read === 'true';

        if (!isRead && notificationId && this.currentUser) {
            try {
                await this.markAsRead(notificationId);
                item.classList.remove('unread');
                item.dataset.read = 'true';

                // Update badge
                const updatedNotif = this.notifications.find(n => n.id === notificationId);
                if (updatedNotif) updatedNotif.read = true;
                this.updateBadge();
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    }

    async markAsRead(notificationId) {
        if (typeof authManager !== 'undefined' && authManager.markNotificationAsRead) {
            await authManager.markNotificationAsRead(this.currentUser.uid, notificationId);
        } else {
            const db = firebase.firestore();
            await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('notifications')
                .doc(notificationId)
                .update({ read: true });
        }
    }

    async markAllAsRead() {
        if (!this.currentUser) return;

        const unreadIds = this.notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        try {
            if (typeof authManager !== 'undefined' && authManager.markAllNotificationsAsRead) {
                await authManager.markAllNotificationsAsRead(this.currentUser.uid);
            } else {
                const db = firebase.firestore();
                const batch = db.batch();
                unreadIds.forEach(id => {
                    const ref = db.collection('users')
                        .doc(this.currentUser.uid)
                        .collection('notifications')
                        .doc(id);
                    batch.update(ref, { read: true });
                });
                await batch.commit();
            }

            this.notifications.forEach(n => { n.read = true; });
            this.updateBadge();
            this.updateDropdown();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    setupEventListeners() {
        const btn = document.getElementById('notificationBtn');
        const dropdown = document.getElementById('notificationDropdown');
        const markAllBtn = document.getElementById('markAllReadBtn');

        if (btn) {
            btn.removeEventListener('click', this.toggleDropdown);
            btn.addEventListener('click', this.toggleDropdown.bind(this));
        }

        if (markAllBtn) {
            markAllBtn.removeEventListener('click', this.handleMarkAllRead);
            markAllBtn.addEventListener('click', this.handleMarkAllRead.bind(this));
        }

        // Close dropdown when clicking outside
        document.removeEventListener('click', this.handleClickOutside);
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    toggleDropdown(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    handleClickOutside(e) {
        const dropdown = document.getElementById('notificationDropdown');
        const btn = document.getElementById('notificationBtn');
        if (dropdown && btn) {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        }
    }

    handleMarkAllRead(e) {
        e.stopPropagation();
        this.markAllAsRead();
    }

    startListening() {
        if (!this.currentUser) return;

        // Real-time listener for new notifications
        const db = firebase.firestore();
        this.unsubscribe = db.collection('users')
            .doc(this.currentUser.uid)
            .collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                let hasChanges = false;
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const newNotif = { id: change.doc.id, ...change.doc.data() };
                        this.notifications.unshift(newNotif);
                        hasChanges = true;
                    } else if (change.type === 'modified') {
                        const index = this.notifications.findIndex(n => n.id === change.doc.id);
                        if (index !== -1) {
                            this.notifications[index] = { ...this.notifications[index], ...change.doc.data() };
                        }
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    this.updateBadge();
                    this.updateDropdown();
                }
            });
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Just now';

        let date;
        if (timestamp && timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp && timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) return 'Just now';

        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

        const years = Math.floor(days / 365);
        return `${years} year${years === 1 ? '' : 's'} ago`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
let notificationsSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔔 Initializing notifications system...');
    notificationsSystem = new NotificationsSystem();
});
