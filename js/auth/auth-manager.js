// auth-manager.js - COMPLETE FIXED VERSION

class AuthManager {
  constructor() {
    this.auth = firebase.auth();
    // Use the global db from firebase-config.js
    // If db is not defined, create it
    if (typeof db === "undefined") {
      console.warn("db not defined, creating local instance");
      this.db = firebase.firestore();
    } else {
      this.db = db;
    }
    this.currentUser = null;
    this.dropdownOpen = false;
    this.updateScheduled = false;
    this.init();
  }

  init() {
    // Set persistence to LOCAL
    this.auth
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => console.log("✅ Auth persistence set to LOCAL"))
      .catch((error) => console.error("Persistence error:", error));

    // Listen for auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      console.log("Auth state changed:", user ? user.email : "No user");
      this.updateUI();
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: { user: user } }),
      );
    });

    // Listen for page navigation
    window.addEventListener("pageshow", () => this.updateUI());
  }

  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(
        email,
        password,
      );
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Register a new user with Date of Birth
   */
  async register(email, password, fullname, dateOfBirth) {
    try {
      console.log("Register called with:", { email, fullname, dateOfBirth });

      // Validate age (must be at least 13)
      const age = this.calculateAge(dateOfBirth);
      console.log("Calculated age:", age);

      if (age < 13) {
        return {
          success: false,
          error: "You must be at least 13 years old to join Art Mecca.",
        };
      }

      console.log("Creating user...");
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;
      console.log("User created:", user.uid);

      // Update display name
      await user.updateProfile({ displayName: fullname });

      // Send verification email
      try {
        await user.sendEmailVerification();
        console.log("Verification email sent");
      } catch (emailError) {
        console.warn("Could not send verification email:", emailError);
      }

      const isAdult = age >= 18;

      // Create user document in Firestore
      const userData = {
        fullname: fullname,
        username: this.generateUsername(fullname),
        email: email,
        dateOfBirth: dateOfBirth,
        age: age,
        isAdult: isAdult,
        isIdentityVerified: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        profileComplete: false,
        avatar: this.generateAvatar(fullname),
        bio: "",
        socialLinks: {},
        stats: {
          artworks: 0,
          challengesCompleted: 0,
          followers: 0,
          following: 0,
        },
        nsfwPreferences: {
          enabled: false,
          showBlurred: true,
        },
        nsfwContent: {
          canView: isAdult,
          canCreate: isAdult,
        },
        role: "user",
        ageVerified: false,
      };

      console.log("Saving user data to Firestore...");
      // Use this.db (which is either the global db or a local instance)
      await this.db.collection("users").doc(user.uid).set(userData);

      console.log("User registration complete!");

      return {
        success: true,
        user: user,
        message: "Verification email sent! Please check your inbox.",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;

    try {
      let birthDate;
      if (typeof dateOfBirth === "string") {
        const parts = dateOfBirth.split("-");
        if (parts.length === 3) {
          birthDate = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
          );
        } else {
          birthDate = new Date(dateOfBirth);
        }
      } else if (dateOfBirth instanceof Date) {
        birthDate = dateOfBirth;
      } else {
        birthDate = new Date(dateOfBirth);
      }

      if (isNaN(birthDate.getTime())) {
        console.error("Invalid date:", dateOfBirth);
        return 0;
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      console.log(`Age calculation: ${dateOfBirth} -> ${age} years`);
      return age;
    } catch (error) {
      console.error("Error calculating age:", error);
      return 0;
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      window.location.href = "/index.html";
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUserData() {
    if (!this.currentUser) return null;
    try {
      const userDoc = await this.db
        .collection("users")
        .doc(this.currentUser.uid)
        .get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  // ============================================
  // NOTIFICATION SYSTEM METHODS
  // ============================================

  async createNotification(userId, type, data) {
    if (!userId) return;

    const notification = {
      id: Date.now().toString(),
      type: type,
      data: data,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await this.db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .add(notification);

      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  async updateUnreadCount(userId) {
    try {
      const snapshot = await this.db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .where("read", "==", false)
        .get();

      const unreadCount = snapshot.size;

      await this.db
        .collection("users")
        .doc(userId)
        .update({ unreadNotifications: unreadCount });

      window.dispatchEvent(
        new CustomEvent("notificationsUpdated", {
          detail: { unreadCount: unreadCount },
        }),
      );
    } catch (error) {
      console.error("Error updating unread count:", error);
    }
  }

  async markNotificationAsRead(userId, notificationId) {
    try {
      await this.db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc(notificationId)
        .update({ read: true });

      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      const snapshot = await this.db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .where("read", "==", false)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  async getNotifications(userId, limit = 20) {
    try {
      const snapshot = await this.db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }
  // In renderAuthUI method, replace the dropdown menu section with this:

renderAuthUI(container) {
    if (this.currentUser) {
        const displayName =
            this.currentUser.displayName || this.currentUser.email.split("@")[0];
        const avatarLetter = displayName.charAt(0).toUpperCase();

        container.innerHTML = `
            <div class="user-menu" style="position: relative; display: inline-block;">
                <button class="user-avatar-btn" id="user-avatar-btn" style="background: none; border: none; cursor: pointer; padding: 0; margin: 0;">
                    <div style="background: linear-gradient(135deg, #fe67ea, #63dbee); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem;">${avatarLetter}</div>
                </button>
                <div class="user-dropdown" id="user-dropdown" style="display: none; position: fixed; background: #1a1a2e; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); min-width: 220px; z-index: 1000; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.03); border-radius: 12px 12px 0 0;">
                        <div style="font-weight: 600; color: white;">${this.escapeHtml(displayName)}</div>
                        <div style="font-size: 11px; color: #a0aec0;">${this.escapeHtml(this.currentUser.email)}</div>
                    </div>

                    <!-- Profile Link -->
                    <a href="/pages/community/profiles.html?user=${this.currentUser.uid}" class="dropdown-item" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; text-decoration: none; color: #c4b8ff; transition: all 0.2s; border-left: 3px solid transparent;">
                        <i class="fas fa-user" style="width: 18px; color: #fe67ea;"></i> My Profile
                    </a>

                    <!-- Account Settings Link -->
                    <a href="/pages/account/settings.html" class="dropdown-item" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; text-decoration: none; color: #c4b8ff; transition: all 0.2s; border-left: 3px solid transparent;">
                        <i class="fas fa-cog" style="width: 18px; color: #63dbee;"></i> Account Settings
                    </a>

                    <!-- Moderation Dashboard (only for mods/admins) -->
                    ${this.currentUser && this.isModerator ? `
                        <a href="/pages/admin/moderation.html" class="dropdown-item" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; text-decoration: none; color: #c4b8ff; transition: all 0.2s; border-left: 3px solid transparent; background: rgba(254, 103, 234, 0.05);">
                            <i class="fas fa-shield-alt" style="width: 18px; color: #fe67ea;"></i> Moderation Dashboard
                            <span style="font-size: 0.6rem; background: #ef4444; color: white; padding: 2px 6px; border-radius: 10px; margin-left: auto;">Admin</span>
                        </a>
                    ` : ''}

                    <!-- My Artwork -->
                    <a href="/pages/community/gallery.html?user=${this.currentUser.uid}" class="dropdown-item" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; text-decoration: none; color: #c4b8ff; transition: all 0.2s; border-left: 3px solid transparent;">
                        <i class="fas fa-images" style="width: 18px; color: #f59e0b;"></i> My Artwork
                    </a>

                    <!-- My Uploads -->
                    <a href="/pages/community/my-uploads.html" class="dropdown-item" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; text-decoration: none; color: #c4b8ff; transition: all 0.2s; border-left: 3px solid transparent;">
                        <i class="fas fa-cloud-upload-alt" style="width: 18px; color: #10b981;"></i> My Uploads
                    </a>
                    // In renderAuthUI, add this to the dropdown:
                    <a href="/pages/community/profile-enhanced.html?user=${this.currentUser.uid}" class="dropdown-item" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; text-decoration: none; color: #c4b8ff; transition: all 0.2s; border-left: 3px solid transparent;">
                       <i class="fas fa-user" style="width: 18px; color: #fe67ea;"></i> My Profile (Enhanced)
                    </a>

                    <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 4px 12px;"></div>

                    <!-- Logout -->
                    <button class="dropdown-item logout-btn" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: none; border: none; cursor: pointer; color: #ef4444; width: 100%; text-align: left; transition: all 0.2s; border-radius: 0 0 12px 12px;">
                        <i class="fas fa-sign-out-alt" style="width: 18px;"></i> Logout
                    </button>
                </div>
            </div>
        `;

        // Check if user is moderator and update UI accordingly
        this.checkModeratorStatus().then(() => {
            // Re-render if needed
        });

        this.setupNotificationBell();
    } else {
        container.innerHTML = `
            <a href="/pages/auth/login.html" class="btn-icon user-btn" aria-label="Login" style="text-decoration: none; color: #c4b8ff;">
                <i class="fas fa-user" style="font-size: 1.2rem;"></i>
            </a>
            <a href="/pages/auth/register.html" class="btn btn-primary signup-btn" style="padding: 8px 16px; border-radius: 8px; text-decoration: none; margin-left: 8px; background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; font-weight: 600;">Sign Up</a>
        `;
    }
}

// Add this method to check if user is a moderator
async checkModeratorStatus() {
    if (!this.currentUser) return false;

    try {
        const doc = await db.collection('users').doc(this.currentUser.uid).get();
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

  // ============================================
  // END NOTIFICATION SYSTEM
  // ============================================

  generateUsername(fullname) {
    const baseUsername = fullname.toLowerCase().replace(/\s+/g, "");
    const randomNum = Math.floor(Math.random() * 1000);
    return `${baseUsername}${randomNum}`;
  }

  generateAvatar(name) {
    const colors = ["#f705d7", "#ff4ae7", "#ff73e5", "#6a5acd", "#14b8a6"];
    const color = colors[name.length % colors.length];
    return {
      backgroundColor: color,
      text: name.charAt(0).toUpperCase(),
      type: "generated",
    };
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
        const displayName =
          this.currentUser.displayName || this.currentUser.email.split("@")[0];
        userNameSpan.textContent = displayName;
        loginLink.textContent = "Logout";
        loginLink.href = "#";
        loginLink.onclick = (e) => {
          e.preventDefault();
          this.logout();
        };
      } else {
        userNameSpan.textContent = "Guest User";
        loginLink.textContent = "Sign In";
        loginLink.href = "/pages/auth/login.html";
        loginLink.onclick = null;
      }
    }
  }
  // In renderAuthUI method, replace the dropdown menu section with this:

renderAuthUI(container) {
    if (this.currentUser) {
        // User is logged in - show NOTHING in the auth container
        // The avatar is handled by avatar-manager.js
        container.innerHTML = '';
        // The avatar-manager.js will show the avatar with dropdown
    } else {
        // Not logged in - show login/signup buttons
        container.innerHTML = `
            <a href="/pages/auth/login.html" class="btn-icon user-btn" aria-label="Login" style="text-decoration: none; color: #c4b8ff;">
                <i class="fas fa-user" style="font-size: 1.2rem;"></i>
            </a>
            <a href="/pages/auth/register.html" class="btn btn-primary signup-btn" style="
                padding: 8px 16px;
                border-radius: 8px;
                text-decoration: none;
                margin-left: 8px;
                background: linear-gradient(135deg, #fe67ea, #63dbee);
                color: white;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
                font-size: 0.85rem;
            ">
                Sign Up
            </a>
        `;
    }
}

  // ... rest of the notification and UI methods remain the same ...

  setupNotificationBell() {
    if (!this.currentUser) return;

    const authButtons = document.querySelector(".auth-buttons");
    const navActions = document.querySelector(".nav-actions");

    if (navActions && !document.querySelector(".notification-container")) {
      const notifContainer = document.createElement("div");
      notifContainer.className = "notification-container";
      notifContainer.innerHTML = `
            <button class="btn-icon notification-btn" id="notificationBtn">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </button>
            <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
                <div class="notification-header">
                    <h3>Notifications</h3>
                    <button id="markAllReadBtn" class="mark-read-btn">Mark all as read</button>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>No notifications yet</p>
                    </div>
                </div>
                <div class="notification-footer">
                    <a href="/pages/community/notifications.html">View All</a>
                </div>
            </div>
        `;

      navActions.insertBefore(notifContainer, authButtons);

      this.setupNotificationDropdown();
      this.updateUnreadCount(this.currentUser.uid);

      window.addEventListener("notificationsUpdated", (e) => {
        const badge = document.getElementById("notificationBadge");
        if (badge) {
          const count = e.detail.unreadCount;
          if (count > 0) {
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = "flex";
          } else {
            badge.style.display = "none";
          }
        }
      });
    }
  }

  setupNotificationDropdown() {
    const notifBtn = document.getElementById("notificationBtn");
    const dropdown = document.getElementById("notificationDropdown");
    const notificationList = document.getElementById("notificationList");

    if (notifBtn && dropdown) {
      notifBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === "block";
        dropdown.style.display = isVisible ? "none" : "block";

        if (!isVisible && this.currentUser) {
          const notifications = await this.getNotifications(
            this.currentUser.uid,
            5,
          );
          if (notifications.length === 0) {
            notificationList.innerHTML =
              '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
          } else {
            notificationList.innerHTML = notifications
              .map((n) => this.renderNotificationItem(n))
              .join("");
          }

          const markBtn = document.getElementById("markAllReadBtn");
          if (markBtn) {
            markBtn.onclick = async () => {
              await this.markAllNotificationsAsRead(this.currentUser.uid);
              dropdown.style.display = "none";
            };
          }
        }
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
          dropdown.style.display = "none";
        }
      });
    }
  }

  renderNotificationItem(notification) {
    const type = notification.type;
    const data = notification.data;
    const timeAgo = this.formatTimeAgoNotification(notification.createdAt);
    const unreadClass = notification.read ? "" : "unread";

    let iconClass = "";
    let iconHtml = "";
    let text = "";

    switch (type) {
      case "like":
        iconClass = "like";
        iconHtml = '<i class="fas fa-heart"></i>';
        text = `<strong>${this.escapeHtml(data.userName)}</strong> liked your artwork`;
        break;
      case "cheer":
        iconClass = "cheer";
        iconHtml = '<i class="fas fa-glass-cheers"></i>';
        text = `<strong>${this.escapeHtml(data.userName)}</strong> cheered for your artwork`;
        break;
      case "shadow":
        iconClass = "shadow";
        iconHtml = '<i class="fas fa-eye"></i>';
        text = `<strong>${this.escapeHtml(data.userName)}</strong> started shadowing you`;
        break;
      case "comment":
        iconClass = "comment";
        iconHtml = '<i class="fas fa-comment"></i>';
        text = `<strong>${this.escapeHtml(data.userName)}</strong> commented on your artwork`;
        break;
      default:
        iconClass = "like";
        iconHtml = '<i class="fas fa-bell"></i>';
        text = "New notification";
    }

    return `
      <a href="/pages/community/notifications.html" class="notification-item ${unreadClass}">
        <div class="notification-icon ${iconClass}">${iconHtml}</div>
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
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  }

  setupDropdown() {
    const avatarBtn = document.getElementById("user-avatar-btn");
    const dropdown = document.getElementById("user-dropdown");

    if (!avatarBtn || !dropdown) return;

    let isOpen = false;
    const positionDropdown = () => {
      const rect = avatarBtn.getBoundingClientRect();
      dropdown.style.position = "fixed";
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.right = `${window.innerWidth - rect.right}px`;
      dropdown.style.left = "auto";
    };

    const toggleDropdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isOpen) {
        positionDropdown();
        dropdown.style.display = "block";
        isOpen = true;
      } else {
        dropdown.style.display = "none";
        isOpen = false;
      }
    };

    const closeDropdown = (e) => {
      if (
        isOpen &&
        !avatarBtn.contains(e.target) &&
        !dropdown.contains(e.target)
      ) {
        dropdown.style.display = "none";
        isOpen = false;
      }
    };

    avatarBtn.addEventListener("click", toggleDropdown);
    document.addEventListener("click", closeDropdown);
    window.addEventListener("resize", () => {
      if (isOpen) positionDropdown();
    });

    const logoutBtn = dropdown.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    });
  }

  getErrorMessage(error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return error.message;
    }
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }
}

// Create global instance
const authManager = new AuthManager();

// Helper function
window.checkAuth = function () {
  if (authManager && authManager.currentUser) {
    console.log("Logged in as:", authManager.currentUser.email);
    return true;
  }
  console.log("Not logged in");
  return false;
};
