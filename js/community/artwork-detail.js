// artwork-detail.js - Complete with Related Artworks & Username Display
// Uses CommentSystem for all comment functionality

class ArtworkDetail {
  constructor() {
    this.artworkId = null;
    this.artwork = null;
    this.currentUser = null;
    this.commentsCollapsed = false;
    this.isVerified = false;
    this.relatedArtworks = [];
    this.relatedPage = 1;
    this.relatedLimit = 12;
    this.hasMoreRelated = true;
    this.isLoadingRelated = false;
    this.userCache = {};
    this.setupThemeToggle();
    this.init();
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.artworkId = urlParams.get("id");

    if (!this.artworkId) {
      this.showError();
      return;
    }

    // Set up auth listener
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      await this.loadArtwork();

      this.setupEventListeners();
      this.setupCommentsToggle();
      this.setupClickableAvatar();
      this.setupReportButton();

      if (
        this.currentUser &&
        this.artwork &&
        this.currentUser.uid !== this.artwork.artistId
      ) {
        await this.updateShadowButton();
        await this.updateSaveButton();
      }

      this.updateLikeButton();
      this.updateCheersButton();

      // Add verification badge
      await this.addVerificationBadge();

      // Initialize Comment System
      this.initCommentSystem();

      // Load related artworks
      await this.loadRelatedArtworks();
    });
  }

  // ============================================
  // INIT COMMENT SYSTEM
  // ============================================

  initCommentSystem() {
    // Check if CommentSystem is available
    if (typeof CommentSystem === "undefined") {
      console.warn("⚠️ CommentSystem not loaded yet, retrying...");
      setTimeout(() => this.initCommentSystem(), 500);
      return;
    }

    // Check if comment elements exist
    const commentsList = document.getElementById("commentsList");
    if (!commentsList) {
      console.warn("Comments list not found");
      return;
    }

    // Check if already initialized
    if (
      window.commentSystem &&
      window.commentSystem.artworkId === this.artworkId
    ) {
      return;
    }

    const isOwner =
      this.currentUser &&
      this.artwork &&
      this.currentUser.uid === this.artwork.artistId;

    // Get the artwork owner ID
    const artworkArtistId = this.artwork?.artistId || null;

    // Create comment system instance with artwork owner ID
    window.commentSystem = new CommentSystem(
      this.artworkId,
      this.currentUser,
      isOwner,
      artworkArtistId, // ← PASS THE ARTWORK OWNER ID
    );

    // In artwork-detail.js, add this to the init method or after rendering

    // Check for comment parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const commentId = urlParams.get("comment");

    if (commentId) {
      // Wait for comments to load then scroll to the comment
      setTimeout(() => {
        const commentElement = document.querySelector(
          `.comment-item[data-id="${commentId}"]`,
        );
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          commentElement.classList.add("highlight");
          setTimeout(() => {
            commentElement.classList.remove("highlight");
          }, 3000);
        }
      }, 1500);
    }

    console.log("✅ Comment System initialized");
  }

  // ============================================
  // THEME TOGGLE
  // ============================================
  setupThemeToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    if (!toggleBtn) return;

    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    toggleBtn.addEventListener("click", () => {
      const currentTheme = document.body.classList.contains("light-mode")
        ? "light"
        : "dark";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  applyTheme(theme) {
    const body = document.body;
    const toggleBtn = document.getElementById("themeToggle");

    if (theme === "light") {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
    } else {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
    }
  }

  // ============================================
  // LOAD ARTWORK
  // ============================================
  async loadArtwork() {
    const loadingState = document.getElementById("loadingState");
    const artworkContent = document.getElementById("artworkContent");
    const errorState = document.getElementById("errorState");

    try {
      const doc = await firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId)
        .get();

      if (!doc.exists) {
        this.showError();
        return;
      }

      this.artwork = { id: doc.id, ...doc.data() };
      await this.renderArtwork();

      loadingState.style.display = "none";
      artworkContent.style.display = "block";
    } catch (error) {
      console.error("Error loading artwork:", error);
      this.showError();
    }
  }

  async renderArtwork() {
    document.title = `${this.artwork.title} | Art Mecca`;

    const artworkImage = document.getElementById("artworkImage");
    const artworkTitle = document.getElementById("artworkTitle");
    const artistNameEl = document.getElementById("artistName");
    const artistAvatarEl = document.getElementById("artistAvatar");
    const artworkDescriptionEl = document.getElementById("artworkDescription");
    const postTimeEl = document.getElementById("postTime");
    const likeCountEl = document.getElementById("likeCount");
    const cheersCountEl = document.getElementById("cheersCount");
    const commentCountEl = document.getElementById("commentCount");

    // Get artist name from user document
    let displayName = this.artwork.artistName || "Anonymous Artist";
    let avatarInitial = displayName.charAt(0).toUpperCase();

    if (this.artwork.artistId) {
      try {
        if (this.userCache[this.artwork.artistId]) {
          const cachedUser = this.userCache[this.artwork.artistId];
          displayName =
            cachedUser.username ||
            cachedUser.fullname ||
            this.artwork.artistName ||
            "Anonymous Artist";
          avatarInitial = displayName.charAt(0).toUpperCase();
        } else {
          const userDoc = await firebase
            .firestore()
            .collection("users")
            .doc(this.artwork.artistId)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            this.userCache[this.artwork.artistId] = userData;
            displayName =
              userData.username ||
              userData.fullname ||
              this.artwork.artistName ||
              "Anonymous Artist";
            avatarInitial = displayName.charAt(0).toUpperCase();
          }
        }
      } catch (error) {
        console.error("Error fetching artist name:", error);
      }
    }

    // Set image
    if (artworkImage) artworkImage.src = this.artwork.imageUrl;

    // Set title
    if (artworkTitle) artworkTitle.textContent = this.artwork.title;

    // Set artist name and avatar
    if (artistNameEl) artistNameEl.textContent = displayName;
    if (artistAvatarEl) artistAvatarEl.textContent = avatarInitial;

    // Set description
    if (artworkDescriptionEl) {
      artworkDescriptionEl.textContent =
        this.artwork.description || "No description provided.";
    }

    // Set post time
    if (postTimeEl)
      postTimeEl.textContent = this.formatTimeAgo(this.artwork.createdAt);

    // Set counts
    if (likeCountEl) likeCountEl.textContent = this.artwork.likes || 0;
    if (cheersCountEl) cheersCountEl.textContent = this.artwork.cheers || 0;
    if (commentCountEl)
      commentCountEl.textContent = this.artwork.comments?.length || 0;

    // Check if NSFW and add badge
    if (this.artwork.isNSFW) {
      const titleEl = document.getElementById("artworkTitle");
      if (titleEl) {
        const nsfwBadge = document.createElement("span");
        nsfwBadge.className = "nsfw-badge";
        nsfwBadge.textContent = "🔞 Mature Content";
        titleEl.appendChild(nsfwBadge);
      }
    }

    // Render tags
    if (this.artwork.tags && this.artwork.tags.length > 0) {
      const tagsHtml = this.artwork.tags
        .map((tag) => `<span class="tag" data-tag="${tag}">#${tag}</span>`)
        .join("");
      const artworkTags = document.getElementById("artworkTags");
      const imageTags = document.getElementById("imageTags");
      if (artworkTags) artworkTags.innerHTML = tagsHtml;
      if (imageTags) imageTags.innerHTML = tagsHtml;
    }
  }

  // ============================================
  // RELATED ARTWORKS
  // ============================================
  async loadRelatedArtworks() {
    if (this.isLoadingRelated || !this.hasMoreRelated) return;
    this.isLoadingRelated = true;

    const container = document.getElementById("relatedGrid");
    const loadingEl = document.getElementById("relatedLoading");

    if (loadingEl) loadingEl.style.display = "block";

    try {
      let query = firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(this.relatedLimit);

      const snapshot = await query.get();

      let artworks = [];
      snapshot.forEach((doc) => {
        if (doc.id !== this.artworkId) {
          artworks.push({ id: doc.id, ...doc.data() });
        }
      });

      const scoredArtworks = artworks.map((art) => {
        let score = 0;

        if (art.artistId === this.artwork.artistId) {
          score += 50;
        }

        if (this.artwork.tags && art.tags) {
          const matchCount = art.tags.filter((tag) =>
            this.artwork.tags.includes(tag),
          ).length;
          score += matchCount * 10;
        }

        if (art.category === this.artwork.category) {
          score += 5;
        }

        score += (art.likes || 0) * 0.1;

        return { ...art, score };
      });

      scoredArtworks.sort((a, b) => b.score - a.score);

      const topArtworks = scoredArtworks.slice(0, 12);
      this.hasMoreRelated = scoredArtworks.length > 12;
      this.relatedArtworks = topArtworks;

      await this.fetchArtistUsernames(this.relatedArtworks);
      this.renderRelatedArtworks();
    } catch (error) {
      console.error("Error loading related artworks:", error);
    } finally {
      this.isLoadingRelated = false;
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  async fetchArtistUsernames(artworks) {
    const artistIds = [
      ...new Set(artworks.map((art) => art.artistId).filter((id) => id)),
    ];
    const uncachedIds = artistIds.filter((id) => !this.userCache[id]);

    if (uncachedIds.length > 0) {
      try {
        const userDocs = await Promise.all(
          uncachedIds.map((id) =>
            firebase.firestore().collection("users").doc(id).get(),
          ),
        );
        userDocs.forEach((doc) => {
          if (doc.exists) {
            this.userCache[doc.id] = doc.data();
          }
        });
      } catch (error) {
        console.error("Error fetching usernames:", error);
      }
    }
  }

  getUserDisplayName(artistId, fallbackName) {
    if (artistId && this.userCache[artistId]) {
      const userData = this.userCache[artistId];
      return (
        userData.username || userData.fullname || fallbackName || "Anonymous"
      );
    }
    return fallbackName || "Anonymous";
  }

  renderRelatedArtworks() {
    const container = document.getElementById("relatedGrid");
    if (!container) return;

    if (this.relatedArtworks.length === 0) {
      container.innerHTML = `
        <div class="related-empty" style="column-span: all;">
          <i class="fas fa-palette"></i>
          <p>No related artworks found</p>
        </div>
      `;
      return;
    }

    const getRandomHeight = () => {
      const heights = [200, 250, 280, 320, 350, 380, 420];
      return heights[Math.floor(Math.random() * heights.length)];
    };

    const categoryNames = {
      daily: "⚡ Daily",
      weekly: "📅 Weekly",
      monthly: "🌟 Monthly",
      yearly: "🏆 Yearly",
      random: "🎲 Random",
      original: "🎨 Original",
      trending: "🔥 Trending",
      new: "🆕 New",
      photography: "📷 Photography",
      animation: "🎬 Animation",
      "traditional-art": "🖌️ Traditional",
    };

    container.innerHTML = this.relatedArtworks
      .map((art) => {
        const category =
          categoryNames[art.category] || art.category || "Artwork";
        const randomHeight = getRandomHeight();
        const displayName = this.getUserDisplayName(
          art.artistId,
          art.artistName,
        );

        return `
        <div class="related-card" data-id="${art.id}" onclick="window.location.href='pages/community/artwork-detail.html?id=${art.id}'">
          <div class="related-image-wrapper" style="height: ${randomHeight}px;">
            <img src="${art.imageUrl}" alt="${art.title || "Artwork"}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            <span class="related-category">${category}</span>
            <div class="related-overlay">
              <i class="fas fa-expand"></i>
            </div>
          </div>
          <div class="related-info">
            <div class="related-title">${this.escapeHtml(art.title || "Untitled")}</div>
            <div class="related-artist">${this.escapeHtml(displayName)}</div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // ============================================
  // VERIFICATION BADGE
  // ============================================
  async addVerificationBadge() {
    if (!this.artwork || !this.artwork.artistId) return;

    const artistInfo = document.getElementById("artistInfo");
    if (!artistInfo) return;

    try {
      let userData = this.userCache[this.artwork.artistId];

      if (!userData) {
        const doc = await firebase
          .firestore()
          .collection("users")
          .doc(this.artwork.artistId)
          .get();

        if (doc.exists) {
          userData = doc.data();
          this.userCache[this.artwork.artistId] = userData;
        }
      }

      if (userData) {
        const isVerified =
          userData.isAdult === true && userData.ageVerified === true;

        if (isVerified) {
          const badge = document.createElement("span");
          badge.className = "verification-badge";
          badge.innerHTML = '<i class="fas fa-shield-alt"></i> Age Verified';

          const artistDetails = artistInfo.querySelector(".artist-details");
          if (artistDetails) {
            const nameElement = artistDetails.querySelector("h4");
            if (nameElement) {
              nameElement.appendChild(badge);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error adding verification badge:", error);
    }
  }

  // ============================================
  // REPORT BUTTON
  // ============================================
  setupReportButton() {
    const reportBtn = document.getElementById("reportBtn");
    if (!reportBtn) return;

    const newReportBtn = reportBtn.cloneNode(true);
    reportBtn.parentNode?.replaceChild(newReportBtn, reportBtn);

    newReportBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Please login to report content");
        window.location.href = "pages/auth/login.html";
        return;
      }

      this.showReportModal();
    });
  }

  showReportModal() {
    const overlay = document.createElement("div");
    overlay.className = "report-modal-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    const modal = document.createElement("div");
    modal.className = "report-modal";
    modal.style.cssText = `
      background: rgba(26, 26, 46, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid rgba(138, 25, 225, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="color: white; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-flag" style="color: #ef4444;"></i> Report Content
        </h3>
        <button class="close-report-modal" style="background: none; border: none; color: #8b7aa8; font-size: 1.5rem; cursor: pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
        Please select a reason for reporting this artwork. Your report will be reviewed by our moderation team.
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${[
          "Untagged mature content (NSFW)",
          "Inappropriate content",
          "Harassment or bullying",
          "Copyright infringement",
          "Spam or misleading",
          "Other",
        ]
          .map(
            (reason) => `
          <button class="report-reason-btn" data-reason="${reason}" style="
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 12px 16px;
            color: var(--text-secondary);
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
          ">
            ${reason}
          </button>
        `,
          )
          .join("")}
      </div>

      <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
        <button id="cancelReportBtn" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #8b7aa8; cursor: pointer; font-weight: 500; font-family: 'Inter', sans-serif;">
          Cancel
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .report-reason-btn:hover {
        background: rgba(138, 25, 225, 0.15) !important;
        border-color: #8A19E1 !important;
        transform: translateX(4px);
      }
    `;
    document.head.appendChild(style);

    const closeModal = () => {
      overlay.remove();
      style.remove();
    };

    modal
      .querySelector(".close-report-modal")
      .addEventListener("click", closeModal);
    document
      .getElementById("cancelReportBtn")
      .addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    modal.querySelectorAll(".report-reason-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const reason = btn.dataset.reason;
        closeModal();
        await this.submitReport(reason);
      });
    });
  }

  async submitReport(reason) {
    if (!this.currentUser) {
      alert("Please login to report content");
      return;
    }

    try {
      const artworkRef = firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId);

      const reportDoc = await firebase
        .firestore()
        .collection("reports")
        .where("artworkId", "==", this.artworkId)
        .where("userId", "==", this.currentUser.uid)
        .get();

      if (!reportDoc.empty) {
        this.showToast("You've already reported this artwork.");
        return;
      }

      await firebase.firestore().collection("reports").add({
        artworkId: this.artworkId,
        userId: this.currentUser.uid,
        reason: reason,
        reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "pending",
      });

      await artworkRef.update({
        reportCount: firebase.firestore.FieldValue.increment(1),
        nsfwReported: true,
      });

      this.showToast(
        "✅ Content reported successfully. Our moderation team will review it.",
      );
    } catch (error) {
      console.error("Report error:", error);
      this.showToast("❌ Error reporting content. Please try again.");
    }
  }

  // ============================================
  // COMMENTS TOGGLE
  // ============================================
  setupCommentsToggle() {
    const toggleBtn = document.getElementById("toggleCommentsBtn");
    const commentBody = document.getElementById("commentBody");

    if (toggleBtn && commentBody) {
      toggleBtn.addEventListener("click", () => {
        this.commentsCollapsed = !this.commentsCollapsed;
        if (this.commentsCollapsed) {
          commentBody.classList.add("collapsed");
          toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        } else {
          commentBody.classList.remove("collapsed");
          toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        }
      });
    }
  }

  setupClickableAvatar() {
    const artistInfo = document.getElementById("artistInfo");
    if (artistInfo && this.artwork && this.artwork.artistId) {
      artistInfo.style.cursor = "pointer";

      const newArtistInfo = artistInfo.cloneNode(true);
      artistInfo.parentNode?.replaceChild(newArtistInfo, artistInfo);

      newArtistInfo.addEventListener("click", () => {
        window.location.href = `pages/community/profiles.html?user=${this.artwork.artistId}`;
      });
    }
  }

  // ============================================
  // SAVE ARTWORK
  // ============================================
  async updateSaveButton() {
    if (!this.currentUser || this.currentUser.uid === this.artwork.artistId)
      return;

    const saveBtn = document.getElementById("saveBtn");
    if (!saveBtn) return;

    const saveBtnText = document.getElementById("saveBtnText");
    const saveIcon = saveBtn.querySelector("i");

    try {
      const savedRef = firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .collection("savedArtworks")
        .doc(this.artworkId);

      const doc = await savedRef.get();

      if (doc.exists) {
        saveBtn.classList.add("saved");
        if (saveIcon) saveIcon.className = "fas fa-bookmark";
        if (saveBtnText) saveBtnText.textContent = "Saved";
      } else {
        saveBtn.classList.remove("saved");
        if (saveIcon) saveIcon.className = "far fa-bookmark";
        if (saveBtnText) saveBtnText.textContent = "Save";
      }
    } catch (error) {
      console.error("Error checking save status:", error);
    }
  }

  async toggleSave() {
    if (!this.currentUser) {
      alert("Please login to save artworks");
      window.location.href = "pages/auth/login.html";
      return;
    }

    if (this.currentUser.uid === this.artwork.artistId) {
      alert("You cannot save your own artwork");
      return;
    }

    const saveBtn = document.getElementById("saveBtn");
    if (!saveBtn) return;

    const saveBtnText = document.getElementById("saveBtnText");
    const saveIcon = saveBtn.querySelector("i");

    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.7";

    try {
      const savedRef = firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .collection("savedArtworks")
        .doc(this.artworkId);

      const doc = await savedRef.get();

      if (doc.exists) {
        await savedRef.delete();
        saveBtn.classList.remove("saved");
        if (saveIcon) saveIcon.className = "far fa-bookmark";
        if (saveBtnText) saveBtnText.textContent = "Save";
        this.showToast("Artwork removed from saved");
      } else {
        await savedRef.set({
          artworkId: this.artworkId,
          title: this.artwork.title,
          thumbnail: this.artwork.imageUrl,
          savedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        saveBtn.classList.add("saved");
        if (saveIcon) saveIcon.className = "fas fa-bookmark";
        if (saveBtnText) saveBtnText.textContent = "Saved";
        this.showToast("Artwork saved to your profile!");
      }
    } catch (error) {
      console.error("Error saving artwork:", error);
      this.showToast("Error saving artwork");
    } finally {
      saveBtn.disabled = false;
      saveBtn.style.opacity = "1";
    }
  }

  // ============================================
  // SHADOW
  // ============================================
  async updateShadowButton() {
    if (!this.currentUser || this.currentUser.uid === this.artwork.artistId)
      return;

    const shadowBtn = document.getElementById("shadowBtn");
    if (!shadowBtn) return;

    const shadowBtnText = document.getElementById("shadowBtnText");

    try {
      const shadowsRef = firebase.firestore().collection("shadows");
      const existing = await shadowsRef
        .where("shadowerId", "==", this.currentUser.uid)
        .where("targetId", "==", this.artwork.artistId)
        .get();

      if (!existing.empty) {
        shadowBtn.classList.add("active");
        if (shadowBtnText) shadowBtnText.textContent = "Shadowing";
      } else {
        shadowBtn.classList.remove("active");
        if (shadowBtnText) shadowBtnText.textContent = "Shadow";
      }
    } catch (error) {
      console.error("Shadow check error:", error);
    }
  }

  async toggleShadow() {
    if (!this.currentUser) {
      alert("Please login to shadow artists");
      return;
    }

    if (this.currentUser.uid === this.artwork.artistId) {
      alert("You cannot shadow yourself");
      return;
    }

    const shadowBtn = document.getElementById("shadowBtn");
    if (!shadowBtn) return;

    const shadowBtnText = document.getElementById("shadowBtnText");

    try {
      const shadowsRef = firebase.firestore().collection("shadows");
      const existing = await shadowsRef
        .where("shadowerId", "==", this.currentUser.uid)
        .where("targetId", "==", this.artwork.artistId)
        .get();

      if (!existing.empty) {
        await existing.docs[0].ref.delete();
        shadowBtn.classList.remove("active");
        if (shadowBtnText) shadowBtnText.textContent = "Shadow";
      } else {
        const shadowerName =
          this.currentUser.displayName || this.currentUser.email.split("@")[0];

        await shadowsRef.add({
          shadowerId: this.currentUser.uid,
          shadowerName: shadowerName,
          targetId: this.artwork.artistId,
          targetName: this.artwork.artistName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        shadowBtn.classList.add("active");
        if (shadowBtnText) shadowBtnText.textContent = "Shadowing";

        if (this.currentUser.uid !== this.artwork.artistId) {
          await authManager.createNotification(
            this.artwork.artistId,
            "shadow",
            {
              userId: this.currentUser.uid,
              userName: shadowerName,
            },
          );
        }
      }
    } catch (error) {
      console.error("Shadow error:", error);
      alert("Error processing shadow");
    }
  }

  // ============================================
  // LIKE
  // ============================================
  async toggleLike() {
    if (!this.currentUser) {
      alert("Please login to like artworks");
      return;
    }

    const likeBtn = document.getElementById("likeBtn");
    if (!likeBtn) return;

    const likeCountSpan = document.getElementById("likeCount");

    try {
      const artworkRef = firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId);
      const likeRef = firebase
        .firestore()
        .collection("likes")
        .doc(`${this.artworkId}_${this.currentUser.uid}`);
      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        await likeRef.delete();
        await artworkRef.update({
          likes: firebase.firestore.FieldValue.increment(-1),
        });
        likeBtn.classList.remove("active");
        this.artwork.likes = (this.artwork.likes || 1) - 1;
        if (likeCountSpan) likeCountSpan.textContent = this.artwork.likes;
      } else {
        await likeRef.set({
          artworkId: this.artworkId,
          userId: this.currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await artworkRef.update({
          likes: firebase.firestore.FieldValue.increment(1),
        });
        likeBtn.classList.add("active");
        this.artwork.likes = (this.artwork.likes || 0) + 1;
        if (likeCountSpan) likeCountSpan.textContent = this.artwork.likes;

        if (this.currentUser.uid !== this.artwork.artistId) {
          await authManager.createNotification(this.artwork.artistId, "like", {
            artworkId: this.artworkId,
            artworkTitle: this.artwork.title,
            userId: this.currentUser.uid,
            userName:
              this.currentUser.displayName ||
              this.currentUser.email.split("@")[0],
          });
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  }

  async updateLikeButton() {
    if (!this.currentUser || !this.artworkId) return;
    try {
      const likeRef = firebase
        .firestore()
        .collection("likes")
        .doc(`${this.artworkId}_${this.currentUser.uid}`);
      const exists = (await likeRef.get()).exists;
      if (exists) document.getElementById("likeBtn")?.classList.add("active");
    } catch (error) {
      console.error("Error checking like:", error);
    }
  }

  // ============================================
  // CHEERS
  // ============================================
  async toggleCheers() {
    if (!this.currentUser) {
      alert("Please login to cheer for this artwork");
      return;
    }

    const cheersBtn = document.getElementById("cheersBtn");
    if (!cheersBtn) return;

    const cheersCountSpan = document.getElementById("cheersCount");

    try {
      const artworkRef = firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId);
      const cheerRef = firebase
        .firestore()
        .collection("cheers")
        .doc(`${this.artworkId}_${this.currentUser.uid}`);
      const cheerDoc = await cheerRef.get();

      if (cheerDoc.exists) {
        await cheerRef.delete();
        await artworkRef.update({
          cheers: firebase.firestore.FieldValue.increment(-1),
        });
        cheersBtn.classList.remove("active");
        this.artwork.cheers = (this.artwork.cheers || 1) - 1;
        if (cheersCountSpan) cheersCountSpan.textContent = this.artwork.cheers;
      } else {
        await cheerRef.set({
          artworkId: this.artworkId,
          userId: this.currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await artworkRef.update({
          cheers: firebase.firestore.FieldValue.increment(1),
        });
        cheersBtn.classList.add("active");
        this.artwork.cheers = (this.artwork.cheers || 0) + 1;
        if (cheersCountSpan) cheersCountSpan.textContent = this.artwork.cheers;

        if (this.currentUser.uid !== this.artwork.artistId) {
          await authManager.createNotification(this.artwork.artistId, "cheer", {
            artworkId: this.artworkId,
            artworkTitle: this.artwork.title,
            userId: this.currentUser.uid,
            userName:
              this.currentUser.displayName ||
              this.currentUser.email.split("@")[0],
          });
        }
      }
    } catch (error) {
      console.error("Cheers error:", error);
    }
  }

  async updateCheersButton() {
    if (!this.currentUser || !this.artworkId) return;
    try {
      const cheerRef = firebase
        .firestore()
        .collection("cheers")
        .doc(`${this.artworkId}_${this.currentUser.uid}`);
      const exists = (await cheerRef.get()).exists;
      if (exists) document.getElementById("cheersBtn")?.classList.add("active");
    } catch (error) {
      console.error("Error checking cheer:", error);
    }
  }

  // ============================================
  // SHARE & DOWNLOAD
  // ============================================
  shareArtwork() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: this.artwork.title, url: url });
    } else {
      navigator.clipboard.writeText(url);
      this.showToast("Link copied!");
    }
  }

  downloadImage() {
    const link = document.createElement("a");
    link.href = this.artwork.imageUrl;
    link.download = `${this.artwork.title.replace(/\s+/g, "_")}.jpg`;
    link.click();
    this.showToast("Downloading...");
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  setupEventListeners() {
    const likeBtn = document.getElementById("likeBtn");
    const cheersBtn = document.getElementById("cheersBtn");
    const shadowBtn = document.getElementById("shadowBtn");
    const saveBtn = document.getElementById("saveBtn");
    const shareBtn = document.getElementById("shareBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    if (likeBtn) likeBtn.addEventListener("click", () => this.toggleLike());
    if (cheersBtn)
      cheersBtn.addEventListener("click", () => this.toggleCheers());
    if (saveBtn) saveBtn.addEventListener("click", () => this.toggleSave());

    if (shadowBtn) {
      const newShadowBtn = shadowBtn.cloneNode(true);
      shadowBtn.parentNode?.replaceChild(newShadowBtn, shadowBtn);
      newShadowBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleShadow();
      });
    }

    if (shareBtn) shareBtn.addEventListener("click", () => this.shareArtwork());
    if (downloadBtn)
      downloadBtn.addEventListener("click", () => this.downloadImage());

    document.querySelectorAll(".tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        window.location.href = `pages/community/gallery.html?tag=${tag.dataset.tag}`;
      });
    });
  }

  // ============================================
  // UTILITY
  // ============================================
  showToast(message) {
    let toast = document.getElementById("toastNotification");
    let toastMessage = document.getElementById("toastMessage");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toastNotification";
      toast.className = "toast-notification";
      toast.innerHTML = `<i class="fas fa-check-circle"></i><span id="toastMessage"></span>`;
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--bg-card);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 12px 24px;
        box-shadow: var(--shadow-card), var(--glow-purple);
        color: var(--text-primary);
        font-family: var(--font-condensed);
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0;
        pointer-events: none;
        max-width: 90%;
      `;
      document.body.appendChild(toast);
      toastMessage = document.getElementById("toastMessage");
    }

    if (toastMessage) toastMessage.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
  }

  showError() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");

    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "block";
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return "Recently";
    let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "Recently";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing ArtworkDetail...");
  new ArtworkDetail();
});
