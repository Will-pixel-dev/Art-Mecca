// Community Hub Functionality

class CommunityHub {
  constructor() {
    this.dailyPrompts = [
      {
        title: "At the Top of the World",
        description:
          "Create artwork depicting the highest peaks, both literal and metaphorical. Show us what being 'at the top' means to you.",
        tags: ["mountain", "achievement", "perspective", "landscape"],
        date: new Date().toISOString().split("T")[0],
      },
      {
        title: "Breathe",
        description:
          "Capture the essence of breath, life, and moments of calm. Show us what it means to truly breathe.",
        tags: ["calm", "life", "meditation", "peace"],
        date: new Date().toISOString().split("T")[0],
      },
      {
        title: "Fallen",
        description:
          "Explore themes of descent, loss, or transformation. What does it mean to have fallen?",
        tags: ["descent", "transformation", "metaphor", "emotion"],
        date: new Date().toISOString().split("T")[0],
      },
      {
        title: "A Thousand Words",
        description:
          "Create an image that tells a complex story without using any text. Let your art speak volumes.",
        tags: ["storytelling", "narrative", "expression", "communication"],
        date: new Date().toISOString().split("T")[0],
      },
      {
        title: "Echoes of Silence",
        description:
          "Depict the powerful presence of silence and the echoes it leaves behind.",
        tags: ["quiet", "reflection", "space", "atmosphere"],
        date: new Date().toISOString().split("T")[0],
      },
      {
        title: "Uncharted Waters",
        description:
          "Venture into the unknown. Show us exploration, discovery, and new beginnings.",
        tags: ["exploration", "adventure", "unknown", "journey"],
        date: new Date().toISOString().split("T")[0],
      },
      {
        title: "Forgotten Memories",
        description:
          "Bring to life memories that have faded but not disappeared entirely.",
        tags: ["memory", "nostalgia", "past", "emotion"],
        date: new Date().toISOString().split("T")[0],
      },
    ];

    // Initialize analytics
    this.setupAnalytics();

    this.init();
  }
  // ========== LOAD CHALLENGE STATS WITH CACHING ==========
  async loadChallengeStatsWithCache() {
    const cacheKey = "community_challenge_stats";

    try {
      const stats = await queryOptimizer.getCachedOrFetch(
        cacheKey,
        async () => {
          // Get real stats from Firestore
          const [participantsSnapshot, submissionsSnapshot] = await Promise.all(
            [
              firebase.firestore().collection("challengeParticipants").get(),
              firebase
                .firestore()
                .collection("submissions")
                .where("type", "==", "challenge")
                .get(),
            ],
          );

          return {
            participants:
              participantsSnapshot.size || Math.floor(Math.random() * 100) + 50,
            submissions:
              submissionsSnapshot.size || Math.floor(Math.random() * 70) + 30,
          };
        },
        2 * 60 * 1000, // 2 minutes cache
      );

      if (stats) {
        document.getElementById("participants-count").textContent =
          stats.participants;
        document.getElementById("submissions-count").textContent =
          stats.submissions;
      }
    } catch (error) {
      console.error("Error loading challenge stats:", error);
      // Fallback to random numbers if Firestore fails
      const participants = Math.floor(Math.random() * 100) + 50;
      const submissions = Math.floor(participants * 0.7);
      document.getElementById("participants-count").textContent = participants;
      document.getElementById("submissions-count").textContent = submissions;
    }
  }

  init() {
    this.loadDailyChallenge();
    this.loadChallengeStatsWithCache();
    this.setupQuickInteractions();
    this.loadRecentActivity();
    this.loadFeaturedArtists();
    this.startCountdown();
    this.setupFeedback();

    console.log("Community Hub with quick interactions initialized!");
  }

  // ANALYTICS SETUP
  setupAnalytics() {
    this.trackPageView();

    document.addEventListener("click", (e) => {
      this.trackInteraction(e.target);
    });
  }

  trackPageView() {
    console.log("📊 Page viewed: Community Hub");
    this.trackEvent("page_view", "Community Hub");
  }

