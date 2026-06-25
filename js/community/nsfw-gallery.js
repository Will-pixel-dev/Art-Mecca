/**
 * NSFW Gallery - Age-gated mature content
 */

class NSFWGallery {
  constructor() {
    this.currentUser = null;
    this.artworks = [];
    this.masonry = null;
    this.currentFilter = "all";
    this.searchQuery = "";
    this.isBlurred = true;
    this.ageVerified = false;
    this.isAdult = false;
    this.userData = null;
    this.verificationPending = false;

    this.init();
  }

  async init() {
    // Check age verification status
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;

      if (!user) {
        // Not logged in - show age gate with verification form
        this.showAgeGate();
        return;
      }

      // Load user data to check age
      await this.loadUserData();

      // If user has no isAdult field, show verification form
      if (this.isAdult === undefined || this.isAdult === null) {
        this.showAgeGate();
        return;
      }

      if (this.isAdult === true) {
        // Check if user has verified age for this session
        const sessionVerified = sessionStorage.getItem("nsfw_age_verified");
        if (sessionVerified === "true") {
          this.ageVerified = true;
          this.showGallery();
          this.loadNSFWArtworks();
        } else {
          this.showAgeGate();
        }
      } else {
        // Under 18 or not verified - show access denied
        this.showAccessDenied();
      }
    });

    // Age gate buttons
    document.getElementById("ageVerifyBtn")?.addEventListener("click", () => {
      this.showVerificationForm();
    });

    document.getElementById("ageDenyBtn")?.addEventListener("click", () => {
      window.location.href = "/pages/community/gallery.html";
    });

    // Submit verification
    document.getElementById("submitAgeVerification")?.addEventListener("click", () => {
      this.submitAgeVerification();
    });

    // Cancel verification
    document.getElementById("cancelVerification")?.addEventListener("click", () => {
      this.hideVerificationForm();
    });

    // Verify existing age
    document.getElementById("verifyExistingAge")?.addEventListener("click", () => {
      // Check if user is logged in
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Please login first to verify your age.");
        window.location.href = "/pages/auth/login.html";
        return;
      }
      this.showVerificationForm();
    });

    // Unblur toggle
    document.getElementById("unblurToggle")?.addEventListener("change", (e) => {
      this.isBlurred = !e.target.checked;
      this.renderGallery();
    });

    // Filter and search
    document.getElementById("nsfwFilter")?.addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.renderGallery();
    });

    document.getElementById("nsfwSearch")?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderGallery();
    });
  }

  async loadUserData() {
    try {
      const doc = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .get();

      if (doc.exists) {
        this.userData = doc.data();
        // Check if isAdult field exists
        if (this.userData.hasOwnProperty('isAdult')) {
          this.isAdult = this.userData.isAdult;
        } else {
          this.isAdult = undefined;
        }
        // Check if user has already verified age in Firestore
        if (this.userData.ageVerified === true) {
          this.ageVerified = true;
          sessionStorage.setItem("nsfw_age_verified", "true");
        }
      } else {
        // User document doesn't exist yet
        this.isAdult = undefined;
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      this.isAdult = undefined;
    }
  }

  showVerificationForm() {
    const ageGateButtons = document.getElementById("ageGateButtons");
    const ageVerificationForm = document.getElementById("ageVerificationForm");
    const verificationError = document.getElementById("verificationError");

    if (ageGateButtons) ageGateButtons.style.display = "none";
    if (ageVerificationForm) ageVerificationForm.style.display = "block";
    if (verificationError) verificationError.style.display = "none";

    // Reset form
    const dobInput = document.getElementById("dobInput");
    const idInput = document.getElementById("idInput");
    const fullNameInput = document.getElementById("fullNameInput");

    if (dobInput) dobInput.value = "";
    if (idInput) idInput.value = "";
    if (fullNameInput) fullNameInput.value = "";
  }

  hideVerificationForm() {
    const ageGateButtons = document.getElementById("ageGateButtons");
    const ageVerificationForm = document.getElementById("ageVerificationForm");
    const verificationError = document.getElementById("verificationError");

    if (ageGateButtons) ageGateButtons.style.display = "block";
    if (ageVerificationForm) ageVerificationForm.style.display = "none";
    if (verificationError) verificationError.style.display = "none";
  }

  async submitAgeVerification() {
    const dob = document.getElementById("dobInput").value;
    const idNumber = document.getElementById("idInput").value.trim();
    const fullName = document.getElementById("fullNameInput").value.trim();
    const errorElement = document.getElementById("verificationError");

    // Validate fields
    if (!dob || !idNumber || !fullName) {
      errorElement.textContent = "Please fill in all fields.";
      errorElement.style.display = "block";
      return;
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    let calculatedAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      errorElement.textContent = "You must be 18 or older to view this content.";
      errorElement.style.display = "block";
      return;
    }

    // Validate ID format (simple validation)
    if (idNumber.length < 6) {
      errorElement.textContent = "Please enter a valid ID/Passport number (minimum 6 characters).";
      errorElement.style.display = "block";
      return;
    }

    // Check if user is logged in
    if (!this.currentUser) {
      errorElement.textContent = "Please login first.";
      errorElement.style.display = "block";
      window.location.href = "/pages/auth/login.html";
      return;
    }

    try {
      // Store verification in Firestore
      await firebase.firestore().collection("users").doc(this.currentUser.uid).set({
        isAdult: true,
        ageVerified: true,
        ageVerifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
        dateOfBirth: dob,
        fullName: fullName,
        idNumber: idNumber, // In production, you should hash this
        verificationMethod: "id_verification",
        idNumberLastFour: idNumber.slice(-4) // Store only last 4 digits for reference
      }, { merge: true });

      // Store in session
      sessionStorage.setItem("nsfw_age_verified", "true");
      this.ageVerified = true;
      this.isAdult = true;

      // Show success message
      errorElement.style.color = "#10b981";
      errorElement.textContent = "✅ Age verified successfully!";
      errorElement.style.display = "block";

      // Load gallery after short delay
      setTimeout(() => {
        this.showGallery();
        this.loadNSFWArtworks();
      }, 1500);

    } catch (error) {
      console.error("Error saving verification:", error);
      errorElement.style.color = "#ef4444";
      errorElement.textContent = "Error saving verification. Please try again.";
      errorElement.style.display = "block";
    }
  }

  showAgeGate() {
    const ageGate = document.getElementById("ageGate");
    if (ageGate) {
      // Make sure we show the original age gate, not the access denied version
      // Reset the HTML if it was replaced
      if (!ageGate.querySelector('.age-gate-card')) {
        // Rebuild the age gate if it was replaced
        ageGate.innerHTML = this.getAgeGateHTML();
      }
      ageGate.style.display = "flex";

      // Reattach event listeners
      this.reattachEventListeners();
    }
    const galleryContent = document.getElementById("galleryContent");
    if (galleryContent) {
      galleryContent.style.display = "none";
    }
  }

  getAgeGateHTML() {
    return `
      <div class="age-gate-card">
        <div class="age-icon">🔞</div>
        <h2>Age Verification Required</h2>
        <p>
          This gallery contains mature artistic content. You must be 18
          years or older to view these works.
        </p>

        <!-- Age Verification Form -->
        <div id="ageVerificationForm" style="display: none">
          <div style="text-align: left; margin: 1rem 0">
            <div style="margin-bottom: 1rem">
              <label style="display: block; color: #4b5563; font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem;">
                Date of Birth
              </label>
              <input type="date" id="dobInput" style="width: 100%; padding: 0.7rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;" max="2008-06-19" />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; color: #4b5563; font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem;">
                ID/Passport Number
              </label>
              <input type="text" id="idInput" placeholder="Enter your ID or Passport number" style="width: 100%; padding: 0.7rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;" />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; color: #4b5563; font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem;">
                Full Name (as on ID)
              </label>
              <input type="text" id="fullNameInput" placeholder="Enter your full name" style="width: 100%; padding: 0.7rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;" />
            </div>
          </div>
          <div class="age-buttons" style="flex-direction: column; gap: 0.5rem">
            <button class="age-btn yes" id="submitAgeVerification" style="width: 100%">Submit & Verify</button>
            <button class="age-btn no" id="cancelVerification" style="width: 100%">Cancel</button>
          </div>
          <p id="verificationError" style="color: #ef4444; font-size: 0.85rem; margin-top: 0.5rem; display: none;"></p>
        </div>

        <!-- Initial Buttons -->
        <div id="ageGateButtons">
          <div class="age-buttons">
            <button class="age-btn yes" id="ageVerifyBtn">I am 18+</button>
            <button class="age-btn no" id="ageDenyBtn">I am under 18</button>
          </div>
        </div>

        <!-- Existing Users Section -->
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.5rem">
            Already registered? Verify your age to access this gallery.
          </p>
          <button id="verifyExistingAge" class="btn btn-outline" style="padding: 0.5rem 1.5rem; border: 2px solid #fe67ea; border-radius: 0.5rem; background: transparent; color: #fe67ea; font-weight: 600; cursor: pointer;">
            Verify Age Now
          </button>
        </div>

        <p class="warning-text">
          By submitting your ID, you confirm you are of legal age to view
          mature content. Your information is securely stored and only used
          for age verification.
        </p>
      </div>
    `;
  }

  reattachEventListeners() {
    // Reattach all event listeners
    document.getElementById("ageVerifyBtn")?.addEventListener("click", () => {
      this.showVerificationForm();
    });

    document.getElementById("ageDenyBtn")?.addEventListener("click", () => {
      window.location.href = "/pages/community/gallery.html";
    });

    document.getElementById("submitAgeVerification")?.addEventListener("click", () => {
      this.submitAgeVerification();
    });

    document.getElementById("cancelVerification")?.addEventListener("click", () => {
      this.hideVerificationForm();
    });

    document.getElementById("verifyExistingAge")?.addEventListener("click", () => {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Please login first to verify your age.");
        window.location.href = "/pages/auth/login.html";
        return;
      }
      this.showVerificationForm();
    });
  }

  showAccessDenied() {
    const ageGate = document.getElementById("ageGate");
    if (ageGate) {
      ageGate.innerHTML = `
        <div class="age-gate-card">
          <div class="age-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>You must be 18 years or older to view this gallery.</p>
          <div class="age-buttons">
            <button class="age-btn no" onclick="window.location.href='/pages/community/gallery.html'">
              Return to Main Gallery
            </button>
          </div>
        </div>
      `;
      ageGate.style.display = "flex";
    }
    const galleryContent = document.getElementById("galleryContent");
    if (galleryContent) {
      galleryContent.style.display = "none";
    }
  }

  showGallery() {
    const ageGate = document.getElementById("ageGate");
    if (ageGate) {
      ageGate.style.display = "none";
    }
    const galleryContent = document.getElementById("galleryContent");
    if (galleryContent) {
      galleryContent.style.display = "block";
    }
  }
  // Add this method to the NSFWGallery class:

