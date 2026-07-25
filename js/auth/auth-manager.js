// ================================================================
// AUTH-MANAGER.JS — COMPLETE FIXED VERSION
// ================================================================

class AuthManager {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.currentUser = null;
    this.updateScheduled = false;
    this.isModerator = false;
    this.notificationDropdownOpen = false;
    this.init();
  }

  init() {
    this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => console.log("✅ Auth persistence set to LOCAL"))
      .catch((error) => console.error("Persistence error:", error));

    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      console.log("Auth state changed:", user ? user.email : "No user");

      this.updateUI();

      if (user) {
        this.checkModeratorStatus();
        this.showNotificationBell(true);
        setTimeout(() => this.setupNotificationHandlers(), 500);
        this.updateUnreadCount(user.uid);
      } else {
        this.showNotificationBell(false);
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) dropdown.style.display = 'none';
        this.notificationDropdownOpen = false;
      }

      window.dispatchEvent(new CustomEvent("authStateChanged", { detail: { user } }));
    });

    window.addEventListener("pageshow", () => this.updateUI());
  }

  showNotificationBell(visible) {
    const container = document.querySelector('.notification-container');
    if (container) {
      if (visible) {
        container.classList.add('visible');
      } else {
        container.classList.remove('visible');
      }
    }
  }

  renderAuthUI(container) {
    if (!container) return;

    container.innerHTML = '';

    if (this.currentUser) {
      container.className = 'auth-buttons logged-in';
      container.style.display = 'none';

      if (window.avatarManager) {
        setTimeout(() => window.avatarManager.renderAllAvatars(), 100);
      }
    } else {
      container.className = 'auth-buttons logged-out';
      container.style.display = 'flex';

      container.innerHTML = `
        <a href="/pages/auth/login.html" class="user-btn" aria-label="Login" style="
          text-decoration: none;
          color: rgba(26, 26, 46, 0.5);
          padding: 6px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          transition: all 0.3s ease;
        ">
          <i class="fas fa-user"></i>
        </a>
        <a href="/pages/auth/register.html" class="signup-btn" style="
          padding: 8px 18px;
          border-radius: 8px;
          text-decoration: none;
          background: linear-gradient(135deg, #fe67ea, #63dbee);
          color: white;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          white-space: nowrap;
          border: none;
          transition: all 0.3s ease;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
        ">
          Sign Up
        </a>
      `;
    }
  }

  updateUI() {
    if (this.updateScheduled) return;
    this.updateScheduled = true;

    setTimeout(() => {
      const authContainer = document.querySelector(".auth-buttons");
      if (!authContainer) {
        console.log("Auth container not found, retrying...");
        this.updateScheduled = false;
        setTimeout(() => this.updateUI(), 200);
        return;
      }
      this.renderAuthUI(authContainer);
      this.updateSidebarUI();
      this.updateScheduled = false;
    }, 10);
  }

  updateSidebarUI() {
    const userNameSpan = document.getElementById("sidebarUserName");
    const loginLink = document.getElementById("sidebarLoginLink");

    if (userNameSpan && loginLink) {
      if (this.currentUser) {
        const displayName = this.currentUser.displayName || this.currentUser.email.split("@")[0];
        userNameSpan.textContent = displayName;
        loginLink.textContent = "Logout";
        loginLink.href = "#";
        loginLink.onclick = (e) => { e.preventDefault(); this.logout(); };
      } else {
        userNameSpan.textContent = "Guest User";
        loginLink.textContent = "Sign In";
        loginLink.href = "/pages/auth/login.html";
        loginLink.onclick = null;
      }
    }
  }

  async checkModeratorStatus() {
    if (!this.currentUser) return false;
    try {
      const doc = await this.db.collection('users').doc(this.currentUser.uid).get();
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

  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      if (userCredential.user) {
        await this.db.collection('users').doc(userCredential.user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
      }
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async register(email, password, fullName, dateOfBirth) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await user.updateProfile({ displayName: fullName });

      await this.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        dateOfBirth: dateOfBirth || null,
        photoURL: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        role: 'user',
        isModerator: false,
        unreadNotifications: 0,
        bio: '',
        location: '',
        website: '',
        socialLinks: {}
      });

      this.currentUser = user;
      this.updateUI();
      return { success: true, user };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async googleLogin() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await this.auth.signInWithPopup(provider);
      const user = result.user;

      const docRef = this.db.collection('users').doc(user.uid);
      const doc = await docRef.get();

      if (!doc.exists) {
        await docRef.set({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          role: 'user',
          isModerator: false,
          unreadNotifications: 0,
          bio: '',
          location: '',
          website: '',
          socialLinks: {}
        });
        console.log('✅ Google user profile created');
      } else {
        await docRef.update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      this.currentUser = user;
      this.updateUI();
      return { success: true, user };
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error) || 'Google login failed'
      };
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.showNotificationBell(false);
      if (window.avatarManager) {
        window.avatarManager.clearCache();
      }
      window.location.href = "/index.html";
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // ============================================
  // NOTIFICATION SYSTEM
  // ============================================

  setupNotificationHandlers() {
    const notifBtn = document.getElementById("notificationBtn");
    const dropdown = document.getElementById("notificationDropdown");

    if (!notifBtn || !dropdown) return;

    const newBtn = notifBtn.cloneNode(true);
    notifBtn.parentNode.replaceChild(newBtn, notifBtn);

    const positionDropdown = () => {
      const rect = newBtn.getBoundingClientRect();
      const dropdownWidth = 380;
      let left = rect.right - dropdownWidth;
      if (left < 10) left = 10;

      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.left = `${left}px`;
      dropdown.style.right = 'auto';
    };

    newBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
        this.notificationDropdownOpen = false;
        return;
      }

      positionDropdown();
      dropdown.style.display = "block";
      this.notificationDropdownOpen = true;

      if (this.currentUser) {
        const notificationList = document.getElementById("notificationList");
        const notifications = await this.getNotifications(this.currentUser.uid, 5);
        if (notificationList) {
          if (notifications.length === 0) {
            notificationList.innerHTML = `
              <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
              </div>
            `;
          } else {
            notificationList.innerHTML = notifications
              .map(n => this.renderNotificationItem(n))
              .join("");
          }
        }

        const markBtn = document.getElementById("markAllReadBtn");
        if (markBtn) {
          markBtn.onclick = async () => {
            await this.markAllNotificationsAsRead(this.currentUser.uid);
            dropdown.style.display = "none";
            this.notificationDropdownOpen = false;
          };
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (this.notificationDropdownOpen &&
          !dropdown.contains(e.target) &&
          !newBtn.contains(e.target)) {
        dropdown.style.display = "none";
        this.notificationDropdownOpen = false;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.notificationDropdownOpen) {
        dropdown.style.display = "none";
        this.notificationDropdownOpen = false;
      }
    });

    window.addEventListener("resize", () => {
      if (dropdown.style.display === "block") positionDropdown();
    });
  }

  renderNotificationItem(notification) {
    const type = notification.type || 'like';
    const data = notification.data || {};
    const timeAgo = this.formatTimeAgoNotification(notification.createdAt);
    const unreadClass = notification.read ? "" : "unread";

    let iconHtml = '<i class="fas fa-heart"></i>';
    let text = 'New notification';
    let bgColor = '#fee2e2';
    let iconColor = '#ef4444';
    let link = '/pages/community/notifications.html';

    switch (type) {
        case 'like':
            iconHtml = '<i class="fas fa-heart"></i>';
            text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> liked your artwork <strong>"${this.escapeHtml(data.artworkTitle || 'Artwork')}"</strong>`;
            bgColor = '#fee2e2';
            iconColor = '#ef4444';
            link = `/pages/community/artwork-detail.html?id=${data.artworkId}`;
            break;

        case 'cheer':
            iconHtml = '<i class="fas fa-glass-cheers"></i>';
            text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> cheered for your artwork <strong>"${this.escapeHtml(data.artworkTitle || 'Artwork')}"</strong>`;
            bgColor = '#fef3c7';
            iconColor = '#f59e0b';
            link = `/pages/community/artwork-detail.html?id=${data.artworkId}`;
            break;

        case 'shadow':
            iconHtml = '<i class="fas fa-eye"></i>';
            text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> started shadowing you`;
            bgColor = '#e0e7ff';
            iconColor = '#4f46e5';
            link = `/pages/community/profiles.html?user=${data.userId}`;
            break;

        case 'comment':
            iconHtml = '<i class="fas fa-comment"></i>';
            const commentPreview = data.comment ? `: "${this.escapeHtml(data.comment.substring(0, 60))}"` : '';
            text = `<strong>${this.escapeHtml(data.userName || 'Someone')}</strong> commented on your artwork <strong>"${this.escapeHtml(data.artworkTitle || 'Artwork')}"</strong>${commentPreview}`;
            bgColor = '#dcfce7';
            iconColor = '#10b981';
            link = `/pages/community/artwork-detail.html?id=${data.artworkId}`;
            break;

        case 'mention':
            iconHtml = '<i class="fas fa-at"></i>';
            const mentionPreview = data.comment ? `: "${this.escapeHtml(data.comment.substring(0, 60))}"` : '';
            text = `<strong>${this.escapeHtml(data.fromUserName || 'Someone')}</strong> mentioned you in a comment on <strong>"${this.escapeHtml(data.artworkTitle || 'Artwork')}"</strong>${mentionPreview}`;
            bgColor = '#e0e7ff';
            iconColor = '#8b5cf6';
            link = data.artworkId ? `/pages/community/artwork-detail.html?id=${data.artworkId}` : '/pages/community/notifications.html';
            break;

        case 'message':
            iconHtml = '<i class="fas fa-envelope"></i>';
            const messagePreview = data.message ? `: "${this.escapeHtml(data.message.substring(0, 60))}"` : '';
            text = `<strong>${this.escapeHtml(data.fromUserName || 'Someone')}</strong> sent you a message${messagePreview}`;
            bgColor = '#dbeafe';
            iconColor = '#3b82f6';
            link = data.conversationId ? `/pages/community/messages.html?conversation=${data.conversationId}` : '/pages/community/messages.html';
            break;

        default:
            iconHtml = '<i class="fas fa-bell"></i>';
            text = 'New notification';
            bgColor = '#f1f5f9';
            iconColor = '#64748b';
            link = '/pages/community/notifications.html';
    }

    return `
        <a href="${link}" class="notification-item ${unreadClass}">
            <div class="notification-icon" style="background: ${bgColor}; color: ${iconColor};">
                ${iconHtml}
            </div>
            <div class="notification-content">
                <div class="notification-text">${text}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
        </a>
    `;
}

  formatTimeAgoNotification(timestamp) {
    if (!timestamp) return "Just now";
    let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  async createNotification(userId, type, data) {
    if (!userId) return;
    try {
      await this.db.collection("users").doc(userId).collection("notifications").add({
        type, data, read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  async updateUnreadCount(userId) {
    try {
      const snapshot = await this.db.collection("users").doc(userId).collection("notifications")
        .where("read", "==", false).get();
      const unreadCount = snapshot.size;

      await this.db.collection("users").doc(userId).set({
        unreadNotifications: unreadCount
      }, { merge: true });

      const badge = document.getElementById('notificationBadge');
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
          badge.className = 'notification-badge show';
          badge.style.display = 'flex';
        } else {
          badge.className = 'notification-badge';
          badge.textContent = '0';
          badge.style.display = 'none';
        }
      }

      window.dispatchEvent(new CustomEvent("notificationsUpdated", { detail: { unreadCount } }));
    } catch (error) {
      console.error("Error updating unread count:", error);
    }
  }

  async getNotifications(userId, limit = 20) {
    try {
      const snapshot = await this.db.collection("users").doc(userId).collection("notifications")
        .orderBy("createdAt", "desc").limit(limit).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      const snapshot = await this.db.collection("users").doc(userId).collection("notifications")
        .where("read", "==", false).get();

      if (snapshot.empty) return;

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => batch.update(doc.ref, { read: true }));
      await batch.commit();
      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  // ============================================
  // UTILITY
  // ============================================

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getErrorMessage(error) {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email. Please sign up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/operation-not-allowed': 'This login method is not enabled.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email. Please sign in with your original method.',
      'auth/popup-closed-by-user': 'The popup was closed before signing in. Please try again.'
    };
    return messages[error.code] || error.message || 'An error occurred. Please try again.';
  }

  async getUserProfile(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      if (doc.exists) {
        return { success: true, data: doc.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(userId, data) {
    try {
      await this.db.collection('users').doc(userId).update(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }
}

// ================================================================
// CREATE GLOBAL INSTANCE
// ================================================================

let authManager;

function initAuthManager() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    authManager = new AuthManager();
    console.log('✅ AuthManager initialized');
  } else {
    console.log('⏳ Waiting for Firebase...');
    setTimeout(initAuthManager, 200);
  }
}

initAuthManager();

window.checkAuth = function() {
  if (authManager && authManager.currentUser) {
    console.log("Logged in as:", authManager.currentUser.email);
    return true;
  }
  console.log("Not logged in");
  return false;
};

window.getCurrentUser = function() {
  return authManager ? authManager.currentUser : null;
};

window.getUserId = function() {
  return authManager ? authManager.getUserId() : null;
};

window.isLoggedIn = function() {
  return authManager ? authManager.isLoggedIn() : false;
};
