// Profile Page with Shadow System, Image Uploads, and Collapsible Bio
// Note: queryOptimizer, cacheManager, and ErrorHandler are global from their scripts

class UserProfile {
  constructor() {
    this.userId = null;
    this.userData = null;
    this.artworks = [];
    this.isOwnProfile = false;
    this.currentUser = null;
    this.shadowCount = 0;
    this.shadowingCount = 0;
    this.isShadowing = false;
    this.bioExpanded = false;
    this.BIO_CHAR_LIMIT = 500;
    this.uploadedImageFile = null;
    this.badgeData = null;
    this.init();
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.userId = urlParams.get("user");

    if (!this.userId) {
      this.showError();
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      this.isOwnProfile =
        this.currentUser && this.currentUser.uid === this.userId;

      await this.loadProfile();
      await this.loadArtworks();
      await this.loadShadowData();
      await this.loadLikedArtworks();
      await this.loadSavedArtworks();
      await this.loadSavedTutorials();
      await this.loadCompletedTutorials();
      await this.loadBadge();
      await this.updateSidebarUI();
      await this.updateSidebarCounts();
      await this.checkNSFWCreator();

      this.setupEventListeners();
      this.setupImageUploads();
      this.setupBioToggle();
      this.setupUpload();
      this.setupSidebarToggle();
      this.setupSidebarActions();
      this.setupBadgeEdit();
      this.setupAgeVerification();

      this.updateUIForProfileType();
    });
  }

  // ========== IMAGE COMPRESSION METHOD ==========
  compressImage(file, maxDimension = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (file.size < 300 * 1024) {
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

          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                console.log(
                  `Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`,
                );
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
  // Add to UserProfile class:

  /**
   * Setup age verification in profile
   */
  setupAgeVerification() {
    const section = document.getElementById("ageVerificationSection");
    if (!section) return;

    // Only show if user is logged in and viewing their own profile
    if (!this.isOwnProfile) {
      section.style.display = "none";
      return;
    }

    // Check if user already has age set
    if (this.userData && this.userData.ageVerified === true) {
      section.style.display = "none";
      return;
    }

    // Show verification section
    section.style.display = "block";

    // Setup verify button
    const verifyBtn = document.getElementById("verifyAgeBtn");
    if (verifyBtn) {
      verifyBtn.addEventListener("click", async () => {
        if (window.ageVerification) {
          await window.ageVerification.startVerification(window.location.href);
        } else {
          // Fallback to simple verification
          this.showSimpleAgeVerification();
        }
      });
    }
  }
  // Add to UserProfile class

/**
 * Render verification badge for the profile
 */
renderVerificationBadge() {
    const profileHeader = document.querySelector('.profile-header');
    if (!profileHeader) return;

    // Remove existing badge if any
    const existingBadge = document.querySelector('.profile-verification-section');
    if (existingBadge) existingBadge.remove();

    // Check if user is verified
    const isVerified = this.userData?.isAdult === true && this.userData?.ageVerified === true;
    const isPending = this.userData?.verificationStatus === 'pending';
    const hasAttempted = this.userData?.verificationAttempts > 0;

    let badgeHTML = '';
    let statusText = '';
    let statusIcon = '';
    let badgeClass = '';

    // Only show verification section for own profile or if user has attempted verification
    if (this.isOwnProfile || hasAttempted) {
        if (isVerified) {
            badgeClass = 'verified';
            statusText = 'Age Verified';
            statusIcon = 'fa-shield-alt';
        } else if (isPending) {
            badgeClass = 'pending';
            statusText = 'Verification Pending';
            statusIcon = 'fa-clock';
        } else if (hasAttempted) {
            badgeClass = 'unverified';
            statusText = 'Verification Failed';
            statusIcon = 'fa-exclamation-circle';
        } else {
            badgeClass = 'not-required';
            statusText = 'Not Verified';
            statusIcon = 'fa-user';
        }

        badgeHTML = `
            <div class="profile-verification-section">
                <span class="label">Verification Status:</span>
                <div class="verification-badge-wrapper">
                    <span class="verification-badge ${badgeClass} large">
                        <i class="fas ${statusIcon}"></i>
                        <span class="verification-dot ${badgeClass}"></span>
                        ${statusText}
                    </span>
                    <span class="verification-tooltip">
                        ${isVerified ? 'This user has verified their age (18+)' :
                          isPending ? 'Verification is in progress...' :
                          'This user has not verified their age'}
                    </span>
                </div>
                ${!isVerified && this.isOwnProfile ? `
                    <button class="btn-verify-age" onclick="window.ageVerification?.startVerification(window.location.href)"
                            style="padding: 6px 16px; background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.8rem;">
                        <i class="fas fa-id-card"></i> Verify Age
                    </button>
                ` : ''}
            </div>
        `;

        // Insert after profile name section
        const nameSection = profileHeader.querySelector('.profile-name-section');
        if (nameSection) {
            nameSection.insertAdjacentHTML('afterend', badgeHTML);
        }
    }
}

/**
 * Add verification badge to gallery cards
 */
addVerificationBadgeToGallery() {
    // This will be called when rendering gallery cards
    const cards = document.querySelectorAll('.gallery-card');
    cards.forEach(card => {
        const artistId = card.dataset.artistId;
        if (!artistId) return;

        // Check if artist is verified
        this.checkArtistVerification(artistId).then(isVerified => {
            if (isVerified) {
                const badge = document.createElement('span');
                badge.className = 'verification-badge verified small';
                badge.innerHTML = '<i class="fas fa-shield-alt"></i> Verified';
                badge.style.position = 'absolute';
                badge.style.top = '8px';
                badge.style.right = '8px';
                badge.style.zIndex = '5';

                const cardInner = card.querySelector('.card-inner');
                if (cardInner) {
                    cardInner.style.position = 'relative';
                    cardInner.appendChild(badge);
                }
            }
        });
    });
}

/**
 * Check if an artist is verified
 */
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
// Add to UserProfile class in profile.js

async loadVerificationStats() {
    if (!this.userId) return;

    try {
        const doc = await firebase.firestore()
            .collection('users')
            .doc(this.userId)
            .get();

        if (doc.exists) {
            const data = doc.data();
            const isVerified = data.isAdult === true && data.ageVerified === true;

            // Add to stats section
            const statsContainer = document.querySelector('.profile-stats-header');
            if (statsContainer) {
                const statHTML = `
                    <div class="stat verification-stat">
                        <span class="stat-value" style="font-size: 1rem;">
                            ${isVerified ? '✅' : '❌'}
                        </span>
                        <span class="stat-label">Age Verified</span>
                    </div>
                `;
                statsContainer.insertAdjacentHTML('beforeend', statHTML);
            }
        }
    } catch (error) {
        console.error('Error loading verification stats:', error);
    }
}

  // ========== SHOW/HIDE UI BASED ON PROFILE TYPE ==========
  updateUIForProfileType() {
    const editBtn = document.getElementById("editProfileBtn");
    const coverUploadBtn = document.getElementById("coverUploadBtn");
    const avatarOverlay = document.getElementById("avatarUploadBtn");
    const uploadSection = document.querySelector(".profile-upload-section");
    const emptyUploadBtn = document.getElementById("emptyUploadBtn");

    if (this.isOwnProfile) {
      if (editBtn) editBtn.style.display = "flex";
      if (coverUploadBtn) coverUploadBtn.style.display = "flex";
      if (avatarOverlay) avatarOverlay.style.display = "flex";
      if (uploadSection) uploadSection.style.display = "flex";
      if (emptyUploadBtn) emptyUploadBtn.style.display = "block";
    } else {
      if (editBtn) editBtn.style.display = "none";
      if (coverUploadBtn) coverUploadBtn.style.display = "none";
      if (avatarOverlay) avatarOverlay.style.display = "none";
      if (uploadSection) uploadSection.style.display = "none";
      if (emptyUploadBtn) emptyUploadBtn.style.display = "none";
    }
  }

  // ========== UPDATE SIDEBAR USER INFO ==========
  async updateSidebarUI() {
    const user = this.currentUser;
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
        sidebarAvatar.style.background =
          "linear-gradient(135deg, #fe67ea, #63dbee)";
        sidebarAvatar.style.cursor = "pointer";
        sidebarAvatar.onclick = () => {
          window.location.href = `/pages/community/profiles.html?user=${user.uid}`;
        };
      }
      if (logoutBtn) logoutBtn.style.display = "flex";
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

  async updateSidebarCounts() {
    if (!this.currentUser) return;

    try {
      const likesSnapshot = await firebase
        .firestore()
        .collection("likes")
        .where("userId", "==", this.currentUser.uid)
        .get();
      const likesCount = document.getElementById("likesCount");
      if (likesCount) likesCount.textContent = likesSnapshot.size;

      const savedTutsSnapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .collection("savedTutorials")
        .get();
      const savedTutsCount = document.getElementById("savedTutsCount");
      if (savedTutsCount) savedTutsCount.textContent = savedTutsSnapshot.size;

      const completedSnapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .collection("tutorialProgress")
        .where("completed", "==", true)
        .get();
      const completedCount = document.getElementById("completedCount");
      if (completedCount) completedCount.textContent = completedSnapshot.size;

      const savedArtsSnapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .collection("savedArtworks")
        .get();
      const savesCount = document.getElementById("savesCount");
      if (savesCount)
        savesCount.textContent =
          savedTutsSnapshot.size + savedArtsSnapshot.size;
    } catch (error) {
      console.error("Error updating sidebar counts:", error);
    }
  }

  setupSidebarActions() {
    const likedBtn = document.getElementById("sidebarLikes");
    if (likedBtn) {
      likedBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.currentUser) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        const likedSection = document.getElementById("likedArtworksSection");
        if (likedSection) {
          likedSection.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = `/pages/community/profiles.html?user=${this.currentUser.uid}`;
        }
      });
    }

    const savedTutsBtn = document.getElementById("sidebarSavedTuts");
    if (savedTutsBtn) {
      savedTutsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.currentUser) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        const savedSection = document.getElementById("savedTutorialsSection");
        if (savedSection) {
          savedSection.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = `/pages/community/profiles.html?user=${this.currentUser.uid}`;
        }
      });
    }

    const completedBtn = document.getElementById("sidebarCompleted");
    if (completedBtn) {
      completedBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.currentUser) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        const completedSection = document.getElementById(
          "completedTutorialsSection",
        );
        if (completedSection) {
          completedSection.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = `/pages/community/profiles.html?user=${this.currentUser.uid}`;
        }
      });
    }

    const uploadsBtn = document.getElementById("sidebarUploads");
    if (uploadsBtn) {
      uploadsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.currentUser) {
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
        if (!this.currentUser) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        window.location.href = "/pages/community/notifications.html";
      });
    }

    const savesBtn = document.getElementById("sidebarSaves");
    if (savesBtn) {
      savesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.currentUser) {
          window.location.href = "/pages/auth/login.html";
          return;
        }
        window.location.href = `/pages/community/profiles.html?user=${this.currentUser.uid}`;
      });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await firebase.auth().signOut();
          window.location.href = "/index.html";
        } catch (error) {
          console.error("Logout error:", error);
        }
      });
    }
  }
  // Add to UserProfile class

