// Artwork Detail Page - Complete with Verification Badge & Report Functionality

class ArtworkDetail {
  constructor() {
    this.artworkId = null;
    this.artwork = null;
    this.currentUser = null;
    this.commentsCollapsed = false;
    this.isVerified = false;
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

      // Setup comment click handlers AFTER comments are loaded
      setTimeout(() => {
        this.setupClickableComments();
      }, 500);
    });
  }

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
      this.renderArtwork();

      loadingState.style.display = "none";
      artworkContent.style.display = "block";
    } catch (error) {
      console.error("Error loading artwork:", error);
      this.showError();
    }
  }

  renderArtwork() {
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

    if (artworkImage) artworkImage.src = this.artwork.imageUrl;
    if (artworkTitle) artworkTitle.textContent = this.artwork.title;

    const artistName = this.artwork.artistName || "Anonymous Artist";
    if (artistNameEl) artistNameEl.textContent = artistName;
    if (artistAvatarEl)
      artistAvatarEl.textContent = artistName.charAt(0).toUpperCase();

    if (artworkDescriptionEl)
      artworkDescriptionEl.textContent =
        this.artwork.description || "No description provided.";
    if (postTimeEl)
      postTimeEl.textContent = this.formatTimeAgo(this.artwork.createdAt);
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
        nsfwBadge.style.cssText = `
          display: inline-block;
          background: #ef4444;
          color: white;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 10px;
          vertical-align: middle;
        `;
        nsfwBadge.textContent = "🔞 Mature Content";
        titleEl.appendChild(nsfwBadge);
      }
    }

    if (this.artwork.tags && this.artwork.tags.length > 0) {
      const tagsHtml = this.artwork.tags
        .map((tag) => `<span class="tag" data-tag="${tag}">#${tag}</span>`)
        .join("");
      const artworkTags = document.getElementById("artworkTags");
      const imageTags = document.getElementById("imageTags");
      if (artworkTags) artworkTags.innerHTML = tagsHtml;
      if (imageTags) imageTags.innerHTML = tagsHtml;
    }

    this.loadComments();
  }

  // ========== VERIFICATION BADGE ==========
  async addVerificationBadge() {
    if (!this.artwork || !this.artwork.artistId) return;

    const artistInfo = document.getElementById("artistInfo");
    if (!artistInfo) return;

    try {
      const doc = await firebase.firestore()
        .collection('users')
        .doc(this.artwork.artistId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        const isVerified = data.isAdult === true && data.ageVerified === true;

        if (isVerified) {
          const badge = document.createElement('span');
          badge.className = 'verification-badge verified small';
          badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 0.65rem;
            font-weight: 600;
            margin-left: 8px;
            vertical-align: middle;
          `;
          badge.innerHTML = '<i class="fas fa-shield-alt"></i> Age Verified';

          const artistDetails = artistInfo.querySelector('.artist-details');
          if (artistDetails) {
            const nameElement = artistDetails.querySelector('h4');
            if (nameElement) {
              nameElement.appendChild(badge);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error adding verification badge:', error);
    }
  }

  // ========== REPORT BUTTON ==========
  setupReportButton() {
    const reportBtn = document.getElementById("reportBtn");
    if (!reportBtn) return;

    // Remove existing listener
    const newReportBtn = reportBtn.cloneNode(true);
    reportBtn.parentNode?.replaceChild(newReportBtn, reportBtn);

    newReportBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Please login to report content");
        window.location.href = "/pages/auth/login.html";
        return;
      }

      // Show report modal with reason options
      this.showReportModal();
    });
  }

  showReportModal() {
    // Create modal
    const overlay = document.createElement('div');
    overlay.className = 'report-modal-overlay';
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

    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.style.cssText = `
      background: #1a1a2e;
      border-radius: 16px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid rgba(254, 103, 234, 0.2);
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

      <p style="color: #c4b8ff; margin-bottom: 1.5rem; font-size: 0.9rem;">
        Please select a reason for reporting this artwork. Your report will be reviewed by our moderation team.
      </p>

      <div class="report-reasons" style="display: flex; flex-direction: column; gap: 10px;">
        <button class="report-reason-btn" data-reason="Untagged mature content (NSFW)"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; color: #c4b8ff; cursor: pointer; text-align: left; transition: all 0.2s;">
          🔞 Untagged mature content (NSFW)
        </button>
        <button class="report-reason-btn" data-reason="Inappropriate content"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; color: #c4b8ff; cursor: pointer; text-align: left; transition: all 0.2s;">
          🚫 Inappropriate content
        </button>
        <button class="report-reason-btn" data-reason="Harassment or bullying"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; color: #c4b8ff; cursor: pointer; text-align: left; transition: all 0.2s;">
          👊 Harassment or bullying
        </button>
        <button class="report-reason-btn" data-reason="Copyright infringement"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; color: #c4b8ff; cursor: pointer; text-align: left; transition: all 0.2s;">
          © Copyright infringement
        </button>
        <button class="report-reason-btn" data-reason="Spam or misleading"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; color: #c4b8ff; cursor: pointer; text-align: left; transition: all 0.2s;">
          📨 Spam or misleading
        </button>
        <button class="report-reason-btn" data-reason="Other"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; color: #c4b8ff; cursor: pointer; text-align: left; transition: all 0.2s;">
          ❓ Other
        </button>
      </div>

      <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
        <button id="cancelReportBtn" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #8b7aa8; cursor: pointer; font-weight: 500;">
          Cancel
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .report-reason-btn:hover {
        background: rgba(254, 103, 234, 0.15) !important;
        border-color: #fe67ea !important;
        transform: translateX(4px);
      }
    `;
    document.head.appendChild(style);

    // Handle close
    const closeBtn = modal.querySelector('.close-report-modal');
    const cancelBtn = document.getElementById('cancelReportBtn');

    const closeModal = () => {
      overlay.remove();
      style.remove();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Handle reason selection
    const reasonBtns = modal.querySelectorAll('.report-reason-btn');
    reasonBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
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
      // Use the global reportNSFWContent function if available
      if (typeof window.reportNSFWContent === 'function') {
        const result = await window.reportNSFWContent(this.artworkId, reason);
        if (result.success) {
          this.showToast("✅ Content reported successfully. Our moderation team will review it.");
        } else {
          this.showToast("❌ Error reporting content: " + (result.error || "Please try again."));
        }
        return;
      }

      // Fallback: Direct Firestore update
      const artworkRef = firebase.firestore()
        .collection('artworks')
        .doc(this.artworkId);

      // Check if already reported by this user
      const reportDoc = await firebase.firestore()
        .collection('reports')
        .where('artworkId', '==', this.artworkId)
        .where('userId', '==', this.currentUser.uid)
        .get();

      if (!reportDoc.empty) {
        this.showToast("You've already reported this artwork.");
        return;
      }

      // Add report
      await firebase.firestore().collection('reports').add({
        artworkId: this.artworkId,
        userId: this.currentUser.uid,
        reason: reason,
        reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      });

      // Increment report count on artwork
      await artworkRef.update({
        reportCount: firebase.firestore.FieldValue.increment(1),
        nsfwReported: true
      });

      this.showToast("✅ Content reported successfully. Our moderation team will review it.");

    } catch (error) {
      console.error('Report error:', error);
      this.showToast("❌ Error reporting content. Please try again.");
    }
  }

  // ========== CLICKABLE COMMENTS ==========
  setupClickableComments() {
    setTimeout(() => {
      this.attachCommentClickHandlers();
    }, 100);
  }

  attachCommentClickHandlers() {
    const commentItems = document.querySelectorAll(".comment-item");

    commentItems.forEach((item) => {
      const authorId = item.getAttribute("data-author-id");
      item.style.cursor = "pointer";

      const newItem = item.cloneNode(true);
      item.parentNode?.replaceChild(newItem, item);

      newItem.addEventListener("click", async (e) => {
        e.stopPropagation();

        let userId = newItem.getAttribute("data-author-id");

        if (userId && userId !== "undefined" && userId !== "null" && userId !== "") {
          window.location.href = `/pages/community/profiles.html?user=${userId}`;
          return;
        }

        const authorName = newItem.querySelector(".comment-author")?.textContent;
        if (!authorName) return;

        try {
          const usersSnapshot = await firebase
            .firestore()
            .collection("users")
            .where("fullname", "==", authorName)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            userId = usersSnapshot.docs[0].id;
            window.location.href = `/pages/community/profiles.html?user=${userId}`;
          }
        } catch (error) {
          console.error("Error finding user:", error);
        }
      });
    });
  }

  // ========== CLICKABLE ARTIST AVATAR ==========
  setupClickableAvatar() {
    const artistInfo = document.getElementById("artistInfo");
    if (artistInfo && this.artwork && this.artwork.artistId) {
      artistInfo.style.cursor = "pointer";

      const newArtistInfo = artistInfo.cloneNode(true);
      artistInfo.parentNode?.replaceChild(newArtistInfo, artistInfo);

      newArtistInfo.addEventListener("click", () => {
        window.location.href = `/pages/community/profiles.html?user=${this.artwork.artistId}`;
      });
    }
  }

  // ========== SAVE ARTWORK ==========
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
      window.location.href = "/pages/auth/login.html";
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

  // ========== SHADOW ==========
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

  // ========== LIKE ==========
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

  // ========== CHEERS ==========
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

  // ========== COMMENTS ==========
  async postComment() {
    if (!this.currentUser) {
      alert("Please login to comment");
      return;
    }

    const commentInput = document.getElementById("commentInput");
    const commentText = commentInput?.value.trim();
    if (!commentText) return;

    const newComment = {
      id: Date.now().toString(),
      author:
        this.currentUser.displayName || this.currentUser.email.split("@")[0],
      authorAvatar: this.currentUser.email.charAt(0).toUpperCase(),
      authorId: this.currentUser.uid,
      text: commentText,
      timestamp: new Date().toISOString(),
    };

    try {
      const artworkRef = firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId);
      const comments = this.artwork.comments || [];
      comments.push(newComment);

      await artworkRef.update({ comments: comments });

      this.artwork.comments = comments;
      if (commentInput) commentInput.value = "";
      this.loadComments();
      const commentCountEl = document.getElementById("commentCount");
      if (commentCountEl) commentCountEl.textContent = comments.length;

      setTimeout(() => {
        this.attachCommentClickHandlers();
      }, 100);

      if (this.currentUser.uid !== this.artwork.artistId) {
        await authManager.createNotification(this.artwork.artistId, "comment", {
          artworkId: this.artworkId,
          artworkTitle: this.artwork.title,
          userId: this.currentUser.uid,
          userName:
            this.currentUser.displayName ||
            this.currentUser.email.split("@")[0],
          comment: commentText.substring(0, 100),
        });
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  }

  loadComments() {
    const container = document.getElementById("commentsList");
    const comments = this.artwork.comments || [];

    if (comments.length === 0) {
      if (container)
        container.innerHTML =
          '<p class="no-comments">No comments yet. Be the first!</p>';
      return;
    }

    if (container) {
      container.innerHTML = comments
        .map(
          (c) => `
              <div class="comment-item" data-author-id="${c.authorId || ""}" data-author-name="${this.escapeHtml(c.author)}" style="cursor: pointer;">
                  <div class="comment-avatar">${c.authorAvatar || "👤"}</div>
                  <div class="comment-content">
                      <div class="comment-author">${this.escapeHtml(c.author)}</div>
                      <div class="comment-text">${this.escapeHtml(c.text)}</div>
                      <div class="comment-time">${this.formatTimeAgo(c.timestamp)}</div>
                  </div>
              </div>
          `,
        )
        .join("");
    }
  }

  // ========== COMMENTS TOGGLE ==========
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

  // ========== SHARE & DOWNLOAD ==========
  shareArtwork() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: this.artwork.title, url: url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  downloadImage() {
    const link = document.createElement("a");
    link.href = this.artwork.imageUrl;
    link.download = `${this.artwork.title.replace(/\s+/g, "_")}.jpg`;
    link.click();
  }

  // ========== EVENT LISTENERS ==========
  setupEventListeners() {
    const likeBtn = document.getElementById("likeBtn");
    const cheersBtn = document.getElementById("cheersBtn");
    const shadowBtn = document.getElementById("shadowBtn");
    const saveBtn = document.getElementById("saveBtn");
    const shareBtn = document.getElementById("shareBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const postCommentBtn = document.getElementById("postCommentBtn");

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
    if (postCommentBtn)
      postCommentBtn.addEventListener("click", () => this.postComment());

    // Enter key for comments
    const commentInput = document.getElementById("commentInput");
    if (commentInput) {
      commentInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.postComment();
        }
      });
    }

    document.querySelectorAll(".tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        window.location.href = `/pages/community/gallery.html?tag=${tag.dataset.tag}`;
      });
    });
  }

  // ========== UTILITY ==========
  showToast(message) {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    } else {
      alert(message);
    }
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
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================
// GLOBAL REPORT FUNCTION (for nsfw-moderation.js)
// ============================================
window.reportNSFWContent = async function(artworkId, reason) {
  const user = firebase.auth().currentUser;
  if (!user) {
    return { success: false, error: 'Please login to report content' };
  }

  try {
    // Check if already reported by this user
    const existingReports = await firebase.firestore()
      .collection('reports')
      .where('artworkId', '==', artworkId)
      .where('userId', '==', user.uid)
      .get();

    if (!existingReports.empty) {
      return { success: false, error: 'You have already reported this artwork' };
    }

    // Add report
    await firebase.firestore().collection('reports').add({
      artworkId: artworkId,
      userId: user.uid,
      reason: reason,
      reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      userName: user.displayName || user.email.split('@')[0]
    });

    // Update artwork
    const artworkRef = firebase.firestore()
      .collection('artworks')
      .doc(artworkId);

    // Get current report count
    const artworkDoc = await artworkRef.get();
    if (artworkDoc.exists) {
      const data = artworkDoc.data();
      const currentReports = data.reportCount || 0;

      await artworkRef.update({
        reportCount: currentReports + 1,
        nsfwReported: true,
        lastReportedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // If more than 3 reports, flag for review
      if (currentReports + 1 >= 3) {
        await artworkRef.update({
          nsfwStatus: 'flagged',
          nsfwFlaggedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Notify moderators
        await notifyModerators(artworkId, data.title || 'Untitled');
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Report error:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to notify moderators
async function notifyModerators(artworkId, title) {
  try {
    const adminsSnapshot = await firebase.firestore()
      .collection('users')
      .where('role', 'in', ['admin', 'moderator'])
      .get();

    const notifications = [];
    adminsSnapshot.forEach(doc => {
      notifications.push({
        userId: doc.id,
        type: 'nsfw_flagged',
        message: `🚨 Artwork "${title}" has been flagged for review after multiple reports.`,
        artworkId: artworkId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
        priority: 'high'
      });
    });

    const batch = firebase.firestore().batch();
    notifications.forEach(notification => {
      const ref = firebase.firestore().collection('notifications').doc();
      batch.set(ref, notification);
    });
    await batch.commit();

  } catch (error) {
    console.error('Error notifying moderators:', error);
  }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing ArtworkDetail...");
  new ArtworkDetail();
});
