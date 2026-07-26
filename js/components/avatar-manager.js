/**
 * Avatar Manager - Universal Profile Picture System
 */

class AvatarManager {
  constructor(options = {}) {
    this.userId = null;
    this.userData = null;
    this.avatarUrl = null;
    this.cacheKey = "avatar_data";
    this.isOwnProfile = false;
    this.avatarContainer = options.containerSelector || ".nav-avatar-container";
    this.avatarSize = options.size || "sm";
    this.isModerator = false;
    this.avatarContainers = [];
    this.dropdownOpen = false;
    this.dropdown = null;

    this.initAuth();
  }

  initAuth() {
    if (
      typeof firebase === "undefined" ||
      typeof firebase.auth === "undefined"
    ) {
      console.warn("Firebase auth not available, retrying...");
      setTimeout(() => this.initAuth(), 500);
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        this.userId = user.uid;
        await this.loadUserData();
        await this.checkModeratorStatus();
        setTimeout(() => {
          this.renderAllAvatars();
          setTimeout(() => this.setupAvatarClickHandlers(), 100);
        }, 300);
      } else {
        this.renderLoggedOutState();
      }
    });
  }

  async checkModeratorStatus() {
    if (!this.userId) return false;
    try {
      const doc = await db.collection("users").doc(this.userId).get();
      if (doc.exists) {
        const data = doc.data();
        this.isModerator =
          data.role === "admin" ||
          data.role === "moderator" ||
          data.isModerator === true;
        return this.isModerator;
      }
      return false;
    } catch (error) {
      console.error("Error checking moderator status:", error);
      return false;
    }
  }

  async loadUserData() {
    if (!this.userId) return;

    const cached = this.getCachedData();
    if (cached && cached.userId === this.userId) {
      this.userData = cached.data;
      this.avatarUrl =
        cached.data.profilePicture || cached.data.avatarUrl || null;
      return;
    }

    try {
      const doc = await db.collection("users").doc(this.userId).get();
      if (doc.exists) {
        this.userData = doc.data();
        this.avatarUrl =
          this.userData.profilePicture || this.userData.avatarUrl || null;
        this.cacheData(this.userId, this.userData);
        console.log(
          "✅ User data loaded:",
          this.userData.fullname || this.userData.username,
        );
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  getDisplayName() {
    if (!this.userData) return "User";
    return this.userData.fullname || this.userData.username || "User";
  }

  getInitials() {
    const name = this.getDisplayName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarUrl() {
    return this.avatarUrl || null;
  }

  // ============================================
  // RENDER METHODS
  // ============================================

  renderAllAvatars() {
    const containers = document.querySelectorAll(this.avatarContainer);
    const specificContainers = document.querySelectorAll(
      "[data-avatar-container]",
    );
    const navContainers = document.querySelectorAll(".nav-avatar-container");

    this.avatarContainers = [
      ...new Set([...containers, ...specificContainers, ...navContainers]),
    ];

    console.log(
      "📦 Rendering avatars in",
      this.avatarContainers.length,
      "containers",
    );

    this.avatarContainers.forEach((container) => {
      if (container && container.offsetParent !== null) {
        container.innerHTML = "";
        this.renderAvatar(container);
      }
    });
  }

  renderAvatar(container) {
    if (!container) return;
    container.innerHTML = "";

    if (this.userId && this.userData) {
      this.buildAvatarElement(container);
    } else {
      this.buildLoggedOutElement(container);
    }
  }

  buildAvatarElement(container) {
    const avatarUrl = this.getAvatarUrl();
    const initials = this.getInitials();
    const displayName = this.getDisplayName();
    const size = container.dataset.size || this.avatarSize;

    const wrapper = document.createElement("div");
    wrapper.className = `avatar-wrapper avatar-${size}`;
    wrapper.title = displayName;
    wrapper.dataset.userId = this.userId;
    wrapper.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.2);
      cursor: pointer;
      background: linear-gradient(135deg, #ff00ea, #ad03fc);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.3s ease;
    `;

    if (avatarUrl) {
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.alt = displayName;
      img.loading = "lazy";
      img.style.cssText =
        "width: 100%; height: 100%; object-fit: cover; display: block;";
      img.onerror = () => {
        wrapper.innerHTML = `<span class="avatar-initials" style="color: white; font-weight: 700; font-size: 0.85rem; text-shadow: 0 1px 4px rgba(0,0,0,0.3);">${initials}</span>`;
      };
      wrapper.appendChild(img);
    } else {
      const initialsSpan = document.createElement("span");
      initialsSpan.className = "avatar-initials";
      initialsSpan.style.cssText =
        "color: white; font-weight: 700; font-size: 0.85rem; text-shadow: 0 1px 4px rgba(0,0,0,0.3); user-select: none; pointer-events: none;";
      initialsSpan.textContent = initials;
      wrapper.appendChild(initialsSpan);
    }

    container.appendChild(wrapper);
    container.dataset.userId = this.userId;
    container._avatarWrapper = wrapper;
  }

  buildLoggedOutElement(container) {
    const wrapper = document.createElement("div");
    wrapper.className = `avatar-wrapper avatar-${this.avatarSize}`;
    wrapper.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.2);
      cursor: pointer;
      background: rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    wrapper.title = "Login";

    const link = document.createElement("a");
    link.href = "/pages/auth/login.html";
    link.style.cssText =
      "display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-decoration:none;color:white;";
    link.innerHTML =
      '<i class="fas fa-user" style="font-size:0.7rem;opacity:0.6;"></i>';

    wrapper.appendChild(link);
    container.appendChild(wrapper);
  }

  renderLoggedOutState() {
    const containers = document.querySelectorAll(this.avatarContainer);
    containers.forEach((container) => {
      this.buildLoggedOutElement(container);
    });
  }

  // ============================================
  // DROPDOWN WITH CHANGE AVATAR OPTION
  // ============================================

  setupAvatarClickHandlers() {
    const containers = document.querySelectorAll(this.avatarContainer);
    console.log(
      "🔧 Setting up click handlers for",
      containers.length,
      "avatar containers",
    );

    containers.forEach((container) => {
      let wrapper = container.querySelector(".avatar-wrapper");
      if (!wrapper && container.classList.contains("avatar-wrapper")) {
        wrapper = container;
      }

      if (wrapper) {
        const newWrapper = wrapper.cloneNode(true);
        wrapper.parentNode.replaceChild(newWrapper, wrapper);
        container._avatarWrapper = newWrapper;

        newWrapper.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log("👤 Avatar clicked!");
          this.toggleDropdown(container);
        });
      }
    });

    document.addEventListener("click", (e) => {
      const isAvatarClick = e.target.closest(this.avatarContainer);
      if (!isAvatarClick) {
        const dropdown = document.getElementById("avatarDropdown");
        if (dropdown) {
          dropdown.style.display = "none";
          dropdown.classList.remove("active");
          this.dropdownOpen = false;
        }
      }
    });
  }
  toggleDropdown(container) {
    console.log("🔄 toggleDropdown called");

    const existingDropdown = document.getElementById("avatarDropdown");
    if (existingDropdown) {
      existingDropdown.remove();
      this.dropdown = null;
    }

    const dropdown = document.createElement("div");
    dropdown.id = "avatarDropdown";
    dropdown.className = "avatar-dropdown active";
    dropdown.style.cssText = `
        display: block !important;
        position: fixed;
        z-index: 999999;
        background: rgba(10, 5, 8, 0.95) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border-radius: 12px !important;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 0, 234, 0.1) !important;
        min-width: 220px !important;
        border: 1px solid rgba(255, 0, 234, 0.15) !important;
        padding: 8px 0 !important;
        animation: dropdownSlideDown 0.25s ease !important;
    `;

    const wrapper =
      container._avatarWrapper || container.querySelector(".avatar-wrapper");
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const dropdownWidth = 220;
      let left = rect.right - dropdownWidth;
      if (left < 10) left = 10;
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.left = `${left}px`;
    }

    // Username
    const username = document.createElement("div");
    username.className = "dropdown-username";
    username.textContent = `@${this.userData?.username || this.userData?.fullname || "user"}`;
    dropdown.appendChild(username);

    const divider1 = document.createElement("div");
    divider1.className = "dropdown-divider";
    dropdown.appendChild(divider1);

    // Change Avatar
    const changeAvatarItem = this.createDropdownItem(
      "fa-camera",
      "Change Avatar",
      () => {
        this.closeDropdown();
        this.showAvatarUploadModal();
      },
    );
    dropdown.appendChild(changeAvatarItem);

    // My Profile
    const profileItem = this.createDropdownLink(
      "fa-user",
      "My Profile",
      `/pages/community/profiles.html?user=${this.userId}`,
    );
    dropdown.appendChild(profileItem);

    // My Uploads
    const uploadsItem = this.createDropdownLink(
      "fa-cloud-upload-alt",
      "My Uploads",
      "/pages/community/my-uploads.html",
    );
    dropdown.appendChild(uploadsItem);

    // Account Settings
    const settingsItem = this.createDropdownLink(
      "fa-cog",
      "Account Settings",
      "/pages/account/settings.html",
    );
    dropdown.appendChild(settingsItem);

    // Moderation dashboard for mods
    if (this.isModerator) {
      const modItem = this.createDropdownLink(
        "fa-shield-alt",
        "Moderation Dashboard",
        "/pages/admin/moderation.html",
        true, // isModerator
      );
      dropdown.appendChild(modItem);
    }

    const divider2 = document.createElement("div");
    divider2.className = "dropdown-divider";
    dropdown.appendChild(divider2);

    // Logout
    const logoutItem = document.createElement("button");
    logoutItem.className = "dropdown-item logout";
    logoutItem.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
    logoutItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleLogout();
    });
    dropdown.appendChild(logoutItem);

    document.body.appendChild(dropdown);
    this.dropdown = dropdown;
    this.dropdownOpen = true;
  }

  createDropdownItem(icon, label, onClick) {
    const item = document.createElement("button");
    item.className = "dropdown-item";
    item.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      if (onClick) onClick();
    });
    return item;
  }

  createDropdownLink(icon, label, href, isModerator = false) {
    const item = document.createElement("a");
    item.className = "dropdown-item";
    item.href = href;
    item.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
    if (isModerator) {
      item.style.borderLeftColor = "#ff00ea";
      item.style.background = "rgba(255, 0, 234, 0.05)";
    }
    return item;
  }

  // ============================================
  // AVATAR UPLOAD MODAL
  // ============================================

  showAvatarUploadModal() {
    // Remove any existing modal
    const existingModal = document.getElementById("avatarUploadModal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "avatarUploadModal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    `;

    // Add fade-in animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    modal.innerHTML = `
      <div style="
        background: rgba(26,26,46,0.95);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 32px;
        max-width: 450px;
        width: 100%;
        box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        position: relative;
        animation: fadeIn 0.3s ease;
      ">
        <button class="modal-close-btn" style="
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        ">&times;</button>

        <div style="text-align: center;">
          <div style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 16px;
            overflow: hidden;
            border: 3px solid rgba(254, 103, 234, 0.3);
            background: linear-gradient(135deg, #ff00ea, #ad03fc);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <img id="avatarPreview" src="${this.getAvatarUrl() || ""}" alt="Avatar Preview" style="width:100%;height:100%;object-fit:cover;display:${this.getAvatarUrl() ? "block" : "none"};">
            <span id="avatarInitialsPreview" style="color:white;font-weight:700;font-size:2rem;display:${this.getAvatarUrl() ? "none" : "block"};">
              ${this.getInitials()}
            </span>
          </div>

          <h3 style="color: white; font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">Change Profile Picture</h3>
          <p style="color: rgba(255,255,255,0.4); font-size: 0.85rem; margin-bottom: 16px;">Upload a new profile picture for your account</p>

          <div style="
            border: 2px dashed rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 16px;
            transition: all 0.3s ease;
            cursor: pointer;
          " id="dropZone">
            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: rgba(255,255,255,0.2); display: block; margin-bottom: 8px;"></i>
            <p style="color: rgba(255,255,255,0.3); font-size: 0.85rem;">
              Click or drag an image here
            </p>
            <p style="color: rgba(255,255,255,0.2); font-size: 0.7rem; margin-top: 4px;">
              PNG, JPG, WEBP • Max 5MB
            </p>
            <input type="file" id="avatarFileInput" accept="image/*" style="display:none;">
          </div>

          <div id="uploadLoading" style="display:none; color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-bottom: 12px;">
            <i class="fas fa-spinner fa-spin"></i> Uploading...
          </div>

          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button id="uploadAvatarBtn" style="
              padding: 10px 28px;
              background: linear-gradient(135deg, #ff00ea, #ad03fc);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 0.85rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              <i class="fas fa-upload"></i> Upload
            </button>
            <button id="cancelUploadBtn" style="
              padding: 10px 28px;
              background: rgba(255,255,255,0.05);
              color: rgba(255,255,255,0.5);
              border: 1px solid rgba(255,255,255,0.05);
              border-radius: 8px;
              font-size: 0.85rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // === Modal Event Handlers ===

    const closeBtn = modal.querySelector(".modal-close-btn");
    const cancelBtn = modal.querySelector("#cancelUploadBtn");
    const uploadBtn = modal.querySelector("#uploadAvatarBtn");
    const fileInput = modal.querySelector("#avatarFileInput");
    const dropZone = modal.querySelector("#dropZone");
    const avatarPreview = modal.querySelector("#avatarPreview");
    const initialsPreview = modal.querySelector("#avatarInitialsPreview");
    const loadingMsg = modal.querySelector("#uploadLoading");

    // Close modal
    const closeModal = () => {
      modal.remove();
      style.remove();
    };

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Open file picker
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "rgba(254, 103, 234, 0.5)";
      dropZone.style.background = "rgba(254, 103, 234, 0.05)";
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "rgba(255,255,255,0.1)";
      dropZone.style.background = "transparent";
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "rgba(255,255,255,0.1)";
      dropZone.style.background = "transparent";
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) {
        handleFileSelect(e.target.files[0]);
      }
    });

    let selectedFile = null;

    function handleFileSelect(file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be less than 5MB.");
        return;
      }

      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.style.display = "block";
        initialsPreview.style.display = "none";
        dropZone.style.borderColor = "rgba(79, 243, 166, 0.3)";
        uploadBtn.style.opacity = "1";
        uploadBtn.style.cursor = "pointer";
      };
      reader.readAsDataURL(file);
    }

    // Upload
    uploadBtn.addEventListener("click", async () => {
      if (!selectedFile) {
        alert("Please select an image first.");
        return;
      }

      loadingMsg.style.display = "block";
      uploadBtn.disabled = true;
      uploadBtn.style.opacity = "0.5";

      try {
        const result = await this.uploadProfilePicture(selectedFile);
        if (result) {
          setTimeout(() => {
            closeModal();
            // Refresh avatar in header
            this.renderAllAvatars();
            this.setupAvatarClickHandlers();
          }, 500);
        }
      } catch (error) {
        console.error("Upload error:", error);
        loadingMsg.textContent = "❌ Error uploading. Please try again.";
        loadingMsg.style.color = "rgba(239, 68, 68, 0.8)";
      } finally {
        loadingMsg.style.display = "none";
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = "1";
      }
    });

    // Escape key to close
    const escHandler = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  // ============================================
  // UPLOAD PROFILE PICTURE
  // ============================================

  async uploadProfilePicture(file) {
    if (!this.userId) {
      console.error("No user ID found");
      return null;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be less than 5MB");
      return null;
    }

    try {
      const storageRef = firebase.storage().ref();
      const filePath = `avatars/${this.userId}/profile-picture.jpg`;
      const uploadTask = storageRef.child(filePath).put(file);

      const snapshot = await uploadTask;
      const downloadURL = await snapshot.ref.getDownloadURL();

      // Update Firestore
      await db.collection("users").doc(this.userId).update({
        profilePicture: downloadURL,
      });

      // Update auth profile too
      const user = firebase.auth().currentUser;
      if (user) {
        await user.updateProfile({ photoURL: downloadURL });
      }

      // Update local state
      await this.updateAvatar(downloadURL);

      this.showToast("✅ Profile picture updated successfully!");
      return downloadURL;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      this.showToast("Error uploading profile picture", "error");
      return null;
    }
  }

  async updateAvatar(newUrl) {
    this.avatarUrl = newUrl;
    if (this.userData) {
      this.userData.profilePicture = newUrl;
      this.cacheData(this.userId, this.userData);
    }
    this.renderAllAvatars();
    this.setupAvatarClickHandlers();
  }

  // ============================================
  // CACHE METHODS
  // ============================================

  cacheData(userId, data) {
    try {
      localStorage.setItem(
        this.cacheKey,
        JSON.stringify({
          userId: userId,
          data: data,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.warn("Could not cache avatar data:", error);
    }
  }

  getCachedData() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > 5 * 60 * 1000) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  clearCache() {
    localStorage.removeItem(this.cacheKey);
  }

  // ============================================
  // LOGOUT
  // ============================================

  async handleLogout() {
    try {
      await firebase.auth().signOut();
      this.clearCache();
      window.location.href = "/index.html";
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // ============================================
  // TOAST
  // ============================================

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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (typeof firebase !== "undefined" && typeof db !== "undefined") {
      if (!window.avatarManager) {
        console.log("🔄 Initializing AvatarManager...");
        window.avatarManager = new AvatarManager({
          containerSelector: ".nav-avatar-container",
          size: "md",
        });
      }
    } else {
      console.warn("Firebase not ready, avatar manager will retry...");
      setTimeout(() => {
        if (typeof firebase !== "undefined" && typeof db !== "undefined") {
          window.avatarManager = new AvatarManager({
            containerSelector: ".nav-avatar-container",
            size: "md",
          });
        }
      }, 2000);
    }
  }, 500);
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = AvatarManager;
}