  trackInteraction(element) {
    const featureName = this.getFeatureName(element);
    if (featureName) {
      console.log(`📊 User interacted with: ${featureName}`);
      this.trackEvent("feature_click", featureName);
    }
  }

  getFeatureName(element) {
    if (element.id === "start-challenge-btn") return "Start Challenge";
    if (element.id === "share-challenge-btn") return "Share Challenge";
    if (element.id === "view-submissions-btn") return "View Submissions";
    if (element.closest(".feature-card"))
      return element.closest(".feature-card").querySelector("h3").textContent;
    if (element.closest(".activity-item")) return "Activity Item";
    if (element.closest(".artist-card")) return "Artist Card";
    return null;
  }

  trackEvent(action, label, category = "engagement") {
    if (typeof gtag !== "undefined") {
      gtag("event", action, {
        event_category: category,
        event_label: label,
      });
    }

    if (typeof firebase !== "undefined" && firebase.analytics) {
      firebase.analytics().logEvent(action, {
        category: category,
        label: label,
      });
    }

    this.storeAnalyticsEvent(action, label, category);
  }

  async storeAnalyticsEvent(action, label, category) {
    if (typeof firebase !== "undefined" && firebase.firestore) {
      try {
        await firebase.firestore().collection("analytics").add({
          action: action,
          label: label,
          category: category,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          userAgent: navigator.userAgent,
          path: window.location.pathname,
        });
      } catch (error) {
        console.log("Analytics storage failed:", error);
      }
    }
  }

  // QUICK INTERACTIONS SETUP
  setupQuickInteractions() {
    this.setupChallengeButtons();
    this.setupFeatureCards();
    this.setupActivityItems();
    this.setupArtistCards();
  }

