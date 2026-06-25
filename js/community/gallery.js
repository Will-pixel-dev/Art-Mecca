// ============================================
// COMMUNITY GALLERY - FIRESTORE VERSION
// WITH NEW CATEGORIES: Photography, Animation, Traditional Art
// ============================================

class CommunityGallery {
  constructor() {
    this.currentCategory = "all";
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.artworks = [];
    this.currentArtwork = null;
    this.masonry = null;
    this.searchQuery = "";
    this.likedArtworks = new Set();
    this.savedArtworks = new Set();
    this.lastDoc = null;
    this.artworksPerPage = 12;
    this.currentUser = null;
    this.uploadedImageFile = null;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupMasonry();
    this.setupUpload();
    this.setupRandomPrompt();
    this.setupDropdown();
    this.setupSearch();
    this.setupSidebar();
    this.setupCollapsibleSidebar();
    this.setupLogout();
    this.setupSidebarActions();

    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      await this.updateSidebarUser();
      if (!this.artworks.length) {
        await this.loadArtworksFromFirestore();
      }
    });

    console.log("Community Gallery initialized!");
  }

  // ========== UPDATE SIDEBAR USER INFO ==========
  async updateSidebarUser() {
    const user = firebase.auth().currentUser;
    const sidebarAvatar = document.getElementById("sidebarUserAvatar");
    const sidebarName = document.getElementById("sidebarUserName");
    const sidebarEmail = document.getElementById("sidebarUserEmail");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginLink = document.getElementById("sidebarLoginLink");

    if (user) {
      const displayName = user.displayName || user.email.split("@")[0];
      if (sidebarName) sidebarName.textContent = displayName;
      if (sidebarEmail) sidebarEmail.textContent = user.email;
      if (sidebarAvatar) {
        sidebarAvatar.innerHTML = displayName.charAt(0).toUpperCase();
        sidebarAvatar.style.background = "linear-gradient(135deg, #fe67ea, #63dbee)";
        sidebarAvatar.style.cursor = "pointer";
        sidebarAvatar.onclick = () => {
          window.location.href = `/pages/community/profiles.html?user=${user.uid}`;
        };
      }
      if (logoutBtn) {
        logoutBtn.style.display = "flex";
      }
      if (loginLink) loginLink.style.display = "none";
    } else {
      if (sidebarName) sidebarName.textContent = "Guest User";
      if (sidebarEmail) sidebarEmail.textContent = "";
      if (sidebarAvatar) {
        sidebarAvatar.innerHTML = '<i class="fas fa-user"></i>';
        sidebarAvatar.style.background = "rgba(255,255,255,0.1)";
        sidebarAvatar.style.cursor = "default";
        sidebarAvatar.onclick = null;
      }
      if (logoutBtn) logoutBtn.style.display = "none";
      if (loginLink) loginLink.style.display = "inline-block";
    }
  }

  // ========== LOGOUT FUNCTIONALITY ==========
  setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await firebase.auth().signOut();
          window.location.href = "/index.html";
        } catch (error) {
          console.error("Logout error:", error);
          this.showToast("Error logging out");
        }
      });
    }
  }

  // ========== SIDEBAR ACTIONS ==========
  setupSidebarActions() {
    const uploadsBtn = document.getElementById("sidebarUploads");
    if (uploadsBtn) {
      uploadsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        window.location.href = "/pages/community/my-uploads.html";
      });
    }

    const notifBtn = document.getElementById("sidebarNotifications");
    if (notifBtn) {
      notifBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        window.location.href = "/pages/community/notifications.html";
      });
    }

    const likedBtn = document.getElementById("sidebarLikes");
    if (likedBtn) {
      likedBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        window.location.href = `/pages/community/profiles.html?user=${user.uid}`;
      });
    }

    const savesBtn = document.getElementById("sidebarSaves");
    if (savesBtn) {
      savesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        window.location.href = `/pages/community/profiles.html?user=${user.uid}`;
      });
    }
  }

  // ========== LOAD ARTWORKS WITH CACHING ==========
  async loadArtworksFromFirestore(reset = true) {
    if (this.isLoading) return;

    this.isLoading = true;
    const loadingSpinner = document.getElementById("loadingSpinner");
    if (loadingSpinner) loadingSpinner.classList.add("show");

    try {
      // Check if user is adult for NSFW filtering
      let isAdult = false;
      if (this.currentUser) {
        try {
          const userDoc = await firebase.firestore()
            .collection('users')
            .doc(this.currentUser.uid)
            .get();
          if (userDoc.exists) {
            isAdult = userDoc.data().isAdult || false;
          }
        } catch (error) {
          console.error('Error checking user age:', error);
        }
      }

      let query = firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(this.artworksPerPage);

      // Apply category filter
      if (this.currentCategory !== "all" && this.currentCategory !== "trending") {
        query = query.where("category", "==", this.currentCategory);
      }

      // If user is not adult, hide NSFW content
      if (!isAdult) {
        query = query.where("isNSFW", "==", false);
      }

      // Apply pagination
      if (!reset && this.lastDoc) {
        query = query.startAfter(this.lastDoc);
      }

      const snapshot = await query.get();

      if (reset) {
        this.artworks = [];
      }

      const newArtworks = [];
      snapshot.forEach((doc) => {
        newArtworks.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      this.artworks = reset ? newArtworks : [...this.artworks, ...newArtworks];
      this.hasMore = newArtworks.length === this.artworksPerPage;
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1];

      this.renderGallery();
    } catch (error) {
      console.error("Error loading artworks:", error);
      this.showToast("Failed to load artworks. Please refresh.");
    } finally {
      this.isLoading = false;
      if (loadingSpinner) loadingSpinner.classList.remove("show");
    }
    // After getting artworks, check verification status for each artist
    for (const artwork of this.artworks) {
        const isVerified = await this.checkArtistVerification(artwork.artistId);
        artwork.artistVerified = isVerified;
    }
  }
  // In gallery.js, update createCardHTML method

createCardHTML(art) {
    // ... existing code ...

    // Add verification badge if artist is verified
    const verificationBadge = art.artistVerified ?
        `<span class="verification-badge verified small" style="position: absolute; top: 8px; right: 8px; z-index: 5;">
            <i class="fas fa-shield-alt"></i> Verified
        </span>` : '';

    // ... rest of card HTML ...

    return `
        <div class="gallery-card" data-id="${art.id}" data-artist-id="${art.artistId}">
            <div class="card-inner">
                <span class="category-badge">${category}</span>
                ${verificationBadge}
                <img src="${imageUrl}" alt="${art.title || "Artwork"}" class="card-image" loading="lazy">
                <!-- ... rest of card ... -->
            </div>
        </div>
    `;
}

// In loadArtworksFromFirestore method, after loading artworks:
async loadArtworksFromFirestore(reset = true) {
    // ... existing code ...

    // After getting artworks, check verification status for each artist
    for (const artwork of this.artworks) {
        const isVerified = await this.checkArtistVerification(artwork.artistId);
        artwork.artistVerified = isVerified;
    }

    // ... render gallery ...
}

// Add this method to the CommunityGallery class:
async checkArtistVerification(artistId) {
    try {
        const doc = await firebase.firestore()
            .collection('users')
            .doc(artistId)
            .get();

        if (doc.exists) {
            const data = doc.data();
            return data.isAdult === true && data.ageVerified === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking artist verification:', error);
        return false;
    }
}

  // ========== RENDER GALLERY ==========
  renderGallery() {
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;

    let filteredArtworks = this.artworks;
    if (this.searchQuery) {
      filteredArtworks = this.artworks.filter(
        (art) =>
          art.title?.toLowerCase().includes(this.searchQuery) ||
          art.artistName?.toLowerCase().includes(this.searchQuery) ||
          art.tags?.some((tag) => tag.toLowerCase().includes(this.searchQuery)),
      );
    }

    const loadMoreContainer = document.getElementById("loadMoreContainer");
    if (loadMoreContainer) {
      loadMoreContainer.style.display =
        this.hasMore && filteredArtworks.length > 0 ? "block" : "none";
    }

    if (filteredArtworks.length === 0 && !this.isLoading) {
      grid.innerHTML = `
        <div class="gallery-sizer"></div>
        <div class="empty-gallery" style="width: 100%; text-align: center; padding: var(--space-12);">
          <i class="fas fa-images" style="font-size: 4rem; color: var(--gray);"></i>
          <h3>No artworks yet</h3>
          <p>Be the first to share your artwork!</p>
          <button class="btn btn-primary" id="emptyUploadBtn" style="background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; border: none; padding: 12px 24px; border-radius: 50px; cursor: pointer;">
            Upload Artwork
          </button>
        </div>
      `;
      const emptyBtn = document.getElementById("emptyUploadBtn");
      if (emptyBtn) {
        emptyBtn.addEventListener("click", () => {
          const uploadModal = document.getElementById("uploadModal");
          if (uploadModal) uploadModal.classList.add("active");
        });
      }
      return;
    }

    const existingCards = grid.querySelectorAll(
      ".gallery-card:not(.gallery-sizer)",
    );
    existingCards.forEach((card) => card.remove());
    grid.innerHTML =
      '<div class="gallery-sizer"></div>' +
      filteredArtworks.map((art) => this.createCardHTML(art)).join("");

    this.attachCardEvents();

    if (this.masonry) {
      setTimeout(() => {
        this.masonry.reloadItems();
        this.masonry.layout();
      }, 100);
    }
  }
  // Add to CommunityGallery class

setupVerifiedFilter() {
    const verifiedFilter = document.getElementById('verifiedOnly');
    if (verifiedFilter) {
        verifiedFilter.addEventListener('change', async (e) => {
            this.verifiedOnly = e.target.checked;
            this.currentPage = 1;
            this.lastDoc = null;
            await this.loadArtworksFromFirestore(true);
        });
    }
}

// In loadArtworksFromFirestore, filter by verification:
async loadArtworksFromFirestore(reset = true) {
    // ... existing code ...

    let artworks = this.artworks;

    // Filter by verification if enabled
    if (this.verifiedOnly) {
        const verifiedArtworks = [];
        for (const art of artworks) {
            const isVerified = await this.checkArtistVerification(art.artistId);
            if (isVerified) {
                verifiedArtworks.push(art);
            }
        }
        artworks = verifiedArtworks;
    }

    // ... render gallery ...
}

  createCardHTML(art) {
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
      "traditional-art": "🖌️ Traditional Art",
    };

    const category = categoryNames[art.category] || art.category || "Artwork";
    const artistName = art.artistName || "Anonymous Artist";
    const artistAvatar = art.artistName?.charAt(0)?.toUpperCase() || "A";
    const imageUrl =
      art.imageUrl || "https://placehold.co/400x500/fe67ea/white?text=Artwork";
    const likeCount = art.likes || 0;
    const artistId = art.artistId || "";
    // Add verification badge if artist is verified
    const verificationBadge = art.artistVerified ?
        `<span class="verification-badge verified small" style="position: absolute; top: 8px; right: 8px; z-index: 5;">
            <i class="fas fa-shield-alt"></i> Verified
        </span>` : '';

    const isOwner = this.currentUser && this.currentUser.uid === art.artistId;
    const editButton = isOwner
      ? `<button class="card-action-btn edit-card" data-id="${art.id}" title="Edit Artwork"><i class="fas fa-edit"></i></button>`
      : "";

    return `
      <div class="gallery-card" data-id="${art.id}">
        <div class="card-inner">
          <span class="category-badge">${category}</span>
          <img src="${imageUrl}" alt="${art.title || "Artwork"}" class="card-image" loading="lazy">
          <div class="card-overlay">
            <div class="artist-info">
              <div class="artist-avatar-small" data-artist-id="${artistId}" style="cursor: pointer;">${artistAvatar}</div>
              <span class="artist-name-small" data-artist-id="${artistId}" style="cursor: pointer;">${artistName}</span>
            </div>
            <div class="card-actions">
              ${editButton}
              <button class="card-action-btn like-card" data-id="${art.id}">
                <i class="fas fa-heart"></i>
                <span class="like-count">${likeCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachCardEvents() {
    document.querySelectorAll(".gallery-card").forEach((card) => {
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      newCard.addEventListener("click", (e) => {
        if (
          !e.target.closest(".card-action-btn") &&
          !e.target.closest(".artist-info")
        ) {
          const id = newCard.dataset.id;
          window.location.href = `/pages/community/artwork-detail.html?id=${id}`;
        }
      });

      const artistAvatar = newCard.querySelector(".artist-avatar-small");
      const artistNameSpan = newCard.querySelector(".artist-name-small");

      const handleArtistClick = (e) => {
        e.stopPropagation();
        const artistId = e.currentTarget.dataset.artistId;
        if (artistId) {
          window.location.href = `/pages/community/profiles.html?user=${artistId}`;
        }
      };

      if (artistAvatar)
        artistAvatar.addEventListener("click", handleArtistClick);
      if (artistNameSpan)
        artistNameSpan.addEventListener("click", handleArtistClick);

      const editBtn = newCard.querySelector(".edit-card");
      if (editBtn) {
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = editBtn.dataset.id;
          window.location.href = `/pages/community/edit-artwork.html?id=${id}`;
        });
      }

      const likeBtn = newCard.querySelector(".like-card");
      if (likeBtn) {
        likeBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const id = likeBtn.dataset.id;
          await this.handleLike(id, likeBtn);
        });
      }
    });
  }

  async handleLike(artworkId, btnElement) {
    const user = firebase.auth().currentUser;
    if (!user) {
      this.showToast("Please login to like artworks");
      return;
    }

    try {
      const artworkRef = firebase
        .firestore()
        .collection("artworks")
        .doc(artworkId);
      const likeRef = firebase
        .firestore()
        .collection("likes")
        .doc(`${artworkId}_${user.uid}`);
      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        await likeRef.delete();
        await artworkRef.update({
          likes: firebase.firestore.FieldValue.increment(-1),
        });
        this.showToast("Removed like");
      } else {
        await likeRef.set({
          artworkId: artworkId,
          userId: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await artworkRef.update({
          likes: firebase.firestore.FieldValue.increment(1),
        });
        this.showToast("Liked! ❤️");
      }

      const likeCountSpan = btnElement.querySelector(".like-count");
      const artwork = this.artworks.find((a) => a.id === artworkId);
      if (artwork && likeCountSpan) {
        const newCount = likeDoc.exists
          ? (artwork.likes || 1) - 1
          : (artwork.likes || 0) + 1;
        likeCountSpan.textContent = newCount;
        artwork.likes = newCount;
      }
    } catch (error) {
      console.error("Like error:", error);
      this.showToast("Error processing like");
    }
  }

  loadMore() {
    if (this.isLoading || !this.hasMore) return;
    this.currentPage++;
    this.loadArtworksFromFirestore(false);
  }

  setupEventListeners() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn)
      loadMoreBtn.addEventListener("click", () => this.loadMore());
  }

  setupMasonry() {
    const grid = document.getElementById("galleryGrid");
    if (grid) {
      imagesLoaded(grid, () => {
        this.masonry = new Masonry(grid, {
          itemSelector: ".gallery-card",
          columnWidth: ".gallery-sizer",
          percentPosition: true,
          gutter: 0,
        });
      });
    }
  }

  // ========== FIXED DROPDOWN ==========
  setupDropdown() {
    const dropdownBtn = document.getElementById("categoryDropdownBtn");
    const dropdownMenu = document.getElementById("categoryDropdownMenu");
    if (dropdownBtn && dropdownMenu) {
      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
      });

      document.querySelectorAll(".dropdown-item").forEach((item) => {
        item.addEventListener("click", async (e) => {
          e.preventDefault();
          const category = item.dataset.category;

          // ========== NSFW CATEGORY HANDLING ==========
          if (category === 'nsfw') {
            // Check if user is logged in
            const user = firebase.auth().currentUser;
            if (!user) {
              this.showToast('Please login to view NSFW content');
              window.location.href = '/pages/auth/login.html';
              return;
            }

            // Check if user is 18+
            try {
              const userDoc = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .get();

              if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.isAdult) {
                  window.location.href = '/pages/community/nsfw-gallery.html';
                } else {
                  this.showToast('You must be 18+ to view NSFW content');
                  if (window.AgeVerification) {
                    window.AgeVerification.triggerVerification();
                  } else {
                    alert('Please verify your age in your profile settings to access NSFW content.');
                    window.location.href = `/pages/community/profiles.html?user=${user.uid}`;
                  }
                }
              } else {
                this.showToast('Please complete your profile to view NSFW content');
              }
            } catch (error) {
              console.error('Error checking user age:', error);
              this.showToast('Error verifying age. Please try again.');
            }
            return;
          }

          // ========== REGULAR CATEGORY HANDLING ==========
          this.currentCategory = category;
          this.currentPage = 1;
          this.lastDoc = null;
          document
            .querySelectorAll(".dropdown-item")
            .forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
          const selectedSpan = document.getElementById("selectedCategory");
          if (selectedSpan) selectedSpan.textContent = item.textContent.trim();
          await this.loadArtworksFromFirestore(true);
          this.closeDropdown();
        });
      });
    }
  }

  closeDropdown() {
    const dropdownMenu = document.getElementById("categoryDropdownMenu");
    if (dropdownMenu) dropdownMenu.classList.remove("show");
  }

  setupSearch() {
    const searchInput = document.getElementById("searchInput");
    const searchClear = document.getElementById("searchClearBtn");
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          if (searchClear)
            searchClear.style.display = this.searchQuery ? "block" : "none";
          this.renderGallery();
        }, 300);
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        this.searchQuery = "";
        searchClear.style.display = "none";
        this.renderGallery();
      });
    }
  }

  // ========== IMAGE COMPRESSION METHOD ==========
  compressImage(file, maxWidth = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (file.size < 500 * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Image compression failed"));
              }
            },
            "image/jpeg",
            quality,
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  }

  // ========== UPLOAD FUNCTIONALITY ==========
  setupUpload() {
    const uploadBtn = document.getElementById("topUploadBtn");
    const uploadModal = document.getElementById("uploadModal");
    const closeModal = document.getElementById("closeUploadModal");
    const uploadArea = document.getElementById("uploadArea");
    const imageFile = document.getElementById("imageFile");
    const uploadForm = document.getElementById("uploadForm");
    const submitBtn = document.getElementById("submitArtBtn");

    if (uploadBtn) {
      uploadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Upload button clicked - opening modal");
        if (uploadModal) uploadModal.classList.add("active");
      });
    }

    if (closeModal) {
      closeModal.addEventListener("click", () => {
        if (uploadModal) uploadModal.classList.remove("active");
        this.resetUploadForm();
      });
    }

    if (uploadModal) {
      uploadModal.addEventListener("click", (e) => {
        if (e.target === uploadModal) {
          uploadModal.classList.remove("active");
          this.resetUploadForm();
        }
      });
    }

    if (uploadArea) {
      uploadArea.addEventListener("click", () => {
        if (imageFile) imageFile.click();
      });

      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "#fe67ea";
        uploadArea.style.background = "rgba(254, 103, 234, 0.05)";
      });

      uploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "var(--gray-light)";
        uploadArea.style.background = "var(--light)";
      });

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          this.handleImageUpload(file);
        }
        uploadArea.style.borderColor = "var(--gray-light)";
        uploadArea.style.background = "var(--light)";
      });
    }

    if (imageFile) {
      imageFile.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageUpload(e.target.files[0]);
        }
      });
    }

    if (uploadForm) {
      uploadForm.addEventListener("submit", (e) => this.submitArtwork(e));
    }
  }

  resetUploadForm() {
    const uploadForm = document.getElementById("uploadForm");
    const uploadArea = document.getElementById("uploadArea");
    const imageFile = document.getElementById("imageFile");

    if (uploadForm) uploadForm.reset();
    this.uploadedImageFile = null;

    if (uploadArea) {
      uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Drag & drop or click to upload</p>
        <span>PNG, JPG, JPEG up to 10MB</span>
        <input type="file" id="imageFile" accept="image/*" hidden>
      `;

      const newImageFile = document.getElementById("imageFile");
      if (newImageFile) {
        newImageFile.addEventListener("change", (e) => {
          if (e.target.files && e.target.files[0]) {
            this.handleImageUpload(e.target.files[0]);
          }
        });
      }

      const newUploadArea = document.getElementById("uploadArea");
      if (newUploadArea) {
        newUploadArea.addEventListener("click", () => {
          const fileInput = document.getElementById("imageFile");
          if (fileInput) fileInput.click();
        });
      }
    }
  }

  handleImageUpload(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.showToast("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showToast("File size must be less than 10MB");
      return;
    }

    this.uploadedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadArea = document.getElementById("uploadArea");
      if (uploadArea) {
        uploadArea.innerHTML = `
          <img src="${e.target.result}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">
          <p>Image ready!</p>
          <span>${file.name}</span>
          <input type="file" id="imageFile" accept="image/*" hidden>
        `;

        const newImageFile = document.getElementById("imageFile");
        if (newImageFile) {
          newImageFile.addEventListener("change", (ev) => {
            if (ev.target.files && ev.target.files[0]) {
              this.handleImageUpload(ev.target.files[0]);
            }
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async submitArtwork(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;

    if (!user) {
      this.showToast("Please login to upload artwork");
      window.location.href = "/pages/auth/login.html";
      return;
    }

    const title = document.getElementById("artTitle").value.trim();
    const category = document.getElementById("artCategory").value;
    const description = document.getElementById("artDescription").value.trim();
    const tagsInput = document.getElementById("artTags").value;

    // Get NSFW fields
    const isNSFW = document.getElementById("isNSFW")?.checked || false;
    const nsfwCategory = document.getElementById("nsfwCategory")?.value || "mature";

    if (!title || !category || !this.uploadedImageFile) {
      this.showToast("Please fill in all required fields and select an image");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const submitBtn = document.getElementById("submitArtBtn");
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    try {
      const compressedFile = await this.compressImage(
        this.uploadedImageFile,
        1200,
        0.85,
      );

      const storageRef = firebase.storage().ref();
      const fileName = `artworks/${user.uid}/${Date.now()}_${this.uploadedImageFile.name}`;
      const fileRef = storageRef.child(fileName);

      await fileRef.put(compressedFile);
      const downloadURL = await fileRef.getDownloadURL();

      await firebase
        .firestore()
        .collection("artworks")
        .add({
          title: title,
          description: description,
          imageUrl: downloadURL,
          category: category,
          tags: tags,
          artistId: user.uid,
          artistName: user.displayName || user.email.split("@")[0],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          likes: 0,
          cheers: 0,
          comments: [],
          status: "published",
          isNSFW: isNSFW,
          nsfwCategory: isNSFW ? nsfwCategory : null,
          nsfwReported: false,
          nsfwWarnings: 0,
        });

      this.showToast("Artwork published successfully! 🎉");

      const uploadModal = document.getElementById("uploadModal");
      if (uploadModal) uploadModal.classList.remove("active");

      this.resetUploadForm();
      this.uploadedImageFile = null;
      this.currentPage = 1;
      this.lastDoc = null;
      await this.loadArtworksFromFirestore(true);
    } catch (error) {
      console.error("Upload error:", error);
      this.showToast("Upload failed: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  setupRandomPrompt() {
    const prompts = [
      "At the Top of the World",
      "Breathe",
      "Fallen",
      "A Thousand Words",
      "Echoes of Silence",
      "Uncharted Waters",
      "Forgotten Memories",
      "Urban Jungle",
      "Mythical Realms",
      "Neon Dreams",
    ];

    const generateBtn = document.getElementById("generateRandomPrompt");
    const miniGenerateBtn = document.getElementById("miniPromptBtn");
    const promptValue = document.getElementById("randomPromptText");
    const miniPromptText = document.getElementById("miniPromptText");

    const updatePrompt = () => {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      if (promptValue) promptValue.textContent = `"${randomPrompt}"`;
      if (miniPromptText) miniPromptText.textContent = `"${randomPrompt}"`;
    };

    if (generateBtn) generateBtn.addEventListener("click", updatePrompt);
    if (miniGenerateBtn)
      miniGenerateBtn.addEventListener("click", updatePrompt);
    updatePrompt();
  }

  setupSidebar() {
    const likesCount = document.getElementById("likesCount");
    const savesCount = document.getElementById("savesCount");
    if (likesCount) likesCount.textContent = this.likedArtworks.size;
    if (savesCount) savesCount.textContent = this.savedArtworks.size;
  }

  setupCollapsibleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    if (sidebar && toggleBtn) {
      const savedState = localStorage.getItem("sidebarCollapsed");
      if (savedState === "true") sidebar.classList.add("collapsed");
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        localStorage.setItem(
          "sidebarCollapsed",
          sidebar.classList.contains("collapsed"),
        );
        setTimeout(() => {
          if (this.masonry) {
            this.masonry.reloadItems();
            this.masonry.layout();
          }
        }, 300);
      });
    }

    const mobileToggle = document.getElementById("mobileSidebarToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (mobileToggle && sidebar && sidebarOverlay) {
      mobileToggle.addEventListener("click", () => {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
      });
      sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return "Recently";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1)
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
    return "Just now";
  }

  showToast(message) {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

// Initialize gallery
document.addEventListener("DOMContentLoaded", () => {
  window.gallery = new CommunityGallery();
});
