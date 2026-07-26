// notifications.js - Simplified (real-time listener only)

let notificationsInitialized = false;

class NotificationsSystem {
  constructor() {
    this.currentUser = null;
    this.unsubscribe = null;
    this.init();
  }

  async init() {
    console.log("🔔 NotificationsSystem initializing...");

    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        this.currentUser = null;
        return;
      }

      this.currentUser = user;
      await this.setupListener();
    });
  }

  async setupListener() {
    if (!this.currentUser) return;

    // Clean up existing listener
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    console.log(
      "📡 Setting up notification listener for:",
      this.currentUser.uid,
    );

    this.unsubscribe = firebase
      .firestore()
      .collection("users")
      .doc(this.currentUser.uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(10)
      .onSnapshot(
        (snapshot) => {
          let unreadCount = 0;
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.read) unreadCount++;
          });

          const badge = document.getElementById("notificationBadge");
          if (badge) {
            if (unreadCount > 0) {
              badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
              badge.style.display = "flex";
            } else {
              badge.style.display = "none";
            }
          }

          // If dropdown is open, update it
          const dropdown = document.getElementById("notificationDropdown");
          if (dropdown && dropdown.style.display === "block") {
            this.loadNotifications();
          }
        },
        (error) => {
          console.error("❌ Notification listener error:", error);
        },
      );
  }

  async loadNotifications() {
    if (!this.currentUser) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      const notifications = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          read: data.read || false,
        });
      });

      this.updateDropdown(notifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }

  updateDropdown(notifications) {
    const list = document.getElementById("notificationList");
    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
      return;
    }

    list.innerHTML = notifications
      .map((notif) => this.renderItem(notif))
      .join("");
  }

  renderItem(notification) {
    const type = notification.type || "like";
    const data = notification.data || {};
    const timeAgo = this.formatTimeAgo(notification.createdAt);
    const unreadClass = notification.read ? "" : "unread";

    let iconClass = "like";
    let iconHtml = '<i class="fas fa-heart"></i>';
    let text = "New notification";
    let link = "#";

    switch (type) {
      case "like":
        iconClass = "like";
        iconHtml = '<i class="fas fa-heart"></i>';
        text = `<strong>${this.escapeHtml(data.userName || "Someone")}</strong> liked your artwork`;
        link = `/pages/community/artwork-detail.html?id=${data.artworkId || ""}`;
        break;
      case "cheer":
        iconClass = "cheer";
        iconHtml = '<i class="fas fa-glass-cheers"></i>';
        text = `<strong>${this.escapeHtml(data.userName || "Someone")}</strong> cheered for your artwork`;
        link = `/pages/community/artwork-detail.html?id=${data.artworkId || ""}`;
        break;
      case "shadow":
        iconClass = "shadow";
        iconHtml = '<i class="fas fa-eye"></i>';
        text = `<strong>${this.escapeHtml(data.userName || "Someone")}</strong> started shadowing you`;
        link = `/pages/community/profile.html?user=${data.userId || ""}`;
        break;
      case "comment":
        iconClass = "comment";
        iconHtml = '<i class="fas fa-comment"></i>';
        text = `<strong>${this.escapeHtml(data.userName || "Someone")}</strong> commented on your artwork`;
        link = `/pages/community/artwork-detail.html?id=${data.artworkId || ""}`;
        break;
    }

    return `
            <a href="${link}" class="notification-item ${unreadClass}" data-id="${notification.id}">
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

  formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "Just now";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
let notificationsSystem = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🔔 Initializing notifications system...");
  notificationsSystem = new NotificationsSystem();
});
