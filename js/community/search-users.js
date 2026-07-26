// Search Users Page - With Artist Badge Support
// FIXED: Uses data-theme attribute for header/footer light mode support

class SearchUsers {
  constructor() {
    this.allUsers = [];
    this.filteredUsers = [];
    this.currentUser = null;
    this.currentFilter = "all";
    this.searchQuery = "";
    this.badgeFilter = "all_types";
    this.shadowingStatus = new Map();
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

    // Get current user
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      await this.loadUsers();
      this.setupEventListeners();
      this.setupThemeControls();
      this.setupHUDControls();
    });
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
  }

  updateThemeElements() {
    const isBlueGreen = document.body.classList.contains("blue-green");
    const color1 = isBlueGreen ? "#58ebfe" : "#ff00ea";
    const color2 = isBlueGreen ? "#4ff3a6" : "#8A19E1";
    const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;

    // Update page header
    const header = document.querySelector(".page-header h1");
    if (header) {
      header.style.background = gradient;
      header.style.webkitBackgroundClip = "text";
      header.style.webkitTextFillColor = "transparent";
    }

    // Update filter chips active state
    document
      .querySelectorAll(".filter-chip.active, .badge-filter-chip.active")
      .forEach((el) => {
        el.style.borderColor = color1;
        el.style.color = color1;
      });

    // Update gradient background
    const bg = document.querySelector(".gradient-bg");
    if (bg) {
      const color3 = isBlueGreen ? "#3B82F6" : "#ff69b4";
      bg.style.background = `
        radial-gradient(ellipse at 0% 0%, ${color2} 0%, transparent 50%),
        radial-gradient(ellipse at 100% 100%, ${color1} 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, ${color3} 0%, transparent 60%)
      `;
    }

    // Update particle colors
    document.querySelectorAll(".particle").forEach((p, i) => {
      const colors = [color1, color2, color1, color2];
      p.style.background = colors[i % colors.length];
      p.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
    });
  }

  // ============================================
  // LOAD USERS WITH BADGE DATA
  // ============================================
  async loadUsers() {
    const usersGrid = document.getElementById("usersGrid");
    const resultsCount = document.getElementById("resultsCount");

    try {
      // Get all users from Firestore
      const snapshot = await firebase.firestore().collection("users").get();

      this.allUsers = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data();
        const userId = doc.id;

        // Skip current user
        if (this.currentUser && userId === this.currentUser.uid) continue;

        // Get user stats
        const artworksSnapshot = await firebase
          .firestore()
          .collection("artworks")
          .where("artistId", "==", userId)
          .where("status", "==", "published")
          .get();

        const artworks = artworksSnapshot.docs.length;

        // Get shadow count (followers)
        const shadowsSnapshot = await firebase
          .firestore()
          .collection("shadows")
          .where("targetId", "==", userId)
          .get();
        const shadowCount = shadowsSnapshot.size;

        // Check if current user is shadowing this user
        let isShadowing = false;
        if (this.currentUser) {
          const shadowCheck = await firebase
            .firestore()
            .collection("shadows")
            .where("shadowerId", "==", this.currentUser.uid)
            .where("targetId", "==", userId)
            .get();
          isShadowing = !shadowCheck.empty;
          this.shadowingStatus.set(userId, isShadowing);
        }

        // Get artist badge data
        const badge = userData.badge || null;
        const artistType = badge?.artistType || null;
        const specialties = badge?.specialties || [];
        const mediums = badge?.mediums || [];

        this.allUsers.push({
          id: userId,
          fullname: userData.fullname || "Artist",
          username: userData.username || "artist",
          bio: userData.bio || "",
          avatarUrl: userData.profilePicture || null,
          artworks: artworks,
          shadows: shadowCount,
          isShadowing: isShadowing,
          createdAt: userData.createdAt,
          // Badge data
          badge: badge,
          artistType: artistType,
          specialties: specialties,
          mediums: mediums,
        });
      }

      // Apply initial filter
      this.applyFilters();
    } catch (error) {
      console.error("Error loading users:", error);
      usersGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Artists</h3>
          <p>Please refresh the page and try again.</p>
        </div>
      `;
    }
  }

  // ============================================
  // APPLY FILTERS
  // ============================================
  applyFilters() {
    let filtered = [...this.allUsers];

    // Apply search filter (now includes badge fields)
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        // Search in basic fields
        const basicMatch =
          user.fullname.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.bio && user.bio.toLowerCase().includes(query));

        // Search in badge fields
        const badgeMatch =
          (user.artistType && user.artistType.toLowerCase().includes(query)) ||
          user.specialties.some((s) => s.toLowerCase().includes(query)) ||
          user.mediums.some((m) => m.toLowerCase().includes(query));

        return basicMatch || badgeMatch;
      });
    }

    // Apply badge type filter
    if (this.badgeFilter !== "all_types") {
      filtered = filtered.filter((user) => {
        if (this.badgeFilter === "none") {
          return !user.artistType;
        }
        return user.artistType === this.badgeFilter;
      });
    }

    // Apply sort filter
    switch (this.currentFilter) {
      case "popular":
        filtered.sort((a, b) => b.shadows - a.shadows);
        break;
      case "active":
        filtered.sort((a, b) => b.artworks - a.artworks);
        break;
      case "new":
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
          return dateB - dateA;
        });
        break;
      default:
        filtered.sort((a, b) => a.fullname.localeCompare(b.fullname));
        break;
    }

    this.filteredUsers = filtered;
    this.renderUsers();
  }

  // ============================================
  // RENDER USERS
  // ============================================
  renderUsers() {
    const usersGrid = document.getElementById("usersGrid");
    const resultsCount = document.getElementById("resultsCount");

    resultsCount.innerHTML = `
      <span>${this.filteredUsers.length}</span> artist${this.filteredUsers.length !== 1 ? "s" : ""} found
      ${this.badgeFilter !== "all_types" ? ` · Filtered by: ${this.formatBadgeType(this.badgeFilter)}` : ""}
    `;

    if (this.filteredUsers.length === 0) {
      usersGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-slash"></i>
          <h3>No Artists Found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      `;
      return;
    }

    usersGrid.innerHTML = this.filteredUsers
      .map((user) => this.createUserCard(user))
      .join("");

    // Attach event listeners to shadow buttons
    document.querySelectorAll(".shadow-btn-small").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const userId = btn.dataset.userId;
        await this.toggleShadow(userId, btn);
      });
    });

    // Attach click events to user cards
    document.querySelectorAll(".user-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (
          !e.target.closest(".shadow-btn-small") &&
          !e.target.closest(".badge-filter-chip") &&
          !e.target.closest(".filter-chip")
        ) {
          const userId = card.dataset.userId;
          if (userId) {
            window.location.href = `/pages/community/profiles.html?user=${userId}`;
          }
        }
      });
    });
  }

  // ============================================
  // CREATE USER CARD WITH BADGE DATA
  // ============================================
  createUserCard(user) {
    const hasAvatar = user.avatarUrl && user.avatarUrl.startsWith("http");
    const avatarHtml = hasAvatar
      ? `<img src="${user.avatarUrl}" alt="${user.fullname}">`
      : user.fullname.charAt(0).toUpperCase();

    const bio =
      user.bio && user.bio.length > 100
        ? user.bio.substring(0, 100) + "..."
        : user.bio || "No bio yet.";
    const shadowBtnText = user.isShadowing ? "Shadowing" : "Shadow";
    const shadowBtnClass = user.isShadowing ? "active" : "";

    // Generate badge tags
    let badgeTags = "";

    // Artist Type
    if (user.artistType) {
      const typeLabels = {
        digital: "🎨 Digital",
        traditional: "🖌️ Traditional",
        mixed: "🎭 Mixed",
        "3d": "🧊 3D",
        photography: "📷 Photo",
        animation: "🎬 Animation",
      };
      badgeTags += `<span class="user-badge-tag artist-type">${typeLabels[user.artistType] || user.artistType}</span>`;
    }

    // Specialties (limit to 2)
    if (user.specialties && user.specialties.length > 0) {
      const specialtyLabels = {
        "character-design": "Character",
        portrait: "Portrait",
        anatomy: "Anatomy",
        landscape: "Landscape",
        "digital-painting": "Digital Paint",
        "concept-art": "Concept Art",
        illustration: "Illustration",
        manga: "Manga",
        "oil-painting": "Oil Paint",
        watercolor: "Watercolor",
        acrylic: "Acrylic",
        charcoal: "Charcoal",
        ink: "Ink",
        "3d-modeling": "3D Model",
        sculpting: "Sculpting",
        texturing: "Texturing",
      };
      const displaySpecialties = user.specialties.slice(0, 2);
      displaySpecialties.forEach((s) => {
        badgeTags += `<span class="user-badge-tag specialty">${specialtyLabels[s] || s}</span>`;
      });
      if (user.specialties.length > 2) {
        badgeTags += `<span class="user-badge-tag specialty">+${user.specialties.length - 2}</span>`;
      }
    }

    // Mediums (limit to 2)
    if (user.mediums && user.mediums.length > 0) {
      const mediumLabels = {
        photoshop: "PS",
        procreate: "Procreate",
        "clip-studio": "Clip Studio",
        krita: "Krita",
        blender: "Blender",
        zbrush: "ZBrush",
        maya: "Maya",
        watercolor: "Watercolor",
        acrylic: "Acrylic",
        "oil-paint": "Oil Paint",
        ink: "Ink",
        graphite: "Graphite",
      };
      const displayMediums = user.mediums.slice(0, 2);
      displayMediums.forEach((m) => {
        badgeTags += `<span class="user-badge-tag medium">${mediumLabels[m] || m}</span>`;
      });
      if (user.mediums.length > 2) {
        badgeTags += `<span class="user-badge-tag medium">+${user.mediums.length - 2}</span>`;
      }
    }

    // If no badge data, show "No Badge"
    if (!badgeTags) {
      badgeTags = `<span class="user-badge-tag" style="color: var(--text-muted); opacity: 0.5;">No badge set</span>`;
    }

    return `
      <div class="user-card" data-user-id="${user.id}">
        <div class="user-card-content">
          <div class="user-avatar-left">
            ${avatarHtml}
          </div>
          <div class="user-info-right">
            <div class="user-name">
              <a href="/pages/community/profiles.html?user=${user.id}">${this.escapeHtml(user.fullname)}</a>
            </div>
            <div class="user-username">@${user.username}</div>
            <div class="user-bio">${this.escapeHtml(bio)}</div>
            <div class="user-badges">${badgeTags}</div>
            <div class="user-stats">
              <div class="user-stat">
                <span class="user-stat-value">${user.artworks}</span>
                <span class="user-stat-label">Artworks</span>
              </div>
              <div class="user-stat">
                <span class="user-stat-value">${user.shadows}</span>
                <span class="user-stat-label">Shadows</span>
              </div>
            </div>
            <button class="shadow-btn-small ${shadowBtnClass}" data-user-id="${user.id}">
              <i class="fas fa-eye"></i> ${shadowBtnText}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  formatBadgeType(type) {
    const labels = {
      digital: "Digital Artist",
      traditional: "Traditional Artist",
      mixed: "Mixed Media Artist",
      "3d": "3D Artist",
      photography: "Photographer",
      animation: "Animator",
    };
    return labels[type] || type;
  }

  // ============================================
  // TOGGLE SHADOW
  // ============================================
  async toggleShadow(userId, btnElement) {
    if (!this.currentUser) {
      alert("Please login to shadow artists");
      window.location.href = "/pages/auth/login.html";
      return;
    }

    const isCurrentlyShadowing = this.shadowingStatus.get(userId) || false;

    try {
      const shadowsRef = firebase.firestore().collection("shadows");

      if (isCurrentlyShadowing) {
        const existing = await shadowsRef
          .where("shadowerId", "==", this.currentUser.uid)
          .where("targetId", "==", userId)
          .get();

        if (!existing.empty) {
          await existing.docs[0].ref.delete();
        }

        this.shadowingStatus.set(userId, false);
        btnElement.classList.remove("active");
        btnElement.innerHTML = '<i class="fas fa-eye"></i> Shadow';

        const card = btnElement.closest(".user-card");
        const shadowStat = card.querySelector(
          ".user-stat:last-child .user-stat-value",
        );
        if (shadowStat) {
          const currentCount = parseInt(shadowStat.textContent);
          shadowStat.textContent = currentCount - 1;
        }
      } else {
        const user = this.allUsers.find((u) => u.id === userId);
        const shadowerName =
          this.currentUser.displayName || this.currentUser.email.split("@")[0];

        await shadowsRef.add({
          shadowerId: this.currentUser.uid,
          shadowerName: shadowerName,
          targetId: userId,
          targetName: user?.fullname || "Artist",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        this.shadowingStatus.set(userId, true);
        btnElement.classList.add("active");
        btnElement.innerHTML = '<i class="fas fa-eye"></i> Shadowing';

        const card = btnElement.closest(".user-card");
        const shadowStat = card.querySelector(
          ".user-stat:last-child .user-stat-value",
        );
        if (shadowStat) {
          const currentCount = parseInt(shadowStat.textContent);
          shadowStat.textContent = currentCount + 1;
        }

        if (typeof authManager !== "undefined") {
          await authManager.createNotification(userId, "shadow", {
            userId: this.currentUser.uid,
            userName: shadowerName,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling shadow:", error);
      alert("Error processing request");
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  setupEventListeners() {
    const searchInput = document.getElementById("userSearchInput");
    const searchBtn = document.getElementById("searchUsersBtn");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.applyFilters();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        this.searchQuery = searchInput.value;
        this.applyFilters();
      });
    }

    // Filter chips
    const filterChips = document.querySelectorAll(".filter-chip");
    filterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        filterChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        this.currentFilter = chip.dataset.filter;
        this.applyFilters();
      });
    });

    // Badge filter chips
    const badgeChips = document.querySelectorAll(".badge-filter-chip");
    badgeChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        badgeChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        this.badgeFilter = chip.dataset.badge;
        this.applyFilters();
      });
    });

    // Enter key search
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchQuery = searchInput.value;
          this.applyFilters();
        }
      });
    }
  }

  // ============================================
  // UTILITY
  // ============================================
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Apply saved theme immediately
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }

  new SearchUsers();
});
