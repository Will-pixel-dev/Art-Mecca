/**
 * HOST INFO — Load Avatar & Characters from Firestore
 */

class HostInfo {
  constructor() {
    this.hostUserId = "hsCEKJBO4nMUOhHyZ8rz8zPR9Fg2";
    this.hostAvatarUrl =
      "https://firebasestorage.googleapis.com/v0/b/truly-yours-artisan-hub.firebasestorage.app/o/avatars%2FhsCEKJBO4nMUOhHyZ8rz8zPR9Fg2%2F1781980217521_TrulytheRandomTVhead!.jpg?alt=media&token=b00189f1-f148-4286-a192-4004666b42fb";

    this.characters = [
      {
        id: "BMMWyg3a07MjXB1bHmoGtiXcIWB3",
        name: "Keres Dame",
        icon: "⚔️",
        color: "#ff6b00",
        avatarUrl:
          "https://firebasestorage.googleapis.com/v0/b/truly-yours-artisan-hub.firebasestorage.app/o/avatars%2FBMMWyg3a07MjXB1bHmoGtiXcIWB3%2Fprofile-picture.jpg?alt=media&token=94c768d4-c50e-4de7-9315-cbc77486e736",
      },
      {
        id: "Ar3QB139ZZbGQn0MF7TisgqKXxl1",
        name: "Ai",
        icon: "🤖",
        color: "#58ebfe",
        avatarUrl:
          "https://firebasestorage.googleapis.com/v0/b/truly-yours-artisan-hub.firebasestorage.app/o/avatars%2FAr3QB139ZZbGQn0MF7TisgqKXxl1%2Fprofile-picture.jpg?alt=media&token=190df5fe-1118-483d-b8c8-00ea31fe6b2c",
      },
      {
        id: "2SSSuHhdGSMdr1grzQ7S2Rp2p4C3",
        name: "Aliscir",
        icon: "🎭",
        color: "#ff00ea",
        avatarUrl:
          "https://firebasestorage.googleapis.com/v0/b/truly-yours-artisan-hub.firebasestorage.app/o/avatars%2F2SSSuHhdGSMdr1grzQ7S2Rp2p4C3%2Fprofile-picture.jpg?alt=media&token=602259a3-bf4d-429f-80c0-7d3072c0d438",
      },
      {
        id: "coming-soon",
        name: "Coming Soon",
        icon: "✦",
        color: "#4ff3a6",
      },
    ];

    // Store avatars directly
    this.avatarMap = {};
    this.characters.forEach((char) => {
      if (char.avatarUrl) {
        this.avatarMap[char.id] = char.avatarUrl;
      }
    });

    // Start the process
    this.init();
  }

  // ============================================================
  // FIXED: Prioritize real image URLs over generated avatars
  // ============================================================
  getAvatarUrl(data) {
    if (!data) return null;

    // 1. Check profilePicture first (highest priority)
    if (
      data.profilePicture &&
      typeof data.profilePicture === "string" &&
      data.profilePicture.startsWith("http")
    ) {
      return data.profilePicture;
    }

    // 2. Check avatarUrl
    if (
      data.avatarUrl &&
      typeof data.avatarUrl === "string" &&
      data.avatarUrl.startsWith("http")
    ) {
      return data.avatarUrl;
    }

    // 3. Check photoURL
    if (
      data.photoURL &&
      typeof data.photoURL === "string" &&
      data.photoURL.startsWith("http")
    ) {
      return data.photoURL;
    }

    // 4. Check avatar (if it's a string URL)
    if (typeof data.avatar === "string" && data.avatar.startsWith("http")) {
      return data.avatar;
    }

    // 5. If avatar is an object with a url property
    if (data.avatar && typeof data.avatar === "object") {
      if (data.avatar.url && data.avatar.url.startsWith("http")) {
        return data.avatar.url;
      }
      if (data.avatar.imageUrl && data.avatar.imageUrl.startsWith("http")) {
        return data.avatar.imageUrl;
      }
    }

    // No valid URL found
    return null;
  }

  async init() {
    // Check Firebase
    if (typeof firebase === "undefined" || typeof db === "undefined") {
      console.warn("⏳ Firebase not ready, retrying...");
      setTimeout(() => this.init(), 1000);
      return;
    }

    console.log("🎯 HostInfo initializing...");

    try {
      await this.loadHostData();
    } catch (e) {
      console.warn("Host data load failed:", e.message);
    }

    try {
      await this.loadCharacterData();
    } catch (e) {
      console.warn("Character data load failed:", e.message);
    }

    this.renderCharacters();
    this.setupHostAvatarClick();

    console.log("✅ HostInfo rendered with avatars");
  }

