/**
 * Profile Sections - About, Uploads, Liked, Saved, Tutorials, Commission
 * Manages all profile tab content below the hero
 */

class ProfileSections {
  constructor() {
    this.userId = null;
    this.currentUser = null;
    this.userData = null;
    this.isOwnProfile = false;
    this.uploadsPage = 1;
    this.likedPage = 1;
    this.savedPage = 1;
    this.tutorialsPage = 1;
    this.uploadsLimit = 12;
    this.likedLimit = 12;
    this.savedLimit = 12;
    this.tutorialsLimit = 10;
    this.collections = [];
    this.uploads = [];
    this.likedArtworks = [];
    this.savedArtworks = [];
    this.savedTutorials = [];
    this.loadingMore = false;
    this.hasMoreUploads = true;
    this.hasMoreLiked = true;
    this.hasMoreSaved = true;
    this.hasMoreTutorials = true;
    this.cvFile = null;
    this.cvUrl = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    // Get user ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.userId = urlParams.get("user");

    if (!this.userId) {
      console.error("No user ID in URL");
      return;
    }

    // Wait for Firebase auth
    if (typeof firebase === "undefined" || typeof db === "undefined") {
      console.log("Waiting for Firebase...");
      setTimeout(() => this.init(), 500);
      return;
    }

    // Wait for auth and profile hero to load
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      this.isOwnProfile =
        this.currentUser && this.currentUser.uid === this.userId;

      console.log("ProfileSections initialized for:", this.userId);
      console.log("Is own profile:", this.isOwnProfile);

      // Wait for user data to be loaded by profile-enhanced
      await this.waitForUserData();

      // Now load all section data
      await this.loadAllData();

      // Setup event listeners
      this.setupEventListeners();
      this.setupTabNavigation();
      this.setupEndlessScroll();
      this.setupPrivacyToggles();

      // Load challenges and badges
      await this.loadJoinedChallenges();
      await this.loadBadges();

      // Show sections wrapper
      const wrapper = document.getElementById("profileSectionsWrapper");
      if (wrapper) {
        wrapper.style.display = "block";
        wrapper.style.opacity = "1";
      }

      this.initialized = true;
      console.log("ProfileSections fully initialized");
    });
  }

  // Wait for user data from profile-enhanced
  waitForUserData() {
    return new Promise((resolve) => {
      const checkData = () => {
        if (window.profileHero && window.profileHero.userData) {
          this.userData = window.profileHero.userData;
          resolve();
        } else {
          setTimeout(checkData, 100);
        }
      };
      // Also check directly
      if (window.profileHero && window.profileHero.userData) {
        this.userData = window.profileHero.userData;
        resolve();
      } else {
        checkData();
      }
      // Timeout fallback
      setTimeout(resolve, 3000);
    });
  }

  async loadAllData() {
    try {
      // Load all data in parallel
      await Promise.all([
        this.loadAboutData(),
        this.loadCollections(),
        this.loadUploads(true),
        this.loadLikedArtworks(true),
        this.loadSavedArtworks(true),
        this.loadSavedTutorials(true),
        this.loadCommissionData(),
        this.loadBlogPosts(true),
        this.loadBlogCollections(),
      ]);
      console.log("All profile data loaded");
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  }

  // ============================================
  // ABOUT DATA
  // ============================================

  async loadAboutData() {
    // Try to get from userData first
    const aboutData = this.userData?.about || {};

    const fields = {
      aboutBirthday: aboutData.birthday || "",
      aboutStarSign: aboutData.starSign || "",
      aboutMbti: aboutData.mbti || "",
      aboutBook: aboutData.book || "",
      aboutMovie: aboutData.movie || "",
      aboutShow: aboutData.show || "",
      aboutColour: aboutData.colour || "",
      aboutFood: aboutData.food || "",
      aboutHobby: aboutData.hobby || "",
      aboutSong: aboutData.song || "",
      aboutQuote: aboutData.quote || "",
      aboutDislikes: aboutData.dislikes || "",
    };

    Object.keys(fields).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = fields[id] || "";
    });

    // Calculate age and add listener to update in real-time
    const ageEl = document.getElementById("aboutAge");
    const birthdayInput = document.getElementById("aboutBirthday");
    if (aboutData.birthday) {
      const age = this.calculateAge(aboutData.birthday);
      if (ageEl) ageEl.textContent = age !== null ? `${age} years` : "—";
    } else {
      if (ageEl) ageEl.textContent = "—";
    }
    if (birthdayInput) {
      birthdayInput.addEventListener("change", () => {
        if (birthdayInput.value) {
          const age = this.calculateAge(birthdayInput.value);
          if (ageEl) ageEl.textContent = age !== null ? `${age} years` : "—";
        } else {
          if (ageEl) ageEl.textContent = "—";
        }
      });
    }

    // Disable inputs if not own profile
    if (!this.isOwnProfile) {
      document
        .querySelectorAll("#tab-about input, #tab-about textarea")
        .forEach((el) => {
          if (el) el.disabled = true;
        });
      const saveBtn = document.getElementById("saveAboutBtn");
      if (saveBtn) saveBtn.style.display = "none";
    }
  }

  calculateAge(birthday) {
    if (!birthday) return null;
    try {
      const b = new Date(birthday);
      if (isNaN(b.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  }

  async saveAboutData() {
    const aboutData = {
      birthday: document.getElementById("aboutBirthday")?.value || null,
      starSign: document.getElementById("aboutStarSign")?.value?.trim() || "",
      mbti: document.getElementById("aboutMbti")?.value?.trim() || "",
      book: document.getElementById("aboutBook")?.value?.trim() || "",
      movie: document.getElementById("aboutMovie")?.value?.trim() || "",
      show: document.getElementById("aboutShow")?.value?.trim() || "",
      colour: document.getElementById("aboutColour")?.value?.trim() || "",
      food: document.getElementById("aboutFood")?.value?.trim() || "",
      hobby: document.getElementById("aboutHobby")?.value?.trim() || "",
      song: document.getElementById("aboutSong")?.value?.trim() || "",
      quote: document.getElementById("aboutQuote")?.value?.trim() || "",
      dislikes: document.getElementById("aboutDislikes")?.value?.trim() || "",
    };

    try {
      await db.collection("users").doc(this.userId).update({
        about: aboutData,
      });

      if (this.userData) this.userData.about = aboutData;
      this.showToast("About info saved successfully! ✅");

      if (aboutData.birthday) {
        const age = this.calculateAge(aboutData.birthday);
        const ageEl = document.getElementById("aboutAge");
        if (ageEl) ageEl.textContent = age !== null ? `${age} years` : "—";
      }
    } catch (error) {
      console.error("Error saving about data:", error);
      this.showToast("Error saving about info", "error");
    }
  }

  // ============================================
  // COLLECTIONS
  // ============================================

  async loadCollections() {
    if (!this.userId) return;

    try {
      const snapshot = await db
        .collection("users")
        .doc(this.userId)
        .collection("collections")
        .orderBy("createdAt", "desc")
        .get();

      this.collections = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.renderCollections();
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }

  renderCollections() {
    const grid = document.getElementById("collectionsGrid");
    if (!grid) return;

    if (this.collections.length === 0) {
      grid.innerHTML = `
        <div class="collection-card" style="opacity: 0.5; cursor: default;">
          <div class="collection-thumbnail">📁</div>
          <div class="collection-name" style="color: rgba(255,255,255,0.3);">No collections yet</div>
          <div class="collection-count">Create your first collection</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.collections
      .map(
        (col) => `
      <div class="collection-card" data-id="${col.id}">
        <div class="collection-thumbnail">
          ${col.thumbnail ? `<img src="${col.thumbnail}" alt="${col.name}">` : "📁"}
        </div>
        <div class="collection-name">${this.escapeHtml(col.name)}</div>
        <div class="collection-count">${col.artworkIds?.length || 0} artworks</div>
        ${
          this.isOwnProfile
            ? `
          <div class="collection-actions">
            <button class="collection-delete-btn" data-id="${col.id}" title="Delete Collection">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `
            : ""
        }
      </div>
    `,
      )
      .join("");

    // Collection click
    grid.querySelectorAll(".collection-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".collection-actions")) return;
        const id = card.dataset.id;
        this.viewCollection(id);
      });
    });

    // Delete collection
    grid.querySelectorAll(".collection-delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteCollection(id);
      });
    });
  }

  async deleteCollection(collectionId) {
    if (!confirm("Delete this collection?")) return;

    try {
      await db
        .collection("users")
        .doc(this.userId)
        .collection("collections")
        .doc(collectionId)
        .delete();

      this.collections = this.collections.filter((c) => c.id !== collectionId);
      this.renderCollections();
      this.showToast("Collection deleted");
    } catch (error) {
      console.error("Error deleting collection:", error);
      this.showToast("Error deleting collection", "error");
    }
  }

  viewCollection(collectionId) {
    window.location.href = `/pages/community/collection.html?id=${collectionId}&user=${this.userId}`;
  }

  // ============================================
  // UPLOADS
  // ============================================

  async loadUploads(reset = false) {
    if (reset) {
      this.uploads = [];
      this.uploadsPage = 1;
      this.hasMoreUploads = true;
      const grid = document.getElementById("uploadsMasonry");
      if (grid) grid.innerHTML = "";
    }

    if (!this.hasMoreUploads || this.loadingMore) return;

    this.loadingMore = true;
    const loadingEl = document.getElementById("uploadsLoading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
      let query = db
        .collection("artworks")
        .where("artistId", "==", this.userId)
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(this.uploadsLimit);

      if (this.uploads.length > 0) {
        const lastArtwork = this.uploads[this.uploads.length - 1];
        if (lastArtwork.createdAt) {
          query = query.startAfter(lastArtwork.createdAt);
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        this.hasMoreUploads = false;
      } else {
        const newArtworks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.uploads = [...this.uploads, ...newArtworks];
        this.uploadsPage++;
      }

      this.renderUploads();
    } catch (error) {
      console.error("Error loading uploads:", error);
    } finally {
      this.loadingMore = false;
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  renderUploads() {
    const grid = document.getElementById("uploadsMasonry");
    if (!grid) return;

    if (this.uploads.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.3);">
          <i class="fas fa-upload" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p>No artworks uploaded yet</p>
          ${this.isOwnProfile ? `<button onclick="window.location.href='/pages/community/upload.html'" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: linear-gradient(135deg, #fe67ea, #63dbee); border: none; border-radius: 30px; color: white; font-weight: 600; cursor: pointer;">Upload Your First Artwork</button>` : ""}
        </div>
      `;
      return;
    }

    const html = this.uploads
      .map((art) => this.createMasonryItem(art))
      .join("");
    grid.innerHTML = html;
  }

  createMasonryItem(art) {
    const isNSFW = art.isNSFW ? "🔞 " : "";
    return `
      <div class="masonry-item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
        <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" loading="lazy">
        <div class="item-overlay">
          <div class="item-title">${isNSFW}${this.escapeHtml(art.title)}</div>
          <div class="item-meta">❤️ ${art.likes || 0} • 💬 ${art.comments || 0}</div>
        </div>
      </div>
    `;
  }

  // ============================================
  // LIKED ARTWORKS
  // ============================================

  async loadLikedArtworks(reset = false) {
    if (reset) {
      this.likedArtworks = [];
      this.likedPage = 1;
      this.hasMoreLiked = true;
      const grid = document.getElementById("likedMasonry");
      if (grid) grid.innerHTML = "";
    }

    if (!this.hasMoreLiked || this.loadingMore) return;

    this.loadingMore = true;
    const loadingEl = document.getElementById("likedLoading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
      let likesQuery = db
        .collection("likes")
        .where("userId", "==", this.userId)
        .orderBy("createdAt", "desc")
        .limit(this.likedLimit);

      if (this.likedArtworks.length > 0) {
        const lastLike = this.likedArtworks[this.likedArtworks.length - 1];
        if (lastLike.likedAt) {
          likesQuery = likesQuery.startAfter(lastLike.likedAt);
        }
      }

      const likesSnapshot = await likesQuery.get();

      if (likesSnapshot.empty) {
        this.hasMoreLiked = false;
      } else {
        const likeData = likesSnapshot.docs.map((doc) => ({
          likeId: doc.id,
          ...doc.data(),
        }));

        const artworkPromises = likeData.map(async (like) => {
          if (!like.artworkId) return null;
          try {
            const artDoc = await db
              .collection("artworks")
              .doc(like.artworkId)
              .get();
            if (artDoc.exists) {
              return {
                id: artDoc.id,
                ...artDoc.data(),
                likedAt: like.createdAt,
              };
            }
          } catch (e) {
            console.warn("Artwork not found:", like.artworkId);
          }
          return null;
        });

        const artworks = await Promise.all(artworkPromises);
        const validArtworks = artworks.filter((a) => a !== null);

        this.likedArtworks = [...this.likedArtworks, ...validArtworks];
        this.likedPage++;
      }

      this.renderLikedArtworks();
    } catch (error) {
      console.error("Error loading liked artworks:", error);
    } finally {
      this.loadingMore = false;
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  renderLikedArtworks() {
    const grid = document.getElementById("likedMasonry");
    if (!grid) return;

    if (this.likedArtworks.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.3);">
          <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p>No liked artworks yet</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.likedArtworks
      .map((art) => this.createMasonryItem(art))
      .join("");
  }

  // ============================================
  // SAVED ARTWORKS
  // ============================================

  async loadSavedArtworks(reset = false) {
    if (reset) {
      this.savedArtworks = [];
      this.savedPage = 1;
      this.hasMoreSaved = true;
      const grid = document.getElementById("savedMasonry");
      if (grid) grid.innerHTML = "";
    }

    if (!this.hasMoreSaved || this.loadingMore) return;

    this.loadingMore = true;
    const loadingEl = document.getElementById("savedLoading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
      let savesQuery = db
        .collection("users")
        .doc(this.userId)
        .collection("savedArtworks")
        .orderBy("savedAt", "desc")
        .limit(this.savedLimit);

      if (this.savedArtworks.length > 0) {
        const lastSaved = this.savedArtworks[this.savedArtworks.length - 1];
        if (lastSaved.savedAt) {
          savesQuery = savesQuery.startAfter(lastSaved.savedAt);
        }
      }

      const savesSnapshot = await savesQuery.get();

      if (savesSnapshot.empty) {
        this.hasMoreSaved = false;
      } else {
        const saveData = savesSnapshot.docs.map((doc) => ({
          saveId: doc.id,
          ...doc.data(),
        }));

        const artworkPromises = saveData.map(async (save) => {
          if (!save.artworkId) return null;
          try {
            const artDoc = await db
              .collection("artworks")
              .doc(save.artworkId)
              .get();
            if (artDoc.exists) {
              return {
                id: artDoc.id,
                ...artDoc.data(),
                savedAt: save.savedAt,
              };
            }
          } catch (e) {
            console.warn("Artwork not found:", save.artworkId);
          }
          return null;
        });

        const artworks = await Promise.all(artworkPromises);
        const validArtworks = artworks.filter((a) => a !== null);

        this.savedArtworks = [...this.savedArtworks, ...validArtworks];
        this.savedPage++;
      }

      this.renderSavedArtworks();
    } catch (error) {
      console.error("Error loading saved artworks:", error);
    } finally {
      this.loadingMore = false;
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  renderSavedArtworks() {
    const grid = document.getElementById("savedMasonry");
    if (!grid) return;

    if (this.savedArtworks.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.3);">
          <i class="fas fa-bookmark" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p>No saved artworks yet</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.savedArtworks
      .map((art) => this.createMasonryItem(art))
      .join("");
  }

  // ============================================
  // SAVED TUTORIALS
  // ============================================

  async loadSavedTutorials(reset = false) {
    if (reset) {
      this.savedTutorials = [];
      this.tutorialsPage = 1;
      this.hasMoreTutorials = true;
      const grid = document.getElementById("savedTutorialsGrid");
      if (grid) grid.innerHTML = "";
    }

    if (!this.hasMoreTutorials || this.loadingMore) return;

    this.loadingMore = true;
    const loadingEl = document.getElementById("tutorialsLoading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
      let query = db
        .collection("users")
        .doc(this.userId)
        .collection("savedTutorials")
        .orderBy("savedAt", "desc")
        .limit(this.tutorialsLimit);

      if (this.savedTutorials.length > 0) {
        const lastTutorial =
          this.savedTutorials[this.savedTutorials.length - 1];
        if (lastTutorial.savedAt) {
          query = query.startAfter(lastTutorial.savedAt);
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        this.hasMoreTutorials = false;
      } else {
        const tutorials = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.savedTutorials = [...this.savedTutorials, ...tutorials];
        this.tutorialsPage++;
      }

      this.renderSavedTutorials();
    } catch (error) {
      console.error("Error loading saved tutorials:", error);
    } finally {
      this.loadingMore = false;
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  renderSavedTutorials() {
    const grid = document.getElementById("savedTutorialsGrid");
    if (!grid) return;

    if (this.savedTutorials.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.3); grid-column: 1 / -1;">
          <i class="fas fa-graduation-cap" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p>No saved tutorials yet</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.savedTutorials
      .map(
        (tut) => `
      <div class="tutorial-item" onclick="window.location.href='${tut.url || "#"}'">
        <div class="tutorial-icon">${tut.icon || "📚"}</div>
        <div class="tutorial-info">
          <h4>${this.escapeHtml(tut.title)}</h4>
          <p>${this.escapeHtml(tut.source || "Art Mecca")}</p>
        </div>
        ${
          this.isOwnProfile
            ? `
          <button class="tutorial-remove" data-id="${tut.id}" title="Remove">
            <i class="fas fa-times"></i>
          </button>
        `
            : ""
        }
      </div>
    `,
      )
      .join("");

    grid.querySelectorAll(".tutorial-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.removeSavedTutorial(id);
      });
    });
  }

  async removeSavedTutorial(tutorialId) {
    try {
      await db
        .collection("users")
        .doc(this.userId)
        .collection("savedTutorials")
        .doc(tutorialId)
        .delete();

      this.savedTutorials = this.savedTutorials.filter(
        (t) => t.id !== tutorialId,
      );
      this.renderSavedTutorials();
      this.showToast("Tutorial removed");
    } catch (error) {
      console.error("Error removing tutorial:", error);
      this.showToast("Error removing tutorial", "error");
    }
  }
  // ============================================
  // LOAD JOINED CHALLENGES - FIXED
  // ============================================

  // ============================================
  // LOAD JOINED CHALLENGES - WITH REAL DATA
  // ============================================

  async loadJoinedChallenges() {
    const container = document.getElementById("joinedChallengesContainer");
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="empty-challenges">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading challenges...</p>
        </div>
    `;

    try {
      // Get all user challenges from Firestore
      const snapshot = await db
        .collection("userChallenges")
        .where("userId", "==", this.userId)
        .orderBy("joinedAt", "desc")
        .get();

      if (snapshot.empty) {
        container.innerHTML = `
                <div class="empty-challenges">
                    <i class="fas fa-trophy" style="opacity: 0.3;"></i>
                    <p>No challenges joined yet</p>
                    ${this.isOwnProfile ? `<a href="/pages/community/challenges.html" class="btn-challenge">Browse Challenges</a>` : ""}
                </div>
            `;
        return;
      }

      const joinedChallenges = [];
      const challengeIds = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const challengeId = data.challengeId;
        if (challengeId) {
          challengeIds.push(challengeId);
          joinedChallenges.push({
            id: doc.id,
            challengeId: challengeId,
            challengeType: data.challengeType || "daily",
            joinedAt: data.joinedAt?.toDate?.() || new Date(data.joinedAt),
            status: data.status || "active",
          });
        }
      });

      // Get challenge details from Firestore
      const challengeDetails = {};
      if (challengeIds.length > 0) {
        for (const challengeId of challengeIds) {
          try {
            const doc = await db
              .collection("challenges")
              .doc(challengeId)
              .get();
            if (doc.exists) {
              const data = doc.data();
              challengeDetails[challengeId] = {
                title: data.title || challengeId,
                type: data.type || "daily",
                icon: data.icon || "🎯",
                color: data.color || "#8a19e1",
                isIntuit: data.isIntuit || false,
                status: data.status || "active",
                endDate: data.endDate?.toDate?.() || new Date(data.endDate),
                startDate:
                  data.startDate?.toDate?.() || new Date(data.startDate),
                prize: data.prize || "Points + Badge",
                prizeValue: data.prizeValue || 0,
                badge: data.badge || "",
                participants: data.participants || 0,
                submissions: data.submissions || 0,
              };
            } else {
              // Fallback only if challenge truly doesn't exist in Firestore
              challengeDetails[challengeId] = {
                title: challengeId,
                type: challengeId.split("-")[0] || "daily",
                icon: "🎯",
                color: "#8a19e1",
                isIntuit: false,
                status: "active",
                endDate: new Date(Date.now() + 86400000), // 1 day from now
                startDate: new Date(),
                prize: "Points + Badge",
                prizeValue: 0,
                badge: "",
                participants: 0,
                submissions: 0,
              };
            }
          } catch (e) {
            console.warn("Error fetching challenge:", challengeId, e);
          }
        }
      }

      // Render challenges
      if (joinedChallenges.length === 0) {
        container.innerHTML = `
                <div class="empty-challenges">
                    <i class="fas fa-trophy" style="opacity: 0.3;"></i>
                    <p>No challenges joined yet</p>
                    ${this.isOwnProfile ? `<a href="/pages/community/challenges.html" class="btn-challenge">Browse Challenges</a>` : ""}
                </div>
            `;
        return;
      }

      container.innerHTML = joinedChallenges
        .map((jc) => {
          const details = challengeDetails[jc.challengeId];

          // If no details found, skip this challenge
          if (!details) {
            console.warn("No details found for challenge:", jc.challengeId);
            return "";
          }

          const statusClass = jc.status === "active" ? "active" : "completed";
          const statusLabel =
            jc.status === "active" ? "🟢 Active" : "✅ Completed";
          const intuitBadge = details.isIntuit ? " ⚡" : "";
          const dateStr = jc.joinedAt
            ? new Date(jc.joinedAt).toLocaleDateString()
            : "";

          // Calculate time remaining - REAL data from Firestore
          const now = new Date();
          const endDate =
            details.endDate instanceof Date
              ? details.endDate
              : new Date(details.endDate);
          const timeRemaining = endDate - now;

          let timeLeftText = "";
          let timeLeftClass = "";

          if (jc.status === "active") {
            if (timeRemaining > 0) {
              const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
              const hours = Math.floor(
                (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
              );
              const minutes = Math.floor(
                (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
              );

              if (days > 0) {
                timeLeftText = `${days}d ${hours}h left`;
              } else if (hours > 0) {
                timeLeftText = `${hours}h ${minutes}m left`;
              } else {
                timeLeftText = `${minutes}m left`;
              }

              timeLeftClass = days < 2 ? "time-warning" : "time-normal";
            } else {
              // Challenge has ended but status hasn't updated yet
              timeLeftText = "⏰ Ended";
              timeLeftClass = "time-expired";
            }
          } else {
            timeLeftText = "✅ Completed";
            timeLeftClass = "time-completed";
          }

          // Build click handler - goes to challenges page with highlight
          const challengeUrl = `/pages/community/challenges.html?highlight=${encodeURIComponent(jc.challengeId)}`;

          // Get the right icon based on type
          const typeIcon =
            details.icon ||
            (details.type === "daily"
              ? "🌅"
              : details.type === "weekly"
                ? "📅"
                : details.type === "monthly"
                  ? "🌟"
                  : "🏆");

          return `
                <div class="challenge-card-mini"
                     style="border-left: 3px solid ${details.color}; cursor: pointer;"
                     onclick="window.location.href='${challengeUrl}'"
                     title="Click to view challenge details">
                    <div class="challenge-icon">${typeIcon}</div>
                    <div class="challenge-info">
                        <div class="challenge-name">${this.escapeHtml(details.title)}${intuitBadge}</div>
                        <div class="challenge-type">${details.type.charAt(0).toUpperCase() + details.type.slice(1)} • Joined: ${dateStr}</div>
                        <div class="challenge-meta">
                            <span class="challenge-prize">🏆 ${this.escapeHtml(details.prize)}</span>
                            ${details.prizeValue > 0 ? `<span class="challenge-points">⭐ ${details.prizeValue} pts</span>` : ""}
                            ${details.badge ? `<span class="challenge-badge">🏅 ${details.badge.replace(/_/g, " ")}</span>` : ""}
                        </div>
                    </div>
                    <div class="challenge-status-group">
                        <div class="challenge-status ${statusClass}">${statusLabel}</div>
                        <div class="challenge-time ${timeLeftClass}">${timeLeftText}</div>
                        <div class="challenge-stats-mini">
                            <span>👥 ${details.participants || 0}</span>
                            <span>📤 ${details.submissions || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        })
        .filter((html) => html !== "")
        .join("");
    } catch (error) {
      console.error("Error loading joined challenges:", error);
      container.innerHTML = `
            <div class="empty-challenges">
                <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
                <p>Error loading challenges</p>
                <button onclick="window.profileSections.loadJoinedChallenges()" style="margin-top: 0.5rem; padding: 0.3rem 1rem; background: rgba(254,103,234,0.2); border: 1px solid rgba(254,103,234,0.3); border-radius: 20px; color: #fe67ea; cursor: pointer;">Retry</button>
            </div>
        `;
    }
  }

  // ============================================
  // LOAD BADGES
  // ============================================

  async loadBadges() {
    const container = document.getElementById("badgesContainer");
    const countEl = document.getElementById("badgeCount");
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="empty-badges">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading badges...</p>
        </div>
    `;

    try {
      const badges = [];
      const seenBadges = new Set();

      // 1. Get badges from user document
      if (this.userData?.badges) {
        const userBadges = Array.isArray(this.userData.badges)
          ? this.userData.badges
          : [];
        userBadges.forEach((b) => {
          const key = b.name || b.id || "badge";
          if (!seenBadges.has(key)) {
            seenBadges.add(key);
            badges.push({
              id: b.id || `badge-${Date.now()}`,
              name: b.name || "Badge",
              icon: b.icon || "🏅",
              type: b.type || "user",
              earnedAt: b.earnedAt || new Date(),
            });
          }
        });
      }

      // 2. Get challenge winner badges
      const winsSnapshot = await db
        .collection("challengeWinners")
        .where("winnerUserId", "==", this.userId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      winsSnapshot.forEach((doc) => {
        const data = doc.data();
        const badgeName = data.challengeTitle || "Challenge Winner";
        const key = `winner-${data.challengeId}`;
        if (!seenBadges.has(key)) {
          seenBadges.add(key);
          badges.push({
            id: key,
            name: `🏆 ${badgeName}`,
            icon: "🏆",
            type: "winner",
            earnedAt: data.createdAt?.toDate?.() || new Date(),
            challengeId: data.challengeId,
          });
        }
      });

      // 3. Check for completed challenges (submissions that won)
      const completedSnapshot = await db
        .collection("challengeSubmissions")
        .where("userId", "==", this.userId)
        .where("status", "in", ["winner", "runner-up"])
        .get();

      completedSnapshot.forEach((doc) => {
        const data = doc.data();
        const badgeName =
          data.status === "winner" ? "🏆 Winner" : "🥈 Runner-up";
        const key = `submission-${data.challengeId}`;
        if (!seenBadges.has(key)) {
          seenBadges.add(key);
          badges.push({
            id: key,
            name: `${badgeName} - ${data.title || "Challenge"}`,
            icon: data.status === "winner" ? "🏆" : "🥈",
            type: data.status,
            earnedAt: data.submittedAt?.toDate?.() || new Date(),
          });
        }
      });

      // Update badge count
      if (countEl) {
        countEl.textContent = `${badges.length} badge${badges.length !== 1 ? "s" : ""}`;
      }

      if (badges.length === 0) {
        container.innerHTML = `
                <div class="empty-badges">
                    <i class="fas fa-award" style="opacity: 0.3;"></i>
                    <p>No badges earned yet</p>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Complete challenges to earn badges!</span>
                </div>
            `;
        return;
      }

      // Sort by date (newest first)
      badges.sort((a, b) => {
        const dateA =
          a.earnedAt instanceof Date ? a.earnedAt : new Date(a.earnedAt);
        const dateB =
          b.earnedAt instanceof Date ? b.earnedAt : new Date(b.earnedAt);
        return dateB - dateA;
      });

      container.innerHTML = badges
        .map(
          (b) => `
            <div class="badge-item" title="${this.escapeHtml(b.name)}">
                <div class="badge-icon-display">${b.icon}</div>
                <div class="badge-name-display">${this.escapeHtml(b.name)}</div>
                ${b.earnedAt ? `<div class="badge-date">${this.formatDate(b.earnedAt)}</div>` : ""}
            </div>
        `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading badges:", error);
      container.innerHTML = `
            <div class="empty-badges">
                <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
                <p>Error loading badges</p>
                <button onclick="window.profileSections.loadBadges()" style="margin-top: 0.5rem; padding: 0.3rem 1rem; background: rgba(254,103,234,0.2); border: 1px solid rgba(254,103,234,0.3); border-radius: 20px; color: #fe67ea; cursor: pointer;">Retry</button>
            </div>
        `;
    }
  }

  // ============================================
  // FORMAT DATE HELPER
  // ============================================

  formatDate(date) {
    if (!date) return "";
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  }
  // ============================================
  // BLOG POSTS
  // ============================================

  async loadBlogPosts(reset = false) {
    if (reset) {
      this.blogPosts = [];
      this.blogPage = 1;
      this.hasMoreBlog = true;
      const grid = document.getElementById("savedBlogPostsGrid");
      if (grid) grid.innerHTML = "";
    }

    if (!this.hasMoreBlog || this.loadingMore) return;

    this.loadingMore = true;
    const loadingEl = document.getElementById("blogLoading");
    if (loadingEl) loadingEl.style.display = "block";

    try {
      let query = db
        .collection("users")
        .doc(this.userId)
        .collection("savedBlogPosts")
        .orderBy("savedAt", "desc")
        .limit(this.tutorialsLimit);

      if (this.blogPosts && this.blogPosts.length > 0) {
        const lastPost = this.blogPosts[this.blogPosts.length - 1];
        if (lastPost.savedAt) {
          query = query.startAfter(lastPost.savedAt);
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        this.hasMoreBlog = false;
      } else {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (!this.blogPosts) this.blogPosts = [];
        this.blogPosts = [...this.blogPosts, ...posts];
        this.blogPage++;
      }

      this.renderBlogPosts();
    } catch (error) {
      console.error("Error loading blog posts:", error);
    } finally {
      this.loadingMore = false;
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  renderBlogPosts() {
    const grid = document.getElementById("savedBlogPostsGrid");
    if (!grid) return;

    if (!this.blogPosts || this.blogPosts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.3);">
          <i class="fas fa-blog" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <p>No saved blog posts yet</p>
          <p style="font-size: 0.8rem; margin-top: 0.5rem;">Save blog posts from the Equip section to read later</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.blogPosts
      .map(
        (post) => `
      <div class="blog-post-item">
        <div class="blog-post-icon">${post.icon || "📝"}</div>
        <div class="blog-post-info">
          <h4>${this.escapeHtml(post.title)}</h4>
          <p>${this.escapeHtml(post.source || "Art Mecca")} • ${post.collection ? this.escapeHtml(post.collection) : "Read Later"}</p>
        </div>
        <div class="blog-post-actions">
          <button class="blog-post-collection-btn" data-id="${post.id}" title="Move to collection">
            <i class="fas fa-folder"></i>
          </button>
          ${
            this.isOwnProfile
              ? `
            <button class="blog-post-remove" data-id="${post.id}" title="Remove">
              <i class="fas fa-times"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("");

    // Remove blog post
    grid.querySelectorAll(".blog-post-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.removeBlogPost(id);
      });
    });

    // Move to collection
    grid.querySelectorAll(".blog-post-collection-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.moveBlogPostToCollection(id);
      });
    });
  }

  async removeBlogPost(postId) {
    try {
      await db
        .collection("users")
        .doc(this.userId)
        .collection("savedBlogPosts")
        .doc(postId)
        .delete();

      this.blogPosts = this.blogPosts.filter((p) => p.id !== postId);
      this.renderBlogPosts();
      this.showToast("Blog post removed");
    } catch (error) {
      console.error("Error removing blog post:", error);
      this.showToast("Error removing blog post", "error");
    }
  }

  async moveBlogPostToCollection(postId) {
    // Find the post
    const post = this.blogPosts.find((p) => p.id === postId);
    if (!post) return;

    // Get existing collections
    const collections = this.blogCollections || [];

    // Create a simple selection modal
    const collectionNames = collections.map((c) => c.name);
    const currentCollection = post.collection || "Read Later";

    // Use a prompt-like selection
    const selectHTML = `
      <div class="collection-select-modal">
        <h4>Move "${post.title}" to:</h4>
        <select id="collectionSelect">
          <option value="Read Later" ${currentCollection === "Read Later" ? "selected" : ""}>Read Later</option>
          ${collectionNames
            .filter((name) => name !== "Read Later")
            .map(
              (name) =>
                `<option value="${name}" ${currentCollection === name ? "selected" : ""}>${name}</option>`,
            )
            .join("")}
          <option value="__new__">+ Create New Collection</option>
        </select>
        <div id="newCollectionInput" style="display: none; margin-top: 0.5rem;">
          <input type="text" id="newCollectionName" placeholder="Collection name" />
        </div>
      </div>
    `;

    // Create modal overlay
    const modal = document.createElement("div");
    modal.className = "modal-overlay active";
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Move to Collection</h3>
          <button class="modal-close" id="closeMoveModal">&times;</button>
        </div>
        <div class="modal-body">
          ${selectHTML}
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="cancelMoveBtn">Cancel</button>
          <button class="btn btn-primary" id="confirmMoveBtn">Move</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Handle select change
    const select = modal.querySelector("#collectionSelect");
    const newInput = modal.querySelector("#newCollectionInput");
    select.addEventListener("change", () => {
      newInput.style.display = select.value === "__new__" ? "block" : "none";
    });

    // Close handlers
    modal
      .querySelector("#closeMoveModal")
      .addEventListener("click", () => modal.remove());
    modal
      .querySelector("#cancelMoveBtn")
      .addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // Confirm move
    modal
      .querySelector("#confirmMoveBtn")
      .addEventListener("click", async () => {
        let collectionName = select.value;
        if (collectionName === "__new__") {
          collectionName = modal
            .querySelector("#newCollectionName")
            .value.trim();
          if (!collectionName) {
            this.showToast("Please enter a collection name", "error");
            return;
          }
          // Create new blog collection
          await this.createBlogCollection(collectionName);
        }

        try {
          await db
            .collection("users")
            .doc(this.userId)
            .collection("savedBlogPosts")
            .doc(postId)
            .update({
              collection: collectionName,
            });

          post.collection = collectionName;
          this.renderBlogPosts();
          this.renderBlogCollections();
          modal.remove();
          this.showToast(`Moved to "${collectionName}"`);
        } catch (error) {
          console.error("Error moving blog post:", error);
          this.showToast("Error moving blog post", "error");
        }
      });
  }

  // ============================================
  // BLOG COLLECTIONS
  // ============================================

  async loadBlogCollections() {
    if (!this.userId) return;

    try {
      // Get blog collections from Firestore
      const snapshot = await db
        .collection("users")
        .doc(this.userId)
        .collection("blogCollections")
        .orderBy("createdAt", "desc")
        .get();

      this.blogCollections = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ensure "Read Later" exists
      const hasReadLater = this.blogCollections.some(
        (c) => c.name === "Read Later",
      );
      if (!hasReadLater) {
        await this.createBlogCollection("Read Later", true);
        // Reload
        const newSnapshot = await db
          .collection("users")
          .doc(this.userId)
          .collection("blogCollections")
          .orderBy("createdAt", "desc")
          .get();
        this.blogCollections = newSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      this.renderBlogCollections();
    } catch (error) {
      console.error("Error loading blog collections:", error);
    }
  }

  async createBlogCollection(name, silent = false) {
    try {
      const docRef = await db
        .collection("users")
        .doc(this.userId)
        .collection("blogCollections")
        .add({
          name: name,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      if (!silent) {
        await this.loadBlogCollections();
        this.showToast(`Collection "${name}" created!`);
      }
      return docRef;
    } catch (error) {
      console.error("Error creating blog collection:", error);
      if (!silent) this.showToast("Error creating collection", "error");
    }
  }

  renderBlogCollections() {
    const grid = document.getElementById("blogCollectionsGrid");
    if (!grid) return;

    if (!this.blogCollections || this.blogCollections.length === 0) {
      grid.innerHTML = `
        <div class="blog-collection-card" style="opacity: 0.5; cursor: default;">
          <div class="blog-collection-icon">📁</div>
          <div class="blog-collection-name" style="color: rgba(255,255,255,0.3);">No collections yet</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.blogCollections
      .map(
        (col) => `
      <div class="blog-collection-card" data-id="${col.id}">
        <div class="blog-collection-icon">${col.name === "Read Later" ? "📚" : "📁"}</div>
        <div class="blog-collection-name">${this.escapeHtml(col.name)}</div>
        <div class="blog-collection-count">${this.blogPosts?.filter((p) => p.collection === col.name).length || 0} posts</div>
        ${
          this.isOwnProfile && col.name !== "Read Later"
            ? `
          <div class="blog-collection-actions">
            <button class="blog-collection-delete" data-id="${col.id}" title="Delete Collection">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `
            : ""
        }
      </div>
    `,
      )
      .join("");

    // Delete collection
    grid.querySelectorAll(".blog-collection-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteBlogCollection(id);
      });
    });

    // Click to filter posts by collection
    grid.querySelectorAll(".blog-collection-card").forEach((card) => {
      card.addEventListener("click", () => {
        const name = card.querySelector(".blog-collection-name")?.textContent;
        if (name) {
          this.filterBlogPostsByCollection(name);
        }
      });
    });
  }

  async deleteBlogCollection(collectionId) {
    const collection = this.blogCollections.find((c) => c.id === collectionId);
    if (!collection || collection.name === "Read Later") {
      this.showToast("Cannot delete Read Later collection", "error");
      return;
    }

    if (
      !confirm(
        `Delete collection "${collection.name}"? Posts will be moved to "Read Later".`,
      )
    )
      return;

    try {
      // Move all posts in this collection to "Read Later"
      const postsToMove =
        this.blogPosts?.filter((p) => p.collection === collection.name) || [];
      for (const post of postsToMove) {
        await db
          .collection("users")
          .doc(this.userId)
          .collection("savedBlogPosts")
          .doc(post.id)
          .update({ collection: "Read Later" });
      }

      // Delete the collection
      await db
        .collection("users")
        .doc(this.userId)
        .collection("blogCollections")
        .doc(collectionId)
        .delete();

      await this.loadBlogCollections();
      await this.loadBlogPosts(true);
      this.showToast("Collection deleted, posts moved to Read Later");
    } catch (error) {
      console.error("Error deleting blog collection:", error);
      this.showToast("Error deleting collection", "error");
    }
  }

  filterBlogPostsByCollection(collectionName) {
    const grid = document.getElementById("savedBlogPostsGrid");
    if (!grid) return;

    const filtered =
      this.blogPosts?.filter((p) => p.collection === collectionName) || [];
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: rgba(255,255,255,0.3);">
          <p>No posts in "${collectionName}"</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (post) => `
      <div class="blog-post-item">
        <div class="blog-post-icon">${post.icon || "📝"}</div>
        <div class="blog-post-info">
          <h4>${this.escapeHtml(post.title)}</h4>
          <p>${this.escapeHtml(post.source || "Art Mecca")}</p>
        </div>
        <div class="blog-post-actions">
          <button class="blog-post-collection-btn" data-id="${post.id}" title="Move to collection">
            <i class="fas fa-folder"></i>
          </button>
          ${
            this.isOwnProfile
              ? `
            <button class="blog-post-remove" data-id="${post.id}" title="Remove">
              <i class="fas fa-times"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("");

    // Re-attach event listeners
    grid.querySelectorAll(".blog-post-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.removeBlogPost(id);
      });
    });

    grid.querySelectorAll(".blog-post-collection-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.moveBlogPostToCollection(id);
      });
    });
  }

  // ============================================
  // COMMISSION DATA
  // ============================================

  async loadCommissionData() {
    const commission = this.userData?.commission || {};

    const fields = {
      commissionContact: commission.contact || "",
      commissionWebsite: commission.website || "",
      commissionShop: commission.shop || "",
      commissionExperience: commission.experience || "",
      commissionExpertise: commission.expertise || "",
      commissionProjects: commission.projects || "",
      commissionRates: commission.rates || "",
    };

    Object.keys(fields).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = fields[id] || "";
    });

    // CV
    if (commission.cvUrl) {
      this.cvUrl = commission.cvUrl;
      this.showCVPreview(commission.cvName || "CV.pdf");
    }

    // Disable if not own profile
    if (!this.isOwnProfile) {
      document
        .querySelectorAll("#tab-commission input, #tab-commission textarea")
        .forEach((el) => {
          if (el) el.disabled = true;
        });
      const fileInput = document.querySelector(
        '.cv-upload-area input[type="file"]',
      );
      if (fileInput) fileInput.disabled = true;
      const saveBtn = document.getElementById("saveCommissionBtn");
      if (saveBtn) saveBtn.style.display = "none";
    }
  }

  async saveCommissionData() {
    const commissionData = {
      contact:
        document.getElementById("commissionContact")?.value?.trim() || "",
      website:
        document.getElementById("commissionWebsite")?.value?.trim() || "",
      shop: document.getElementById("commissionShop")?.value?.trim() || "",
      experience:
        document.getElementById("commissionExperience")?.value?.trim() || "",
      expertise:
        document.getElementById("commissionExpertise")?.value?.trim() || "",
      projects:
        document.getElementById("commissionProjects")?.value?.trim() || "",
      rates: document.getElementById("commissionRates")?.value?.trim() || "",
      cvUrl: this.cvUrl || null,
      cvName: this.cvFile?.name || null,
    };

    try {
      await db.collection("users").doc(this.userId).update({
        commission: commissionData,
      });

      if (this.userData) this.userData.commission = commissionData;
      this.showToast("Commission info saved successfully! ✅");
    } catch (error) {
      console.error("Error saving commission data:", error);
      this.showToast("Error saving commission info", "error");
    }
  }

  // ============================================
  // CV UPLOAD
  // ============================================

  setupCVUpload() {
    const fileInput = document.getElementById("cvFileInput");
    const dropZone = document.querySelector(".cv-drop-zone");

    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleCVFile(file);
      }
    });

    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#fe67ea";
        dropZone.style.background = "rgba(254, 103, 234, 0.05)";
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "rgba(255, 255, 255, 0.1)";
        dropZone.style.background = "rgba(255, 255, 255, 0.02)";
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "rgba(255, 255, 255, 0.1)";
        dropZone.style.background = "rgba(255, 255, 255, 0.02)";
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleCVFile(files[0]);
        }
      });
    }

    document.getElementById("cvRemoveBtn")?.addEventListener("click", () => {
      this.removeCV();
    });

    document.getElementById("cvDownloadBtn")?.addEventListener("click", () => {
      this.downloadCV();
    });
  }

  async handleCVFile(file) {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      this.showToast("Please upload a PDF, DOC, or DOCX file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast("File must be less than 5MB", "error");
      return;
    }

    this.cvFile = file;

    const loading = document.getElementById("uploadLoading");
    if (loading) {
      loading.style.display = "block";
      loading.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Uploading CV...';
    }

    try {
      const storageRef = firebase.storage().ref();
      const filePath = `cvs/${this.userId}/${Date.now()}_${file.name}`;
      const uploadTask = storageRef.child(filePath).put(file);

      const snapshot = await uploadTask;
      const downloadURL = await snapshot.ref.getDownloadURL();

      this.cvUrl = downloadURL;
      this.showCVPreview(file.name);

      await db.collection("users").doc(this.userId).update({
        "commission.cvUrl": downloadURL,
        "commission.cvName": file.name,
      });

      this.showToast("CV uploaded successfully! ✅");
    } catch (error) {
      console.error("Error uploading CV:", error);
      this.showToast("Error uploading CV", "error");
    } finally {
      if (loading) {
        loading.style.display = "none";
        loading.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      }
    }
  }

  showCVPreview(name) {
    const dropZone = document.querySelector(".cv-drop-zone");
    const preview = document.getElementById("cvPreview");
    const fileName = document.getElementById("cvFileName");

    if (dropZone) dropZone.style.display = "none";
    if (preview) preview.style.display = "flex";
    if (fileName) fileName.textContent = name;
  }

  removeCV() {
    this.cvFile = null;
    this.cvUrl = null;

    const dropZone = document.querySelector(".cv-drop-zone");
    const preview = document.getElementById("cvPreview");

    if (dropZone) dropZone.style.display = "block";
    if (preview) preview.style.display = "none";
    document.getElementById("cvFileInput").value = "";

    db.collection("users")
      .doc(this.userId)
      .update({
        "commission.cvUrl": firebase.firestore.FieldValue.delete(),
        "commission.cvName": firebase.firestore.FieldValue.delete(),
      })
      .catch(console.error);

    this.showToast("CV removed");
  }

  downloadCV() {
    if (this.cvUrl) {
      window.open(this.cvUrl, "_blank");
    }
  }

  // ============================================
  // PRIVACY TOGGLES
  // ============================================

  setupPrivacyToggles() {
    const privacy = this.userData?.privacy || {};

    const likedToggle = document.getElementById("likedPrivacyToggle");
    if (likedToggle) {
      likedToggle.checked = privacy.likedPublic !== false;
      likedToggle.addEventListener("change", () => {
        this.savePrivacySetting("likedPublic", likedToggle.checked);
      });
    }

    const savedToggle = document.getElementById("savedPrivacyToggle");
    if (savedToggle) {
      savedToggle.checked = privacy.savedPublic !== false;
      savedToggle.addEventListener("change", () => {
        this.savePrivacySetting("savedPublic", savedToggle.checked);
      });
    }

    const tutorialsToggle = document.getElementById("tutorialsPrivacyToggle");
    if (tutorialsToggle) {
      tutorialsToggle.checked = privacy.tutorialsPublic !== false;
      tutorialsToggle.addEventListener("change", () => {
        this.savePrivacySetting("tutorialsPublic", tutorialsToggle.checked);
      });
    }
  }

  async savePrivacySetting(key, value) {
    try {
      await db
        .collection("users")
        .doc(this.userId)
        .update({
          [`privacy.${key}`]: value,
        });

      if (!this.userData.privacy) this.userData.privacy = {};
      this.userData.privacy[key] = value;

      this.showToast("Privacy setting updated");
    } catch (error) {
      console.error("Error saving privacy setting:", error);
      this.showToast("Error saving privacy setting", "error");
    }
  }

  // ============================================
  // TAB NAVIGATION
  // ============================================

  setupTabNavigation() {
    const tabs = document.querySelectorAll(".profile-tab");
    const contents = document.querySelectorAll(".profile-tab-content");

    // Add portfolio tab if it doesn't exist
    this.addPortfolioTab();

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        contents.forEach((c) => c.classList.remove("active"));
        const targetContent = document.getElementById(`tab-${target}`);
        if (targetContent) {
          targetContent.classList.add("active");
        }

        // Trigger load for lazy-loaded sections
        if (target === "uploads") {
          this.loadUploads(true);
        } else if (target === "liked") {
          this.loadLikedArtworks(true);
        } else if (target === "saved") {
          this.loadSavedArtworks(true);
        } else if (target === "tutorials") {
          this.loadSavedTutorials(true);
        } else if (target === "challenges") {
          this.loadJoinedChallenges();
        } else if (target === "badges") {
          this.loadBadges();
        }
        // Handle portfolio tab specially
        if (target === "portfolio") {
          this.activatePortfolioMode();
        } else if (target === "profile") {
          this.deactivatePortfolioMode();
        }

        // Trigger load for lazy-loaded sections
        if (target === "uploads") {
          this.loadUploads(true);
        } else if (target === "liked") {
          this.loadLikedArtworks(true);
        } else if (target === "saved") {
          this.loadSavedArtworks(true);
        } else if (target === "tutorials") {
          this.loadSavedTutorials(true);
        } else if (target === "challenges") {
          this.loadJoinedChallenges();
        } else if (target === "badges") {
          this.loadBadges();
        }
      });
    });
  }

  // ============================================
  // PORTFOLIO TAB
  // ============================================

  addPortfolioTab() {
    const tabsContainer = document.getElementById("profileTabs");
    if (!tabsContainer) return;

    // Check if portfolio tab already exists
    if (tabsContainer.querySelector('[data-tab="portfolio"]')) return;

    // Check if this is the user's own profile or portfolio mode
    // Only show for own profile or when viewing someone's portfolio
    if (!this.isOwnProfile) return;

    // Insert portfolio tab before About tab
    const aboutTab = tabsContainer.querySelector('[data-tab="about"]');

    const portfolioTab = document.createElement("button");
    portfolioTab.className = "profile-tab";
    portfolioTab.dataset.tab = "portfolio";
    portfolioTab.innerHTML = '<i class="fas fa-folder-open"></i> Portfolio';

    if (aboutTab) {
      tabsContainer.insertBefore(portfolioTab, aboutTab);
    } else {
      tabsContainer.appendChild(portfolioTab);
    }

    // Add portfolio content
    this.addPortfolioContent();
  }

  // ============================================
  // PORTFOLIO CONTENT
  // ============================================

  addPortfolioContent() {
    const wrapper = document.querySelector(".profile-sections-wrapper");
    if (!wrapper) return;

    // Check if portfolio content already exists
    if (document.getElementById("tab-portfolio")) return;

    // Create portfolio tab content
    const portfolioContent = document.createElement("div");
    portfolioContent.className = "profile-tab-content";
    portfolioContent.id = "tab-portfolio";
    portfolioContent.style.display = "none";

    portfolioContent.innerHTML = `
        <div class="portfolio-mode-container">
            <div class="portfolio-mode-header glass-panel" style="
                padding: 2rem 2.5rem;
                text-align: center;
                margin-bottom: 2rem;
                border-radius: 16px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
            ">
                <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 14px;
                    border-radius: 20px;
                    background: rgba(99, 219, 238, 0.1);
                    border: 1px solid rgba(99, 219, 238, 0.2);
                    color: #63dbee;
                    font-size: 0.6rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 1rem;
                ">
                    <i class="fas fa-folder-open"></i> PORTFOLIO MODE
                </div>

                <h2 style="
                    font-family: var(--font-display);
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                ">
                    Your Art Portfolio
                </h2>

                <p style="
                    color: var(--text-secondary);
                    font-size: 1rem;
                    max-width: 600px;
                    margin: 0 auto 1.5rem;
                    line-height: 1.6;
                ">
                    This is your professional portfolio view. Share this link with
                    clients, galleries, or on social media to showcase your work.
                </p>

                <div style="
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button class="btn-share-portfolio btn-primary" style="
                        padding: 10px 28px;
                        border: none;
                        border-radius: 30px;
                        background: linear-gradient(135deg, #63dbee, #fe67ea);
                        color: white;
                        font-weight: 600;
                        font-size: 0.85rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-share-alt"></i> Share Portfolio
                    </button>
                    <button class="btn-copy-link btn-outline" style="
                        padding: 10px 28px;
                        border: 1px solid var(--border-color);
                        border-radius: 30px;
                        background: var(--bg-card);
                        color: var(--text-primary);
                        font-weight: 600;
                        font-size: 0.85rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                    <button class="btn-switch-to-profile btn-secondary" style="
                        padding: 10px 28px;
                        border: 1px solid var(--border-color);
                        border-radius: 30px;
                        background: transparent;
                        color: var(--text-muted);
                        font-weight: 500;
                        font-size: 0.85rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-arrow-left"></i> Switch to Profile
                    </button>
                </div>
            </div>

            <!-- Portfolio content will be dynamically rendered -->
            <div id="portfolioContentArea">
                <div class="portfolio-loading" style="
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-muted);
                ">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; display: block; margin-bottom: 1rem;"></i>
                    <p>Loading portfolio...</p>
                </div>
            </div>
        </div>
    `;

    wrapper.appendChild(portfolioContent);

    // Add event listeners for the portfolio buttons
    setTimeout(() => {
      const shareBtn = portfolioContent.querySelector(".btn-share-portfolio");
      const copyBtn = portfolioContent.querySelector(".btn-copy-link");
      const switchBtn = portfolioContent.querySelector(
        ".btn-switch-to-profile",
      );

      if (shareBtn) {
        shareBtn.addEventListener("click", () => this.sharePortfolio());
      }
      if (copyBtn) {
        copyBtn.addEventListener("click", () => this.copyPortfolioLink());
      }
      if (switchBtn) {
        switchBtn.addEventListener("click", () => this.switchToProfileMode());
      }

      // Render portfolio content
      this.renderPortfolioContent();
    }, 100);
  }

  // ============================================
  // RENDER PORTFOLIO CONTENT
  // ============================================

  async renderPortfolioContent() {
    const area = document.getElementById("portfolioContentArea");
    if (!area) return;

    try {
      // Get user's artworks
      const snapshot = await db
        .collection("artworks")
        .where("artistId", "==", this.userId)
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const artworks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const user = this.userData || {};
      const badge = user.badge || {};
      const commission = user.commission || {};

      const typeLabels = {
        digital: "🎨 Digital Artist",
        traditional: "🖌️ Traditional Artist",
        mixed: "🎭 Mixed Media Artist",
        "3d": "🧊 3D Artist",
        photography: "📷 Photographer",
        animation: "🎬 Animator",
      };

      // Build portfolio HTML
      let html = `
            <div class="portfolio-content">
                <!-- Artist Info -->
                <div class="portfolio-artist-info glass-panel" style="
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    display: flex;
                    gap: 2rem;
                    align-items: flex-start;
                    flex-wrap: wrap;
                ">
                    <div style="flex: 1; min-width: 200px;">
                        <h3 style="
                            font-family: var(--font-display);
                            font-size: 1.2rem;
                            font-weight: 700;
                            color: var(--text-primary);
                            margin-bottom: 0.25rem;
                        ">${this.escapeHtml(user.fullname || "Artist")}</h3>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">@${this.escapeHtml(user.username || "artist")}</p>
                        ${
                          badge.artistType
                            ? `
                            <span style="
                                display: inline-block;
                                padding: 2px 12px;
                                border-radius: 12px;
                                background: rgba(254, 103, 234, 0.1);
                                color: #fe67ea;
                                font-size: 0.75rem;
                                font-weight: 600;
                                margin-top: 4px;
                            ">${typeLabels[badge.artistType] || badge.artistType}</span>
                        `
                            : ""
                        }
                        ${
                          user.bio
                            ? `
                            <p style="
                                color: var(--text-secondary);
                                font-size: 0.9rem;
                                line-height: 1.6;
                                margin-top: 0.75rem;
                            ">${this.escapeHtml(user.bio)}</p>
                        `
                            : ""
                        }
                    </div>
                    <div style="
                        display: flex;
                        gap: 2rem;
                        flex-wrap: wrap;
                    ">
                        <div>
                            <div style="
                                font-family: var(--font-display);
                                font-size: 1.5rem;
                                font-weight: 700;
                                color: var(--text-primary);
                            ">${artworks.length}</div>
                            <div style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Artworks</div>
                        </div>
                        ${
                          commission.rates
                            ? `
                            <div>
                                <div style="
                                    font-family: var(--font-display);
                                    font-size: 1rem;
                                    font-weight: 700;
                                    color: #63dbee;
                                ">${this.escapeHtml(commission.rates)}</div>
                                <div style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Rates</div>
                            </div>
                        `
                            : ""
                        }
                        ${
                          commission.contact
                            ? `
                            <div>
                                <div style="
                                    font-family: var(--font-display);
                                    font-size: 0.85rem;
                                    font-weight: 700;
                                    color: #4ff3a6;
                                ">${this.escapeHtml(commission.contact)}</div>
                                <div style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Contact</div>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>

                <!-- Artworks Gallery -->
                <div class="portfolio-gallery">
                    <h4 style="
                        font-family: var(--font-display);
                        font-size: 1rem;
                        font-weight: 700;
                        color: var(--text-primary);
                        margin-bottom: 1rem;
                        letter-spacing: 1px;
                    ">✦ Artworks</h4>
                    <div class="portfolio-artwork-grid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                        gap: 1.5rem;
                    ">
        `;

      if (artworks.length === 0) {
        html += `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-muted);
                ">
                    <i class="fas fa-paint-brush" style="font-size: 2rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No artworks uploaded yet</p>
                </div>
            `;
      } else {
        artworks.forEach((art) => {
          const isNSFW = art.isNSFW ? "🔞 " : "";
          html += `
                    <div class="portfolio-artwork-item" style="
                        border-radius: 8px;
                        overflow: hidden;
                        background: var(--bg-card);
                        border: 1px solid var(--border-color);
                        transition: all 0.3s ease;
                        cursor: pointer;
                    " onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
                        <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" loading="lazy" style="
                            width: 100%;
                            aspect-ratio: 1/1;
                            object-fit: cover;
                            display: block;
                        ">
                        <div style="padding: 0.75rem 1rem;">
                            <div style="
                                font-weight: 600;
                                color: var(--text-primary);
                                font-size: 0.85rem;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${isNSFW}${this.escapeHtml(art.title)}</div>
                            <div style="
                                color: var(--text-muted);
                                font-size: 0.7rem;
                                display: flex;
                                gap: 12px;
                                margin-top: 4px;
                            ">
                                <span><i class="fas fa-heart" style="color: #fe67ea;"></i> ${art.likes || 0}</span>
                                <span><i class="fas fa-eye"></i> ${art.views || 0}</span>
                            </div>
                        </div>
                    </div>
                `;
        });
      }

      html += `
                    </div>
                </div>
            </div>
        `;

      area.innerHTML = html;
    } catch (error) {
      console.error("Error rendering portfolio:", error);
      area.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 1rem; color: #ef4444;"></i>
                <p>Error loading portfolio</p>
                <button onclick="window.profileSections.renderPortfolioContent()" style="
                    margin-top: 0.5rem;
                    padding: 0.5rem 1.5rem;
                    background: rgba(254, 103, 234, 0.2);
                    border: 1px solid rgba(254, 103, 234, 0.3);
                    border-radius: 20px;
                    color: #fe67ea;
                    cursor: pointer;
                ">Retry</button>
            </div>
        `;
    }
  }

  // ============================================
  // PORTFOLIO MODE HELPERS
  // ============================================

  activatePortfolioMode() {
    // Hide non-portfolio tabs
    const tabs = document.querySelectorAll(".profile-tab");
    const tabsToHide = [
      "liked",
      "saved",
      "tutorials",
      "challenges",
      "badges",
      "blog",
      "commission",
    ];
    tabs.forEach((tab) => {
      const tabId = tab.dataset.tab;
      if (tabsToHide.includes(tabId)) {
        tab.style.display = "none";
      } else if (tabId === "about" || tabId === "uploads") {
        tab.style.display = "flex";
      }
    });

    // Hide social sidebar
    const sidebar = document.querySelector(".hero-right-sidebar");
    if (sidebar) {
      const iconsToHide = [
        "message",
        "block",
        "cv",
        "edit",
        "notifications",
        "settings",
      ];
      const icons = sidebar.querySelectorAll(".sidebar-icon");
      icons.forEach((icon) => {
        const action = icon.dataset.action;
        if (iconsToHide.includes(action)) {
          icon.style.display = "none";
        }
      });
    }

    // Hide Shadow button
    const shadowBtn = document.querySelector(".hero-shadow-btn");
    if (shadowBtn) shadowBtn.style.display = "none";

    // Hide layer controls
    const layerControls = document.querySelector(".layer-controls-container");
    if (layerControls) layerControls.style.display = "none";

    // Show portfolio badge in hero
    const badgesContainer = document.querySelector(".hero-badges");
    if (badgesContainer) {
      let portfolioBadge = badgesContainer.querySelector(
        ".hero-badge.portfolio",
      );
      if (!portfolioBadge) {
        portfolioBadge = document.createElement("span");
        portfolioBadge.className = "hero-badge portfolio";
        portfolioBadge.innerHTML =
          '<i class="fas fa-folder-open"></i> Portfolio';
        portfolioBadge.style.cssText = `
                background: rgba(99, 219, 238, 0.2);
                border-color: #63dbee;
                color: #63dbee;
            `;
        badgesContainer.appendChild(portfolioBadge);
      }
    }
  }

  deactivatePortfolioMode() {
    // Show all tabs again
    const tabs = document.querySelectorAll(".profile-tab");
    tabs.forEach((tab) => {
      tab.style.display = "flex";
    });

    // Show social sidebar icons again
    const sidebar = document.querySelector(".hero-right-sidebar");
    if (sidebar) {
      const icons = sidebar.querySelectorAll(".sidebar-icon");
      icons.forEach((icon) => {
        icon.style.display = "flex";
      });
    }

    // Show Shadow button
    const shadowBtn = document.querySelector(".hero-shadow-btn");
    if (shadowBtn) shadowBtn.style.display = "flex";

    // Show layer controls
    const layerControls = document.querySelector(".layer-controls-container");
    if (layerControls) layerControls.style.display = "flex";

    // Remove portfolio badge
    const badgesContainer = document.querySelector(".hero-badges");
    if (badgesContainer) {
      const portfolioBadge = badgesContainer.querySelector(
        ".hero-badge.portfolio",
      );
      if (portfolioBadge) portfolioBadge.remove();
    }

    // Switch back to about tab
    const aboutTab = document.querySelector('[data-tab="about"]');
    if (aboutTab) aboutTab.click();
  }

  switchToProfileMode() {
    const profileTab = document.querySelector('[data-tab="profile"]');
    if (profileTab) {
      profileTab.click();
    } else {
      // Fallback: reload page without mode
      const url = new URL(window.location.href);
      url.searchParams.delete("mode");
      window.location.href = url.toString();
    }
  }

  sharePortfolio() {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `${this.userData?.fullname || "Artist"}'s Portfolio`,
          text: `Check out ${this.userData?.fullname || "Artist"}'s art portfolio on Art Mecca!`,
          url: url,
        })
        .catch(() => {});
    } else {
      this.copyPortfolioLink();
    }
  }

  copyPortfolioLink() {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.showToast("📋 Portfolio link copied to clipboard!");
      })
      .catch(() => {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        this.showToast("📋 Portfolio link copied to clipboard!");
      });
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
            max-width: 90%;
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

  // ============================================
  // ENDLESS SCROLL
  // ============================================

  setupEndlessScroll() {
    const triggers = [
      { id: "uploadsScrollTrigger", load: () => this.loadUploads(false) },
      { id: "likedScrollTrigger", load: () => this.loadLikedArtworks(false) },
      { id: "savedScrollTrigger", load: () => this.loadSavedArtworks(false) },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const trigger = triggers.find((t) => t.id === entry.target.id);
            if (trigger) {
              trigger.load();
            }
          }
        });
      },
      { threshold: 0.1 },
    );

    triggers.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners() {
    document.getElementById("saveAboutBtn")?.addEventListener("click", () => {
      this.saveAboutData();
    });

    document
      .getElementById("saveCommissionBtn")
      ?.addEventListener("click", () => {
        this.saveCommissionData();
      });

    this.setupCVUpload();

    document
      .getElementById("floatingUploadBtn")
      ?.addEventListener("click", () => {
        this.openUploadModal();
      });

    document
      .getElementById("newCollectionBtn")
      ?.addEventListener("click", () => {
        this.openCollectionModal();
      });

    document
      .getElementById("viewAllUploadsBtn")
      ?.addEventListener("click", () => {
        window.location.href = `/pages/community/gallery.html?user=${this.userId}`;
      });

    document
      .getElementById("closeCollectionModal")
      ?.addEventListener("click", () => {
        this.closeCollectionModal();
      });
    document
      .getElementById("cancelCollectionBtn")
      ?.addEventListener("click", () => {
        this.closeCollectionModal();
      });
    document
      .getElementById("saveCollectionBtn")
      ?.addEventListener("click", () => {
        this.saveCollection();
      });
    // Blog Collection
    document
      .getElementById("newBlogCollectionBtn")
      ?.addEventListener("click", async () => {
        const name = prompt("Enter collection name:");
        if (name && name.trim()) {
          await this.createBlogCollection(name.trim());
        }
      });

    // Upload Modal
    document
      .getElementById("floatingUploadBtn")
      ?.addEventListener("click", () => {
        this.openUploadModal();
      });

    document
      .getElementById("closeUploadModal")
      ?.addEventListener("click", () => {
        this.closeUploadModal();
      });
    document
      .getElementById("cancelUploadBtn")
      ?.addEventListener("click", () => {
        this.closeUploadModal();
      });
    document
      .getElementById("submitUploadBtn")
      ?.addEventListener("click", () => {
        this.submitUploadModal();
      });

    // Upload Modal - File handling
    this.setupUploadModal();

    // Blog Privacy Toggle
    const blogToggle = document.getElementById("blogPrivacyToggle");
    if (blogToggle) {
      blogToggle.checked = this.userData?.privacy?.blogPublic !== false;
      blogToggle.addEventListener("change", () => {
        this.savePrivacySetting("blogPublic", blogToggle.checked);
      });
    }
  }

  // ============================================
  // UPLOAD MODAL
  // ============================================

  setupUploadModal() {
    const fileInput = document.getElementById("uploadModalFile");
    const dropZone = document.getElementById("uploadDropZone");
    const preview = document.getElementById("uploadModalPreview");
    const previewImg = document.getElementById("uploadModalPreviewImg");
    const removeBtn = document.getElementById("removeUploadPreview");
    const nsfwToggle = document.getElementById("uploadModalNSFW");

    if (!fileInput) return;

    // File input change
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleUploadFile(file);
      }
    });

    // Drag and drop
    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleUploadFile(files[0]);
        }
      });
    }

    // Remove preview
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        this.uploadModalFile = null;
        preview.style.display = "none";
        dropZone.querySelector(".upload-placeholder").style.display = "block";
        fileInput.value = "";
        document.getElementById("uploadModalPreviewImg").src = "";
      });
    }

    // NSFW toggle
    if (nsfwToggle) {
      nsfwToggle.addEventListener("change", () => {
        const categoryGroup = document.getElementById(
          "uploadModalNSFWCategory",
        );
        if (categoryGroup) {
          categoryGroup.style.display = nsfwToggle.checked ? "block" : "none";
        }
      });
    }

    // Tags input
    const tagsInput = document.getElementById("uploadModalTags");
    if (tagsInput) {
      this.uploadModalTags = [];
      tagsInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const tag = tagsInput.value.trim();
          if (tag && this.uploadModalTags.length < 10) {
            if (!this.uploadModalTags.includes(tag)) {
              this.uploadModalTags.push(tag);
              this.renderUploadModalTags();
              tagsInput.value = "";
            }
          }
        }
      });
    }
  }

  renderUploadModalTags() {
    const display = document.getElementById("uploadModalTagsDisplay");
    if (!display) return;

    display.innerHTML = this.uploadModalTags
      .map(
        (tag, index) => `
      <span class="tag">
        ${tag}
        <button type="button" class="tag-remove" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      </span>
    `,
      )
      .join("");

    display.querySelectorAll(".tag-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        this.uploadModalTags.splice(index, 1);
        this.renderUploadModalTags();
      });
    });
  }

  handleUploadFile(file) {
    if (!file.type.startsWith("image/")) {
      this.showToast("Please upload an image file", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showToast("File must be less than 10MB", "error");
      return;
    }

    this.uploadModalFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById("uploadModalPreview");
      const previewImg = document.getElementById("uploadModalPreviewImg");
      const placeholder = document.querySelector(".upload-placeholder");

      previewImg.src = e.target.result;
      preview.style.display = "block";
      if (placeholder) placeholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  openUploadModal() {
    // Reset form
    this.uploadModalFile = null;
    this.uploadModalTags = [];
    document.getElementById("uploadModalTitle").value = "";
    document.getElementById("uploadModalDescription").value = "";
    document.getElementById("uploadModalSoftware").value = "";
    document.getElementById("uploadModalTags").value = "";
    document.getElementById("uploadModalNSFW").checked = false;
    document.getElementById("uploadModalNSFWCategory").style.display = "none";
    document.getElementById("uploadModalTagsDisplay").innerHTML = "";
    document.getElementById("uploadModalPreview").style.display = "none";
    document.querySelector(".upload-placeholder").style.display = "block";
    document.getElementById("uploadModalFile").value = "";

    document.getElementById("uploadModal").classList.add("active");
  }

  closeUploadModal() {
    document.getElementById("uploadModal").classList.remove("active");
  }

  async submitUploadModal() {
    const title = document.getElementById("uploadModalTitle").value.trim();
    if (!title) {
      this.showToast("Please enter a title", "error");
      return;
    }

    if (!this.uploadModalFile) {
      this.showToast("Please select an artwork file", "error");
      return;
    }

    const description = document
      .getElementById("uploadModalDescription")
      .value.trim();
    const category = document.getElementById("uploadModalCategory").value;
    const software = document
      .getElementById("uploadModalSoftware")
      .value.trim();
    const tags = this.uploadModalTags || [];
    const isNSFW = document.getElementById("uploadModalNSFW").checked;
    const nsfwCategory = document.getElementById(
      "uploadModalNSFWCategorySelect",
    ).value;

    const submitBtn = document.getElementById("submitUploadBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    try {
      // Use the existing artwork manager
      if (window.artworkManager) {
        const result = await window.artworkManager.uploadArtwork({
          file: this.uploadModalFile,
          title: title,
          description: description,
          category: category,
          software: software,
          tags: tags,
          challenge: null,
          isNSFW: isNSFW,
          nsfwCategory: isNSFW ? nsfwCategory : null,
        });

        this.closeUploadModal();
        this.showToast("Artwork uploaded successfully! 🎉");

        // Refresh uploads
        setTimeout(() => {
          this.loadUploads(true);
        }, 500);
      } else {
        throw new Error("Artwork manager not available");
      }
    } catch (error) {
      console.error("Upload error:", error);
      this.showToast(error.message || "Error uploading artwork", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  // ============================================
  // COLLECTION MODAL
  // ============================================

  async openCollectionModal() {
    const modal = document.getElementById("collectionModal");
    if (!modal) return;

    const selectArea = document.getElementById("collectionArtworkSelect");
    if (selectArea) {
      try {
        const snapshot = await db
          .collection("artworks")
          .where("artistId", "==", this.userId)
          .where("status", "==", "published")
          .orderBy("createdAt", "desc")
          .limit(20)
          .get();

        const artworks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        selectArea.innerHTML = artworks
          .map(
            (art) => `
          <label class="artwork-checkbox">
            <input type="checkbox" value="${art.id}">
            <img src="${art.imageUrl}" alt="${art.title}">
            <span>${this.escapeHtml(art.title)}</span>
          </label>
        `,
          )
          .join("");
      } catch (error) {
        console.error("Error loading artworks for collection:", error);
        selectArea.innerHTML =
          '<p style="color: rgba(255,255,255,0.3);">No artworks found</p>';
      }
    }

    document.getElementById("collectionName").value = "";
    document.getElementById("collectionDescription").value = "";
    modal.classList.add("active");
  }

  closeCollectionModal() {
    document.getElementById("collectionModal")?.classList.remove("active");
  }

  async saveCollection() {
    const name = document.getElementById("collectionName")?.value?.trim() || "";
    const description =
      document.getElementById("collectionDescription")?.value?.trim() || "";

    if (!name) {
      this.showToast("Please enter a collection name", "error");
      return;
    }

    const selectedCheckboxes = document.querySelectorAll(
      '#collectionArtworkSelect input[type="checkbox"]:checked',
    );
    const artworkIds = Array.from(selectedCheckboxes).map((cb) => cb.value);

    try {
      await db
        .collection("users")
        .doc(this.userId)
        .collection("collections")
        .add({
          name: name,
          description: description,
          artworkIds: artworkIds,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      this.closeCollectionModal();
      await this.loadCollections();
      this.showToast("Collection created! ✅");
    } catch (error) {
      console.error("Error creating collection:", error);
      this.showToast("Error creating collection", "error");
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
        max-width: 90%;
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
}

// Initialize after DOM is ready and profileHero is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, waiting for ProfileSections...");

  // Wait for profileHero to be ready
  const checkHero = () => {
    if (window.profileHero && window.profileHero.userData) {
      console.log("ProfileHero ready, initializing ProfileSections...");
      window.profileSections = new ProfileSections();
    } else {
      setTimeout(checkHero, 200);
    }
  };

  // Start checking after a short delay
  setTimeout(checkHero, 500);

  // Fallback: initialize anyway after 3 seconds
  setTimeout(() => {
    if (!window.profileSections) {
      console.log("Fallback: initializing ProfileSections...");
      window.profileSections = new ProfileSections();
    }
  }, 3000);
});
