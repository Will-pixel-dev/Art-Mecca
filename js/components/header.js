/**
 * HEADER — Complete Header System
 * Standalone header with auth, avatar, notifications, and search
 *
 * Usage: Include this file after Firebase and your config
 */

// ============================================================
// HEADER INITIALIZATION
// ============================================================

function initHeader() {
  console.log("🔧 Initializing header system...");

  // Make sure Firebase is ready
  if (typeof firebase === "undefined" || !firebase.auth) {
    console.warn("⚠️ Firebase not ready, waiting...");
    setTimeout(initHeader, 500);
    return;
  }

  // 1. Mobile menu toggle
  initMobileMenu();

  // 2. Search overlay
  initSearch();

  // 3. Auth state (Firebase)
  initAuth();

  // 4. Notification system - with delay to ensure DOM is ready
  setTimeout(initNotificationSystem, 800);

  // 5. Avatar manager (if available)
  initAvatarManager();
}

// ============================================================
// MOBILE MENU
// ============================================================

function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  if (menuBtn && navLinks) {
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

    newMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      newMenuBtn.classList.toggle("open");
    });
  }
}

// ============================================================
// SEARCH OVERLAY
// ============================================================

function initSearch() {
  const searchBtn = document.getElementById("search-btn");
  const searchOverlay = document.getElementById("search-overlay");
  const searchClose = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");

  if (!searchBtn || !searchOverlay) return;

  const newSearchBtn = searchBtn.cloneNode(true);
  searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

  newSearchBtn.addEventListener("click", () => {
    searchOverlay.classList.add("active");
    searchOverlay.style.display = "flex";
    searchInput?.focus();
  });

  if (searchClose) {
    const newSearchClose = searchClose.cloneNode(true);
    searchClose.parentNode.replaceChild(newSearchClose, searchClose);

    newSearchClose.addEventListener("click", () => {
      searchOverlay.classList.remove("active");
      searchOverlay.style.display = "none";
    });
  }

  searchOverlay.addEventListener("click", (e) => {
    if (e.target === searchOverlay) {
      searchOverlay.classList.remove("active");
      searchOverlay.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
      searchOverlay.classList.remove("active");
      searchOverlay.style.display = "none";
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchOverlay.classList.toggle("active");
      if (searchOverlay.classList.contains("active")) {
        searchOverlay.style.display = "flex";
        searchInput?.focus();
      } else {
        searchOverlay.style.display = "none";
      }
    }
  });
}

// ============================================================
// AUTH STATE
// ============================================================

function initAuth() {
  if (typeof firebase === "undefined" || !firebase.auth) {
    console.warn("⚠️ Firebase auth not available");
    return;
  }

  firebase.auth().onAuthStateChanged(function (user) {
    console.log("🔐 Auth state changed:", user ? "Logged in" : "Logged out");

    const hybridStatus = document.getElementById("hybridStatus");
    const authButtons = document.getElementById("authButtons");
    const avatarContainer = document.getElementById("navAvatar");

    if (user) {
      if (hybridStatus) {
        hybridStatus.textContent = "● ONLINE";
        hybridStatus.classList.remove("offline");
      }

      if (authButtons) {
        authButtons.innerHTML = `
                    <button class="btn-icon" id="logoutBtn" title="Logout" style="background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 1.1rem; padding: 8px;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                `;
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", () => {
            firebase.auth().signOut();
            window.location.href = "/";
          });
        }
      }

      if (avatarContainer && window.avatarManager) {
        setTimeout(() => {
          window.avatarManager.renderAllAvatars();
          setTimeout(
            () => window.avatarManager.setupAvatarClickHandlers(),
            100,
          );
        }, 200);
      }

      setTimeout(initNotificationSystem, 300);
    } else {
      if (hybridStatus) {
        hybridStatus.textContent = "● OFFLINE";
        hybridStatus.classList.add("offline");
      }

      if (authButtons) {
        authButtons.innerHTML = `
                    <a href="pages/auth/login.html" class="btn btn-outline btn-sm">Log In</a>
                    <a href="pages/auth/register.html" class="btn btn-primary btn-sm">Sign Up</a>
                `;
      }

      if (avatarContainer) {
        avatarContainer.innerHTML = "";
      }

      const badge = document.getElementById("notificationBadge");
      if (badge) badge.style.display = "none";
    }
  });
}

// ============================================================
// AVATAR MANAGER
// ============================================================

function initAvatarManager() {
  if (typeof window.avatarManager !== "undefined") {
    console.log("✅ AvatarManager already exists");
    return;
  }

  if (typeof AvatarManager === "undefined") {
    console.warn("⚠️ AvatarManager class not found");
    return;
  }

  if (typeof firebase !== "undefined" && firebase.auth) {
    setTimeout(() => {
      window.avatarManager = new AvatarManager({
        containerSelector: ".nav-avatar-container",
        size: "md",
      });
      console.log("✅ AvatarManager initialized");
    }, 500);
  }
}