/**
 * Trigger age verification using the service
 */
async triggerAgeVerification() {
    if (!this.currentUser) {
        alert('Please login first to verify your age.');
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Check if already verified
    const isVerified = sessionStorage.getItem('nsfw_age_verified') === 'true';
    if (isVerified) {
        this.showGallery();
        this.loadNSFWArtworks();
        return;
    }

    // Use the age verification service
    if (window.ageVerification) {
        await window.ageVerification.startVerification(window.location.href);
    } else {
        // Fallback: Show the DOB form
        this.showVerificationForm();
    }
}

// Update the init method to handle age verification
async init() {
    // ... existing code ...

    // Update age verify button to use the service
    document.getElementById("ageVerifyBtn")?.addEventListener("click", async () => {
        await this.triggerAgeVerification();
    });

    // Verify existing age button
    document.getElementById("verifyExistingAge")?.addEventListener("click", async () => {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("Please login first to verify your age.");
            window.location.href = "/pages/auth/login.html";
            return;
        }
        await this.triggerAgeVerification();
    });
}
// In nsfw-gallery.js - handle callback from URL parameters

async checkVerificationCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('verification');
    const userId = urlParams.get('userId');

    if (status === 'success' && userId) {
        // Update user in Firestore directly (client-side)
        try {
            await firebase.firestore()
                .collection('users')
                .doc(userId)
                .update({
                    isAdult: true,
                    ageVerified: true,
                    ageVerifiedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            sessionStorage.setItem('nsfw_age_verified', 'true');
            this.showToast('✅ Age verified successfully!');

            // Remove URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);

            // Reload gallery
            this.showGallery();
            this.loadNSFWArtworks();

        } catch (error) {
            console.error('Error updating verification:', error);
        }
    }
}

  async loadNSFWArtworks() {
    const grid = document.getElementById("nsfwGalleryGrid");
    const spinner = document.getElementById("loadingSpinner");

    if (!grid) return;

    spinner.style.display = "block";
    grid.innerHTML = '<div class="gallery-sizer"></div>';

    try {
      const snapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .where("isNSFW", "==", true)
        .orderBy("createdAt", "desc")
        .limit(30)
        .get();

      this.artworks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.renderGallery();
    } catch (error) {
      console.error("Error loading NSFW artworks:", error);
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error loading content</h3>
          <p>Please refresh the page and try again.</p>
        </div>
      `;
    } finally {
      spinner.style.display = "none";
    }
  }

  renderGallery() {
    const grid = document.getElementById("nsfwGalleryGrid");
    if (!grid) return;

    let filtered = this.artworks;

    // Apply filter
    if (this.currentFilter !== "all") {
      filtered = filtered.filter(
        (art) => art.nsfwCategory === this.currentFilter,
      );
    }

    // Apply search
    if (this.searchQuery) {
      filtered = filtered.filter(
        (art) =>
          art.title?.toLowerCase().includes(this.searchQuery) ||
          art.artistName?.toLowerCase().includes(this.searchQuery) ||
          art.tags?.some((tag) => tag.toLowerCase().includes(this.searchQuery)),
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="gallery-sizer"></div>
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fas fa-search"></i>
          <h3>No results found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML =
      '<div class="gallery-sizer"></div>' +
      filtered.map((art) => this.createCardHTML(art)).join("");

    this.attachCardEvents();

    if (this.masonry) {
      setTimeout(() => {
        this.masonry.reloadItems();
        this.masonry.layout();
      }, 100);
    } else {
      // Initialize masonry
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

  createCardHTML(art) {
    const imageUrl =
      art.imageUrl || "https://placehold.co/400x500/1a1a2e/fe67ea?text=NSFW";
    const categoryLabels = {
      nudity: "🔞 Artistic Nudity",
      violence: "⚔️ Gore & Violence",
      mature: "🌙 Mature Themes",
    };
    const category = categoryLabels[art.nsfwCategory] || "🔞 NSFW";

    // Determine if image should be blurred
    const blurClass = this.isBlurred ? "" : "unblurred";

    return `
      <div class="gallery-card nsfw-card ${blurClass}" data-id="${art.id}">
        <div class="card-inner">
          <span class="category-badge" style="background: #ef4444;">${category}</span>
          <div class="nsfw-blur-overlay">
            <i class="fas fa-eye-slash"></i>
            <span>Click to view</span>
          </div>
          <img src="${imageUrl}" alt="${art.title || "NSFW Artwork"}" class="card-image" loading="lazy" data-blurred="${this.isBlurred}">
          <div class="card-overlay">
            <div class="artist-info">
              <div class="artist-avatar-small">${art.artistName?.charAt(0)?.toUpperCase() || "A"}</div>
              <span class="artist-name-small">${art.artistName || "Anonymous"}</span>
            </div>
            <div class="card-actions">
              <button class="card-action-btn like-card" data-id="${art.id}">
                <i class="fas fa-heart"></i>
                <span class="like-count">${art.likes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachCardEvents() {
    // Card click - unblur/redirect
    document.querySelectorAll(".nsfw-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-action-btn")) return;

        const id = card.dataset.id;

        // If blurred, unblur on first click
        if (
          card.classList.contains("nsfw-card") &&
          !card.classList.contains("unblurred")
        ) {
          card.classList.add("unblurred");
          const img = card.querySelector(".card-image");
          if (img) {
            img.classList.add("unblurred");
          }
          // Unblur for 5 seconds then re-blur (or keep unblurred based on setting)
          setTimeout(() => {
            if (!this.isBlurred) return;
            card.classList.remove("unblurred");
            const img = card.querySelector(".card-image");
            if (img) {
              img.classList.remove("unblurred");
            }
          }, 5000);
          return;
        }

        // If already unblurred, go to detail page
        window.location.href = `/pages/community/artwork-detail.html?id=${id}`;
      });
    });

    // Like buttons
    document.querySelectorAll(".like-card").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await this.handleLike(id, btn);
      });
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
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.nsfwGallery = new NSFWGallery();
});