  async loadHostData() {
    try {
      const doc = await db.collection("users").doc(this.hostUserId).get();
      if (!doc.exists) return;

      const data = doc.data();

      // Update avatar - USE THE FIXED getAvatarUrl method
      const avatarContainer = document.getElementById("hostAvatar");
      if (avatarContainer) {
        const avatarUrl = this.getAvatarUrl(data);

        if (avatarUrl) {
          console.log("✅ Host avatar URL found:", avatarUrl);
          avatarContainer.innerHTML = `
            <img src="${avatarUrl}" alt="Host Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                 onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'host-avatar-emoji\\' style=\\'font-size:2.5rem;font-weight:700;color:white;\\'>${this.getInitials(data.fullname || "🎨")}</span><div class=\\'host-avatar-ring\\'></div>'">
            <div class="host-avatar-ring"></div>
          `;
        } else {
          // Use hostAvatarUrl as fallback
          const fallbackUrl = this.hostAvatarUrl;
          if (fallbackUrl) {
            avatarContainer.innerHTML = `
              <img src="${fallbackUrl}" alt="Host Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                   onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'host-avatar-emoji\\' style=\\'font-size:2.5rem;font-weight:700;color:white;\\'>${this.getInitials(data.fullname || "🎨")}</span><div class=\\'host-avatar-ring\\'></div>'">
              <div class="host-avatar-ring"></div>
            `;
          } else {
            // Use initials
            avatarContainer.innerHTML = `
              <span class="host-avatar-emoji" style="font-size:2.5rem;font-weight:700;color:white;">${this.getInitials(data.fullname || "🎨")}</span>
              <div class="host-avatar-ring"></div>
            `;
          }
        }
      }

      // Update name
      const nameEl = document.getElementById("hostName");
      if (nameEl && data.fullname) {
        nameEl.textContent = data.fullname;
      }

      // Update bio

      console.log("✅ Host data loaded");
    } catch (error) {
      console.warn("Host data load error:", error.message);
    }
  }

  async loadCharacterData() {
    console.log("📥 Loading character data from Firestore...");

    for (const char of this.characters) {
      if (char.id === "coming-soon") continue;

      try {
        const doc = await db.collection("users").doc(char.id).get();
        if (doc.exists) {
          const data = doc.data();
          // Use the fixed getAvatarUrl method
          const fbAvatar = this.getAvatarUrl(data);
          if (fbAvatar) {
            this.avatarMap[char.id] = fbAvatar;
            console.log(`✅ Updated ${char.name} avatar from Firestore`);
          }
        }
      } catch (error) {
        // Silently fail - use hardcoded avatar
      }
    }
  }

  renderCharacters() {
    const grid = document.getElementById("charactersGrid");
    if (!grid) {
      console.warn("⚠️ Characters grid not found");
      return;
    }

    grid.innerHTML = "";

    for (const char of this.characters) {
      const item = document.createElement("div");
      item.className = "character-item";

      const isComingSoon = char.id === "coming-soon";

      // Get avatar from map, fallback to hardcoded
      const avatarUrl = this.avatarMap[char.id] || char.avatarUrl || null;

      // Gradient
      const gradients = {
        BMMWyg3a07MjXB1bHmoGtiXcIWB3:
          "linear-gradient(135deg, #ff6b00, #ff00ea)",
        Ar3QB139ZZbGQn0MF7TisgqKXxl1:
          "linear-gradient(135deg, #58ebfe, #00d4ff)",
        "2SSSuHhdGSMdr1grzQ7S2Rp2p4C3":
          "linear-gradient(135deg, #ff00ea, #ad03fc)",
      };
      const gradient = isComingSoon
        ? "linear-gradient(135deg, #4ff3a6, #10b981)"
        : gradients[char.id] || "var(--gradient-neon)";

      // Avatar content
      let avatarContent = "";
      if (isComingSoon) {
        avatarContent = `<span class="char-initials" style="font-size:0.8rem;">✦</span>`;
      } else if (avatarUrl && avatarUrl.startsWith("http")) {
        avatarContent = `
          <img src="${avatarUrl}" alt="${char.name}" style="width:100%;height:100%;object-fit:cover;"
               onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'char-initials\\'>${char.icon}</span>'">
        `;
      } else {
        avatarContent = `<span class="char-initials">${char.icon}</span>`;
      }

      item.innerHTML = `
        <div class="char-avatar" style="background: ${gradient};">
          ${avatarContent}
          ${!isComingSoon ? `<div class="char-status online"></div>` : `<div class="char-status offline"></div>`}
        </div>
        <span class="char-name">${char.name}</span>
      `;

      if (!isComingSoon) {
        item.style.cursor = "pointer";
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          window.location.href = `/pages/community/profiles.html?user=${char.id}`;
        });
      }

      grid.appendChild(item);
    }
  }

  getInitials(name) {
    if (!name) return "🎨";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  setupHostAvatarClick() {
    const hostAvatar = document.getElementById("hostAvatar");
    if (hostAvatar) {
      hostAvatar.style.cursor = "pointer";
      hostAvatar.addEventListener("click", () => {
        window.location.href = `/pages/community/profiles.html?user=${this.hostUserId}`;
      });
      hostAvatar.setAttribute("title", "Click to view host profile");
    }

    const profileBtn = document.querySelector(".host-profile-btn");
    if (profileBtn) {
      profileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = `/pages/community/profiles.html?user=${this.hostUserId}`;
      });
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const checkFirebase = setInterval(() => {
    if (typeof firebase !== "undefined" && typeof db !== "undefined") {
      clearInterval(checkFirebase);
      window.hostInfo = new HostInfo();
    }
  }, 500);

  setTimeout(() => {
    clearInterval(checkFirebase);
    if (!window.hostInfo) {
      console.warn("⚠️ Firebase timeout, initializing anyway...");
      window.hostInfo = new HostInfo();
    }
  }, 10000);
});