// ============================================================
// NOTIFICATION SYSTEM
// ============================================================

function initNotificationSystem() {
  console.log("🔔 Initializing notification system...");

  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationDropdown");
  const notificationBadge = document.getElementById("notificationBadge");

  if (!notificationBtn) {
    console.error("❌ Notification button not found");
    return;
  }

  console.log("✅ Notification elements found");

  const newBtn = notificationBtn.cloneNode(true);
  notificationBtn.parentNode.replaceChild(newBtn, notificationBtn);

  newBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    e.preventDefault();

    console.log("🔔 Notification bell clicked");

    const avatarDropdown = document.getElementById("avatarDropdown");
    if (avatarDropdown) {
      avatarDropdown.style.display = "none";
      avatarDropdown.classList.remove("active");
    }

    const isVisible = notificationDropdown.style.display === "block";
    notificationDropdown.style.display = isVisible ? "none" : "block";
    notificationDropdown.classList.toggle("active", !isVisible);

    if (!isVisible) {
      const user = firebase.auth().currentUser;
      if (user) {
        loadNotifications(user.uid);
      }
    }
  });

  document.addEventListener("click", function (e) {
    const container = e.target.closest(".notification-container");
    if (!container) {
      if (notificationDropdown) {
        notificationDropdown.style.display = "none";
        notificationDropdown.classList.remove("active");
      }
    }
  });

  const markAllBtn = document.getElementById("markAllReadBtn");
  if (markAllBtn) {
    const newMarkBtn = markAllBtn.cloneNode(true);
    markAllBtn.parentNode.replaceChild(newMarkBtn, markAllBtn);
    newMarkBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      console.log("📋 Mark all as read clicked");
      markAllNotificationsRead();
    });
  }

  const user = firebase.auth().currentUser;
  if (user) {
    console.log("👤 User logged in, loading notifications");
    setTimeout(() => loadNotifications(user.uid), 300);
    setupNotificationListener(user.uid);
  } else {
    console.log("👤 No user logged in");
    if (notificationBadge) notificationBadge.style.display = "none";
    if (notificationDropdown) {
      const list = notificationDropdown.querySelector(".notification-list");
      if (list) {
        list.innerHTML = `
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>Log in to see notifications</p>
                    </div>
                `;
      }
    }
  }

  console.log("✅ Notification system initialized");
}

// ============================================================
// SETUP REAL-TIME NOTIFICATION LISTENER
// ============================================================

let notificationUnsubscribe = null;

function setupNotificationListener(userId) {
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }

  console.log("📡 Setting up real-time notification listener for:", userId);

  notificationUnsubscribe = firebase
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(10)
    .onSnapshot(
      (snapshot) => {
        console.log(
          "📡 Notification snapshot received, changes:",
          snapshot.docChanges().length,
        );

        const notifications = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            type: data.type || "like",
            read: data.read || false,
            data: data.data || {},
            createdAt: data.createdAt || null,
            message: data.message || "",
          });
        });

        const unreadCount = notifications.filter((n) => !n.read).length;
        const badge = document.getElementById("notificationBadge");
        if (badge) {
          if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
            badge.style.display = "flex";
          } else {
            badge.style.display = "none";
          }
        }

        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown && dropdown.style.display === "block") {
          renderNotifications(notifications);
        }
      },
      (error) => {
        console.error("❌ Notification listener error:", error);
      },
    );
}

// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

