// Activity Feed - See what artists you shadow are creating
// FIXED: Uses data-theme attribute for header/footer light mode support

class ActivityFeed {
  constructor() {
    this.currentUser = null;
    this.shadowingList = [];
    this.activities = [];
    this.currentTab = "all";
    this.lastDoc = null;
    this.hasMore = true;
    this.isLoading = false;
    this.limit = 15;
    this.hudMode = false;
    this.scanlinesEnabled = true;
    this.gridMode = false;
    this.init();
  }

  async init() {
    // Apply saved theme immediately for header/footer
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedColorTheme = localStorage.getItem("colorTheme") || "pink-purple";
    if (savedColorTheme === "blue-green") {
      document.body.classList.add("blue-green");
    }

    this.setupThemeControls();
    this.setupHUDControls();

    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        document.getElementById("authRequired").style.display = "block";
        document.getElementById("feedContent").style.display = "none";
        return;
      }

      this.currentUser = user;
      document.getElementById("authRequired").style.display = "none";
      document.getElementById("feedContent").style.display = "block";

      await this.loadShadowingList();
      await this.loadActivities();
      this.setupEventListeners();

      // Apply theme after render
      setTimeout(() => this.updateThemeElements(), 100);
    });
  }

  // ============================================
  // THEME CONTROLS - FIXED for header/footer
  // ============================================
  setupThemeControls() {
    const pinkPurpleBtn = document.getElementById("themePinkPurple");
    const blueGreenBtn = document.getElementById("themeBlueGreen");
    const darkBtn = document.getElementById("themeDark");
    const lightBtn = document.getElementById("themeLight");

    // Color theme toggles
    if (pinkPurpleBtn) {
      pinkPurpleBtn.addEventListener("click", () => {
        document.body.classList.remove("blue-green");
        pinkPurpleBtn.classList.add("active");
        blueGreenBtn?.classList.remove("active");
        localStorage.setItem("colorTheme", "pink-purple");
        this.updateThemeElements();
      });
    }

    if (blueGreenBtn) {
      blueGreenBtn.addEventListener("click", () => {
        document.body.classList.add("blue-green");
        blueGreenBtn.classList.add("active");
        pinkPurpleBtn?.classList.remove("active");
        localStorage.setItem("colorTheme", "blue-green");
        this.updateThemeElements();
      });
    }

    // Dark/Light toggles - FIXED: Use data-theme attribute
    if (darkBtn) {
      darkBtn.addEventListener("click", () => {
        this.setTheme("dark");
        darkBtn.classList.add("active");
        lightBtn?.classList.remove("active");
      });
    }

    if (lightBtn) {
      lightBtn.addEventListener("click", () => {
        this.setTheme("light");
        lightBtn.classList.add("active");
        darkBtn?.classList.remove("active");
      });
    }
  }

  setTheme(theme) {
    // Set data-theme on html element for header/footer
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Also toggle body class for page-specific styles
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    // Update theme elements
    this.updateThemeElements();
    this.updateGradientColors();
  }

  updateGradientColors() {
    const isBlueGreen = document.body.classList.contains("blue-green");
    const bg = document.querySelector(".gradient-bg");
    if (!bg) return;

    let color1, color2, color3;
    if (isBlueGreen) {
      color1 = "#58ebfe";
      color2 = "#4ff3a6";
      color3 = "#3B82F6";
    } else {
      color1 = "#ff00ea";
      color2 = "#8A19E1";
      color3 = "#ff69b4";
    }

    bg.style.background = `
            radial-gradient(ellipse at 0% 0%, ${color2} 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, ${color1} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${color3} 0%, transparent 60%)
        `;
  }

  updateThemeElements() {
    const isBlueGreen = document.body.classList.contains("blue-green");
    const color1 = isBlueGreen ? "#58ebfe" : "#ff00ea";
    const color2 = isBlueGreen ? "#4ff3a6" : "#8A19E1";
    const color3 = isBlueGreen ? "#3B82F6" : "#ff69b4";
    const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;

    // Update stat numbers
    document.querySelectorAll(".stat-number").forEach((el) => {
      el.style.background = gradient;
      el.style.webkitBackgroundClip = "text";
      el.style.webkitTextFillColor = "transparent";
    });

    // Update page header
    const header = document.querySelector(".page-header h1");
    if (header) {
      header.style.background = gradient;
      header.style.webkitBackgroundClip = "text";
      header.style.webkitTextFillColor = "transparent";
    }

    // Update avatar backgrounds
    document.querySelectorAll(".feed-avatar").forEach((el) => {
      el.style.background = gradient;
    });

    // Update feed item borders
    document.querySelectorAll(".feed-item::before").forEach((el) => {
      el.style.background = gradient;
    });

    // Update action text colors
    document.querySelectorAll(".feed-action").forEach((el) => {
      el.style.color = color1;
    });

    // Update accent colors on buttons
    document
      .querySelectorAll(".tab-btn.active, .period-btn.active")
      .forEach((el) => {
        el.style.borderColor = color1;
        el.style.color = color1;
      });

    // Update like/cheer colors
    document.querySelectorAll(".feed-stats .cheer-count").forEach((el) => {
      el.style.color = color3;
    });

    document.querySelectorAll(".feed-stats .view-count").forEach((el) => {
      el.style.color = color1;
    });

    // Update particle colors
    document.querySelectorAll(".particle").forEach((p, i) => {
      const colors = [color1, color2, color3, color1, color2, color3];
      p.style.background = colors[i % colors.length];
      p.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
    });

    // Update gradient background
    this.updateGradientColors();
  }

  // ============================================
  // HUD CONTROLS
  // ============================================
  setupHUDControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "h" || e.key === "H") this.toggleHUD();
      if (e.key === "s" || e.key === "S") this.toggleScanlines();
      if (e.key === "g" || e.key === "G") this.toggleGrid();
    });

    const hudBtn = document.getElementById("hudToggle");
    const scanBtn = document.getElementById("scanlineToggle");
    const gridBtn = document.getElementById("gridToggle");

    if (hudBtn) hudBtn.addEventListener("click", () => this.toggleHUD());
    if (scanBtn)
      scanBtn.addEventListener("click", () => this.toggleScanlines());
    if (gridBtn) gridBtn.addEventListener("click", () => this.toggleGrid());
  }

  toggleHUD() {
    this.hudMode = !this.hudMode;
    document.body.classList.toggle("hud-mode", this.hudMode);
    const btn = document.getElementById("hudToggle");
    if (btn) btn.classList.toggle("active", this.hudMode);
  }

  toggleScanlines() {
    this.scanlinesEnabled = !this.scanlinesEnabled;
    const overlay = document.querySelector(".scanline-overlay");
    const btn = document.getElementById("scanlineToggle");
    if (overlay) overlay.classList.toggle("active", this.scanlinesEnabled);
    if (btn) btn.classList.toggle("active", this.scanlinesEnabled);
  }

  toggleGrid() {
    this.gridMode = !this.gridMode;
    document.body.classList.toggle("grid-mode", this.gridMode);
    const btn = document.getElementById("gridToggle");
    if (btn) btn.classList.toggle("active", this.gridMode);
  }

  // ============================================
  // LOAD SHADOWING LIST
  // ============================================
  async loadShadowingList() {
    try {
      const snapshot = await firebase
        .firestore()
        .collection("shadows")
        .where("shadowerId", "==", this.currentUser.uid)
        .get();

      this.shadowingList = snapshot.docs.map((doc) => ({
        id: doc.data().targetId,
        name: doc.data().targetName,
      }));

      document.getElementById("shadowCount").textContent =
        this.shadowingList.length;

      console.log(`Shadowing ${this.shadowingList.length} artists`);
    } catch (error) {
      console.error("Error loading shadowing list:", error);
    }
  }

  // ============================================
  // LOAD ACTIVITIES
  // ============================================
  async loadActivities(reset = true) {
    if (this.isLoading) return;
    if (!reset && !this.hasMore) return;

    this.isLoading = true;

    if (reset) {
      this.activities = [];
      this.lastDoc = null;
      this.hasMore = true;
    }

    const feedList = document.getElementById("feedList");

    if (reset) {
      feedList.innerHTML =
        '<div class="loading-state"><div class="spinner"></div><p>Loading your feed...</p></div>';
    }

    if (this.shadowingList.length === 0) {
      feedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-eye-slash"></i>
                    <h3>No artists shadowed yet</h3>
                    <p>Start shadowing artists to see their latest creations in your feed!</p>
                    <a href="pages/community/search-users.html" class="btn-shadow-find">
                        <i class="fas fa-search"></i> Find Artists to Shadow
                    </a>
                </div>
            `;
      this.isLoading = false;
      document.getElementById("loadMoreContainer").style.display = "none";
      return;
    }

    try {
      const artistIds = this.shadowingList.map((artist) => artist.id);

      let query = firebase
        .firestore()
        .collection("artworks")
        .where("artistId", "in", artistIds)
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(this.limit);

      if (!reset && this.lastDoc) {
        query = query.startAfter(this.lastDoc);
      }

      const artworksSnapshot = await query.get();

      const newActivities = [];

      for (const doc of artworksSnapshot.docs) {
        const artwork = { id: doc.id, ...doc.data() };
        const artist = this.shadowingList.find(
          (a) => a.id === artwork.artistId,
        );

        newActivities.push({
          id: doc.id,
          type: "artwork",
          artistId: artwork.artistId,
          artistName: artist?.name || artwork.artistName || "Unknown Artist",
          title: artwork.title || "Untitled",
          description: artwork.description,
          imageUrl: artwork.imageUrl,
          tags: artwork.tags || [],
          timestamp: artwork.createdAt,
          likes: artwork.likes || 0,
          cheers: artwork.cheers || 0,
          category: artwork.category,
        });
      }

      this.hasMore = newActivities.length === this.limit;
      this.lastDoc = artworksSnapshot.docs[artworksSnapshot.docs.length - 1];

      if (reset) {
        this.activities = newActivities;
      } else {
        this.activities = [...this.activities, ...newActivities];
      }

      document.getElementById("loadMoreContainer").style.display = this.hasMore
        ? "block"
        : "none";

      this.renderFeed();
    } catch (error) {
      console.error("Error loading activities:", error);
      if (reset) {
        feedList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error loading feed</h3>
                        <p>Please refresh the page and try again.</p>
                    </div>
                `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  // ============================================
  // RENDER FEED
  // ============================================
  renderFeed() {
    const feedList = document.getElementById("feedList");

    let filteredActivities = this.activities;

    if (this.currentTab === "artworks") {
      filteredActivities = this.activities;
    } else if (this.currentTab === "likes") {
      filteredActivities = this.activities.filter((a) => a.likes > 0);
    } else if (this.currentTab === "cheers") {
      filteredActivities = this.activities.filter((a) => a.cheers > 0);
    }

    document.getElementById("activityCount").textContent =
      filteredActivities.length;
    document.getElementById("recentCount").textContent = Math.min(
      filteredActivities.length,
      5,
    );

    if (filteredActivities.length === 0 && this.activities.length > 0) {
      feedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>No ${this.currentTab} activity</h3>
                    <p>No ${this.currentTab === "likes" ? "likes" : this.currentTab === "cheers" ? "cheers" : ""} found for artworks from artists you shadow.</p>
                </div>
            `;
      return;
    }

    if (filteredActivities.length === 0) {
      feedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No recent activity</h3>
                    <p>Artists you shadow haven't posted anything recently. Check back later!</p>
                </div>
            `;
      return;
    }

    feedList.innerHTML = filteredActivities
      .map((activity) => this.createFeedItem(activity))
      .join("");

    // Click handlers for feed items
    document.querySelectorAll(".feed-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (
          e.target.closest(".feed-image-preview") ||
          e.target.closest(".feed-tag")
        )
          return;
        const id = item.dataset.id;
        if (id) {
          window.location.href = `pages/community/artwork-detail.html?id=${id}`;
        }
      });
    });

    // Click handlers for image previews
    document.querySelectorAll(".feed-image-preview").forEach((preview) => {
      preview.addEventListener("click", (e) => {
        e.stopPropagation();
        const artworkId = preview.dataset.id;
        window.location.href = `pages/community/artwork-detail.html?id=${artworkId}`;
      });
    });

    // Click handlers for tags
    document.querySelectorAll(".feed-tag").forEach((tag) => {
      tag.addEventListener("click", (e) => {
        e.stopPropagation();
        const tagName = tag.textContent.replace("#", "");
        window.location.href = `pages/community/gallery.html?tag=${tagName}`;
      });
    });
  }

  // ============================================
  // CREATE FEED ITEM
  // ============================================
  createFeedItem(activity) {
    const timeAgo = this.formatTimeAgo(activity.timestamp);
    const avatarLetter = activity.artistName?.charAt(0).toUpperCase() || "A";
    const avatarBg = `linear-gradient(135deg, var(--accent-1), var(--accent-2))`;

    const categoryEmojis = {
      daily: "⚡",
      weekly: "📅",
      monthly: "🌟",
      yearly: "🏆",
      random: "🎲",
      original: "🎨",
      trending: "🔥",
      photography: "📷",
      animation: "🎬",
    };
    const categoryEmoji = categoryEmojis[activity.category] || "🎨";

    const isVerified = false;

    return `
            <div class="feed-item" data-id="${activity.id}">
                <div class="feed-avatar" style="background: ${avatarBg}">
                    ${avatarLetter}
                </div>
                <div class="feed-content">
                    <div class="feed-header">
                        <div class="feed-user">
                            <i class="fas fa-user"></i> ${this.escapeHtml(activity.artistName)}
                            ${isVerified ? '<span class="verified-badge"><i class="fas fa-shield-alt"></i></span>' : ""}
                        </div>
                        <div class="feed-time">
                            <i class="far fa-clock"></i> ${timeAgo}
                        </div>
                    </div>
                    <div class="feed-action">
                        <span class="action-icon">${categoryEmoji}</span>
                        <strong>New Artwork</strong>
                        ${activity.category ? `· ${activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}` : ""}
                    </div>
                    <div class="feed-title">
                        "${this.escapeHtml(activity.title)}"
                    </div>
                    ${
                      activity.description
                        ? `
                        <div class="feed-description">
                            ${this.escapeHtml(activity.description.substring(0, 150))}${activity.description.length > 150 ? "..." : ""}
                        </div>
                    `
                        : ""
                    }
                    ${
                      activity.imageUrl
                        ? `
                        <div class="feed-image-preview" data-id="${activity.id}">
                            <img src="${activity.imageUrl}" alt="${activity.title}" loading="lazy">
                            <div class="image-overlay">
                                <i class="fas fa-expand"></i> View Artwork
                            </div>
                        </div>
                    `
                        : ""
                    }
                    ${
                      activity.tags && activity.tags.length > 0
                        ? `
                        <div class="feed-tags">
                            ${activity.tags
                              .slice(0, 5)
                              .map(
                                (tag) =>
                                  `<span class="feed-tag">#${this.escapeHtml(tag)}</span>`,
                              )
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                    <div class="feed-stats">
                        <span class="like-count"><i class="fas fa-heart"></i> ${activity.likes}</span>
                        <span class="cheer-count"><i class="fas fa-glass-cheers"></i> ${activity.cheers}</span>
                        <span class="view-count"><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 20) + 5}</span>
                    </div>
                </div>
            </div>
        `;
  }

  // ============================================
  // LOAD MORE
  // ============================================
  loadMore() {
    this.loadActivities(false);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  setupEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentTab = btn.dataset.tab;
        this.renderFeed();
      });
    });

    // Load more
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => this.loadMore());
    }

    // Refresh on visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.loadActivities(true);
      }
    });
  }

  // ============================================
  // UTILITY
  // ============================================
  formatTimeAgo(timestamp) {
    if (!timestamp) return "Recently";

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Apply saved theme immediately
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }

  new ActivityFeed();
});
