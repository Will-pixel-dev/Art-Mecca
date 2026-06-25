/**
 * Enhanced Profile Hero - Three Layer System
 * Layer 1: Background (image/video/gif)
 * Layer 2: Transparent overlay (character/artwork)
 * Layer 3: Glass UI with name, stats, bio, actions
 */

class ProfileHero {
  constructor() {
    this.userId = null;
    this.currentUser = null;
    this.userData = null;
    this.isOwnProfile = false;
    this.bioExpanded = false;
    this.currentTheme = "dark";
    this.badgeData = null;
    this.layerControlsVisible = false;
    this.init();
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.userId = urlParams.get("user");

    console.log("UserId from URL:", this.userId);

    if (!this.userId) {
      this.showError();
      return;
    }

    if (typeof firebase === "undefined" || typeof db === "undefined") {
      console.log("Waiting for Firebase...");
      setTimeout(() => this.init(), 500);
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      this.isOwnProfile =
        this.currentUser && this.currentUser.uid === this.userId;

      console.log("Loading profile for:", this.userId);
      console.log("Is own profile:", this.isOwnProfile);

      if (!this.currentUser) {
        if (!window.location.pathname.includes("login")) {
          window.location.href =
            "/pages/auth/login.html?redirect=" +
            encodeURIComponent(
              window.location.pathname + window.location.search,
            );
        }
        return;
      }

      window.profileHero = this;

      await this.loadUserData();
      await this.loadBadge();
      this.renderProfile();
      this.renderBadge();
      this.setupEventListeners();
      this.setupLayerControls();
      this.loadSavedTheme();

      // Position theme toggle
      this.positionThemeToggle();
      this.setupAdminBadgeLink();

      // Hide loading, show content
      const loadingState = document.getElementById("loadingState");
      const profileContent = document.getElementById("profileContent");

      if (loadingState) loadingState.style.display = "none";
      if (profileContent) profileContent.style.display = "block";
    });
  }

  // ============================================
  // POSITION THEME TOGGLE
  // ============================================

  positionThemeToggle() {
    const themeToggle = document.querySelector(".hero-theme-toggle");
    if (themeToggle) {
      themeToggle.style.position = "fixed";
      themeToggle.style.bottom = "100px";
      themeToggle.style.right = "24px";
      themeToggle.style.left = "auto";
      themeToggle.style.top = "auto";
      themeToggle.style.zIndex = "100";
      themeToggle.style.width = "44px";
      themeToggle.style.height = "44px";
      themeToggle.style.borderRadius = "50%";
      themeToggle.style.background = "rgba(0, 0, 0, 0.5)";
      themeToggle.style.backdropFilter = "blur(8px)";
      themeToggle.style.border = "1px solid rgba(255, 255, 255, 0.1)";
      themeToggle.style.display = "flex";
      themeToggle.style.alignItems = "center";
      themeToggle.style.justifyContent = "center";
      themeToggle.style.color = "white";
      themeToggle.style.cursor = "pointer";
    }
  }

  // ============================================
  // LAYER CONTROLS - COLLAPSIBLE ICONS
  // ============================================

  setupLayerControls() {
    console.log("Setting up layer controls...");

    // Remove any existing controls
    const existingControls = document.querySelector(
      ".layer-controls-container",
    );
    if (existingControls) {
      existingControls.remove();
    }

    if (!this.isOwnProfile) return;

    // Create container for layer controls - positioned at top right
    const container = document.createElement("div");
    container.className = "layer-controls-container";
    container.style.cssText = `
        position: fixed;
        right: 24px;
        top: 60px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
    `;

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "layer-toggle-btn";
    toggleBtn.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    `;
    toggleBtn.innerHTML = '<i class="fas fa-layer-group"></i>';
    toggleBtn.title = "Toggle Layer Controls";
    container.appendChild(toggleBtn);

    // Controls wrapper (hidden by default)
    const controlsWrapper = document.createElement("div");
    controlsWrapper.className = "layer-controls-wrapper";
    controlsWrapper.style.cssText = `
        display: none;
        flex-direction: column;
        gap: 6px;
        margin-top: 6px;
        animation: slideDown 0.3s ease;
        align-items: flex-end;
    `;
    container.appendChild(controlsWrapper);

    // Layer 1 control
    const layer1Control = this.createLayerControl("layer1", "🎨", "Background");
    controlsWrapper.appendChild(layer1Control);

    // Layer 2 control
    const layer2Control = this.createLayerControl("layer2", "🖼️", "Overlay");
    controlsWrapper.appendChild(layer2Control);

    document.body.appendChild(container);

    // Toggle visibility
    toggleBtn.addEventListener("click", () => {
      this.layerControlsVisible = !this.layerControlsVisible;
      controlsWrapper.style.display = this.layerControlsVisible
        ? "flex"
        : "none";
      toggleBtn.style.background = this.layerControlsVisible
        ? "rgba(254, 103, 234, 0.3)"
        : "rgba(0, 0, 0, 0.6)";
      toggleBtn.style.borderColor = this.layerControlsVisible
        ? "#fe67ea"
        : "rgba(255, 255, 255, 0.1)";
    });

    // Add slideDown animation
    const style = document.createElement("style");
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    console.log("Layer controls setup complete!");
  }

  createLayerControl(layer, icon, label) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            padding: 4px 8px 4px 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        `;

    // Label
    const labelSpan = document.createElement("span");
    labelSpan.textContent = `${icon} ${label}`;
    labelSpan.style.cssText = `
            color: white;
            font-size: 0.7rem;
            font-weight: 500;
            margin-right: 2px;
        `;
    wrapper.appendChild(labelSpan);

    // Upload button
    const uploadBtn = document.createElement("button");
    uploadBtn.style.cssText = `
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.3);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            transition: all 0.3s ease;
        `;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i>';
    uploadBtn.title = `Change ${label}`;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,video/*";
    fileInput.style.cssText = "display: none;";
    fileInput.id = `${layer}Upload`;

    uploadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadLayerFile(file, layer);
      }
      fileInput.value = "";
    });

    wrapper.appendChild(fileInput);
    wrapper.appendChild(uploadBtn);

    // Remove button (only show if content exists)
    const removeBtn = document.createElement("button");
    removeBtn.style.cssText = `
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.3);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: white;
            cursor: pointer;
            display: ${(layer === "layer1" && this.userData?.heroBackground) || (layer === "layer2" && this.userData?.heroOverlay) ? "flex" : "none"};
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            transition: all 0.3s ease;
        `;
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.title = `Remove ${label}`;
    removeBtn.dataset.layer = layer;

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeLayerFile(layer);
    });

    wrapper.appendChild(removeBtn);

    // Store reference for updating
    wrapper.dataset.layer = layer;
    wrapper.querySelector(".remove-btn") ||
      (() => {
        removeBtn.className = "remove-btn";
      })();

    return wrapper;
  }

  updateLayerControlsVisibility() {
    // Update remove button visibility for each layer
    const controls = document.querySelectorAll(".layer-controls-wrapper > div");
    controls.forEach((wrapper) => {
      const layer = wrapper.dataset.layer;
      const removeBtn = wrapper.querySelector(".remove-btn");
      if (removeBtn) {
        if (
          (layer === "layer1" && this.userData?.heroBackground) ||
          (layer === "layer2" && this.userData?.heroOverlay)
        ) {
          removeBtn.style.display = "flex";
        } else {
          removeBtn.style.display = "none";
        }
      }
    });
  }

  // ============================================
  // LOAD USER DATA
  // ============================================

  async loadUserData() {
    try {
      const doc = await db.collection("users").doc(this.userId).get();
      if (!doc.exists) {
        console.log("User document not found, creating one...");
        await this.createUserDocument();
        const newDoc = await db.collection("users").doc(this.userId).get();
        if (newDoc.exists) {
          this.userData = newDoc.data();
        } else {
          this.showError();
        }
        return;
      }
      this.userData = doc.data();
      console.log("User data loaded:", this.userData);
    } catch (error) {
      console.error("Error loading user data:", error);
      this.showError();
    }
  }

  async createUserDocument() {
    try {
      const user = this.currentUser;
      await db
        .collection("users")
        .doc(user.uid)
        .set({
          fullname: user.displayName || user.email?.split("@")[0] || "Artist",
          username: user.email?.split("@")[0] || "artist",
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          stats: {
            artworks: 0,
            followers: 0,
            following: 0,
            totalLikes: 0,
          },
          bio: "Hello! I am an artist on Art Mecca.",
          role: "user",
          isAdult: false,
          ageVerified: false,
          socialLinks: {},
          heroBackground: "",
          heroOverlay: "",
          badge: null,
        });
      console.log("✅ User document created!");
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  // ============================================
  // ARTIST BADGE
  // ============================================

  async loadBadge() {
    if (!this.userId) return;

    try {
      const userDoc = await db.collection("users").doc(this.userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        this.badgeData = data.badge || null;
      }
    } catch (error) {
      console.error("Error loading badge:", error);
    }
  }

  renderBadge() {
    const badge = this.badgeData;

    const badgeArtistType = document.getElementById("badgeArtistType");
    const badgeSpecialties = document.getElementById("badgeSpecialties");
    const badgeMediumTags = document.getElementById("badgeMediumTags");
    const badgeIcon = document.getElementById("badgeIcon");
    const editBadgeBtn = document.getElementById("editBadgeBtn");

    if (!badgeArtistType) return;

    if (!badge) {
      badgeArtistType.textContent = "Not set";
      if (badgeSpecialties)
        badgeSpecialties.innerHTML = '<span class="badge-tag">Not set</span>';
      if (badgeMediumTags)
        badgeMediumTags.innerHTML = '<span class="badge-tag">Not set</span>';
      if (badgeIcon) badgeIcon.className = "fas fa-palette";

      if (editBadgeBtn && this.isOwnProfile) {
        editBadgeBtn.style.display = "flex";
      }
      return;
    }

    const typeLabels = {
      digital: "🎨 Digital Artist",
      traditional: "🖌️ Traditional Artist",
      mixed: "🎭 Mixed Media Artist",
      "3d": "🧊 3D Artist",
      photography: "📷 Photographer",
      animation: "🎬 Animator",
    };
    badgeArtistType.textContent =
      typeLabels[badge.artistType] || badge.artistType || "Not set";

    const typeIcons = {
      digital: "fas fa-laptop",
      traditional: "fas fa-paintbrush",
      mixed: "fas fa-palette",
      "3d": "fas fa-cube",
      photography: "fas fa-camera",
      animation: "fas fa-film",
    };
    if (badgeIcon)
      badgeIcon.className = typeIcons[badge.artistType] || "fas fa-palette";

    if (badgeSpecialties) {
      if (badge.specialties && badge.specialties.length > 0) {
        badgeSpecialties.innerHTML = badge.specialties
          .map(
            (s) =>
              `<span class="badge-tag primary-tag">${this.formatSpecialtyLabel(s)}</span>`,
          )
          .join("");
      } else {
        badgeSpecialties.innerHTML = '<span class="badge-tag">Not set</span>';
      }
    }

    if (badgeMediumTags) {
      if (badge.mediums && badge.mediums.length > 0) {
        badgeMediumTags.innerHTML = badge.mediums
          .map(
            (m) =>
              `<span class="badge-tag">${this.formatMediumLabel(m)}</span>`,
          )
          .join("");
      } else {
        badgeMediumTags.innerHTML = '<span class="badge-tag">Not set</span>';
      }
    }

    if (editBadgeBtn && this.isOwnProfile) {
      editBadgeBtn.style.display = "flex";
    }
  }

  formatSpecialtyLabel(specialty) {
    const labels = {
      "character-design": "Character Design",
      portrait: "Portrait Art",
      anatomy: "Anatomy & Technical",
      landscape: "Landscape & Environment",
      "digital-painting": "Digital Painting",
      "concept-art": "Concept Art",
      illustration: "Illustration",
      manga: "Manga & Comics",
      storyboarding: "Storyboarding",
      "photo-manipulation": "Photo Manipulation",
      "oil-painting": "Oil Painting",
      watercolor: "Watercolor",
      acrylic: "Acrylic",
      charcoal: "Charcoal & Graphite",
      ink: "Ink Drawing",
      pastel: "Pastel Art",
      "mixed-media": "Mixed Media",
      collage: "Collage",
      printmaking: "Printmaking",
      sketching: "Sketching",
      "3d-modeling": "3D Modeling",
      sculpting: "Sculpting",
      texturing: "Texturing",
      rigging: "Rigging",
      "animation-3d": "3D Animation",
      "game-art": "Game Art",
      "portrait-photography": "Portrait Photography",
      "landscape-photography": "Landscape Photography",
      macro: "Macro Photography",
      street: "Street Photography",
      "fine-art": "Fine Art Photography",
      wildlife: "Wildlife Photography",
      "2d-animation": "2D Animation",
      "stop-motion": "Stop Motion",
      "motion-graphics": "Motion Graphics",
      "character-animation": "Character Animation",
      experimental: "Experimental Animation",
    };
    return labels[specialty] || specialty;
  }

  formatMediumLabel(medium) {
    const labels = {
      watercolor: "Watercolor",
      acrylic: "Acrylic",
      "oil-paint": "Oil Paint",
      ink: "Ink",
      graphite: "Graphite",
      "charcoal-medium": "Charcoal",
      "pastel-medium": "Oil Pastel",
      gouache: "Gouache",
      "colored-pencil": "Colored Pencil",
      marker: "Marker",
      photoshop: "Adobe Photoshop",
      procreate: "Procreate",
      "clip-studio": "Clip Studio Paint",
      krita: "Krita",
      "ibis-paint": "Ibis Paint",
      affinity: "Affinity Designer/Photo",
      "corel-painter": "Corel Painter",
      blender: "Blender",
      zbrush: "ZBrush",
      maya: "Maya",
      windows: "Windows",
      mac: "Mac OS",
      ipad: "iPad",
      android: "Android",
      linux: "Linux",
    };
    return labels[medium] || medium;
  }

  setupBadgeEdit() {
    const editBtn = document.getElementById("editBadgeBtn");
    const modal = document.getElementById("badgeModal");
    const closeBtn = document.getElementById("closeBadgeModal");
    const cancelBtn = document.getElementById("cancelBadgeBtn");
    const saveBtn = document.getElementById("saveBadgeBtn");

    if (editBtn) {
      const newEditBtn = editBtn.cloneNode(true);
      editBtn.parentNode.replaceChild(newEditBtn, editBtn);

      newEditBtn.addEventListener("click", () => {
        this.populateBadgeForm();
        if (modal) modal.classList.add("active");
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (modal) modal.classList.remove("active");
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (modal) modal.classList.remove("active");
      });
    }

    if (saveBtn) {
      const newSaveBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

      newSaveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.saveBadge();
      });
    }

    const form = document.getElementById("badgeForm");
    if (form) {
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.saveBadge();
        }
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
      });
    }

    const artistTypeSelect = document.getElementById("artistType");
    if (artistTypeSelect) {
      artistTypeSelect.addEventListener("change", () => {
        this.filterSpecialties(artistTypeSelect.value);
      });
    }
  }
  // Add to ProfileHero class

  setupAvatarUpload() {
    const changeBtn = document.getElementById("changeAvatarBtn");
    const fileInput = document.getElementById("avatarUpload");

    if (!changeBtn || !fileInput) return;

    // Only show if it's the user's own profile
    if (!this.isOwnProfile) {
      changeBtn.style.display = "none";
      return;
    }

    changeBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (window.avatarManager) {
          await window.avatarManager.uploadProfilePicture(file);
          // Update the profile page avatar
          this.updateProfileAvatar();
        }
      }
      fileInput.value = "";
    });
  }

  updateProfileAvatar() {
    const avatarWrapper = document.getElementById("profileAvatarWrapper");
    const initialsSpan = document.getElementById("profileAvatarInitials");
    const nameEl = document.getElementById("profileAvatarName");
    const usernameEl = document.getElementById("profileAvatarUsername");

    if (!avatarWrapper) return;

    // Get avatar data
    const avatarUrl = window.avatarManager?.getAvatarUrl();
    const initials = window.avatarManager?.getInitials() || "JD";
    const displayName =
      window.avatarManager?.getDisplayName() ||
      this.userData?.fullname ||
      "Artist";
    const username = this.userData?.username || "artist";

    // Update name and username
    if (nameEl) nameEl.textContent = displayName;
    if (usernameEl) usernameEl.textContent = `@${username}`;

    // Update avatar image
    if (avatarUrl) {
      avatarWrapper.innerHTML = `<img src="${avatarUrl}" alt="Profile" loading="lazy">`;
    } else {
      avatarWrapper.innerHTML = `<span class="avatar-initials">${initials}</span>`;
    }
  }

  filterSpecialties(artistType) {
    const groups = document.querySelectorAll(".specialty-group");
    groups.forEach((group) => {
      if (artistType === "") {
        group.style.display = "block";
      } else {
        group.style.display =
          group.dataset.type === artistType ? "block" : "none";
      }
    });

    const mediumGroups = document.querySelectorAll(".medium-group");
    mediumGroups.forEach((group) => {
      if (artistType === "") {
        group.style.display = "block";
      } else if (
        artistType === "digital" ||
        artistType === "3d" ||
        artistType === "animation"
      ) {
        group.style.display =
          group.dataset.type === "digital" || group.dataset.type === "platform"
            ? "block"
            : "none";
      } else if (artistType === "traditional" || artistType === "photography") {
        group.style.display =
          group.dataset.type === "traditional" ||
          group.dataset.type === "platform"
            ? "block"
            : "none";
      } else {
        group.style.display = "block";
      }
    });
  }

  populateBadgeForm() {
    const badge = this.badgeData || {};

    const typeSelect = document.getElementById("artistType");
    if (typeSelect) typeSelect.value = badge.artistType || "";

    this.filterSpecialties(badge.artistType || "");

    const specialties = badge.specialties || [];
    document
      .querySelectorAll('#specialtiesGrid input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = specialties.includes(cb.value);
      });

    const mediums = badge.mediums || [];
    document
      .querySelectorAll('#mediumGrid input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = mediums.includes(cb.value);
      });
  }

  async saveBadge() {
    const artistType = document.getElementById("artistType").value;

    if (!artistType) {
      alert("Please select your artist type");
      return;
    }

    const specialtyCheckboxes = document.querySelectorAll(
      '#specialtiesGrid input[type="checkbox"]:checked',
    );
    let specialties = Array.from(specialtyCheckboxes).map((cb) => cb.value);

    if (specialties.length > 4) {
      alert("Please select up to 4 specialties");
      return;
    }

    const mediumCheckboxes = document.querySelectorAll(
      '#mediumGrid input[type="checkbox"]:checked',
    );
    let mediums = Array.from(mediumCheckboxes).map((cb) => cb.value);

    if (mediums.length > 3) {
      alert("Please select up to 3 mediums");
      return;
    }

    const badgeData = {
      artistType: artistType,
      specialties: specialties,
      mediums: mediums,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await db
        .collection("users")
        .doc(this.userId)
        .update({ badge: badgeData });

      this.badgeData = badgeData;
      this.renderBadge();

      const modal = document.getElementById("badgeModal");
      if (modal) modal.classList.remove("active");

      this.showToast("Artist badge updated successfully! 🎉");
    } catch (error) {
      console.error("Error saving badge:", error);
      alert("Error saving badge. Please try again.");
    }
  }

  // ============================================
  // SOCIAL LINKS
  // ============================================

  setupSocialLinksModal() {
    const modal = document.getElementById("socialLinksModal");
    const closeBtn = document.getElementById("closeSocialModal");
    const cancelBtn = document.getElementById("cancelSocialBtn");
    const saveBtn = document.getElementById("saveSocialBtn");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeSocialLinksModal();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.closeSocialLinksModal();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        this.saveSocialLinks();
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeSocialLinksModal();
        }
      });
    }

    document.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".btn-edit-social");
      if (editBtn) {
        e.preventDefault();
        this.openSocialLinksModal();
      }
    });
  }

  openSocialLinksModal() {
    const modal = document.getElementById("socialLinksModal");
    if (!modal) return;

    const data = this.userData?.socialLinks || {};

    document.getElementById("socialInstagram").value = data.instagram || "";
    document.getElementById("socialTikTok").value = data.tiktok || "";
    document.getElementById("socialYouTube").value = data.youtube || "";
    document.getElementById("socialPinterest").value = data.pinterest || "";
    document.getElementById("socialDiscord").value = data.discord || "";
    document.getElementById("socialX").value = data.x || "";
    document.getElementById("socialVGen").value = data.vgen || "";
    document.getElementById("socialKoFi").value = data.kofi || "";

    modal.classList.add("active");
  }

  closeSocialLinksModal() {
    const modal = document.getElementById("socialLinksModal");
    if (modal) modal.classList.remove("active");
  }

  async saveSocialLinks() {
    const socialLinks = {
      instagram: document.getElementById("socialInstagram").value.trim(),
      tiktok: document.getElementById("socialTikTok").value.trim(),
      youtube: document.getElementById("socialYouTube").value.trim(),
      pinterest: document.getElementById("socialPinterest").value.trim(),
      discord: document.getElementById("socialDiscord").value.trim(),
      x: document.getElementById("socialX").value.trim(),
      vgen: document.getElementById("socialVGen").value.trim(),
      kofi: document.getElementById("socialKoFi").value.trim(),
    };

    Object.keys(socialLinks).forEach((key) => {
      if (!socialLinks[key]) delete socialLinks[key];
    });

    try {
      await db.collection("users").doc(this.userId).update({
        socialLinks: socialLinks,
      });

      this.userData.socialLinks = socialLinks;
      this.renderProfile();
      this.closeSocialLinksModal();
      this.showToast("✅ Social links updated successfully!");
    } catch (error) {
      console.error("Error saving social links:", error);
      this.showToast("Error saving social links", "error");
    }
  }

  // ============================================
  // RENDER PROFILE
  // ============================================

  renderProfile() {
    const data = this.userData;
    if (!data) return;

    console.log("Rendering profile for:", data.fullname);

    // Layer 1 - Background
    if (data.heroBackground) {
      this.setLayer1Content(data.heroBackground);
    }

    // Layer 2 - Overlay
    if (data.heroOverlay) {
      this.setLayer2Content(data.heroOverlay);
    }
    // Update profile avatar - DO THIS AFTER loading user data
    this.updateProfileAvatar();
    this.setupAvatarUpload();

    // Name
    const nameEl = document.querySelector(".artist-name");
    const usernameEl = document.querySelector(".artist-username");
    if (nameEl) nameEl.textContent = data.fullname || "Artist";
    if (usernameEl) usernameEl.textContent = `@${data.username || "artist"}`;

    // Badges
    const badgesContainer = document.querySelector(".hero-badges");
    if (badgesContainer) {
      badgesContainer.innerHTML = "";

      if (data.isAdult && data.ageVerified) {
        badgesContainer.innerHTML += `<span class="hero-badge verified">Age Verified</span>`;
      }

      if (data.role && data.role !== "user") {
        const roleLabels = {
          admin: "Admin",
          moderator: "Moderator",
        };
        badgesContainer.innerHTML += `<span class="hero-badge moderator">${roleLabels[data.role] || data.role}</span>`;
      }

      badgesContainer.innerHTML += `<span class="hero-badge artist">Artist</span>`;
    }

    // Stats
    const statArtworks = document.querySelector(
      '.stat-value[data-stat="artworks"]',
    );
    const statFollowers = document.querySelector(
      '.stat-value[data-stat="followers"]',
    );
    const statFollowing = document.querySelector(
      '.stat-value[data-stat="following"]',
    );
    const statLikes = document.querySelector('.stat-value[data-stat="likes"]');

    if (statArtworks) statArtworks.textContent = data.stats?.artworks || 0;
    if (statFollowers) statFollowers.textContent = data.stats?.followers || 0;
    if (statFollowing) statFollowing.textContent = data.stats?.following || 0;
    if (statLikes) statLikes.textContent = data.stats?.totalLikes || 0;

    // Bio
    const bioText = document.querySelector(".bio-text");
    if (bioText)
      bioText.textContent = data.bio || "No bio yet. Click to expand.";

    // Social Links
    this.renderSocialLinks(data);
    // Update profile avatar
    this.updateProfileAvatar();
    this.setupAvatarUpload();
  }

  renderSocialLinks(data) {
    const socialContainer = document.querySelector(".hero-social-links");
    if (!socialContainer) return;

    socialContainer.innerHTML = "";

    if (this.isOwnProfile) {
      const editBtn = document.createElement("button");
      editBtn.className = "btn-edit-social";
      editBtn.title = "Edit Social Links";
      editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit Links';
      socialContainer.appendChild(editBtn);
    }

    const socialPlatforms = [
      {
        id: "instagram",
        icon: "fa-instagram",
        url: data.socialLinks?.instagram,
      },
      { id: "tiktok", icon: "fa-tiktok", url: data.socialLinks?.tiktok },
      { id: "youtube", icon: "fa-youtube", url: data.socialLinks?.youtube },
      {
        id: "pinterest",
        icon: "fa-pinterest",
        url: data.socialLinks?.pinterest,
      },
      { id: "discord", icon: "fa-discord", url: data.socialLinks?.discord },
      { id: "x", icon: "fa-x-twitter", url: data.socialLinks?.x },
      { id: "vgen", icon: "fa-user", url: data.socialLinks?.vgen },
      { id: "kofi", icon: "fa-coffee", url: data.socialLinks?.kofi },
    ];

    let hasLinks = false;
    socialPlatforms.forEach((platform) => {
      if (platform.url) {
        hasLinks = true;
        const link = document.createElement("a");
        link.href = platform.url;
        link.target = "_blank";
        link.className = "social-icon";
        link.title = platform.id;
        link.innerHTML = `<i class="fab ${platform.icon}"></i>`;
        socialContainer.appendChild(link);
      }
    });

    if (!hasLinks && !this.isOwnProfile) {
      const placeholder = document.createElement("span");
      placeholder.style.cssText =
        "color: rgba(255,255,255,0.3); font-size: 0.8rem;";
      placeholder.textContent = "No social links yet";
      socialContainer.appendChild(placeholder);
    }
  }

  // ============================================
  // LAYER FUNCTIONS
  // ============================================

  setLayer1Content(url) {
    const container = document.getElementById("layer1Content");
    if (!container) return;

    // Remove the dim overlay by setting background to transparent
    const overlay = container.querySelector(".layer-overlay");
    if (overlay) {
      overlay.style.background = "rgba(0,0,0,0)";
    }

    if (!url) {
      container.innerHTML = `
                <div style="width:100%;height:100%;background:linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);"></div>
            `;
      return;
    }

    const isVideo =
      url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes("video");
    const isFirebaseVideo =
      url.includes("video") || url.includes(".mp4") || url.includes(".webm");

    container.innerHTML = "";

    if (isVideo || isFirebaseVideo) {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.position = "absolute";
      video.style.top = "0";
      video.style.left = "0";
      container.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Background";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.position = "absolute";
      img.style.top = "0";
      img.style.left = "0";
      container.appendChild(img);
    }
  }

  setLayer2Content(url) {
    const container = document.getElementById("layer2Content");
    if (!container) return;

    if (!url) {
      container.innerHTML = `
            <div style="
                width: 200px;
                height: 200px;
                border-radius: 50%;
                background: linear-gradient(135deg, #fe67ea, #63dbee);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 4rem;
                color: white;
                font-weight: bold;
                opacity: 0.8;
                flex-shrink: 0;
            ">
                🎨
            </div>
        `;
      return;
    }

    const isVideo =
      url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes("video");
    const isFirebaseVideo =
      url.includes("video") || url.includes(".mp4") || url.includes(".webm");

    container.innerHTML = "";

    if (isVideo || isFirebaseVideo) {
      const video = document.createElement("video");
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = `
            max-width: 80%;
            max-height: 80%;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
      container.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Overlay";
      img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
      container.appendChild(img);
    }
  }

  async uploadLayerFile(file, layer) {
    console.log(`Uploading ${layer}:`, file.name, file.size, file.type);

    if (!this.isOwnProfile) {
      this.showToast("You can only upload to your own profile", "error");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      this.showToast("File must be less than 100MB", "error");
      return;
    }

    const validTypes = ["image/", "video/"];
    const isValid = validTypes.some((type) => file.type.startsWith(type));
    if (!isValid) {
      this.showToast("Please upload an image or video file", "error");
      return;
    }

    const loadingMsg = document.getElementById("uploadLoading");
    if (loadingMsg) {
      loadingMsg.style.display = "block";
      loadingMsg.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    const container =
      layer === "layer1"
        ? document.getElementById("layer1Content")
        : document.getElementById("layer2Content");

    if (container) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (file.type.startsWith("video/")) {
          container.innerHTML = `
                        <video style="width:100%;height:100%;object-fit:cover;" autoplay loop muted playsinline>
                            <source src="${e.target.result}" type="${file.type}">
                        </video>
                    `;
        } else {
          container.innerHTML = `
                        <img src="${e.target.result}" alt="${layer} preview" style="width:100%;height:100%;object-fit:cover;">
                    `;
        }
      };
      reader.readAsDataURL(file);
    }

    try {
      const storageRef = firebase.storage().ref();
      const filePath = `hero/${this.userId}/${layer}/${Date.now()}_${file.name}`;
      const uploadTask = storageRef.child(filePath).put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (loadingMsg) {
            loadingMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading ${Math.round(progress)}%`;
          }
        },
        (error) => {
          console.error("Upload error:", error);
          if (loadingMsg) loadingMsg.style.display = "none";
          this.showToast("Upload failed: " + error.message, "error");
        },
      );

      const snapshot = await uploadTask;
      const downloadURL = await snapshot.ref.getDownloadURL();
      console.log("Upload complete! URL:", downloadURL);

      const updateData = {};
      if (layer === "layer1") {
        updateData.heroBackground = downloadURL;
      } else {
        updateData.heroOverlay = downloadURL;
      }

      await db.collection("users").doc(this.userId).update(updateData);

      if (layer === "layer1") {
        this.userData.heroBackground = downloadURL;
      } else {
        this.userData.heroOverlay = downloadURL;
      }

      // Update remove button visibility
      this.updateLayerControlsVisibility();

      this.showToast(
        `✅ ${layer === "layer1" ? "Background" : "Overlay"} updated successfully!`,
      );
    } catch (error) {
      console.error("Error uploading:", error);
      this.showToast("Error uploading file: " + error.message, "error");

      if (layer === "layer1") {
        this.setLayer1Content(this.userData?.heroBackground || "");
      } else {
        this.setLayer2Content(this.userData?.heroOverlay || "");
      }
    } finally {
      if (loadingMsg) {
        loadingMsg.style.display = "none";
        loadingMsg.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      }
    }
  }

  async removeLayerFile(layer) {
    if (!confirm(`Remove ${layer === "layer1" ? "background" : "overlay"}?`))
      return;

    const updateData = {};
    if (layer === "layer1") {
      updateData.heroBackground = "";
      this.userData.heroBackground = "";
    } else {
      updateData.heroOverlay = "";
      this.userData.heroOverlay = "";
    }

    try {
      await db.collection("users").doc(this.userId).update(updateData);

      if (layer === "layer1") {
        this.setLayer1Content("");
      } else {
        this.setLayer2Content("");
      }

      this.updateLayerControlsVisibility();
      this.showToast(
        `✅ ${layer === "layer1" ? "Background" : "Overlay"} removed`,
      );
    } catch (error) {
      console.error("Error removing layer:", error);
      this.showToast("Error removing file", "error");
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners() {
    this.setupBioToggle();

    const themeToggle = document.querySelector(".hero-theme-toggle");
    if (themeToggle) {
      const newThemeToggle = themeToggle.cloneNode(true);
      themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);

      newThemeToggle.addEventListener("click", () => {
        this.toggleTheme();
      });
    }

    const shadowBtn = document.querySelector(".hero-shadow-btn");
    if (shadowBtn) {
      const newShadowBtn = shadowBtn.cloneNode(true);
      shadowBtn.parentNode.replaceChild(newShadowBtn, shadowBtn);

      newShadowBtn.addEventListener("click", () => {
        this.handleShadowAction();
      });
    }

    document
      .querySelectorAll(".hero-right-sidebar .sidebar-icon")
      .forEach((icon) => {
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);

        newIcon.addEventListener("click", (e) => {
          e.preventDefault();
          const action = newIcon.dataset.action;

          switch (action) {
            case "edit":
              if (this.isOwnProfile) {
                window.location.href = "/pages/account/settings.html";
              }
              break;
            case "settings":
              window.location.href = "/pages/account/settings.html";
              break;
            case "notifications":
              window.location.href = "/pages/community/notifications.html";
              break;
            case "cv":
              this.generateCV();
              break;
            default:
              break;
          }
        });
      });

    this.setupBadgeEdit();
    this.setupSocialLinksModal();
    this.setupNavToggle();
    this.setupNavScrollCollapse();
  }
  setupNavToggle() {
    const nav = document.getElementById("heroNav");
    const toggleBtn = document.getElementById("navToggleBtn");

    if (!nav || !toggleBtn) return;

    // Toggle on button click
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("nav-expanded");

      // Change icon
      const icon = toggleBtn.querySelector("i");
      if (icon) {
        icon.className = nav.classList.contains("nav-expanded")
          ? "fas fa-times"
          : "fas fa-bars";
      }
    });

    // Handle dropdown toggles in mobile
    const dropdowns = nav.querySelectorAll(".nav-dropdown");
    dropdowns.forEach((dropdown) => {
      const link = dropdown.querySelector("a");
      if (link) {
        link.addEventListener("click", (e) => {
          // Only prevent default if dropdown is collapsed
          if (nav.classList.contains("nav-expanded")) {
            e.preventDefault();
            dropdown.classList.toggle("open");
          }
        });
      }
    });

    // Close nav when a link is clicked (for non-dropdown links)
    const links = nav.querySelectorAll(".nav-links a:not(.nav-dropdown > a)");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("nav-expanded");
        const icon = toggleBtn.querySelector("i");
        if (icon) {
          icon.className = "fas fa-bars";
        }
      });
    });

    // Close nav when clicking outside
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && nav.classList.contains("nav-expanded")) {
        nav.classList.remove("nav-expanded");
        const icon = toggleBtn.querySelector("i");
        if (icon) {
          icon.className = "fas fa-bars";
        }
      }
    });

    // Close nav when pressing Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("nav-expanded")) {
        nav.classList.remove("nav-expanded");
        const icon = toggleBtn.querySelector("i");
        if (icon) {
          icon.className = "fas fa-bars";
        }
      }
    });
  }

  // Add to setupNavToggle() or a new method
  setupNavScrollCollapse() {
    const nav = document.getElementById("heroNav");
    const toggleBtn = document.getElementById("navToggleBtn");

    if (!nav) return;

    let lastScrollY = window.scrollY;
    let scrollTimeout;

    window.addEventListener(
      "scroll",
      () => {
        // Only collapse if expanded and user scrolled
        if (nav.classList.contains("nav-expanded")) {
          const currentScrollY = window.scrollY;

          // If scrolled down more than 50px, collapse
          if (currentScrollY > lastScrollY + 50) {
            nav.classList.remove("nav-expanded");
            const icon = toggleBtn?.querySelector("i");
            if (icon) {
              icon.className = "fas fa-bars";
            }
          }

          lastScrollY = currentScrollY;
        }
      },
      { passive: true },
    );
  }

  setupBioToggle() {
    const bio =
      document.querySelector(".hero-bio-left") ||
      document.querySelector(".hero-bio");
    if (!bio) return;

    const newBio = bio.cloneNode(true);
    bio.parentNode.replaceChild(newBio, bio);

    newBio.addEventListener("click", (e) => {
      if (e.target.classList.contains("bio-toggle")) return;
      this.toggleBio();
    });

    const toggleBtn = newBio.querySelector(".bio-toggle");
    if (toggleBtn) {
      const newToggle = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);

      newToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleBio();
      });
    }
  }

  toggleBio() {
    const bio =
      document.querySelector(".hero-bio-left") ||
      document.querySelector(".hero-bio");
    if (!bio) return;

    this.bioExpanded = !this.bioExpanded;
    bio.classList.toggle("collapsed");
    const toggle = bio.querySelector(".bio-toggle");
    if (toggle) {
      toggle.textContent = this.bioExpanded ? "Show less ▲" : "Show more ▼";
    }
  }

  toggleTheme() {
    const body = document.body;
    const toggle = document.querySelector(".hero-theme-toggle");

    if (this.currentTheme === "dark") {
      body.classList.remove("hero-theme-dark");
      body.classList.add("hero-theme-light");
      this.currentTheme = "light";
      if (toggle) toggle.innerHTML = '<i class="fas fa-moon"></i>';
      localStorage.setItem("heroTheme", "light");
    } else {
      body.classList.remove("hero-theme-light");
      body.classList.add("hero-theme-dark");
      this.currentTheme = "dark";
      if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i>';
      localStorage.setItem("heroTheme", "dark");
    }
  }

  loadSavedTheme() {
    const savedTheme = localStorage.getItem("heroTheme") || "dark";
    const body = document.body;
    const toggle = document.querySelector(".hero-theme-toggle");

    if (savedTheme === "light") {
      body.classList.remove("hero-theme-dark");
      body.classList.add("hero-theme-light");
      this.currentTheme = "light";
      if (toggle) toggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      body.classList.add("hero-theme-dark");
      this.currentTheme = "dark";
      if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }

  // ============================================
  // SHADOW / CV / UTILITY
  // ============================================

  handleShadowAction() {
    if (!this.currentUser) {
      alert("Please login to shadow this artist");
      window.location.href = "/pages/auth/login.html";
      return;
    }

    if (this.currentUser.uid === this.userId) {
      alert("You cannot shadow yourself");
      return;
    }

    this.toggleShadow();
  }
  // Add this method to the ProfileHero class
  setupAdminBadgeLink() {
    // Find all moderator badges and make them clickable
    document.querySelectorAll(".hero-badge.moderator").forEach((badge) => {
      badge.style.cursor = "pointer";
      badge.addEventListener("click", () => {
        window.location.href = "/pages/admin/moderation.html";
      });
    });
  }

  async toggleShadow() {
    const btn = document.querySelector(".hero-shadow-btn");
    if (!btn) return;

    const icon = btn.querySelector(".shadow-icon");
    const text = btn.querySelector(".shadow-text");

    try {
      const shadowsRef = db.collection("shadows");
      const existing = await shadowsRef
        .where("shadowerId", "==", this.currentUser.uid)
        .where("targetId", "==", this.userId)
        .get();

      if (!existing.empty) {
        await existing.docs[0].ref.delete();
        if (icon) icon.textContent = "👤";
        if (text) text.textContent = "Shadow";
        btn.style.background = "rgba(0,0,0,0.5)";
      } else {
        await shadowsRef.add({
          shadowerId: this.currentUser.uid,
          shadowerName:
            this.currentUser.displayName ||
            this.currentUser.email.split("@")[0],
          targetId: this.userId,
          targetName: this.userData?.fullname || "Artist",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (icon) icon.textContent = "✨";
        if (text) text.textContent = "Shadowing";
        btn.style.background =
          "linear-gradient(135deg, rgba(254,103,234,0.3), rgba(99,219,238,0.3))";

        if (typeof authManager !== "undefined" && authManager) {
          await authManager.createNotification(this.userId, "shadow", {
            userId: this.currentUser.uid,
            userName:
              this.currentUser.displayName ||
              this.currentUser.email.split("@")[0],
          });
        }
      }
    } catch (error) {
      console.error("Error toggling shadow:", error);
      alert("Error processing request");
    }
  }

  generateCV() {
    const data = this.userData;
    if (!data) {
      alert("No profile data available");
      return;
    }

    const cvContent = `
            === ARTIST CV ===
            Name: ${data.fullname || "Artist"}
            Username: @${data.username || "artist"}
            Bio: ${data.bio || "No bio"}
            Artworks: ${data.stats?.artworks || 0}
            Followers: ${data.stats?.followers || 0}
            Total Likes: ${data.stats?.totalLikes || 0}
            ---
            Generated: ${new Date().toLocaleDateString()}
        `;

    const blob = new Blob([cvContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.username || "artist"}-cv.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  showToast(message, type = "success") {
    let toast = document.getElementById("customToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "customToast";
      toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(26, 26, 46, 0.95);
                backdrop-filter: blur(12px);
                color: white;
                padding: 12px 24px;
                border-radius: 12px;
                z-index: 9999;
                font-weight: 500;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
                pointer-events: none;
            `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    if (type === "error") {
      toast.style.borderColor = "rgba(239,68,68,0.3)";
      toast.style.boxShadow = "0 8px 32px rgba(239,68,68,0.2)";
    } else {
      toast.style.borderColor = "rgba(16,185,129,0.3)";
      toast.style.boxShadow = "0 8px 32px rgba(16,185,129,0.2)";
    }

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
  }

  showError() {
    const loadingState = document.getElementById("loadingState");
    const profileContent = document.getElementById("profileContent");
    const errorState = document.getElementById("errorState");

    if (loadingState) loadingState.style.display = "none";
    if (profileContent) profileContent.style.display = "none";
    if (errorState) errorState.style.display = "flex";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing ProfileHero...");

  if (typeof firebase !== "undefined" && typeof db !== "undefined") {
    window.profileHero = new ProfileHero();
  } else {
    console.log("Waiting for Firebase...");
    setTimeout(() => {
      window.profileHero = new ProfileHero();
    }, 1000);
  }
});