/**
 * Show admin/moderation buttons if user has permissions
 */
showAdminButtons() {
    const settingsBtn = document.getElementById('settingsBtn');
    const moderationBtn = document.getElementById('moderationBtn');

    // Settings button - always show on own profile
    if (this.isOwnProfile) {
        if (settingsBtn) {
            settingsBtn.style.display = 'inline-flex';
        }
    }

    // Check if user is moderator/admin
    this.checkModeratorStatus().then((isModerator) => {
        if (isModerator) {
            if (moderationBtn) {
                moderationBtn.style.display = 'inline-flex';
            }
        }
    });
}

/**
 * Check if the current user is a moderator
 */
async checkModeratorStatus() {
    if (!this.currentUser) return false;

    try {
        const doc = await firebase.firestore()
            .collection('users')
            .doc(this.currentUser.uid)
            .get();

        if (doc.exists) {
            const data = doc.data();
            const isModerator = data.role === 'admin' || data.role === 'moderator' || data.isModerator === true;
            return isModerator;
        }
        return false;
    } catch (error) {
        console.error('Error checking moderator status:', error);
        return false;
    }
}

// In the updateUIForProfileType method, add the settings button call:
updateUIForProfileType() {
    const editBtn = document.getElementById("editProfileBtn");
    const coverUploadBtn = document.getElementById("coverUploadBtn");
    const avatarOverlay = document.getElementById("avatarUploadBtn");
    const uploadSection = document.querySelector(".profile-upload-section");
    const emptyUploadBtn = document.getElementById("emptyUploadBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const moderationBtn = document.getElementById("moderationBtn");

    if (this.isOwnProfile) {
        if (editBtn) editBtn.style.display = "flex";
        if (coverUploadBtn) coverUploadBtn.style.display = "flex";
        if (avatarOverlay) avatarOverlay.style.display = "flex";
        if (uploadSection) uploadSection.style.display = "flex";
        if (emptyUploadBtn) emptyUploadBtn.style.display = "block";
        if (settingsBtn) settingsBtn.style.display = "inline-flex";

        // Check for moderator status
        this.checkModeratorStatus().then((isModerator) => {
            if (isModerator && moderationBtn) {
                moderationBtn.style.display = "inline-flex";
            }
        });
    } else {
        if (editBtn) editBtn.style.display = "none";
        if (coverUploadBtn) coverUploadBtn.style.display = "none";
        if (avatarOverlay) avatarOverlay.style.display = "none";
        if (uploadSection) uploadSection.style.display = "none";
        if (emptyUploadBtn) emptyUploadBtn.style.display = "none";
        if (settingsBtn) settingsBtn.style.display = "none";
        if (moderationBtn) moderationBtn.style.display = "none";
    }
}

  // ========== ARTIST BADGE FUNCTIONALITY ==========

  async loadBadge() {
    if (!this.userId) return;

    try {
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .get();

      if (userDoc.exists) {
        const data = userDoc.data();
        this.badgeData = data.badge || null;
        this.renderBadge();

        const editBadgeBtn = document.getElementById("editBadgeBtn");
        if (editBadgeBtn && this.isOwnProfile) {
          editBadgeBtn.style.display = "flex";
        }
      }
    } catch (error) {
      console.error("Error loading badge:", error);
    }
  }

  renderBadge() {
    const badge = this.badgeData;
    if (!badge) {
      document.getElementById("badgeArtistType").textContent = "Not set";
      document.getElementById("badgeSpecialties").innerHTML =
        '<span class="badge-tag">Not set</span>';
      document.getElementById("badgeMediumTags").innerHTML =
        '<span class="badge-tag">Not set</span>';
      document.getElementById("badgeIcon").className = "fas fa-palette";
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
    document.getElementById("badgeArtistType").textContent =
      typeLabels[badge.artistType] || badge.artistType || "Not set";

    const typeIcons = {
      digital: "fas fa-laptop",
      traditional: "fas fa-paintbrush",
      mixed: "fas fa-palette",
      "3d": "fas fa-cube",
      photography: "fas fa-camera",
      animation: "fas fa-film",
    };
    document.getElementById("badgeIcon").className =
      typeIcons[badge.artistType] || "fas fa-palette";

    const specialtiesContainer = document.getElementById("badgeSpecialties");
    if (badge.specialties && badge.specialties.length > 0) {
      specialtiesContainer.innerHTML = badge.specialties
        .map(
          (s) =>
            `<span class="badge-tag primary-tag">${this.formatSpecialtyLabel(s)}</span>`,
        )
        .join("");
    } else {
      specialtiesContainer.innerHTML = '<span class="badge-tag">Not set</span>';
    }

    const mediumContainer = document.getElementById("badgeMediumTags");
    if (badge.mediums && badge.mediums.length > 0) {
      mediumContainer.innerHTML = badge.mediums
        .map(
          (m) => `<span class="badge-tag">${this.formatMediumLabel(m)}</span>`,
        )
        .join("");
    } else {
      mediumContainer.innerHTML = '<span class="badge-tag">Not set</span>';
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

  // ========== BADGE EDIT SETUP ==========
  setupBadgeEdit() {
    const editBtn = document.getElementById("editBadgeBtn");
    const modal = document.getElementById("badgeModal");
    const closeBtn = document.getElementById("closeBadgeModal");
    const cancelBtn = document.getElementById("cancelBadgeBtn");
    const saveBtn = document.getElementById("saveBadgeBtn");

    console.log("Setting up badge edit...", {
      editBtn: !!editBtn,
      modal: !!modal,
      saveBtn: !!saveBtn,
    });

    if (editBtn) {
      const newEditBtn = editBtn.cloneNode(true);
      editBtn.parentNode.replaceChild(newEditBtn, editBtn);

      newEditBtn.addEventListener("click", () => {
        console.log("Edit badge button clicked");
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
        console.log("Save badge button clicked!");
        this.saveBadge();
      });
    }

    const form = document.getElementById("badgeForm");
    if (form) {
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          console.log("Enter key pressed in form");
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

  // ========== SAVE BADGE ==========
  async saveBadge() {
    console.log("saveBadge called!");

    const artistType = document.getElementById("artistType").value;
    console.log("Artist type:", artistType);

    if (!artistType) {
      alert("Please select your artist type");
      return;
    }

    const specialtyCheckboxes = document.querySelectorAll(
      '#specialtiesGrid input[type="checkbox"]:checked',
    );
    let specialties = Array.from(specialtyCheckboxes).map((cb) => cb.value);
    console.log("Specialties:", specialties);

    if (specialties.length > 4) {
      alert("Please select up to 4 specialties");
      return;
    }

    const mediumCheckboxes = document.querySelectorAll(
      '#mediumGrid input[type="checkbox"]:checked',
    );
    let mediums = Array.from(mediumCheckboxes).map((cb) => cb.value);
    console.log("Mediums:", mediums);

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

    console.log("Saving badge data:", badgeData);

    try {
      await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .update({ badge: badgeData });

      console.log("Badge saved successfully!");
      this.badgeData = badgeData;
      this.renderBadge();

      const modal = document.getElementById("badgeModal");
      if (modal) modal.classList.remove("active");

      this.showToast("Artist badge updated successfully! 🎉");
    } catch (error) {
      console.error("Error saving badge:", error);
      alert("Error saving badge. Please try again. " + error.message);
    }
  }

  // ========== NSFW CREATOR BADGE ==========
  async checkNSFWCreator() {
    if (!this.userId) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("artistId", "==", this.userId)
        .where("isNSFW", "==", true)
        .where("status", "==", "published")
        .limit(1)
        .get();

      const hasNSFW = !snapshot.empty;
      const badge = document.getElementById("nsfwCreatorBadge");

      if (badge) {
        // Only show if user has NSFW content AND viewer is 18+ (or not logged in)
        const isAdult = this.userData?.isAdult || false;
        if (hasNSFW && (isAdult || !this.isOwnProfile)) {
          badge.style.display = "block";
        } else {
          badge.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error checking NSFW creator:", error);
    }
  }

  // ========== AGE VERIFICATION ==========
  setupAgeVerification() {
    const section = document.getElementById("ageVerificationSection");
    if (!section) return;

    // Only show if user is logged in and viewing their own profile
    if (!this.isOwnProfile) {
      section.style.display = "none";
      return;
    }

    // Check if user already has age set
    if (this.userData && this.userData.age !== undefined) {
      section.style.display = "none";
      return;
    }

    // Show verification section
    section.style.display = "block";

    // Setup verify button
    const verifyBtn = document.getElementById("verifyAgeBtn");
    if (verifyBtn) {
      verifyBtn.addEventListener("click", () => {
        // Use the global AgeVerification if available
        if (window.AgeVerification) {
          window.AgeVerification.triggerVerification();
        } else {
          // Fallback: Show a simple prompt for DOB
          this.showSimpleAgeVerification();
        }
      });
    }
  }

  // Fallback age verification if AgeVerification class isn't loaded
  showSimpleAgeVerification() {
    const dob = prompt(
      "Please enter your date of birth (YYYY-MM-DD) to verify your age:",
    );
    if (!dob) return;

    const birthDate = new Date(dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const monthDiff = new Date().getMonth() - birthDate.getMonth();
    const finalAge =
      monthDiff < 0 ||
      (monthDiff === 0 && new Date().getDate() < birthDate.getDate())
        ? age - 1
        : age;

    if (finalAge < 13) {
      alert("You must be at least 13 years old to use Art Mecca.");
      return;
    }

    const isAdult = finalAge >= 18;

    firebase
      .firestore()
      .collection("users")
      .doc(this.currentUser.uid)
      .update({
        dateOfBirth: dob,
        age: finalAge,
        isAdult: isAdult,
        nsfwContent: {
          canView: isAdult,
          canCreate: isAdult,
        },
        nsfwPreferences: {
          enabled: isAdult,
          showBlurred: true,
        },
      })
      .then(() => {
        this.userData.age = finalAge;
        this.userData.isAdult = isAdult;
        section.style.display = "none";
        alert(
          isAdult
            ? "✅ Age verified! You now have access to NSFW content."
            : "You are under 18. NSFW content will be hidden.",
        );
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error saving age:", error);
        alert("Error saving age. Please try again.");
      });
  }

  // ========== PROFILE LOADING ==========
  async loadProfile() {
    const loadingState = document.getElementById("loadingState");
    const profileContent = document.getElementById("profileContent");
    const errorState = document.getElementById("errorState");

    try {
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .get();

      if (!userDoc.exists) {
        this.showError();
        return;
      }

      this.userData = userDoc.data();
      this.renderProfile();

      if (loadingState) loadingState.style.display = "none";
      if (profileContent) profileContent.style.display = "block";
    } catch (error) {
      console.error("Error loading profile:", error);
      this.showError();
    }
  }

  renderProfile() {
    const displayName =
      this.userData.fullname || this.userData.username || "Artist";
    const username = this.userData.username || "artist";
    const avatar = displayName.charAt(0).toUpperCase();
    const avatarUrl = this.userData.avatarUrl;
    const coverUrl = this.userData.coverUrl;

    const avatarDiv = document.getElementById("profileAvatar");
    if (avatarDiv) {
      if (avatarUrl) {
        avatarDiv.style.backgroundImage = `url(${avatarUrl})`;
        avatarDiv.style.backgroundSize = "cover";
        avatarDiv.style.backgroundPosition = "center";
        avatarDiv.innerHTML = "";
      } else {
        avatarDiv.style.background =
          "linear-gradient(135deg, #fe67ea, #63dbee)";
        avatarDiv.innerHTML = avatar;
      }
    }

    const coverDiv = document.getElementById("coverImage");
    if (coverDiv) {
      if (coverUrl) {
        coverDiv.style.backgroundImage = `url(${coverUrl})`;
      } else {
        coverDiv.style.backgroundImage =
          "linear-gradient(135deg, #fe67ea, #7aa5f0)";
      }
    }

    const nameEl = document.getElementById("profileName");
    const usernameEl = document.getElementById("profileUsername");
    const artistDisplay = document.getElementById("artistNameDisplay");

    if (nameEl) nameEl.textContent = displayName;
    if (usernameEl) usernameEl.textContent = `@${username}`;
    if (artistDisplay) artistDisplay.textContent = displayName;

    this.renderBio(this.userData.bio || "No bio yet.");
  }

  renderBio(bioText) {
    const bioContent = document.getElementById("bioContent");
    if (!bioContent) return;

    const formattedBio = bioText.replace(/\n/g, "<br>");
    bioContent.innerHTML = formattedBio;

    const needsCollapse =
      bioText.length > 300 || bioText.split("\n").length > 4;
    const toggleBtn = document.getElementById("bioToggleBtn");

    if (toggleBtn) {
      if (needsCollapse && !this.bioExpanded) {
        bioContent.classList.add("collapsed");
        toggleBtn.style.display = "flex";
      } else {
        bioContent.classList.remove("collapsed");
        toggleBtn.style.display = needsCollapse ? "flex" : "none";
      }
    }
  }

  setupBioToggle() {
    const toggleBtn = document.getElementById("bioToggleBtn");
    const bioContent = document.getElementById("bioContent");
    const toggleText = document.getElementById("bioToggleText");
    const toggleIcon = document.getElementById("bioToggleIcon");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.bioExpanded = !this.bioExpanded;
        if (bioContent) {
          if (this.bioExpanded) {
            bioContent.classList.remove("collapsed");
            if (toggleText) toggleText.textContent = "Show less";
            if (toggleIcon) toggleIcon.className = "fas fa-chevron-up";
          } else {
            bioContent.classList.add("collapsed");
            if (toggleText) toggleText.textContent = "Show more";
            if (toggleIcon) toggleIcon.className = "fas fa-chevron-down";
          }
        }
      });
    }
  }

  // ========== SHADOW SYSTEM ==========
  async loadShadowData() {
    if (!this.userId) return;

    try {
      const shadowsSnapshot = await firebase
        .firestore()
        .collection("shadows")
        .where("targetId", "==", this.userId)
        .get();
      this.shadowCount = shadowsSnapshot.size;
      const shadowCountEl = document.getElementById("shadowCount");
      if (shadowCountEl) shadowCountEl.textContent = this.shadowCount;

      const shadowingSnapshot = await firebase
        .firestore()
        .collection("shadows")
        .where("shadowerId", "==", this.userId)
        .get();
      this.shadowingCount = shadowingSnapshot.size;
      const shadowingCountEl = document.getElementById("shadowingCount");
      if (shadowingCountEl) shadowingCountEl.textContent = this.shadowingCount;

      if (this.currentUser && !this.isOwnProfile) {
        const shadowCheck = await firebase
          .firestore()
          .collection("shadows")
          .where("shadowerId", "==", this.currentUser.uid)
          .where("targetId", "==", this.userId)
          .get();

        this.isShadowing = !shadowCheck.empty;
        const shadowBtn = document.getElementById("shadowBtn");
        const shadowBtnText = document.getElementById("shadowBtnText");

        if (shadowBtn) {
          shadowBtn.style.display = "flex";
          if (this.isShadowing) {
            shadowBtn.classList.add("active");
            if (shadowBtnText) shadowBtnText.textContent = "Shadowing";
          } else {
            shadowBtn.classList.remove("active");
            if (shadowBtnText) shadowBtnText.textContent = "Shadow";
          }
        }
      } else if (this.isOwnProfile) {
        const shadowBtn = document.getElementById("shadowBtn");
        if (shadowBtn) shadowBtn.style.display = "none";
      }
    } catch (error) {
      console.error("Error loading shadow data:", error);
    }
  }

  async toggleShadow() {
    if (!this.currentUser) {
      alert("Please login to shadow artists");
      return;
    }

    const shadowBtn = document.getElementById("shadowBtn");
    const shadowBtnText = document.getElementById("shadowBtnText");

    try {
      const shadowsRef = firebase.firestore().collection("shadows");
      const existingShadow = await shadowsRef
        .where("shadowerId", "==", this.currentUser.uid)
        .where("targetId", "==", this.userId)
        .get();

      if (!existingShadow.empty) {
        await existingShadow.docs[0].ref.delete();
        this.isShadowing = false;
        this.shadowCount--;
        if (shadowBtn) shadowBtn.classList.remove("active");
        if (shadowBtnText) shadowBtnText.textContent = "Shadow";
        const shadowCountEl = document.getElementById("shadowCount");
        if (shadowCountEl) shadowCountEl.textContent = this.shadowCount;

        const shadowingCountSpan = document.getElementById("shadowingCount");
        if (shadowingCountSpan) {
          const currentShadowing =
            parseInt(shadowingCountSpan.textContent) || 0;
          shadowingCountSpan.textContent = currentShadowing - 1;
        }
      } else {
        const shadowerName =
          this.currentUser.displayName || this.currentUser.email.split("@")[0];
        const targetName =
          this.userData.fullname || this.userData.username || "Artist";

        await shadowsRef.add({
          shadowerId: this.currentUser.uid,
          shadowerName: shadowerName,
          targetId: this.userId,
          targetName: targetName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        this.isShadowing = true;
        this.shadowCount++;
        if (shadowBtn) shadowBtn.classList.add("active");
        if (shadowBtnText) shadowBtnText.textContent = "Shadowing";
        const shadowCountEl = document.getElementById("shadowCount");
        if (shadowCountEl) shadowCountEl.textContent = this.shadowCount;

        const shadowingCountSpan = document.getElementById("shadowingCount");
        if (shadowingCountSpan) {
          const currentShadowing =
            parseInt(shadowingCountSpan.textContent) || 0;
          shadowingCountSpan.textContent = currentShadowing + 1;
        }

        if (this.currentUser.uid !== this.userId && authManager) {
          await authManager.createNotification(this.userId, "shadow", {
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

  async showShadows() {
    const modal = document.getElementById("shadowsModal");
    const listContainer = document.getElementById("shadowsList");

    if (!modal || !listContainer) return;

    modal.classList.add("active");
    listContainer.innerHTML = "<p>Loading...</p>";

    try {
      const snapshot = await firebase
        .firestore()
        .collection("shadows")
        .where("targetId", "==", this.userId)
        .get();

      if (snapshot.empty) {
        listContainer.innerHTML = '<p class="no-users">No shadows yet.</p>';
        return;
      }

      const shadowers = [];
      for (const doc of snapshot.docs) {
        const shadowerId = doc.data().shadowerId;
        const userDoc = await firebase
          .firestore()
          .collection("users")
          .doc(shadowerId)
          .get();
        if (userDoc.exists) {
          shadowers.push({
            id: shadowerId,
            name:
              userDoc.data().fullname || doc.data().shadowerName || "Artist",
            username: userDoc.data().username || "artist",
          });
        }
      }

      if (shadowers.length === 0) {
        listContainer.innerHTML = '<p class="no-users">No shadows yet.</p>';
      } else {
        listContainer.innerHTML = shadowers
          .map(
            (user) => `
                    <a href="profile.html?user=${user.id}" class="user-item">
                        <div class="user-avatar-small">${user.name.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <div class="user-name">${this.escapeHtml(user.name)}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </a>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading shadows:", error);
      listContainer.innerHTML = "<p>Error loading shadows.</p>";
    }
  }

  async showShadowing() {
    const modal = document.getElementById("shadowingModal");
    const listContainer = document.getElementById("shadowingList");

    if (!modal || !listContainer) return;

    modal.classList.add("active");
    listContainer.innerHTML = "<p>Loading...</p>";

    try {
      const snapshot = await firebase
        .firestore()
        .collection("shadows")
        .where("shadowerId", "==", this.userId)
        .get();

      if (snapshot.empty) {
        listContainer.innerHTML =
          '<p class="no-users">Not shadowing anyone yet.</p>';
        return;
      }

      const targets = [];
      for (const doc of snapshot.docs) {
        const targetId = doc.data().targetId;
        const userDoc = await firebase
          .firestore()
          .collection("users")
          .doc(targetId)
          .get();
        if (userDoc.exists) {
          targets.push({
            id: targetId,
            name: userDoc.data().fullname || doc.data().targetName || "Artist",
            username: userDoc.data().username || "artist",
          });
        }
      }

      if (targets.length === 0) {
        listContainer.innerHTML =
          '<p class="no-users">Not shadowing anyone yet.</p>';
      } else {
        listContainer.innerHTML = targets
          .map(
            (user) => `
                    <a href="profile.html?user=${user.id}" class="user-item">
                        <div class="user-avatar-small">${user.name.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <div class="user-name">${this.escapeHtml(user.name)}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </a>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading shadowing:", error);
      listContainer.innerHTML = "<p>Error loading shadowing.</p>";
    }
  }

  // ========== ARTWORKS WITH CACHING ==========
  async loadArtworks() {
    const artworksGrid = document.getElementById("artworksGrid");
    const artworkCountSpan = document.getElementById("artworkCount");
    const totalLikesSpan = document.getElementById("totalLikes");
    const totalCheersSpan = document.getElementById("totalCheers");

    if (!artworksGrid) return;

    try {
      // Use queryOptimizer if available, otherwise fallback to direct query
      if (typeof queryOptimizer !== "undefined") {
        const cacheKey = `user_artworks_${this.userId}`;

        const cachedArtworks = await queryOptimizer.getCachedOrFetch(
          cacheKey,
          async () => {
            const snapshot = await firebase
              .firestore()
              .collection("artworks")
              .where("artistId", "==", this.userId)
              .where("status", "==", "published")
              .orderBy("createdAt", "desc")
              .get();

            return snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          },
          5 * 60 * 1000, // 5 minutes cache
        );

        if (cachedArtworks) {
          this.artworks = cachedArtworks;
        } else {
          // Fallback: load directly
          const snapshot = await firebase
            .firestore()
            .collection("artworks")
            .where("artistId", "==", this.userId)
            .where("status", "==", "published")
            .orderBy("createdAt", "desc")
            .get();

          this.artworks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      } else {
        // Fallback without queryOptimizer
        const snapshot = await firebase
          .firestore()
          .collection("artworks")
          .where("artistId", "==", this.userId)
          .where("status", "==", "published")
          .orderBy("createdAt", "desc")
          .get();

        this.artworks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      if (artworkCountSpan) artworkCountSpan.textContent = this.artworks.length;

      let totalLikes = 0;
      let totalCheers = 0;
      this.artworks.forEach((art) => {
        totalLikes += art.likes || 0;
        totalCheers += art.cheers || 0;
      });
      if (totalLikesSpan) totalLikesSpan.textContent = totalLikes;
      if (totalCheersSpan) totalCheersSpan.textContent = totalCheers;

      // Render the artworks
      if (this.artworks.length === 0) {
        artworksGrid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-palette"></i>
            <p>No artworks yet.</p>
            ${this.isOwnProfile ? '<button class="btn-upload-empty" id="emptyUploadBtn">Upload Your First Artwork</button>' : ""}
          </div>
        `;
        const emptyBtn = document.getElementById("emptyUploadBtn");
        if (emptyBtn && this.isOwnProfile) {
          emptyBtn.addEventListener("click", () => {
            const uploadModal = document.getElementById("uploadModal");
            if (uploadModal) uploadModal.classList.add("active");
          });
        }
        return;
      }

      artworksGrid.innerHTML = this.artworks
        .map((art) => {
          const editButton = this.isOwnProfile
            ? `<button class="edit-artwork-btn" data-id="${art.id}" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 32px; height: 32px; color: white; cursor: pointer; z-index: 10;">
                  <i class="fas fa-edit"></i>
                </button>`
            : "";

          return `
            <div class="artwork-card" data-id="${art.id}" style="position: relative;">
              ${editButton}
              <img src="${art.imageUrl}" alt="${art.title}" class="artwork-card-image" loading="lazy">
              <div class="artwork-card-info">
                <div class="artwork-card-title">${this.escapeHtml(art.title)}</div>
                <div class="artwork-card-stats">
                  <span><i class="fas fa-heart" style="color: #fe67ea;"></i> ${art.likes || 0}</span>
                  <span><i class="fas fa-glass-cheers" style="color: #dbee63;"></i> ${art.cheers || 0}</span>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      if (this.isOwnProfile) {
        document.querySelectorAll(".edit-artwork-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            window.location.href = `/pages/community/edit-artwork.html?id=${id}`;
          });
        });
      }

      document.querySelectorAll(".artwork-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (!e.target.closest(".edit-artwork-btn")) {
            const id = card.dataset.id;
            window.location.href = `/pages/community/artwork-detail.html?id=${id}`;
          }
        });
      });
    } catch (error) {
      console.error("Error loading artworks:", error);
      artworksGrid.innerHTML =
        '<div class="empty-state"><p>Error loading artworks.</p></div>';
    }
  }

  // ========== IMAGE UPLOADS ==========
  setupImageUploads() {
    if (!this.isOwnProfile) {
      console.log("Viewing someone else's profile - hiding upload buttons");
      return;
    }

    console.log("Setting up image uploads for own profile");

    const avatarWrapper = document.getElementById("profileAvatar");
    const avatarInput = document.getElementById("avatarFileInput");
    const avatarOverlay = document.getElementById("avatarUploadBtn");

    if (avatarWrapper && avatarInput) {
      avatarWrapper.style.cursor = "pointer";

      if (avatarOverlay) {
        avatarOverlay.style.display = "flex";
      }

      const newAvatarWrapper = avatarWrapper.cloneNode(true);
      avatarWrapper.parentNode.replaceChild(newAvatarWrapper, avatarWrapper);

      newAvatarWrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("Avatar clicked");
        avatarInput.click();
      });

      avatarInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.uploadImage(e.target.files[0], "avatar");
        }
      });
    }

    let coverBtn = document.getElementById("coverUploadBtn");
    const coverInput = document.getElementById("coverFileInput");

    if (coverBtn && coverInput) {
      coverBtn.style.display = "flex";
      coverBtn.style.opacity = "1";
      coverBtn.style.visibility = "visible";
      coverBtn.style.pointerEvents = "auto";

      const newCoverBtn = coverBtn.cloneNode(true);
      coverBtn.parentNode.replaceChild(newCoverBtn, coverBtn);
      coverBtn = newCoverBtn;

      coverBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log("Cover upload button clicked");
        coverInput.click();
      });

      coverInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          console.log("Cover file selected:", e.target.files[0].name);
          this.uploadImage(e.target.files[0], "cover");
        }
      });
    }
  }

  async uploadImage(file, type) {
    if (!file) return;

    const maxSize = type === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        `Image too large. ${type === "avatar" ? "Avatar" : "Cover"} image must be under ${maxSize / (1024 * 1024)}MB`,
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    const loadingState = document.getElementById("loadingState");
    if (loadingState) loadingState.style.display = "block";

    try {
      const maxDimension = type === "avatar" ? 400 : 1200;
      const quality = type === "avatar" ? 0.9 : 0.85;
      const compressedFile = await this.compressImage(
        file,
        maxDimension,
        quality,
      );

      const storageRef = firebase.storage().ref();
      const fileName = `${type}s/${this.userId}/${Date.now()}_${file.name}`;
      const fileRef = storageRef.child(fileName);

      await fileRef.put(compressedFile);
      const downloadURL = await fileRef.getDownloadURL();

      const updateData = {};
      if (type === "avatar") {
        updateData.avatarUrl = downloadURL;
      } else {
        updateData.coverUrl = downloadURL;
      }

      await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .update(updateData);

      if (type === "avatar") {
        const avatarDiv = document.getElementById("profileAvatar");
        if (avatarDiv) {
          avatarDiv.style.backgroundImage = `url(${downloadURL})`;
          avatarDiv.style.backgroundSize = "cover";
          avatarDiv.style.backgroundPosition = "center";
          avatarDiv.innerHTML = "";
        }
      } else {
        const coverDiv = document.getElementById("coverImage");
        if (coverDiv) {
          coverDiv.style.backgroundImage = `url(${downloadURL})`;
        }
      }

      alert(`${type === "avatar" ? "Avatar" : "Cover"} updated successfully!`);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      if (loadingState) loadingState.style.display = "none";
    }
  }

  setupUpload() {
    if (!this.isOwnProfile) {
      console.log(
        "Viewing someone else's profile - hiding upload modal trigger",
      );
      return;
    }

    const uploadBtns = document.querySelectorAll(
      "#profileUploadBtn, #emptyUploadBtn",
    );
    const uploadModal = document.getElementById("uploadModal");
    const closeModal = document.getElementById("closeUploadModal");
    const uploadArea = document.getElementById("uploadArea");
    const imageFile = document.getElementById("imageFile");
    const uploadForm = document.getElementById("uploadForm");

    uploadBtns.forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", () => {
          if (uploadModal) uploadModal.classList.add("active");
        });
      }
    });

    if (closeModal) {
      closeModal.addEventListener("click", () => {
        if (uploadModal) uploadModal.classList.remove("active");
      });
    }

    if (uploadModal) {
      uploadModal.addEventListener("click", (e) => {
        if (e.target === uploadModal) {
          uploadModal.classList.remove("active");
        }
      });
    }

    if (uploadArea && imageFile) {
      uploadArea.addEventListener("click", () => imageFile.click());

      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "#fe67ea";
      });

      uploadArea.addEventListener("dragleave", () => {
        uploadArea.style.borderColor = "var(--gray-light)";
      });

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/"))
          this.handleImageUpload(file);
        uploadArea.style.borderColor = "var(--gray-light)";
      });
    }

    if (imageFile) {
      imageFile.addEventListener("change", (e) => {
        if (e.target.files[0]) this.handleImageUpload(e.target.files[0]);
      });
    }

    if (uploadForm) {
      uploadForm.addEventListener("submit", (e) => this.submitArtwork(e));
    }
  }

  handleImageUpload(file) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.showToast("File size must be less than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      this.showToast("Please upload an image file");
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
            if (ev.target.files[0]) this.handleImageUpload(ev.target.files[0]);
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async submitArtwork(e) {
    e.preventDefault();

    if (!this.currentUser) {
      this.showToast("Please login to upload artwork");
      return;
    }

    const title = document.getElementById("artTitle").value;
    const category = document.getElementById("artCategory").value;
    const description = document.getElementById("artDescription").value;
    const tagsInput = document.getElementById("artTags").value;

    if (!title || !category || !this.uploadedImageFile) {
      this.showToast("Please fill in all required fields and select an image");
      return;
    }

    const tags = tagsInput.split(",").map((t) => t.trim());
    const submitBtn = document.getElementById("submitArtBtn");
    const originalText = submitBtn ? submitBtn.innerHTML : "Upload";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    try {
      const compressedFile = await this.compressImage(
        this.uploadedImageFile,
        1200,
        0.85,
      );

      const storageRef = firebase.storage().ref();
      const fileName = `artworks/${this.currentUser.uid}/${Date.now()}_${this.uploadedImageFile.name}`;
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
          artistId: this.currentUser.uid,
          artistName:
            this.currentUser.displayName ||
            this.currentUser.email.split("@")[0],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          likes: 0,
          cheers: 0,
          comments: [],
          status: "published",
        });

      this.showToast("Artwork published successfully! 🎉");

      const uploadModal = document.getElementById("uploadModal");
      const uploadForm = document.getElementById("uploadForm");

      if (uploadModal) uploadModal.classList.remove("active");
      if (uploadForm) uploadForm.reset();

      const uploadArea = document.getElementById("uploadArea");
      if (uploadArea) {
        uploadArea.innerHTML = `
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop or click to upload</p>
          <span>PNG, JPG, JPEG up to 10MB</span>
          <input type="file" id="imageFile" accept="image/*" hidden>
        `;
        const newImageFile = document.getElementById("imageFile");
        if (newImageFile) {
          newImageFile.addEventListener("change", (ev) => {
            if (ev.target.files[0]) this.handleImageUpload(ev.target.files[0]);
          });
        }
      }

      this.uploadedImageFile = null;
      await this.loadArtworks();
    } catch (error) {
      console.error("Upload error:", error);
      this.showToast("Upload failed: " + error.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  // ========== LIKED & SAVED ARTWORKS ==========
  async loadLikedArtworks() {
    if (!this.userId) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("likes")
        .where("userId", "==", this.userId)
        .get();

      const artworkIds = snapshot.docs.map((doc) => doc.data().artworkId);
      const container = document.getElementById("likedArtworksGrid");
      if (!container) return;

      if (artworkIds.length === 0) {
        container.innerHTML =
          '<div class="empty-state"><i class="fas fa-heart"></i><p>No liked artworks yet.</p></div>';
        return;
      }

      const artworks = [];
      for (const id of artworkIds) {
        const artDoc = await firebase
          .firestore()
          .collection("artworks")
          .doc(id)
          .get();
        if (artDoc.exists) {
          artworks.push({ id: artDoc.id, ...artDoc.data() });
        }
      }

      if (artworks.length === 0) {
        container.innerHTML =
          '<div class="empty-state"><i class="fas fa-heart"></i><p>No liked artworks yet.</p></div>';
      } else {
        container.innerHTML = artworks
          .map(
            (art) => `
          <div class="saved-item-card" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
            <img src="${art.imageUrl}" alt="${art.title}" style="width: 100%; height: 120px; object-fit: cover;" loading="lazy" onerror="this.src='https://placehold.co/200x120/fe67ea/white?text=Artwork'">
            <div class="saved-item-info">
              <div class="saved-item-title">${this.escapeHtml(art.title)}</div>
              <div class="tutorial-meta-small"><i class="fas fa-heart" style="color: #fe67ea;"></i> ${art.likes || 0} likes</div>
            </div>
          </div>
        `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading liked artworks:", error);
    }
  }

  async loadSavedArtworks() {
    if (!this.userId) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .collection("savedArtworks")
        .orderBy("savedAt", "desc")
        .get();

      const container = document.getElementById("savedArtworksGrid");
      if (!container) return;

      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state"><i class="fas fa-bookmark"></i><p>No saved artworks yet.</p></div>';
        return;
      }

      const artworks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      container.innerHTML = artworks
        .map(
          (art) => `
        <div class="saved-item-card" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.artworkId}'">
          <img src="${art.thumbnail}" alt="${art.title}" style="width: 100%; height: 120px; object-fit: cover;" onerror="this.src='https://placehold.co/200x120/fe67ea/white?text=Artwork'">
          <div class="saved-item-info">
            <div class="saved-item-title">${this.escapeHtml(art.title)}</div>
            <div class="tutorial-meta-small">Saved ${new Date(art.savedAt?.toDate()).toLocaleDateString()}</div>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading saved artworks:", error);
    }
  }

  async loadSavedTutorials() {
    if (!this.userId) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .collection("savedTutorials")
        .orderBy("savedAt", "desc")
        .get();

      const container = document.getElementById("savedTutorialsGrid");
      if (!container) return;

      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state"><i class="fas fa-bookmark"></i><p>No saved tutorials yet. Click the bookmark icon on any tutorial to save it!</p></div>';
        return;
      }

      const tutorials = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      container.innerHTML = tutorials
        .map((tut) => {
          let filename = tut.tutorialId;
          const idMappings = {
            "character-design-dynamic": "character-design",
            "color-lighting": "color-lighting",
            "digital-painting": "digital-painting",
            "facial-anatomy": "facial-anatomy",
          };
          filename = idMappings[tut.tutorialId] || tut.tutorialId;

          return `
          <div class="tutorial-card-small" onclick="window.location.href='/pages/tutorials/${tut.category}/${filename}.html'">
            <div class="tutorial-thumb" loading="lazy" onerror="this.textContent='📖'">📖</div>
            <div class="tutorial-info-small">
              <div class="tutorial-title-small">${this.escapeHtml(tut.title)}</div>
              <div class="tutorial-meta-small">${tut.duration || "30 min"} • ${tut.difficulty || "Beginner"}</div>
            </div>
          </div>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading saved tutorials:", error);
    }
  }

  async loadCompletedTutorials() {
    if (!this.userId) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("users")
        .doc(this.userId)
        .collection("tutorialProgress")
        .where("completed", "==", true)
        .orderBy("completedAt", "desc")
        .get();

      const container = document.getElementById("completedTutorialsGrid");
      if (!container) return;

      if (snapshot.empty) {
        container.innerHTML =
          '<div class="empty-state"><i class="fas fa-trophy"></i><p>No completed tutorials yet. Check the checkbox on tutorials when you finish them!</p></div>';
        return;
      }

      const tutorials = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      container.innerHTML = tutorials
        .map((tut) => {
          let filename = tut.tutorialId;
          const idMappings = {
            "character-design-dynamic": "character-design",
            "color-lighting": "color-lighting",
            "digital-painting": "digital-painting",
            "facial-anatomy": "facial-anatomy",
          };
          filename = idMappings[tut.tutorialId] || tut.tutorialId;

          return `
          <div class="tutorial-card-small" onclick="window.location.href='/pages/tutorials/${tut.category}/${filename}.html'">
            <div class="tutorial-thumb" loading="lazy" onerror="this.textContent='🏆'">🏆</div>
            <div class="tutorial-info-small">
              <div class="tutorial-title-small">${this.escapeHtml(tut.title)}</div>
              <div class="tutorial-meta-small">
                <span class="completed-badge">Completed!</span>
                ${tut.progress ? `${tut.progress}% complete` : ""}
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading completed tutorials:", error);
    }
  }

  setupEventListeners() {
    const editBtn = document.getElementById("editProfileBtn");
    if (editBtn && this.isOwnProfile) {
      editBtn.addEventListener("click", () => this.showEditModal());
    }

    const shadowBtn = document.getElementById("shadowBtn");
    if (shadowBtn && !this.isOwnProfile) {
      shadowBtn.addEventListener("click", () => this.toggleShadow());
    }

    const shadowCountCard = document.getElementById("shadowCountCard");
    if (shadowCountCard) {
      shadowCountCard.addEventListener("click", () => this.showShadows());
    }

    const shadowingCountCard = document.getElementById("shadowingCountCard");
    if (shadowingCountCard) {
      shadowingCountCard.addEventListener("click", () => this.showShadowing());
    }

    const closeShadowsModal = document.getElementById("closeShadowsModal");
    if (closeShadowsModal) {
      closeShadowsModal.addEventListener("click", () => {
        const modal = document.getElementById("shadowsModal");
        if (modal) modal.classList.remove("active");
      });
    }

    const closeShadowingModal = document.getElementById("closeShadowingModal");
    if (closeShadowingModal) {
      closeShadowingModal.addEventListener("click", () => {
        const modal = document.getElementById("shadowingModal");
        if (modal) modal.classList.remove("active");
      });
    }

    const shadowsModal = document.getElementById("shadowsModal");
    if (shadowsModal) {
      shadowsModal.addEventListener("click", (e) => {
        if (e.target === shadowsModal) {
          shadowsModal.classList.remove("active");
        }
      });
    }

    const shadowingModal = document.getElementById("shadowingModal");
    if (shadowingModal) {
      shadowingModal.addEventListener("click", (e) => {
        if (e.target === shadowingModal) {
          shadowingModal.classList.remove("active");
        }
      });
    }
  }

  showEditModal() {
    const modal = document.getElementById("editModal");
    const nameInput = document.getElementById("editName");
    const bioTextarea = document.getElementById("editBio");
    const charCountSpan = document.getElementById("bioCharCount");

    if (nameInput) nameInput.value = this.userData.fullname || "";
    if (bioTextarea) bioTextarea.value = this.userData.bio || "";

    if (bioTextarea && charCountSpan) {
      const updateCharCount = () => {
        const count = bioTextarea.value.length;
        charCountSpan.textContent = `${count}/${this.BIO_CHAR_LIMIT}`;
        charCountSpan.style.color =
          count > this.BIO_CHAR_LIMIT ? "var(--error)" : "var(--gray)";
      };
      bioTextarea.addEventListener("input", updateCharCount);
      updateCharCount();
    }

    if (modal) modal.classList.add("active");

    const closeBtn = document.getElementById("closeModalBtn");
    const saveBtn = document.getElementById("saveProfileBtn");

    const closeModal = () => {
      if (modal) modal.classList.remove("active");
    };

    if (closeBtn) closeBtn.onclick = closeModal;

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };
    }

    if (saveBtn) {
      saveBtn.onclick = async () => {
        const newName = nameInput ? nameInput.value.trim() : "";
        const newBio = bioTextarea ? bioTextarea.value : "";

        if (!newName) {
          alert("Please enter a display name");
          return;
        }

        if (newBio.length > this.BIO_CHAR_LIMIT) {
          alert(`Bio must be ${this.BIO_CHAR_LIMIT} characters or less`);
          return;
        }

        try {
          await firebase
            .firestore()
            .collection("users")
            .doc(this.userId)
            .update({
              fullname: newName,
              bio: newBio,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

          this.userData.fullname = newName;
          this.userData.bio = newBio;
          this.renderProfile();

          closeModal();
          alert("Profile updated successfully!");
        } catch (error) {
          console.error("Error updating profile:", error);
          alert("Error updating profile");
        }
      };
    }
  }

  showToast(message) {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  showError() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");

    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "block";
  }

  setupSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const mobileToggle = document.getElementById("mobileSidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");

    if (toggleBtn && sidebar) {
      const savedState = localStorage.getItem("sidebarCollapsed");
      if (savedState === "true") sidebar.classList.add("collapsed");

      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("collapsed");
        localStorage.setItem(
          "sidebarCollapsed",
          sidebar.classList.contains("collapsed"),
        );
      });
    }

    if (mobileToggle && sidebar && overlay) {
      mobileToggle.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new UserProfile();
});