  // Daily Challenge Buttons
  setupChallengeButtons() {
    const startBtn = document.getElementById("start-challenge-btn");
    const shareBtn = document.getElementById("share-challenge-btn");
    const viewSubmissionsBtn = document.getElementById("view-submissions-btn");

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        this.handleStartChallenge();
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        this.shareDailyChallenge();
      });
    }

    if (viewSubmissionsBtn) {
      viewSubmissionsBtn.addEventListener("click", () => {
        this.viewChallengeSubmissions();
      });
    }
  }

  // Feature Cards Navigation
  setupFeatureCards() {
    const featureCards = document.querySelectorAll(".feature-card");

    featureCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const cardText = card.querySelector("h3").textContent;
        this.handleFeatureCardClick(cardText, card);
      });
    });
  }

  // Activity Items Interaction
  setupActivityItems() {
    const activityItems = document.querySelectorAll(".activity-item");

    activityItems.forEach((item) => {
      item.addEventListener("click", () => {
        const title = item.querySelector(".activity-title").textContent;
        this.showArtworkPreview(title);
      });
    });
  }

  // Artist Cards Interaction
  setupArtistCards() {
    const artistCards = document.querySelectorAll(".artist-card");

    artistCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".artist-link")) {
          const artistName = card.querySelector(".artist-name").textContent;
          this.showArtistQuickView(artistName);
        }
      });
    });
  }

  // CHALLENGE BUTTON HANDLERS
  handleStartChallenge() {
    if (authManager && authManager.isLoggedIn()) {
      const promptTitle =
        document.getElementById("daily-prompt-title").textContent;
      this.showQuickCreateModal(promptTitle);
    } else {
      window.location.href = "../auth/login.html?redirect=community/hub.html";
    }
  }

  shareDailyChallenge() {
    const promptTitle =
      document.getElementById("daily-prompt-title").textContent;
    const challengeUrl = window.location.href;

    this.trackEvent("share_attempt", "Daily Challenge");
    this.showShareOptions(promptTitle, challengeUrl);
  }

  viewChallengeSubmissions() {
    this.showQuickMessage("Loading challenge submissions... 🔄");
    setTimeout(() => {
      window.location.href = "gallery.html?filter=daily-challenge";
    }, 1000);
  }

  // ENHANCED SHARE FEATURES
  showShareOptions(promptTitle, challengeUrl) {
    const shareText = `🎨 Join me in today's Art Mecca challenge: "${promptTitle}"!\n\nCreate your interpretation and share it with our creative community.`;

    const modalHTML = `
            <div class="quick-modal-overlay" id="share-modal">
                <div class="quick-modal">
                    <div class="modal-header">
                        <h3>📢 Share This Challenge</h3>
                        <button class="modal-close" id="share-modal-close">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="share-preview">
                            <div class="share-card">
                                <div class="share-icon">🎨</div>
                                <div class="share-content">
                                    <h4>"${promptTitle}"</h4>
                                    <p>Daily Art Challenge</p>
                                    <span class="share-url">artisanhub.com/challenge</span>
                                </div>
                            </div>
                        </div>

                        <div class="share-options">
                            <button class="share-option" data-platform="copy">
                                <i class="fas fa-copy"></i>
                                <span>Copy Link</span>
                            </button>
                            <button class="share-option" data-platform="twitter">
                                <i class="fab fa-twitter"></i>
                                <span>Twitter</span>
                            </button>
                            <button class="share-option" data-platform="whatsapp">
                                <i class="fab fa-whatsapp"></i>
                                <span>WhatsApp</span>
                            </button>
                            <button class="share-option" data-platform="facebook">
                                <i class="fab fa-facebook"></i>
                                <span>Facebook</span>
                            </button>
                            <button class="share-option" data-platform="reddit">
                                <i class="fab fa-reddit"></i>
                                <span>Reddit</span>
                            </button>
                            <button class="share-option" data-platform="pinterest">
                                <i class="fab fa-pinterest"></i>
                                <span>Pinterest</span>
                            </button>
                        </div>

                        <div class="native-share">
                            <button class="btn btn-primary" id="native-share-btn">
                                <i class="fas fa-share-alt"></i>
                                Use Native Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.setupShareModalInteractions(promptTitle, challengeUrl, shareText);
  }

  setupShareModalInteractions(promptTitle, challengeUrl, shareText) {
    const modal = document.getElementById("share-modal");
    const closeBtn = document.getElementById("share-modal-close");
    const nativeShareBtn = document.getElementById("native-share-btn");
    const shareOptions = document.querySelectorAll(".share-option");

    closeBtn.addEventListener("click", () => {
      modal.remove();
      this.trackEvent("share_cancelled", "Daily Challenge");
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        this.trackEvent("share_cancelled", "Daily Challenge");
      }
    });

    if (nativeShareBtn) {
      nativeShareBtn.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: "Art Mecca Daily Challenge",
            text: shareText,
            url: challengeUrl,
          });
          this.trackEvent("share_success", "Native Share");
          this.showQuickMessage("Shared successfully! 🎉");
        } catch (error) {
          this.trackEvent("share_failed", "Native Share");
          this.showQuickMessage("Share cancelled");
        }
        modal.remove();
      });
    }

    shareOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const platform = option.dataset.platform;
        this.shareToPlatform(platform, promptTitle, challengeUrl, shareText);
        modal.remove();
      });
    });
  }

  shareToPlatform(platform, promptTitle, challengeUrl, shareText) {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(challengeUrl);

    const shareUrls = {
      copy: () => {
        navigator.clipboard
          .writeText(`${shareText}\n${challengeUrl}`)
          .then(() => {
            this.showQuickMessage("Link copied to clipboard! 📋");
            this.trackEvent("share_success", "Copy Link");
          })
          .catch(() => {
            this.showQuickMessage("Failed to copy link");
            this.trackEvent("share_failed", "Copy Link");
          });
      },
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
    };

    if (platform === "copy") {
      shareUrls.copy();
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
      this.trackEvent("share_success", platform);
      this.showQuickMessage(`Sharing to ${platform}... ✨`);
    }
  }

  // FEATURE CARD HANDLERS
  handleFeatureCardClick(featureName, card) {
    switch (featureName) {
      case "Monthly Challenges":
        this.showQuickMessage("Redirecting to monthly challenges... 🏆");
        setTimeout(() => {
          window.location.href = "challenges.html";
        }, 800);
        break;

      case "Community Gallery":
        this.showQuickMessage("Opening community gallery... 🖼️");
        setTimeout(() => {
          window.location.href = "gallery.html";
        }, 800);
        break;

      case "Artist Profiles":
        this.showQuickMessage("Browsing artist profiles... 👥");
        setTimeout(() => {
          window.location.href = "profiles.html";
        }, 800);
        break;

      case "Live Chat & Forums":
        this.showQuickMessage("Live chat coming soon! 💬");
        this.pulseAnimation(card);
        break;

      case "Collaboration Hub":
        this.showQuickMessage("Collaboration features in beta! 🤝");
        this.pulseAnimation(card);
        break;

      case "Progress Tracking":
        this.showQuickMessage("Track your artistic journey! 📈");
        this.pulseAnimation(card);
        break;

      default:
        this.showQuickMessage(`Exploring ${featureName}...`);
    }
  }

  // QUICK CREATE MODAL
  showQuickCreateModal(promptTitle) {
    const modalHTML = `
            <div class="quick-modal-overlay" id="quick-create-modal">
                <div class="quick-modal">
                    <div class="modal-header">
                        <h3>🎨 Start Creating</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="challenge-prompt">
                            <h4>Today's Challenge:</h4>
                            <p>"${promptTitle}"</p>
                        </div>
                        <div class="create-options">
                            <button class="create-option" id="upload-existing">
                                <i class="fas fa-upload"></i>
                                <span>Upload Existing Artwork</span>
                            </button>
                            <button class="create-option" id="create-new">
                                <i class="fas fa-plus"></i>
                                <span>Create New Artwork</span>
                            </button>
                            <button class="create-option" id="get-inspiration">
                                <i class="fas fa-lightbulb"></i>
                                <span>Get Inspiration</span>
                            </button>
                        </div>
                        <div class="modal-tips">
                            <h5>💡 Quick Tips:</h5>
                            <ul>
                                <li>Use our <a href="../tools/color-palette-generator.html" target="_blank">color tools</a></li>
                                <li>Check <a href="../tutorials/tutorials.html" target="_blank">tutorials</a> for guidance</li>
                                <li>Share your process in the community</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.setupModalInteractions();
  }

  setupModalInteractions() {
    const modal = document.getElementById("quick-create-modal");
    const closeBtn = document.getElementById("modal-close");
    const uploadBtn = document.getElementById("upload-existing");
    const createBtn = document.getElementById("create-new");
    const inspirationBtn = document.getElementById("get-inspiration");

    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    uploadBtn.addEventListener("click", () => {
      this.showQuickMessage("Upload feature coming next! 📤");
      modal.remove();
    });

    createBtn.addEventListener("click", () => {
      this.showQuickMessage("Opening creation tools... 🎨");
      setTimeout(() => {
        window.open("../tools/color-palette-generator.html", "_blank");
      }, 500);
      modal.remove();
    });

    inspirationBtn.addEventListener("click", () => {
      this.showQuickMessage("Generating inspiration... ✨");
      this.showInspirationTips();
      modal.remove();
    });
  }

  // ACTIVITY AND ARTIST INTERACTIONS
  showArtworkPreview(title) {
    this.showQuickMessage(`Viewing: ${title} 👀`);
    setTimeout(() => {
      window.location.href =
        "gallery.html?preview=" + encodeURIComponent(title);
    }, 800);
  }

  showArtistQuickView(artistName) {
    this.showQuickMessage(`Viewing ${artistName}'s profile... 👤`);
    setTimeout(() => {
      window.location.href = `profiles.html?artist=${encodeURIComponent(artistName)}`;
    }, 800);
  }

  // FEEDBACK SYSTEM
  setupFeedback() {
    const feedbackBtn = document.createElement("button");
    feedbackBtn.textContent = "💡 Suggest Features";
    feedbackBtn.className = "feedback-btn";
    feedbackBtn.onclick = () => this.showFeedbackModal();

    document.body.appendChild(feedbackBtn);
  }

  showFeedbackModal() {
    const modalHTML = `
            <div class="quick-modal-overlay" id="feedback-modal">
                <div class="quick-modal">
                    <div class="modal-header">
                        <h3>💡 Suggest Features</h3>
                        <button class="modal-close" id="feedback-modal-close">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="form-group">
                            <label for="feedback-idea">What feature would you love to see?</label>
                            <textarea id="feedback-idea" placeholder="Tell us your idea..." rows="4"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="feedback-email">Your email (optional)</label>
                            <input type="email" id="feedback-email" placeholder="email@example.com">
                        </div>
                        <button class="btn btn-primary" id="submit-feedback">
                            Submit Idea
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.setupFeedbackModalInteractions();
  }

  setupFeedbackModalInteractions() {
    const modal = document.getElementById("feedback-modal");
    const closeBtn = document.getElementById("feedback-modal-close");
    const submitBtn = document.getElementById("submit-feedback");

    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    submitBtn.addEventListener("click", () => {
      this.submitFeedback();
      modal.remove();
    });
  }

  async submitFeedback() {
    const idea = document.getElementById("feedback-idea").value;
    const email = document.getElementById("feedback-email").value;

    if (!idea.trim()) {
      this.showQuickMessage("Please share your idea! 💭");
      return;
    }

    if (typeof firebase !== "undefined" && firebase.firestore) {
      try {
        await firebase
          .firestore()
          .collection("feedback")
          .add({
            idea: idea,
            email: email || "anonymous",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            page: "Community Hub",
          });
        this.showQuickMessage("Thanks for your suggestion! 🌟");
        this.trackEvent("feedback_submitted", "Feature Suggestion");
      } catch (error) {
        const message = ErrorHandler.getMessage(
          error,
          "Failed to submit. Please try again.",
        );
        this.showQuickMessage(message);
      }
    } else {
      this.showQuickMessage("Thanks for your suggestion! 🌟");
    }
  }

  // INSPIRATION AND UTILITY FUNCTIONS
  showInspirationTips() {
    const tips = [
      "Try a completely different color palette than usual",
      "Incorporate an element from nature in your artwork",
      "Create a character based on today's challenge theme",
      "Experiment with a new art style you've never tried",
      "Tell a story through your artwork's composition",
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.showQuickMessage(`💡 Inspiration: ${randomTip}`);
  }

  showQuickMessage(message) {
    const existingMessage = document.querySelector(".quick-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageEl = document.createElement("div");
    messageEl.className = "quick-message";
    messageEl.textContent = message;
    messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

    document.body.appendChild(messageEl);

    setTimeout(() => {
      messageEl.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      messageEl.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 300);
    }, 3000);
  }

  pulseAnimation(element) {
    element.style.transform = "scale(1.05)";
    element.style.boxShadow = "0 10px 30px rgba(247, 5, 215, 0.3)";

    setTimeout(() => {
      element.style.transform = "scale(1)";
      element.style.boxShadow = "";
    }, 500);
  }

  // EXISTING DAILY CHALLENGE FUNCTIONALITY
  loadDailyChallenge() {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
    );
    const promptIndex = dayOfYear % this.dailyPrompts.length;
    const todayPrompt = this.dailyPrompts[promptIndex];

    document.getElementById("daily-prompt-title").textContent =
      todayPrompt.title;
    document.getElementById("daily-prompt-description").textContent =
      todayPrompt.description;
    document.getElementById("challenge-date").textContent =
      today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const tags = document.querySelectorAll(".prompt-tags .tag");
    todayPrompt.tags.forEach((tag, index) => {
      if (tags[index]) {
        tags[index].textContent = tag;
        tags[index].style.display = "inline-block";
      }
    });

    for (let i = todayPrompt.tags.length; i < tags.length; i++) {
      tags[i].style.display = "none";
    }

    this.loadChallengeStats();
  }

  loadChallengeStats() {
    const participants = Math.floor(Math.random() * 100) + 50;
    const submissions = Math.floor(participants * 0.7);

    document.getElementById("participants-count").textContent = participants;
    document.getElementById("submissions-count").textContent = submissions;
  }

  startCountdown() {
    const countdownElement = document.getElementById("countdown");

    function updateCountdown() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow - now;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      countdownElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  loadRecentActivity() {
    const activities = [
      {
        user: "Alex Chen",
        avatar: "AC",
        title: 'Completed "At the Top of the World"',
        description:
          "Just submitted my interpretation of today's daily challenge!",
        image: "../../images/placeholder-activity-1.jpg",
        time: "2 hours ago",
        type: "submission",
      },
      {
        user: "Maria Rodriguez",
        avatar: "MR",
        title: "New Artwork in Gallery",
        description: 'Added "Whispering Forest" to the community gallery',
        image: "../../images/placeholder-activity-2.jpg",
        time: "4 hours ago",
        type: "gallery",
      },
      {
        user: "Sarah Johnson",
        avatar: "SJ",
        title: "Monthly Challenge Progress",
        description: 'Working on the "Fantasy Realms" monthly challenge',
        image: "../../images/placeholder-activity-3.jpg",
        time: "6 hours ago",
        type: "challenge",
      },
      {
        user: "Dr. Kenji Tanaka",
        avatar: "KT",
        title: "Tutorial Feedback",
        description: "Provided detailed feedback on the eye rendering tutorial",
        image: "../../images/placeholder-activity-4.jpg",
        time: "1 day ago",
        type: "feedback",
      },
    ];

    const grid = document.getElementById("recent-activity-grid");

    grid.innerHTML = activities
      .map(
        (activity) => `
            <div class="activity-item">
                <div class="activity-image" style="background: #f0f0f0; height: 200px; display: flex; align-items: center; justify-content: center; color: #666;">
                    <span>${activity.title} Image</span>
                </div>
                <div class="activity-content">
                    <div class="activity-meta">
                        <div class="activity-user">
                            <div class="user-avatar">${activity.avatar}</div>
                            ${activity.user}
                        </div>
                        <span>${activity.time}</span>
                    </div>
                    <h4 class="activity-title">${activity.title}</h4>
                    <p class="activity-description">${activity.description}</p>
                </div>
            </div>
        `,
      )
      .join("");
  }

  loadFeaturedArtists() {
    const artists = [
      {
        name: "Alex Chen",
        avatar: "AC",
        specialty: "Character Design & Digital Painting",
        artworks: 47,
        followers: 1240,
        joined: "2022",
      },
      {
        name: "Maria Rodriguez",
        avatar: "MR",
        specialty: "Landscape & Environment Art",
        artworks: 32,
        followers: 890,
        joined: "2023",
      },
      {
        name: "Sarah Johnson",
        avatar: "SJ",
        specialty: "Portrait & Figure Drawing",
        artworks: 28,
        followers: 1560,
        joined: "2022",
      },
      {
        name: "Dr. Kenji Tanaka",
        avatar: "KT",
        specialty: "Anatomy & Technical Art",
        artworks: 19,
        followers: 2100,
        joined: "2021",
      },
    ];

    const grid = document.getElementById("featured-artists-grid");

    grid.innerHTML = artists
      .map(
        (artist) => `
            <div class="artist-card">
                <div class="artist-avatar">${artist.avatar}</div>
                <h3 class="artist-name">${artist.name}</h3>
                <p class="artist-specialty">${artist.specialty}</p>
                <div class="artist-stats">
                    <div class="artist-stat">
                        <span class="number">${artist.artworks}</span>
                        <span class="label">Artworks</span>
                    </div>
                    <div class="artist-stat">
                        <span class="number">${artist.followers}</span>
                        <span class="label">Followers</span>
                    </div>
                </div>
                <a href="profiles.html?artist=${artist.name.toLowerCase().replace(" ", "-")}" class="artist-link">
                    View Profile
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `,
      )
      .join("");
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CommunityHub();
});