async function loadNotifications(userId) {
  const notificationList = document.getElementById("notificationList");
  const notificationBadge = document.getElementById("notificationBadge");

  if (!notificationList) return;

  try {
    console.log("📥 Loading notifications for user:", userId);

    const snapshot = await firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type || "like",
        read: data.read || false,
        data: data.data || {},
        createdAt: data.createdAt || null,
        message: data.message || "",
      });
    });

    console.log(`📥 Loaded ${notifications.length} notifications`);

    const unreadCount = notifications.filter((n) => !n.read).length;
    if (notificationBadge) {
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
        notificationBadge.style.display = "flex";
      } else {
        notificationBadge.style.display = "none";
      }
    }

    renderNotifications(notifications);
  } catch (error) {
    console.error("❌ Error loading notifications:", error);
    notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading notifications</p>
            </div>
        `;
  }
}

// ============================================================
// RENDER NOTIFICATIONS — WITH MESSAGE SUPPORT
// ============================================================

function renderNotifications(notifications) {
  const notificationList = document.getElementById("notificationList");
  if (!notificationList) return;

  if (notifications.length === 0) {
    notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        `;
    return;
  }

  notificationList.innerHTML = notifications
    .map((notif) => {
      const type = notif.type || "like";
      const data = notif.data || {};
      const timeAgo = formatTimeAgo(notif.createdAt);
      const unreadClass = notif.read ? "" : "unread";

      let iconClass = "like";
      let iconHtml = '<i class="fas fa-heart"></i>';
      let text = "New notification";
      let link = "#";

      const userName =
        data.fromUserName ||
        data.userName ||
        data.username ||
        data.name ||
        data.displayName ||
        "Someone";
      const userId =
        data.fromUserId ||
        data.userId ||
        data.targetId ||
        data.shadowerId ||
        "";
      const artworkId = data.artworkId || data.artworkID || data.postId || "";
      const commentId = data.commentId || "";
      const artworkTitle = data.artworkTitle || "artwork";
      const conversationId = data.conversationId || "";
      const msgPreview = data.preview || data.message || "";

      switch (type) {
        case "like":
          iconClass = "like";
          iconHtml = '<i class="fas fa-heart"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> liked your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "cheer":
          iconClass = "cheer";
          iconHtml = '<i class="fas fa-glass-cheers"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> cheered for your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "shadow":
          iconClass = "shadow";
          iconHtml = '<i class="fas fa-eye"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> started shadowing you`;
          link = `pages/community/profiles.html?user=${userId}`;
          break;
        case "comment":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-comment"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> commented on your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "mention":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-at"></i>';
          const mentionPreview = data.commentPreview || data.preview || "";
          text = `<strong>${escapeHtml(userName)}</strong> mentioned you in a comment on <em>${escapeHtml(artworkTitle)}</em>`;
          if (commentId) {
            link = `pages/community/artwork-detail.html?id=${artworkId}&comment=${commentId}`;
          } else {
            link = `pages/community/artwork-detail.html?id=${artworkId}`;
          }
          if (mentionPreview) {
            text += `<div style="font-size: 0.75rem; color: var(--text-muted, #5a3a6a); margin-top: 2px; font-weight: normal;">"${escapeHtml(mentionPreview)}"</div>`;
          }
          break;
        case "message":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-envelope"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> sent you a message`;
          if (msgPreview) {
            text += `<div style="font-size: 0.75rem; color: var(--text-muted, #5a3a6a); margin-top: 2px; font-weight: normal;">"${escapeHtml(msgPreview)}"</div>`;
          }
          link = `pages/community/messages.html`;
          break;
        default:
          iconClass = "like";
          iconHtml = '<i class="fas fa-bell"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> ${notif.message || "interacted with you"}`;
          link = notif.link || "#";
      }

      return `
            <a href="${link}" class="notification-item ${unreadClass}" data-id="${notif.id}" data-read="${notif.read || false}">
                <div class="notification-icon ${iconClass}">
                    ${iconHtml}
                </div>
                <div class="notification-content">
                    <div class="notification-text">${text}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            </a>
        `;
    })
    .join("");

  document.querySelectorAll(".notification-item.unread").forEach((item) => {
    item.addEventListener("click", function (e) {
      const id = this.dataset.id;
      if (id) {
        markNotificationRead(id);
        this.classList.remove("unread");
        const badge = document.getElementById("notificationBadge");
        if (badge) {
          const current = parseInt(badge.textContent) || 0;
          if (current > 0) {
            badge.textContent = current - 1;
            if (badge.textContent === "0") badge.style.display = "none";
          }
        }
      }
    });
  });
}

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================

async function markNotificationRead(notificationId) {
  try {
    const user = firebase.auth().currentUser;
    if (!user) return;

    await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .doc(notificationId)
      .update({ read: true });

    console.log("✅ Notification marked as read:", notificationId);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
  }
}

// ============================================================
// MARK ALL AS READ
// ============================================================

async function markAllNotificationsRead() {
  try {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const snapshot = await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();

    if (snapshot.empty) {
      console.log("📋 No unread notifications");
      return;
    }

    const batch = firebase.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    console.log("✅ All notifications marked as read");

    document.querySelectorAll(".notification-item.unread").forEach((item) => {
      item.classList.remove("unread");
    });

    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.style.display = "none";
    }

    const badgeCount = document.querySelector(".notification-badge");
    if (badgeCount) badgeCount.style.display = "none";
  } catch (error) {
    console.error("❌ Error marking all as read:", error);
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Just now";

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

  if (isNaN(date.getTime())) return "Just now";

  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// INIT ON DOM READY
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(initHeader, 300);
  });
} else {
  setTimeout(initHeader, 300);
}
