/**
 * Upload Page - Full functionality with multi-file, video support, and challenge integration
 */

class UploadManager {
  constructor() {
    this.selectedFiles = [];
    this.tags = [];
    this.isNSFW = false;
    this.currentUser = null;
    this.userData = null;
    this.activeChallenges = [];
    this.uploading = false;
    this.init();
  }

  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;

      if (!user) {
        sessionStorage.setItem(
          "redirectAfterLogin",
          "pages/community/upload.html",
        );
        window.location.href = "pages/auth/login.html";
        return;
      }

      await this.loadUserData();
      await this.loadChallenges();
      this.setupEventListeners();
      this.setupDragAndDrop();
      this.setupNSFWToggle();
      this.setupThemeToggle();
      this.updateUserPreview();
    });
  }

  // ============================================
  // LOAD DATA
  // ============================================

  async loadUserData() {
    try {
      const doc = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .get();

      if (doc.exists) {
        this.userData = doc.data();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  // ============================================
  // LOAD CHALLENGES - FROM LOCAL CHALLENGES.JS
  // ============================================

  async loadChallenges() {
    try {
      // Wait a moment for challenges.js to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to get challenges from the global ChallengesSystem instance
      let challenges = [];

      // Check if challenges are available from the ChallengesSystem
      if (window.challengesSystem) {
        console.log("📋 Loading challenges from ChallengesSystem...");
        challenges = window.challengesSystem.challenges || [];
        console.log(
          `✅ Found ${challenges.length} challenges from ChallengesSystem`,
        );
      }
      // Fallback: check if challenges are stored in window
      else if (window.allChallenges) {
        console.log("📋 Loading challenges from window.allChallenges...");
        challenges = window.allChallenges;
        console.log(
          `✅ Found ${challenges.length} challenges from window.allChallenges`,
        );
      }
      // Last resort: try to get from Firestore
      else {
        console.log("📋 Loading challenges from Firestore...");
        const snapshot = await firebase
          .firestore()
          .collection("challenges")
          .where("status", "==", "active")
          .get();

        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            const data = doc.data();
            challenges.push({
              id: doc.id,
              ...data,
              startDate: data.startDate?.toDate?.() || new Date(data.startDate),
              endDate: data.endDate?.toDate?.() || new Date(data.endDate),
            });
          });
        }
        console.log(`✅ Found ${challenges.length} challenges from Firestore`);
      }

      // Filter to only active challenges
      this.activeChallenges = challenges.filter((c) => c.status === "active");
      console.log(
        `📊 ${this.activeChallenges.length} active challenges loaded`,
      );

      // Populate the select dropdown
      this.populateChallengeSelect();

      // Populate the modal challenge list
      this.populateChallengeModal();
    } catch (error) {
      console.error("Error loading challenges:", error);
      // Show empty state
      const select = document.getElementById("selected-challenge");
      if (select) {
        select.innerHTML = '<option value="">No challenges available</option>';
      }
    }
  }

  // ============================================
  // POPULATE CHALLENGE SELECT DROPDOWN
  // ============================================

  populateChallengeSelect() {
    const select = document.getElementById("selected-challenge");
    if (!select) return;

    select.innerHTML = '<option value="">Select a challenge</option>';

    if (this.activeChallenges.length === 0) {
      select.innerHTML +=
        '<option value="" disabled>No active challenges</option>';
      return;
    }

    // Group challenges by type
    const grouped = {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };

    this.activeChallenges.forEach((challenge) => {
      const type = challenge.type || "daily";
      if (grouped[type]) {
        grouped[type].push(challenge);
      } else {
        grouped.daily.push(challenge);
      }
    });

    // Add grouped options with optgroups
    const typeLabels = {
      daily: "⚡ Daily Challenges",
      weekly: "📅 Weekly Challenges",
      monthly: "🌟 Monthly Challenges",
      yearly: "🏆 Yearly Challenges",
    };

    Object.keys(grouped).forEach((type) => {
      const challenges = grouped[type];
      if (challenges.length === 0) return;

      const optgroup = document.createElement("optgroup");
      optgroup.label =
        typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);

      challenges.forEach((challenge) => {
        const option = document.createElement("option");
        option.value = challenge.id;
        const intuitLabel = challenge.isIntuit ? " ⚡Intuit" : "";
        const title = challenge.title || "Untitled";
        option.textContent = `${title}${intuitLabel}`;
        option.dataset.type = type;
        option.dataset.prize = challenge.prize || "";
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });
  }

  // ============================================
  // POPULATE CHALLENGE MODAL
  // ============================================

  populateChallengeModal() {
    const modalList = document.getElementById("challenge-modal-list");
    if (!modalList) return;

    if (this.activeChallenges.length === 0) {
      modalList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fas fa-trophy" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
          <p>No active challenges at the moment.</p>
          <p style="font-size: 0.85rem;">Check back later for new challenges!</p>
        </div>
      `;
      return;
    }

    // Group by type
    const grouped = {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };

    this.activeChallenges.forEach((challenge) => {
      const type = challenge.type || "daily";
      if (grouped[type]) {
        grouped[type].push(challenge);
      } else {
        grouped.daily.push(challenge);
      }
    });

    const typeColors = {
      daily: "#ff38e4",
      weekly: "#4cd6eb",
      monthly: "#8c35e9",
      yearly: "#f59e0b",
    };

    const typeIcons = {
      daily: "⚡",
      weekly: "📅",
      monthly: "🌟",
      yearly: "🏆",
    };

    let html = "";

    Object.keys(grouped).forEach((type) => {
      const challenges = grouped[type];
      if (challenges.length === 0) return;

      const color = typeColors[type] || "#8a19e1";
      const icon = typeIcons[type] || "📌";
      const label = type.charAt(0).toUpperCase() + type.slice(1);

      html += `
        <div style="margin-bottom: 1rem;">
          <h4 style="color: ${color}; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>${icon}</span> ${label} Challenges
            <span style="font-weight: 400; color: var(--text-muted); font-size: 0.7rem;">(${challenges.length})</span>
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
      `;

      challenges.forEach((challenge) => {
        const isIntuit = challenge.isIntuit ? " ⚡Intuit" : "";
        const prize = challenge.prize
          ? challenge.prize.substring(0, 40) +
            (challenge.prize.length > 40 ? "..." : "")
          : "";

        html += `
          <div class="challenge-modal-item"
               style="display: flex; align-items: center; justify-content: space-between;
                      padding: 0.5rem 0.75rem; background: rgba(138, 25, 225, 0.04);
                      border-radius: 0.5rem; border-left: 3px solid ${color};
                      cursor: pointer; transition: all 0.3s ease;"
               data-challenge-id="${challenge.id}"
               onclick="window.uploadManager.selectChallenge('${challenge.id}')">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <span style="font-size: 1.1rem;">${challenge.icon || "🎨"}</span>
              <div style="min-width: 0;">
                <div style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${challenge.title}${isIntuit}
                </div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">
                  ${prize || "No prize listed"}
                </div>
              </div>
            </div>
            <button type="button"
                    style="padding: 0.2rem 0.8rem; background: ${color}; border: none; border-radius: 20px;
                           color: white; font-size: 0.65rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;"
                    onclick="event.stopPropagation(); window.uploadManager.selectChallenge('${challenge.id}')">
              Select
            </button>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    modalList.innerHTML = html;

    // Add hover effects
    modalList.querySelectorAll(".challenge-modal-item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        item.style.background = "rgba(138, 25, 225, 0.1)";
        item.style.transform = "translateX(4px)";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "rgba(138, 25, 225, 0.04)";
        item.style.transform = "translateX(0)";
      });
    });
  }

  // ============================================
  // SELECT CHALLENGE - From modal
  // ============================================

  selectChallenge(challengeId) {
    // Find the challenge
    const challenge = this.activeChallenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    // Update the select dropdown
    const select = document.getElementById("selected-challenge");
    if (select) {
      select.value = challengeId;
    }

    // Close modal
    this.closeChallengeModal();

    // Check the checkbox
    const checkbox = document.getElementById("submit-to-challenge");
    if (checkbox) {
      checkbox.checked = true;
      document.getElementById("challenge-select").style.display = "block";
    }

    // Show success toast
    this.showMessage(`✅ Selected: "${challenge.title}"`, "success");
  }

  // ============================================
  // OPEN CHALLENGE MODAL
  // ============================================

  openChallengeModal() {
    const modal = document.getElementById("challenge-modal");
    if (!modal) return;

    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Refresh the list
    this.populateChallengeModal();
  }

  // ============================================
  // CLOSE CHALLENGE MODAL
  // ============================================

  closeChallengeModal() {
    const modal = document.getElementById("challenge-modal");
    if (!modal) return;

    modal.style.display = "none";
    document.body.style.overflow = "";
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
    if (theme === "light") {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
    } else {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners() {
    document.getElementById("browse-btn")?.addEventListener("click", () => {
      document.getElementById("artwork-file").click();
    });

    document.getElementById("artwork-file")?.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFilesSelect(e.target.files);
      }
    });

    document.getElementById("upload-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    document.getElementById("cancel-btn")?.addEventListener("click", () => {
      if (
        confirm("Are you sure you want to cancel? Your changes will be lost.")
      ) {
        window.location.href = "pages/community/gallery.html";
      }
    });

    document.getElementById("remove-preview")?.addEventListener("click", () => {
      this.removePreview();
    });

    document
      .getElementById("submit-to-challenge")
      ?.addEventListener("change", (e) => {
        document.getElementById("challenge-select").style.display = e.target
          .checked
          ? "block"
          : "none";
      });

    // Modal controls
    document
      .getElementById("open-challenge-modal")
      ?.addEventListener("click", () => {
        this.openChallengeModal();
      });

    document
      .getElementById("close-challenge-modal")
      ?.addEventListener("click", () => {
        this.closeChallengeModal();
      });

    document
      .getElementById("challenge-modal")
      ?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.closeChallengeModal();
        }
      });

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeChallengeModal();
      }
    });

    this.setupTagsInput();
    this.setupRealTimePreview();
  }

  // ============================================
  // NSFW TOGGLE - With Warning Notice
  // ============================================

  setupNSFWToggle() {
    const nsfwToggle = document.getElementById("is-nsfw");
    const nsfwCategoryGroup = document.getElementById("nsfw-category-group");
    const nsfwWarning = document.getElementById("nsfw-warning-notice");

    if (!nsfwToggle) return;

    const isAdult = this.userData?.isAdult || false;
    const isAdmin =
      this.userData?.role === "admin" || this.userData?.isAdmin === true;

    if (!isAdult && !isAdmin) {
      const container = document.querySelector(".nsfw-toggle-container");
      if (container) {
        container.innerHTML = `
        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 1rem; text-align: center;">
          <p style="color: #ef4444; font-weight: 500; margin: 0;">
            <i class="fas fa-lock"></i> You must verify you are 18+ to upload mature content.
          </p>
          <button onclick="window.location.href='pages/community/profiles.html?user=${this.currentUser.uid}'"
                  style="margin-top: 0.5rem; padding: 0.5rem 1.5rem; background: linear-gradient(135deg, #fe67ea, #63dbee);
                         color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
            Verify Age in Profile
          </button>
        </div>
      `;
      }
      return;
    }

    nsfwToggle.addEventListener("change", (e) => {
      this.isNSFW = e.target.checked;

      // Show/hide category group
      if (nsfwCategoryGroup) {
        nsfwCategoryGroup.style.display = e.target.checked ? "block" : "none";
      }

      // Show/hide warning notice
      if (nsfwWarning) {
        nsfwWarning.style.display = e.target.checked ? "block" : "none";
      }

      this.updatePreview();
    });

    // Check initial state
    if (nsfwToggle.checked) {
      if (nsfwCategoryGroup) nsfwCategoryGroup.style.display = "block";
      if (nsfwWarning) nsfwWarning.style.display = "block";
    }
  }

  // ============================================
  // SUBMIT - With NSFW Auto-Route
  // ============================================

  async handleSubmit() {
    if (this.uploading) return;
    const submitBtn = document.getElementById("submit-btn");
    const originalText = submitBtn.innerHTML;

    try {
      if (this.selectedFiles.length === 0) {
        throw new Error("Please select at least one artwork file");
      }

      const title = document.getElementById("artwork-title").value.trim();
      if (!title) {
        throw new Error("Please enter a title for your artwork");
      }

      const isNSFW = document.getElementById("is-nsfw")?.checked || false;
      const nsfwCategory =
        document.getElementById("nsfw-category")?.value || "mature";

      if (isNSFW && !nsfwCategory) {
        throw new Error("Please select an NSFW category");
      }

      const submitToChallenge =
        document.getElementById("submit-to-challenge")?.checked || false;
      const challengeId = submitToChallenge
        ? document.getElementById("selected-challenge")?.value
        : null;

      if (submitToChallenge && !challengeId) {
        throw new Error("Please select a challenge to submit to");
      }

      const artworkData = {
        files: this.selectedFiles,
        title: title,
        description: document
          .getElementById("artwork-description")
          .value.trim(),
        category: document.getElementById("artwork-category").value || "other",
        software: document.getElementById("artwork-software").value || "",
        tags: this.tags,
        challengeId: challengeId,
        isNSFW: isNSFW,
        nsfwCategory: isNSFW ? nsfwCategory : null,
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      submitBtn.classList.add("uploading");
      this.uploading = true;

      const result = await this.uploadArtwork(artworkData);

      const successMessage = isNSFW
        ? "Artwork uploaded to NSFW Gallery! 🔞"
        : "Artwork uploaded successfully! 🎉";

      this.showMessage(successMessage, "success");

      // Route to appropriate gallery
      setTimeout(() => {
        if (isNSFW) {
          window.location.href =
            "pages/community/nsfw-gallery.html?uploaded=" + result.artworkId;
        } else {
          window.location.href =
            "pages/community/gallery.html?uploaded=" + result.artworkId;
        }
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      this.showMessage(error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      submitBtn.classList.remove("uploading");
      this.uploading = false;
    }
  }

  // ============================================
  // UPDATE NSFW PREVIEW
  // ============================================

  updateNSFWPreview() {
    const badge = document.getElementById("preview-nsfw-badge");
    if (!badge) return;
    badge.style.display = this.isNSFW ? "inline-block" : "none";
  }

  // ============================================
  // DRAG AND DROP - Multi-file supported
  // ============================================

  setupDragAndDrop() {
    const uploadArea = document.getElementById("upload-area");
    if (!uploadArea) return;

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(
        eventName,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        false,
      );
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      uploadArea.addEventListener(
        eventName,
        () => {
          uploadArea.classList.add("dragover");
        },
        false,
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(
        eventName,
        () => {
          uploadArea.classList.remove("dragover");
        },
        false,
      );
    });

    uploadArea.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFilesSelect(files);
      }
    });
  }

  // ============================================
  // FILE HANDLING - Multi-file + Video support
  // ============================================

  handleFilesSelect(files) {
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      // Check file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds 100MB limit`);
        continue;
      }

      // Check file type (images + videos)
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];
      if (!validTypes.includes(file.type)) {
        errors.push(`"${file.name}" has unsupported format`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      this.showMessage(errors.join("\n"), "error");
    }

    if (validFiles.length === 0) {
      return;
    }

    // Clear previous selection
    this.selectedFiles = [];
    this.clearFilePreviews();

    // Add new files
    validFiles.forEach((file) => {
      this.selectedFiles.push(file);
    });

    // Show first file as main preview
    this.showFilePreview(validFiles[0]);
    this.updateArtworkPreview(validFiles[0]);

    // Show multi-file indicator
    if (validFiles.length > 1) {
      this.showMultipleFilesPreview(validFiles);
    }

    this.updatePreview();
  }

  showFilePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById("preview-img");
      const container = document.getElementById("preview-container");

      if (file.type.startsWith("video/")) {
        previewImg.style.display = "none";
        // We'll use a video element for video preview
        const videoEl = document.createElement("video");
        videoEl.src = e.target.result;
        videoEl.controls = true;
        videoEl.muted = true;
        videoEl.style.width = "100%";
        videoEl.style.maxHeight = "400px";
        videoEl.style.objectFit = "contain";

        // Remove old video if exists
        const oldVideo = container.querySelector("video");
        if (oldVideo) oldVideo.remove();
        container.appendChild(videoEl);
      } else {
        // Remove old video if exists
        const oldVideo = container.querySelector("video");
        if (oldVideo) oldVideo.remove();
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
      }

      document.getElementById("file-name").textContent = file.name;
      document.getElementById("file-size").textContent = this.formatFileSize(
        file.size,
      );
      document.getElementById("upload-preview").style.display = "block";
      document.getElementById("upload-area").style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  showMultipleFilesPreview(files) {
    const container = document.getElementById("multiple-files-preview");
    const fileList = document.getElementById("file-list");
    const fileCount = document.getElementById("file-count");

    container.style.display = "block";
    fileCount.textContent = files.length;

    fileList.innerHTML = "";
    files.forEach((file, index) => {
      const pill = document.createElement("span");
      pill.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.6rem 0.2rem 0.8rem;
        background: rgba(138, 25, 225, 0.1);
        border: 1px solid rgba(138, 25, 225, 0.1);
        border-radius: 20px;
        font-size: 0.7rem;
        color: var(--text-secondary);
      `;
      const icon = file.type.startsWith("video/") ? "🎬" : "🖼️";
      pill.innerHTML = `${icon} ${file.name.substring(0, 20)}${file.name.length > 20 ? "..." : ""}`;
      fileList.appendChild(pill);
    });
  }

  clearFilePreviews() {
    const container = document.getElementById("preview-container");
    const oldVideo = container.querySelector("video");
    if (oldVideo) oldVideo.remove();
    document.getElementById("preview-img").style.display = "none";
    document.getElementById("multiple-files-preview").style.display = "none";
    document.getElementById("file-list").innerHTML = "";
  }

  removePreview() {
    this.selectedFiles = [];
    this.clearFilePreviews();
    document.getElementById("artwork-file").value = "";
    document.getElementById("upload-preview").style.display = "none";
    document.getElementById("upload-area").style.display = "block";
    document.getElementById("artwork-preview").style.display = "none";
    document.getElementById("artwork-preview-video").style.display = "none";
    document.getElementById("artwork-preview-placeholder").style.display =
      "flex";
    document.getElementById("multiple-files-preview").style.display = "none";
    document.getElementById("file-list").innerHTML = "";
    this.updatePreview();
  }

  // ============================================
  // TAGS
  // ============================================

  setupTagsInput() {
    const tagsInput = document.getElementById("tags-input");
    if (!tagsInput) return;

    tagsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const tag = tagsInput.value.trim();
        if (tag) {
          this.addTag(tag);
          tagsInput.value = "";
        }
      }
    });

    document.querySelectorAll(".tag-suggestion").forEach((button) => {
      button.addEventListener("click", () => {
        this.addTag(button.dataset.tag);
      });
    });
  }

  addTag(tagText) {
    if (!tagText) return;
    if (this.tags.length >= 10) {
      this.showMessage("Maximum 10 tags allowed", "error");
      return;
    }
    if (this.tags.includes(tagText.toLowerCase())) {
      this.showMessage("Tag already added", "error");
      return;
    }

    this.tags.push(tagText.toLowerCase());
    this.updateTagsDisplay();
    this.updatePreviewTags();
  }

  removeTag(tagIndex) {
    this.tags.splice(tagIndex, 1);
    this.updateTagsDisplay();
    this.updatePreviewTags();
  }

  updateTagsDisplay() {
    const tagsDisplay = document.getElementById("tags-display");
    if (!tagsDisplay) return;

    tagsDisplay.innerHTML = "";
    this.tags.forEach((tag, index) => {
      const tagElement = document.createElement("div");
      tagElement.className = "tag";
      tagElement.innerHTML = `
        ${tag}
        <button type="button" class="tag-remove" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      `;
      tagsDisplay.appendChild(tagElement);
    });

    tagsDisplay.querySelectorAll(".tag-remove").forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = parseInt(e.target.closest(".tag-remove").dataset.index);
        this.removeTag(index);
      });
    });
  }

  // ============================================
  // REAL-TIME PREVIEW
  // ============================================

  setupRealTimePreview() {
    const titleInput = document.getElementById("artwork-title");
    const descriptionInput = document.getElementById("artwork-description");

    titleInput?.addEventListener("input", () => {
      document.getElementById("preview-title").textContent =
        titleInput.value || "Artwork Title";
    });

    descriptionInput?.addEventListener("input", () => {
      document.getElementById("preview-description").textContent =
        descriptionInput.value || "Artwork description will appear here...";
    });
  }

  updatePreviewTags() {
    const previewTags = document.getElementById("preview-tags");
    if (!previewTags) return;

    previewTags.innerHTML = "";
    this.tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;
      previewTags.appendChild(tagElement);
    });
  }

  updateArtworkPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById("artwork-preview");
      const previewVideo = document.getElementById("artwork-preview-video");

      if (file.type.startsWith("video/")) {
        previewImg.style.display = "none";
        previewVideo.src = e.target.result;
        previewVideo.style.display = "block";
      } else {
        previewVideo.style.display = "none";
        previewVideo.src = "";
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
      }
      document.getElementById("artwork-preview-placeholder").style.display =
        "none";
    };
    reader.readAsDataURL(file);
  }

  updateUserPreview() {
    if (this.currentUser) {
      const username =
        this.currentUser.displayName ||
        this.currentUser.email?.split("@")[0] ||
        "User";
      const avatar = username.charAt(0).toUpperCase();
      document.getElementById("preview-username").textContent = username;
      document.getElementById("preview-avatar").textContent = avatar;
    }
  }

  updatePreview() {
    this.updateUserPreview();
    this.updatePreviewTags();
    this.updateNSFWPreview();
  }

  updateNSFWPreview() {
    const badge = document.getElementById("preview-nsfw-badge");
    if (!badge) return;
    badge.style.display = this.isNSFW ? "inline-block" : "none";
  }

  // ============================================
  // SUBMIT - With challenge and voting support
  // ============================================

  async handleSubmit() {
    if (this.uploading) return;
    const submitBtn = document.getElementById("submit-btn");
    const originalText = submitBtn.innerHTML;

    try {
      if (this.selectedFiles.length === 0) {
        throw new Error("Please select at least one artwork file");
      }

      const title = document.getElementById("artwork-title").value.trim();
      if (!title) {
        throw new Error("Please enter a title for your artwork");
      }

      const isNSFW = document.getElementById("is-nsfw")?.checked || false;
      const nsfwCategory =
        document.getElementById("nsfw-category")?.value || "mature";

      if (isNSFW && !nsfwCategory) {
        throw new Error("Please select an NSFW category");
      }

      const submitToChallenge =
        document.getElementById("submit-to-challenge")?.checked || false;
      const challengeId = submitToChallenge
        ? document.getElementById("selected-challenge")?.value
        : null;

      if (submitToChallenge && !challengeId) {
        throw new Error("Please select a challenge to submit to");
      }

      const artworkData = {
        files: this.selectedFiles,
        title: title,
        description: document
          .getElementById("artwork-description")
          .value.trim(),
        category: document.getElementById("artwork-category").value || "other",
        software: document.getElementById("artwork-software").value || "",
        tags: this.tags,
        challengeId: challengeId,
        isNSFW: isNSFW,
        nsfwCategory: isNSFW ? nsfwCategory : null,
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      submitBtn.classList.add("uploading");
      this.uploading = true;

      const result = await this.uploadArtwork(artworkData);

      this.showMessage("Artwork uploaded successfully! 🎉", "success");

      setTimeout(() => {
        window.location.href = `pages/community/gallery.html?uploaded=${result.artworkId}`;
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      this.showMessage(error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      submitBtn.classList.remove("uploading");
      this.uploading = false;
    }
  }

  // ============================================
  // UPLOAD TO FIREBASE - With voting support
  // ============================================
  async uploadArtwork(artworkData) {
    if (!this.currentUser) {
      throw new Error("Please login to upload artwork");
    }

    try {
      const uploadedUrls = [];
      const fileTypes = [];

      // Upload all files
      for (const file of artworkData.files) {
        let fileToUpload = file;
        if (file.type.startsWith("image/") && file.size > 300 * 1024) {
          fileToUpload = await this.compressImage(file, 1400, 0.9);
        }

        const storageRef = firebase.storage().ref();
        const filePath = `artworks/${this.currentUser.uid}/${Date.now()}_${file.name}`;
        const uploadTask = storageRef.child(filePath).put(fileToUpload);
        const snapshot = await uploadTask;
        const downloadURL = await snapshot.ref.getDownloadURL();
        uploadedUrls.push(downloadURL);
        fileTypes.push(file.type);
      }

      const primaryImage = uploadedUrls[0];
      const isVideo = fileTypes[0]?.startsWith("video/") || false;

      // Create artwork document
      const artwork = {
        title: artworkData.title,
        description: artworkData.description || "",
        imageUrl: primaryImage,
        imageUrls: uploadedUrls,
        fileTypes: fileTypes,
        isVideo: isVideo,
        category: artworkData.category || "other",
        software: artworkData.software || "",
        tags: artworkData.tags || [],
        artistId: this.currentUser.uid,
        artistName:
          this.currentUser.displayName ||
          this.currentUser.email?.split("@")[0] ||
          "Artist",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        cheers: 0,
        comments: [],
        status: "published",
        isNSFW: artworkData.isNSFW || false,
        nsfwCategory: artworkData.nsfwCategory || null,
        nsfwReported: false,
        nsfwWarnings: 0,
        votes: 0,
        voteCount: 0,
        hasMultiple: uploadedUrls.length > 1,
      };

      // Add challenge if submitted
      if (artworkData.challengeId) {
        artwork.challengeId = artworkData.challengeId;
        artwork.challengeSubmitted =
          firebase.firestore.FieldValue.serverTimestamp();
        artwork.challengeStatus = "pending";
      }

      // Save artwork
      const docRef = await firebase
        .firestore()
        .collection("artworks")
        .add(artwork);

      // Track challenge submission
      if (artworkData.challengeId) {
        try {
          await firebase
            .firestore()
            .collection("challengeSubmissions")
            .add({
              challengeId: artworkData.challengeId,
              artworkId: docRef.id,
              userId: this.currentUser.uid,
              userName:
                this.currentUser.displayName ||
                this.currentUser.email?.split("@")[0] ||
                "Anonymous",
              userAvatar: this.currentUser.photoURL || null,
              submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
              status: "pending",
              votes: 0,
              voteCount: 0,
              title: artworkData.title,
              description: artworkData.description || "",
            });

          await firebase
            .firestore()
            .collection("challenges")
            .doc(artworkData.challengeId)
            .update({
              submissions: firebase.firestore.FieldValue.increment(1),
            });

          // Award points for challenge submission
          await this.awardPoints(
            20,
            `Submitted to challenge: ${artworkData.challengeId}`,
          );
        } catch (error) {
          console.error("Error tracking challenge submission:", error);
        }
      }

      // Award upload points
      await this.awardPoints(10, "Uploaded artwork");

      // Add to user's artworks array
      await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .update({
          artworks: firebase.firestore.FieldValue.arrayUnion(docRef.id),
        });

      return {
        success: true,
        artworkId: docRef.id,
        artwork: artwork,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(error.message || "Failed to upload artwork");
    }
  }

  // ============================================
  // IMAGE COMPRESSION
  // ============================================

  compressImage(file, maxWidth = 1400, quality = 0.9) {
    if (file.size < 300 * 1024) {
      return Promise.resolve(file);
    }

    return new Promise((resolve, reject) => {
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

  // ============================================
  // AWARD POINTS
  // ============================================

  async awardPoints(amount, reason) {
    if (!this.currentUser) return;

    try {
      const userRef = firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid);
      await userRef.set(
        {
          points: firebase.firestore.FieldValue.increment(amount),
        },
        { merge: true },
      );

      await firebase.firestore().collection("pointsTransactions").add({
        userId: this.currentUser.uid,
        amount: amount,
        reason: reason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  }

  // ============================================
  // UTILITY
  // ============================================

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  showMessage(message, type = "success") {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");

    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.className = "toast-notification show";
      if (type === "error") {
        toast.classList.add("error");
      } else {
        toast.classList.remove("error");
      }

      // Auto-hide after 5 seconds
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
      }, 5000);
    } else {
      alert(message);
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.uploadManager = new UploadManager();
});
