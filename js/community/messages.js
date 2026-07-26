// ================================================================
// MESSAGES.JS — Complete Messaging System (FULLY FIXED)
// ================================================================

class MessagesSystem {
  constructor() {
    this.currentUser = null;
    this.conversations = [];
    this.currentConversationId = null;
    this.messages = [];
    this.unsubscribeConversations = null;
    this.unsubscribeMessages = null;
    this.userCache = {};
    this.selectedUserId = null;
    this.isMobile = window.innerWidth <= 768;
    this.unreadTotal = 0;
    this.isLoadingConversations = false;
    this.hasLoadedConversations = false;
    this.toastTimeout = null;
    this.isStartingConversation = false;
    this.conversationLookup = {};
    this.accentColor = localStorage.getItem("messagesAccentColor") || "#ff00ea";
    this.isGlitching = false;
    this.particles = [];
    this.particleAnimationId = null;

    // DOM refs
    this.conversationList = document.getElementById("conversationList");
    this.threadMessages = document.getElementById("threadMessages");
    this.threadHeader = document.getElementById("threadHeader");
    this.threadUserName = document.getElementById("threadUserName");
    this.threadUserStatus = document.getElementById("threadUserStatus");
    this.statusDot = document.getElementById("statusDot");
    this.threadAvatar = document.getElementById("threadAvatar");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendMessageBtn");
    this.msgCharCount = document.getElementById("msgCharCount");
    this.threadBackBtn = document.getElementById("threadBackBtn");
    this.threadProfileBtn = document.getElementById("threadProfileBtn");
    this.typingIndicator = document.getElementById("typingIndicator");
    this.typingText = document.getElementById("typingText");
    this.emojiPicker = document.getElementById("emojiPicker");
    this.emojiToggleBtn = document.getElementById("emojiToggleBtn");
    this.paletteToggle = document.getElementById("paletteToggle");
    this.paletteGrid = document.getElementById("paletteGrid");
    this.fabNewChat = document.getElementById("fabNewChat");
    this.profilePreviewModal = document.getElementById("profilePreviewModal");
    this.previewName = document.getElementById("previewName");
    this.previewUsername = document.getElementById("previewUsername");
    this.previewAvatar = document.getElementById("previewAvatar");
    this.previewBio = document.getElementById("previewBio");
    this.previewArtworks = document.getElementById("previewArtworks");
    this.previewFollowers = document.getElementById("previewFollowers");
    this.previewViewProfile = document.getElementById("previewViewProfile");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.particleCanvas = document.getElementById("particleCanvas");
    this.keyboardHint = document.querySelector(".keyboard-hint");

    this.init();
  }

  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "pages/auth/login.html";
        return;
      }

      this.currentUser = user;
      await this.loadUserData();
      this.setupEventListeners();

      // Initialize particles in the background (don't block)
      setTimeout(() => {
        this.initParticles();
      }, 100);

      this.applyAccentColor(this.accentColor);
      this.setupPalettePicker();

      if (!this.hasLoadedConversations) {
        this.loadConversations();
      }

      window.addEventListener("resize", () => {
        this.isMobile = window.innerWidth <= 768;
        this.updateMobileView();
        // Resize particles
        if (this.particleCanvas) {
          this.particleCanvas.width = window.innerWidth;
          this.particleCanvas.height = window.innerHeight;
        }
      });

      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("user");
      if (userId && userId !== this.currentUser.uid) {
        const checkAndStart = () => {
          if (this.hasLoadedConversations) {
            this.startConversation(userId);
          } else {
            setTimeout(checkAndStart, 200);
          }
        };
        setTimeout(() => {
          const url = new URL(window.location);
          url.searchParams.delete("user");
          window.history.replaceState({}, "", url);
        }, 100);
        checkAndStart();
      }
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
        this.userCache[this.currentUser.uid] = doc.data();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  // ============================================================
  // PARTICLES — ISOLATED AND NON-BLOCKING
  // ============================================================

  initParticles() {
    const canvas = this.particleCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const particleCount = 60;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const colors = ["#ff00ea", "#c400ad", "#ff66f0", "#58ebfe", "#ffffff"];
    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.2 + 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Start animation
    this.particleCtx = ctx;
    this.particleCanvasObj = canvas;
    this.animateParticles();
  }

  animateParticles() {
    const canvas = this.particleCanvasObj;
    const ctx = this.particleCtx;
    if (!canvas || !ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      this.particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Draw connections
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.03;
            ctx.beginPath();
            ctx.moveTo(this.particles[i].x, this.particles[i].y);
            ctx.lineTo(this.particles[j].x, this.particles[j].y);
            ctx.strokeStyle = this.accentColor || "#ff00ea";
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.3;
            ctx.shadowColor = this.accentColor || "#ff00ea";
            ctx.shadowBlur = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          }
        }
      }

      this.particleAnimationId = requestAnimationFrame(animate);
    };

    animate();
  }

  stopParticles() {
    if (this.particleAnimationId) {
      cancelAnimationFrame(this.particleAnimationId);
      this.particleAnimationId = null;
    }
  }

  updateParticleColors(color) {
    const colors = [
      color,
      this.lightenColor(color, 30),
      this.darkenColor(color, 30),
      "#58ebfe",
      "#ffffff",
    ];

    this.particles.forEach((p, index) => {
      p.color = colors[index % colors.length];
    });

    // Update connection color
    this.accentColor = color;
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  // ============================================================
  // ACCENT COLOR
  // ============================================================

  applyAccentColor(color) {
    this.accentColor = color;
    const root = document.documentElement;
    root.style.setProperty("--accent", color);
    root.style.setProperty("--accent-dim", `${color}15`);
    root.style.setProperty("--accent-glow", `0 0 40px ${color}30`);
    root.style.setProperty("--accent-glow-strong", `0 0 60px ${color}40`);
    root.style.setProperty("--accent-glow-soft", `0 0 80px ${color}10`);

    // Update messages container
    if (this.messagesContainer) {
      this.messagesContainer.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.645), 0 0 40px ${color}15`;
      this.messagesContainer.style.borderColor = `${color}40`;
    }

    // Update keyboard hint
    if (this.keyboardHint) {
      this.keyboardHint.style.borderColor = `${color}20`;
      this.keyboardHint.style.color = color;
      this.keyboardHint.querySelectorAll("kbd").forEach((kbd) => {
        kbd.style.borderColor = `${color}20`;
        kbd.style.color = color;
      });
    }

    // Update hero heading
    const heroHeading = document.querySelector(".messages-hero h1");
    if (heroHeading) {
      heroHeading.style.background = `linear-gradient(135deg, ${color}, #c400ad)`;
      heroHeading.style.webkitBackgroundClip = "text";
      heroHeading.style.backgroundClip = "text";
    }

    // Update gradient text
    document.querySelectorAll(".gradient-text").forEach((el) => {
      el.style.background = `linear-gradient(135deg, ${color}, #c400ad)`;
      el.style.webkitBackgroundClip = "text";
      el.style.backgroundClip = "text";
    });

    // Update buttons
    document
      .querySelectorAll(
        ".btn-send, .fab-new-chat, .preview-view-profile, .conversation-empty .empty-action-btn",
      )
      .forEach((el) => {
        el.style.background = `linear-gradient(135deg, ${color}, #c400ad)`;
        el.style.boxShadow = `0 0 30px ${color}20`;
      });

    // Update hero icon
    const heroIcon = document.querySelector(".messages-hero-icon");
    if (heroIcon) {
      heroIcon.style.color = color;
    }

    // Update graffiti tag
    const graffitiTag = document.querySelector(".hero-graffiti-tag");
    if (graffitiTag) {
      graffitiTag.style.color = color;
    }

    // Update particles
    this.updateParticleColors(color);

    // Update palette swatch active state
    document.querySelectorAll(".palette-swatch").forEach((el) => {
      el.classList.toggle("active", el.dataset.color === color);
    });

    // Update scrollbar styles
    const styleId = "accent-scrollbar-style";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .conversation-list::-webkit-scrollbar-thumb { background: ${color} !important; }
      .thread-messages::-webkit-scrollbar-thumb { background: ${color} !important; }
      .conversation-item.active { background: ${color}15 !important; border-left-color: ${color} !important; }
      .conversation-item .conv-unread { background: ${color} !important; box-shadow: 0 0 20px ${color}30 !important; }
      .message-bubble.sent { background: linear-gradient(135deg, ${color}, #c400ad) !important; box-shadow: 0 0 30px ${color}20 !important; }
      .thread-input-wrapper textarea:focus { border-color: ${color} !important; box-shadow: 0 0 30px ${color}10 !important; }
      .input-action-btn:hover { color: ${color} !important; background: ${color}15 !important; }
      .thread-action-btn:hover { color: ${color} !important; background: ${color}15 !important; }
      .thread-user-info h3:hover { color: ${color} !important; }
      .modal-container { border-color: ${color} !important; box-shadow: 0 0 40px ${color}20, 0 20px 60px rgba(0,0,0,0.5) !important; }
      .modal-header h3 i { color: ${color} !important; }
      .preview-avatar { background: linear-gradient(135deg, ${color}, #c400ad) !important; box-shadow: 0 0 30px ${color}30 !important; }
      .typing-indicator .typing-dot { background: ${color} !important; }
      .emoji-picker { border-color: ${color} !important; box-shadow: 0 0 40px ${color}20, 0 8px 32px rgba(0,0,0,0.645) !important; }
      .emoji-option:hover { background: ${color}15 !important; }
      .toast-notification { border-color: ${color} !important; box-shadow: 0 0 40px ${color}20, 0 8px 32px rgba(0,0,0,0.645) !important; }
      .toast-notification i { color: ${color} !important; }
      .theme-toggle:hover { background: ${color}15 !important; border-color: ${color} !important; box-shadow: 0 8px 32px rgba(0,0,0,0.645), 0 0 40px ${color}20 !important; }
      .palette-toggle:hover { background: ${color}15 !important; border-color: ${color} !important; }
      .keyboard-hint { border-color: ${color}20 !important; color: ${color} !important; }
      .keyboard-hint kbd { border-color: ${color}20 !important; color: ${color} !important; }
      .messages-container { border-color: ${color}40 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.645), 0 0 40px ${color}15 !important; }
    `;

    localStorage.setItem("messagesAccentColor", color);
  }

  setupPalettePicker() {
    if (!this.paletteToggle || !this.paletteGrid) return;

    this.paletteToggle.addEventListener("click", () => {
      this.paletteGrid.classList.toggle("active");
    });

    document.querySelectorAll(".palette-swatch").forEach((el) => {
      el.addEventListener("click", () => {
        const color = el.dataset.color;
        this.applyAccentColor(color);
        this.paletteGrid.classList.remove("active");
        this.showToast(`🎨 Accent color changed!`, "info");
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".palette-picker")) {
        this.paletteGrid.classList.remove("active");
      }
    });

    const savedColor = localStorage.getItem("messagesAccentColor");
    if (savedColor) {
      this.applyAccentColor(savedColor);
    }
  }

  // ============================================================
  // UPDATE NOTIFICATION BADGE
  // ============================================================

  updateNotificationBadge() {
    let totalUnread = 0;
    if (this.conversations && this.conversations.length > 0) {
      this.conversations.forEach((conv) => {
        const unread = conv.unreadCount?.[this.currentUser?.uid] || 0;
        totalUnread += unread;
      });
    }
    this.unreadTotal = totalUnread;

    const badge = document.getElementById("notificationBadge");
    if (badge) {
      if (totalUnread > 0) {
        badge.textContent = totalUnread > 9 ? "9+" : totalUnread;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }
  }

  // ============================================================
  // GET CONVERSATION KEY
  // ============================================================

  getConversationKey(userId1, userId2) {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  // ============================================================
  // LOAD CONVERSATIONS
  // ============================================================

  loadConversations() {
    if (this.isLoadingConversations) {
      console.log("⏳ Conversations already loading, skipping...");
      return;
    }

    if (this.unsubscribeConversations) {
      this.unsubscribeConversations();
      this.unsubscribeConversations = null;
    }

    this.isLoadingConversations = true;

    this.conversationList.innerHTML = `
      <div class="conversation-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading conversations...</p>
      </div>
    `;

    this.unsubscribeConversations = firebase
      .firestore()
      .collection("conversations")
      .where("participants", "array-contains", this.currentUser.uid)
      .onSnapshot(
        async (snapshot) => {
          this.isLoadingConversations = false;
          this.hasLoadedConversations = true;

          if (snapshot.empty) {
            this.conversationList.innerHTML = `
            <div class="conversation-empty">
              <i class="fas fa-comment-slash"></i>
              <p>No conversations yet</p>
              <p style="font-size: 0.7rem; margin-top: 4px;">Visit an artist's profile to start messaging</p>
              <button class="empty-action-btn" id="findArtistsBtn">
                <i class="fas fa-search"></i> Find Artists
              </button>
            </div>
          `;
            const findBtn = document.getElementById("findArtistsBtn");
            if (findBtn) {
              findBtn.addEventListener("click", () => {
                window.location.href = "pages/community/search-users.html";
              });
            }
            this.conversations = [];
            this.conversationLookup = {};
            this.updateNotificationBadge();
            return;
          }

          const newConversations = [];
          const newLookup = {};

          for (const doc of snapshot.docs) {
            const data = doc.data();
            const conv = { id: doc.id, ...data };

            const otherUserId = conv.participants.find(
              (id) => id !== this.currentUser.uid,
            );
            if (otherUserId) {
              let userData = this.userCache[otherUserId];
              if (!userData) {
                try {
                  const userDoc = await firebase
                    .firestore()
                    .collection("users")
                    .doc(otherUserId)
                    .get();
                  if (userDoc.exists) {
                    userData = userDoc.data();
                    this.userCache[otherUserId] = userData;
                  }
                } catch (e) {
                  console.warn("Error loading user data:", e);
                }
              }
              conv.otherUser = {
                uid: otherUserId,
                ...userData,
              };
            }

            newConversations.push(conv);
            const key = this.getConversationKey(
              this.currentUser.uid,
              otherUserId,
            );
            newLookup[key] = conv.id;
          }

          // Deduplicate
          const uniqueConversations = [];
          const seenPairs = new Set();

          newConversations.sort((a, b) => {
            const dateA = a.lastMessageAt?.toDate?.() || new Date(0);
            const dateB = b.lastMessageAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });

          for (const conv of newConversations) {
            const otherUserId = conv.participants.find(
              (id) => id !== this.currentUser.uid,
            );
            if (otherUserId) {
              const key = this.getConversationKey(
                this.currentUser.uid,
                otherUserId,
              );
              if (!seenPairs.has(key)) {
                seenPairs.add(key);
                uniqueConversations.push(conv);
                newLookup[key] = conv.id;
              } else {
                console.log(`🗑️ Removing duplicate conversation: ${conv.id}`);
                try {
                  await firebase
                    .firestore()
                    .collection("conversations")
                    .doc(conv.id)
                    .delete();
                } catch (err) {
                  console.warn("Could not delete duplicate conversation:", err);
                }
              }
            }
          }

          uniqueConversations.sort((a, b) => {
            const dateA = a.lastMessageAt?.toDate?.() || new Date(0);
            const dateB = b.lastMessageAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });

          const currentIds = this.conversations
            .map((c) => c.id)
            .sort()
            .join(",");
          const newIds = uniqueConversations
            .map((c) => c.id)
            .sort()
            .join(",");

          if (currentIds !== newIds || this.conversations.length === 0) {
            this.conversations = uniqueConversations;
            this.conversationLookup = newLookup;
            this.updateNotificationBadge();
            this.renderConversations();

            if (this.currentConversationId) {
              const selected = this.conversations.find(
                (c) => c.id === this.currentConversationId,
              );
              if (selected) {
                this.selectConversation(selected.id);
              } else {
                this.currentConversationId = null;
                this.showPlaceholder();
              }
            }
          }
        },
        (error) => {
          this.isLoadingConversations = false;
          console.error("Error loading conversations:", error);
          this.conversationList.innerHTML = `
          <div class="conversation-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading conversations</p>
            <p style="font-size: 0.7rem; color: var(--messages-text-muted);">
              ${error.message.includes("index") ? "Please create the required index in Firebase Console" : "Please try again later"}
            </p>
          </div>
        `;
        },
      );
  }

  // ============================================================
  // RENDER CONVERSATIONS
  // ============================================================

  renderConversations() {
    if (!this.conversationList) return;

    if (this.conversations.length === 0) {
      this.conversationList.innerHTML = `
        <div class="conversation-empty">
          <i class="fas fa-comment-slash"></i>
          <p>No conversations yet</p>
        </div>
      `;
      return;
    }

    this.conversationList.innerHTML = this.conversations
      .map((conv) => {
        const user = conv.otherUser || {};
        const avatar =
          user.profilePicture || user.photoURL || user.avatarUrl || null;
        const name =
          user.displayName || user.fullname || user.username || "Artist";
        const avatarInitial = name.charAt(0).toUpperCase();
        const lastMsg = conv.lastMessage || "No messages yet";
        const timeAgo = this.formatTimeAgo(conv.lastMessageAt);
        const unreadCount = conv.unreadCount?.[this.currentUser?.uid] || 0;
        const isActive = conv.id === this.currentConversationId;

        const avatarHtml = avatar
          ? `<img src="${avatar}" alt="${name}">`
          : avatarInitial;

        return `
        <div class="conversation-item ${isActive ? "active" : ""}" data-id="${conv.id}">
          <div class="conv-avatar">${avatarHtml}</div>
          <div class="conv-info">
            <div class="conv-name">${this.escapeHtml(name)}</div>
            <div class="conv-last-msg">${this.escapeHtml(lastMsg.substring(0, 50))}</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
            <span class="conv-time">${timeAgo}</span>
            ${unreadCount > 0 ? `<span class="conv-unread">${unreadCount}</span>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    this.conversationList
      .querySelectorAll(".conversation-item")
      .forEach((el) => {
        el.addEventListener("click", () => {
          const id = el.dataset.id;
          this.selectConversation(id);
          this.markConversationRead(id);
        });
      });
  }

  // ============================================================
  // SELECT CONVERSATION
  // ============================================================

  selectConversation(conversationId) {
    this.currentConversationId = conversationId;
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    this.selectedUserId = conv.participants.find(
      (id) => id !== this.currentUser.uid,
    );
    this.updateThreadHeader(conv);
    this.loadMessages(conversationId);

    this.conversationList
      .querySelectorAll(".conversation-item")
      .forEach((el) => {
        el.classList.toggle("active", el.dataset.id === conversationId);
      });

    if (this.isMobile) {
      document.querySelector(".conversation-list").classList.add("hidden");
    }
  }

  updateThreadHeader(conv) {
    const user = conv.otherUser || {};
    const name = user.displayName || user.fullname || user.username || "Artist";
    const avatar =
      user.profilePicture || user.photoURL || user.avatarUrl || null;
    const avatarInitial = name.charAt(0).toUpperCase();

    const avatarHtml = avatar
      ? `<img src="${avatar}" alt="${name}">`
      : avatarInitial;

    this.threadAvatar.innerHTML = avatarHtml;
    this.threadAvatar.style.backgroundImage = avatar ? "" : "";
    this.threadUserName.textContent = name;
    this.threadUserStatus.textContent = "Online";
    this.threadUserStatus.className = "thread-user-status online";
    this.statusDot.className = "status-dot online";

    this.threadAvatar.onclick = (e) => {
      e.stopPropagation();
      if (this.selectedUserId) {
        this.showProfilePreview(this.selectedUserId);
      }
    };
    this.threadAvatar.style.cursor = "pointer";

    this.threadUserName.onclick = (e) => {
      e.stopPropagation();
      if (this.selectedUserId) {
        this.showProfilePreview(this.selectedUserId);
      }
    };
    this.threadUserName.style.cursor = "pointer";

    if (this.threadProfileBtn) {
      this.threadProfileBtn.onclick = () => {
        if (this.selectedUserId) {
          this.showProfilePreview(this.selectedUserId);
        }
      };
    }
  }

  // ============================================================
  // LOAD MESSAGES
  // ============================================================

  loadMessages(conversationId) {
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
      this.unsubscribeMessages = null;
    }

    this.messages = [];

    this.threadMessages.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--messages-text-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;display:block;margin-bottom:0.5rem;"></i>
        <p>Loading messages...</p>
      </div>
    `;

    this.unsubscribeMessages = firebase
      .firestore()
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snapshot) => {
          if (snapshot.empty) {
            this.messages = [];
            this.threadMessages.innerHTML = `
            <div class="thread-placeholder">
              <i class="fas fa-comment-dots"></i>
              <p>No messages yet</p>
              <p style="font-size:0.8rem;opacity:0.5;">Say hello!</p>
            </div>
          `;
            return;
          }

          const newMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          this.messages = newMessages;
          this.renderMessages();
          this.scrollToBottom();

          if (this.currentConversationId === conversationId) {
            this.markConversationRead(conversationId);
          }
        },
        (error) => {
          console.error("Error loading messages:", error);
          this.threadMessages.innerHTML = `
          <div class="thread-placeholder">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading messages</p>
            <p style="font-size:0.8rem;opacity:0.5;">Please try again</p>
          </div>
        `;
        },
      );
  }

  // ============================================================
  // RENDER MESSAGES
  // ============================================================

  renderMessages() {
    if (!this.threadMessages) return;

    if (!this.messages || this.messages.length === 0) {
      this.threadMessages.innerHTML = `
        <div class="thread-placeholder">
          <i class="fas fa-comment-dots"></i>
          <p>No messages yet</p>
          <p style="font-size:0.8rem;opacity:0.5;">Say hello!</p>
        </div>
      `;
      return;
    }

    let lastDate = null;
    let html = "";

    this.messages.forEach((msg) => {
      const msgDate = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
      const dateStr = msgDate.toDateString();

      if (dateStr !== lastDate) {
        lastDate = dateStr;
        html += `<div class="message-date-separator">${this.formatDate(dateStr)}</div>`;
      }

      const isSent = msg.senderId === this.currentUser?.uid;
      const time = msgDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const text = this.linkifyMentions(this.escapeHtml(msg.text));
      const readReceipt =
        isSent && msg.readBy?.includes(this.selectedUserId)
          ? `<span class="msg-read-receipt"><i class="fas fa-check-double"></i></span>`
          : "";

      html += `
        <div class="message-bubble ${isSent ? "sent" : "received"}">
          ${text}
          <span class="msg-time">${time} ${readReceipt}</span>
        </div>
      `;
    });

    this.threadMessages.innerHTML = html;
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.threadMessages) {
        this.threadMessages.scrollTop = this.threadMessages.scrollHeight;
      }
    }, 50);
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async sendMessage() {
    const text = this.messageInput.value.trim();
    if (
      !text ||
      !this.selectedUserId ||
      this.selectedUserId === this.currentUser?.uid
    )
      return;

    try {
      this.sendBtn.disabled = true;
      this.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      const conversationId =
        this.currentConversationId || (await this.getOrCreateConversation());

      await firebase
        .firestore()
        .collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .add({
          senderId: this.currentUser.uid,
          text: text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          readBy: [this.currentUser.uid],
        });

      await firebase
        .firestore()
        .collection("conversations")
        .doc(conversationId)
        .update({
          lastMessage: text.substring(0, 200),
          lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
          [`unreadCount.${this.selectedUserId}`]:
            firebase.firestore.FieldValue.increment(1),
        });

      this.messageInput.value = "";
      this.msgCharCount.textContent = "0";
      this.sendBtn.disabled = true;
      this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';

      if (!this.currentConversationId) {
        this.currentConversationId = conversationId;
        this.loadConversations();
      }

      await this.createNotifications(this.selectedUserId, text);
    } catch (error) {
      console.error("Error sending message:", error);
      this.showToast("Error sending message", "error");
      this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
      this.sendBtn.disabled = false;
    }
  }

  // ============================================================
  // GET OR CREATE CONVERSATION
  // ============================================================

  async getOrCreateConversation() {
    if (!this.selectedUserId || !this.currentUser) {
      throw new Error("Missing user information");
    }

    const key = this.getConversationKey(
      this.currentUser.uid,
      this.selectedUserId,
    );

    if (this.conversationLookup[key]) {
      const existingId = this.conversationLookup[key];
      this.currentConversationId = existingId;
      return existingId;
    }

    const existing = this.conversations.find(
      (c) =>
        c.participants.includes(this.selectedUserId) &&
        c.participants.includes(this.currentUser.uid),
    );
    if (existing) {
      this.conversationLookup[key] = existing.id;
      this.currentConversationId = existing.id;
      return existing.id;
    }

    try {
      const snapshot = await firebase
        .firestore()
        .collection("conversations")
        .where("participants", "array-contains", this.currentUser.uid)
        .get();

      let found = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(this.selectedUserId)) {
          found = { id: doc.id, ...data };
        }
      });

      if (found) {
        this.conversationLookup[key] = found.id;
        const otherUserId = found.participants.find(
          (id) => id !== this.currentUser.uid,
        );
        if (otherUserId && this.userCache[otherUserId]) {
          found.otherUser = {
            uid: otherUserId,
            ...this.userCache[otherUserId],
          };
        }
        const existsInArray = this.conversations.some((c) => c.id === found.id);
        if (!existsInArray) {
          this.conversations.push(found);
        }
        this.currentConversationId = found.id;
        return found.id;
      }
    } catch (error) {
      console.warn(
        "Error checking Firestore for existing conversation:",
        error,
      );
    }

    const docRef = await firebase
      .firestore()
      .collection("conversations")
      .add({
        participants: [this.currentUser.uid, this.selectedUserId],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: "",
        unreadCount: {
          [this.currentUser.uid]: 0,
          [this.selectedUserId]: 0,
        },
      });

    this.conversationLookup[key] = docRef.id;

    const newConv = {
      id: docRef.id,
      participants: [this.currentUser.uid, this.selectedUserId],
      otherUser: {
        uid: this.selectedUserId,
        ...(this.userCache[this.selectedUserId] || {}),
      },
      lastMessage: "",
      unreadCount: {
        [this.currentUser.uid]: 0,
        [this.selectedUserId]: 0,
      },
    };
    this.conversations.push(newConv);

    return docRef.id;
  }

  async markConversationRead(conversationId) {
    if (!this.currentUser) return;

    try {
      await firebase
        .firestore()
        .collection("conversations")
        .doc(conversationId)
        .update({
          [`unreadCount.${this.currentUser.uid}`]: 0,
        });
      this.updateNotificationBadge();
    } catch (error) {
      console.error("Error marking read:", error);
    }
  }

  // ============================================================
  // START CONVERSATION
  // ============================================================

  async startConversation(userId) {
    if (this.isStartingConversation) {
      console.log("⏳ Conversation already starting, skipping...");
      return;
    }

    if (userId === this.currentUser?.uid) {
      this.showToast("You can't message yourself", "error");
      return;
    }

    this.isStartingConversation = true;

    try {
      this.selectedUserId = userId;
      const key = this.getConversationKey(this.currentUser.uid, userId);

      let existingId = this.conversationLookup[key];
      if (!existingId) {
        const existing = this.conversations.find(
          (c) =>
            c.participants.includes(userId) &&
            c.participants.includes(this.currentUser.uid),
        );
        if (existing) {
          existingId = existing.id;
          this.conversationLookup[key] = existingId;
        }
      }

      if (existingId) {
        this.selectConversation(existingId);
        this.markConversationRead(existingId);
        this.isStartingConversation = false;
        return;
      }

      this.conversationList.innerHTML = `
        <div class="conversation-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Creating conversation...</p>
        </div>
      `;

      const convId = await this.getOrCreateConversation();
      this.loadConversations();

      setTimeout(() => {
        this.selectConversation(convId);
        this.markConversationRead(convId);
        this.isStartingConversation = false;
      }, 500);
    } catch (error) {
      console.error("Error starting conversation:", error);
      this.showToast("Error creating conversation", "error");
      this.isStartingConversation = false;
    }

    if (this.isMobile) {
      document.querySelector(".conversation-list").classList.add("hidden");
    }
  }

  // ============================================================
  // CREATE NOTIFICATIONS
  // ============================================================

  async createNotifications(recipientId, text) {
    try {
      const senderName =
        this.currentUser.displayName ||
        this.userCache[this.currentUser.uid]?.fullname ||
        this.userCache[this.currentUser.uid]?.username ||
        "User";

      if (recipientId !== this.currentUser.uid) {
        await firebase
          .firestore()
          .collection("users")
          .doc(recipientId)
          .collection("notifications")
          .add({
            type: "message",
            data: {
              fromUserId: this.currentUser.uid,
              fromUserName: senderName,
              conversationId: this.currentConversationId,
              preview: text.substring(0, 60) + (text.length > 60 ? "..." : ""),
            },
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

        const userRef = firebase
          .firestore()
          .collection("users")
          .doc(recipientId);
        await userRef.set(
          {
            unreadNotifications: firebase.firestore.FieldValue.increment(1),
          },
          { merge: true },
        );
      }

      const mentions = text.match(/@([\w.]+)/g) || [];
      for (const mention of mentions) {
        const username = mention.substring(1);
        const userDoc = await firebase
          .firestore()
          .collection("users")
          .where("username", "==", username)
          .limit(1)
          .get();

        if (!userDoc.empty) {
          const user = userDoc.docs[0];
          if (user.id !== this.currentUser.uid && user.id !== recipientId) {
            await firebase
              .firestore()
              .collection("users")
              .doc(user.id)
              .collection("notifications")
              .add({
                type: "mention",
                data: {
                  fromUserId: this.currentUser.uid,
                  fromUserName: senderName,
                  message: text.substring(0, 100),
                  conversationId: this.currentConversationId,
                  preview:
                    text.substring(0, 60) + (text.length > 60 ? "..." : ""),
                },
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              });

            const userRef = firebase
              .firestore()
              .collection("users")
              .doc(user.id);
            await userRef.set(
              {
                unreadNotifications: firebase.firestore.FieldValue.increment(1),
              },
              { merge: true },
            );
          }
        }
      }
    } catch (error) {
      console.error("Error creating notifications:", error);
    }
  }

  // ============================================================
  // PROFILE PREVIEW
  // ============================================================

  async showProfilePreview(userId) {
    try {
      const doc = await firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .get();

      if (!doc.exists) return;

      const data = doc.data();
      const name = data.fullname || data.username || "Artist";
      const username = data.username || "artist";
      const avatar =
        data.profilePicture || data.photoURL || data.avatarUrl || null;
      const bio = data.bio || "No bio available";
      const stats = data.stats || { artworks: 0, followers: 0 };

      this.previewName.textContent = name;
      this.previewUsername.textContent = `@${username}`;
      this.previewBio.textContent = bio;
      this.previewArtworks.textContent = stats.artworks || 0;
      this.previewFollowers.textContent = stats.followers || 0;

      if (avatar) {
        this.previewAvatar.style.backgroundImage = `url(${avatar})`;
        this.previewAvatar.style.backgroundSize = "cover";
        this.previewAvatar.style.backgroundPosition = "center";
        this.previewAvatar.textContent = "";
      } else {
        this.previewAvatar.style.backgroundImage = "";
        this.previewAvatar.textContent = name.charAt(0).toUpperCase();
      }

      this.previewViewProfile.onclick = () => {
        window.location.href = `pages/community/profiles.html?user=${userId}`;
      };

      this.profilePreviewModal.classList.add("active");
    } catch (error) {
      console.error("Error loading profile preview:", error);
      this.showToast("Error loading profile", "error");
    }
  }

  closeProfilePreview() {
    this.profilePreviewModal.classList.remove("active");
  }

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        window.location.href = "pages/community/search-users.html";
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        if (this.currentUser) {
          window.location.href = `pages/community/profiles.html?user=${this.currentUser.uid}`;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        window.location.href = "pages/community/search-users.html";
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "c" || e.key === "C")
      ) {
        e.preventDefault();
        this.paletteGrid.classList.toggle("active");
        if (this.paletteGrid.classList.contains("active")) {
          this.showToast("🎨 Color picker opened!", "info");
        }
      }

      if (e.key === "g" || e.key === "G") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          this.triggerGlitch();
        }
      }

      if (e.key === "t" || e.key === "T") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          this.showToast("✨ Keyboard shortcut test!", "info");
        }
      }

      if (e.key >= "1" && e.key <= "5" && !e.ctrlKey && !e.metaKey) {
        const index = parseInt(e.key) - 1;
        const items =
          this.conversationList.querySelectorAll(".conversation-item");
        if (items[index]) {
          items[index].click();
        }
      }
    });
  }

  // ============================================================
  // GLITCH EFFECT
  // ============================================================

  triggerGlitch() {
    if (this.isGlitching) return;
    this.isGlitching = true;

    const container = this.messagesContainer;
    container.style.animation = "none";
    container.offsetHeight;
    container.style.animation = "glitchFlash 0.3s ease 2";

    const style = document.createElement("style");
    style.textContent = `
      @keyframes glitchFlash {
        0% { opacity: 1; transform: translate(0); filter: hue-rotate(0deg); }
        10% { opacity: 0.7; transform: translate(-3px, 2px); filter: hue-rotate(60deg); }
        20% { opacity: 0.9; transform: translate(3px, -1px); filter: hue-rotate(-30deg); }
        30% { opacity: 0.5; transform: translate(-1px, 3px); filter: hue-rotate(120deg); }
        40% { opacity: 0.8; transform: translate(2px, -2px); filter: hue-rotate(-60deg); }
        50% { opacity: 0.6; transform: translate(-2px, 1px); filter: hue-rotate(180deg); }
        60% { opacity: 0.9; transform: translate(1px, -3px); filter: hue-rotate(-90deg); }
        70% { opacity: 0.7; transform: translate(-3px, -1px); filter: hue-rotate(90deg); }
        80% { opacity: 0.8; transform: translate(2px, 2px); filter: hue-rotate(-45deg); }
        90% { opacity: 0.9; transform: translate(-1px, -2px); filter: hue-rotate(45deg); }
        100% { opacity: 1; transform: translate(0); filter: hue-rotate(0deg); }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      container.style.animation = "";
      style.remove();
      this.isGlitching = false;
    }, 600);
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  setupEventListeners() {
    this.sendBtn.addEventListener("click", () => this.sendMessage());

    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.messageInput.addEventListener("input", () => {
      const length = this.messageInput.value.length;
      this.msgCharCount.textContent = length;
      this.sendBtn.disabled = length === 0 || length > 2000;
    });

    this.threadBackBtn.addEventListener("click", () => {
      document.querySelector(".conversation-list").classList.remove("hidden");
    });

    this.emojiToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emojiPicker.classList.toggle("visible");
    });

    document.querySelectorAll(".emoji-option").forEach((el) => {
      el.addEventListener("click", () => {
        const emoji = el.textContent.trim();
        const cursorPos = this.messageInput.selectionStart;
        const text = this.messageInput.value;
        const newText =
          text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
        this.messageInput.value = newText;
        this.messageInput.focus();
        const newCursorPos = cursorPos + emoji.length;
        this.messageInput.selectionStart = newCursorPos;
        this.messageInput.selectionEnd = newCursorPos;
        this.messageInput.dispatchEvent(new Event("input"));
        this.emojiPicker.classList.remove("visible");
      });
    });

    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".emoji-picker") &&
        !e.target.closest("#emojiToggleBtn")
      ) {
        this.emojiPicker.classList.remove("visible");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.emojiPicker.classList.remove("visible");
      }
    });

    this.fabNewChat.addEventListener("click", () => {
      window.location.href = "pages/community/search-users.html";
    });

    document
      .getElementById("closePreviewModal")
      .addEventListener("click", () => {
        this.closeProfilePreview();
      });
    this.profilePreviewModal.addEventListener("click", (e) => {
      if (e.target === this.profilePreviewModal) {
        this.closeProfilePreview();
      }
    });

    this.setupKeyboardShortcuts();
  }

  // ============================================================
  // MOBILE VIEW
  // ============================================================

  updateMobileView() {
    if (this.isMobile && this.currentConversationId) {
      document.querySelector(".conversation-list").classList.add("hidden");
    } else {
      document.querySelector(".conversation-list").classList.remove("hidden");
    }
    this.threadBackBtn.style.display = this.isMobile ? "block" : "none";
  }

  // ============================================================
  // UTILITY
  // ============================================================

  linkifyMentions(text) {
    if (!text) return "";
    return text.replace(/@([\w.]+)/g, (match, username) => {
      return `<span class="msg-mention">@${username}</span>`;
    });
  }

  formatTimeAgo(date) {
    if (!date) return "Just now";
    const now = Date.now();
    const diff =
      now - (date.toDate ? date.toDate().getTime() : new Date(date).getTime());

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = "info") {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast) return;

    toastMessage.textContent = message;

    if (type === "error") {
      toast.style.borderColor = "#ef4444";
      const icon = toast.querySelector("i");
      if (icon) {
        icon.style.color = "#ef4444";
        icon.className = "fas fa-exclamation-circle";
      }
    } else {
      toast.style.borderColor = this.accentColor;
      const icon = toast.querySelector("i");
      if (icon) {
        icon.style.color = this.accentColor;
        icon.className = "fas fa-check-circle";
      }
    }

    toast.classList.add("show");
    toast.style.display = "flex";

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.style.display = "none";
      }, 500);
    }, 3000);
  }

  showPlaceholder() {
    this.threadMessages.innerHTML = `
      <div class="thread-placeholder">
        <i class="fas fa-comments"></i>
        <p>Select a conversation to start messaging</p>
      </div>
    `;
    this.threadUserName.textContent = "Select a conversation";
    this.threadUserStatus.textContent = "";
    this.statusDot.className = "status-dot offline";
    this.threadAvatar.innerHTML = "U";
    this.threadAvatar.style.backgroundImage = "";
    this.threadAvatar.onclick = null;
    this.threadUserName.onclick = null;
    this.threadAvatar.style.cursor = "default";
    this.threadUserName.style.cursor = "default";
  }
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  window.messagesSystem = new MessagesSystem();
});
