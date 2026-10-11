// ============================================
// COMMUNITY HUB - COMPLETE FUNCTIONALITY
// Reads challenges from Firestore, shows real stats
// ============================================

class CommunityHub {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
    this.db = firebase.firestore();

    this.countdownIntervals = {
      daily: null,
      weekly: null,
      monthly: null,
      yearly: null,
    };

    // Active challenges loaded from Firestore (or generated as fallback)
    this.activeChallenges = {
      daily: null,
      weekly: null,
      monthly: null,
      yearly: null,
    };

    // Local fallback themes (used only when Firestore is empty)
    this.dailyPrompts = [
      { title: "At the Top of the World", description: "Create artwork depicting the highest peaks, both literal and metaphorical. Show us what being 'at the top' means to you.", tags: ["mountain", "achievement", "perspective", "landscape"] },
      { title: "Breathe", description: "Capture the essence of breath, life, and moments of calm. Show us what it means to truly breathe.", tags: ["calm", "life", "meditation", "peace"] },
      { title: "Fallen", description: "Explore themes of descent, loss, or transformation. What does it mean to have fallen?", tags: ["descent", "transformation", "metaphor", "emotion"] },
      { title: "A Thousand Words", description: "Create an image that tells a complex story without using any text. Let your art speak volumes.", tags: ["storytelling", "narrative", "expression", "communication"] },
      { title: "Echoes of Silence", description: "Depict the powerful presence of silence and the echoes it leaves behind.", tags: ["quiet", "reflection", "space", "atmosphere"] },
      { title: "Uncharted Waters", description: "Venture into the unknown. Show us exploration, discovery, and new beginnings.", tags: ["exploration", "adventure", "unknown", "journey"] },
      { title: "Forgotten Memories", description: "Bring to life memories that have faded but not disappeared entirely.", tags: ["memory", "nostalgia", "past", "emotion"] },
      { title: "Neon Dreams", description: "Create a vibrant, neon-infused artwork that captures the energy of the night.", tags: ["neon", "night", "vibrant", "urban"] },
      { title: "Silent Echo", description: "Depict the powerful presence of silence and the echoes it leaves behind.", tags: ["quiet", "reflection", "space", "atmosphere"] },
      { title: "Golden Hour", description: "Capture the magic of golden hour light in your artwork.", tags: ["lighting", "warm", "magic", "sunset"] },
    ];

    this.weeklyThemes = [
      { title: "Urban Jungle", description: "Create artwork that blends city architecture with natural elements.", tags: ["cityscape", "nature", "surreal", "contrast"] },
      { title: "Golden Hour Glow", description: "Capture the magic of the golden hour - that brief moment when the sun casts everything in warm, glowing light.", tags: ["golden hour", "lighting", "warm", "transition"] },
      { title: "Silent Stories", description: "Create artwork that tells a story without words.", tags: ["storytelling", "narrative", "silence", "expression"] },
      { title: "Fractured Realities", description: "Explore the beauty in broken things.", tags: ["fractured", "abstract", "broken", "perspective"] },
      { title: "Midnight Musings", description: "Capture the introspection and mystery of the midnight hour.", tags: ["night", "introspection", "quiet", "intimate"] },
      { title: "Abstract Emotions", description: "Translate feelings into abstract form.", tags: ["abstract", "emotion", "feeling", "expression"] },
      { title: "Culinary Canvas", description: "Treat food as art.", tags: ["food", "culinary", "creative", "composition"] },
      { title: "Dance of the Elements", description: "Capture movement and energy in a single frame.", tags: ["dance", "movement", "energy", "grace"] },
      { title: "Futuristic Visions", description: "Imagine the world of tomorrow.", tags: ["future", "technology", "futuristic", "imagination"] },
      { title: "Organic Abstracts", description: "Find the abstract beauty in the natural world.", tags: ["organic", "abstract", "nature", "patterns"] },
      { title: "Cultural Fusion", description: "Blend cultural elements from different traditions and eras.", tags: ["culture", "fusion", "diverse", "creative"] },
      { title: "Dreamscapes", description: "Bring your dreams to life.", tags: ["dreams", "surreal", "landscape", "imagination"] },
    ];

    this.monthlyThemes = [
      { title: "Mythical Realms Reimagined", description: "Take a classic mythical creature or legend and give it a fresh, unexpected twist.", tags: ["mythology", "fantasy", "reimagine", "worldbuilding"] },
      { title: "Urban Echoes", description: "Capture the hidden stories of the city.", tags: ["urban", "city", "hidden", "storytelling"] },
      { title: "Ethereal Visions", description: "Explore the space between dreams and reality.", tags: ["dreams", "surreal", "ethereal", "fantasy"] },
      { title: "Elements Unleashed", description: "Channel the raw power of earth, wind, fire, and water.", tags: ["elements", "nature", "power", "force"] },
      { title: "Timeless Portraits", description: "Create portraits that transcend time.", tags: ["portraits", "timeless", "expression", "character"] },
      { title: "Mechanical Dreams", description: "Blend organic life with mechanical precision.", tags: ["steampunk", "cyber", "mechanical", "organic"] },
      { title: "Cosmic Wanderers", description: "Journey through the cosmos.", tags: ["space", "cosmic", "alien", "infinite"] },
      { title: "Whispers of the Past", description: "Bring history to life through art.", tags: ["history", "ancient", "culture", "heritage"] },
      { title: "Flora & Fauna Fantasia", description: "Create a vibrant celebration of the natural world.", tags: ["nature", "fantasy", "animals", "plants"] },
      { title: "Architectural Dreams", description: "Design impossible structures.", tags: ["architecture", "design", "impossible", "dreams"] },
      { title: "Shadow & Light", description: "Explore the dramatic interplay between shadow and light.", tags: ["shadows", "light", "contrast", "mystery"] },
      { title: "Festival of Colors", description: "Celebrate the joy of color.", tags: ["color", "celebration", "festival", "vibrant"] },
    ];

    this.yearlyThemes = [
      { title: "Metamorphosis: A Year of Growth", description: "Document your artistic journey and personal growth over a year.", tags: ["growth", "journey", "transformation", "evolution"] },
      { title: "Chronicles of Time: Seasonal Diary", description: "Create a visual diary of the seasons and passing of time.", tags: ["time", "seasons", "reflection", "nature"] },
      { title: "52 Weeks of Creative Exploration", description: "52 weeks of creative exploration, one piece per week.", tags: ["consistency", "exploration", "growth", "discipline"] },
    ];

    this.init();
  }

  // ============================================
  // INIT
  // ============================================
  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;

      if (user) {
        await this.checkAdminStatus();
      }

      // Load challenges first (needed by render)
      await this.loadActiveChallenges();

      // Load everything else in parallel where possible
      this.loadChallengeStats();
      this.loadCommunityStats();
      this.loadRecentActivity();
      this.loadFeaturedArtworks();
      this.loadFeaturedTutorials();
      this.loadFeaturedArtists();
      this.loadTopCreators();
      this.loadWinners();
      this.loadBulletinPosts();

      this.startAllCountdowns();
      this.setupEventListeners();
      this.setupThemeToggle();
      this.setupHeroControls();
      this.setupSuggestionBox();
      this.setupBulletinToggle();

      document
        .querySelectorAll(".loading-state")
        .forEach((el) => (el.style.display = "none"));
    });
  }

  // ============================================
  // CHALLENGES - READ FROM FIRESTORE
  // ============================================
  async loadActiveChallenges() {
    try {
      const snapshot = await this.db
        .collection("challenges")
        .where("status", "==", "active")
        .get();

      if (snapshot.empty) {
        console.warn(
          "⚠️ No active challenges in Firestore. Using local fallback generation.",
        );
        this.generateFallbackChallenges();
        this.renderChallenges();
        return;
      }

      const challenges = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        challenges.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || new Date(data.endDate),
        });
      });

      // Prefer Intuit versions, fall back to any matching type
      this.activeChallenges.daily =
        challenges.find((c) => c.type === "daily" && c.isIntuit) ||
        challenges.find((c) => c.type === "daily") ||
        null;

      this.activeChallenges.weekly =
        challenges.find((c) => c.type === "weekly" && c.isIntuit) ||
        challenges.find((c) => c.type === "weekly") ||
        null;

      this.activeChallenges.monthly =
        challenges.find((c) => c.type === "monthly" && c.isIntuit) ||
        challenges.find((c) => c.type === "monthly") ||
        null;

      this.activeChallenges.yearly =
        challenges.find((c) => c.type === "yearly" && c.isIntuit) ||
        challenges.find((c) => c.type === "yearly") ||
        null;

      console.log(
        `✅ Loaded ${challenges.length} active challenges from Firestore`,
      );
      this.renderChallenges();
    } catch (error) {
      console.error("Error loading challenges from Firestore:", error);
      this.generateFallbackChallenges();
      this.renderChallenges();
    }
  }

  generateFallbackChallenges() {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
    );
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor(
      (now - startOfYear) / (1000 * 60 * 60 * 24),
    );
    const weekNumber = Math.ceil(
      (daysSinceStart + startOfYear.getDay() + 1) / 7,
    );

    // Daily
    const dailyPrompt = this.dailyPrompts[dayOfYear % this.dailyPrompts.length];
    const dailyStart = new Date(now);
    dailyStart.setHours(0, 0, 0, 0);
    const dailyEnd = new Date(now);
    dailyEnd.setHours(23, 59, 59, 0);

    this.activeChallenges.daily = {
      id: "intuit-daily-fallback",
      type: "daily",
      title: `"${dailyPrompt.title}"`,
      description: dailyPrompt.description,
      tags: dailyPrompt.tags,
      startDate: dailyStart,
      endDate: dailyEnd,
      isIntuit: true,
      prize: "Daily Champion Badge + 100 Points + Featured on Homepage",
      prizeValue: 100,
    };

    // Weekly
    const weeklyTheme =
      this.weeklyThemes[(weekNumber - 1) % this.weeklyThemes.length];
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const weeklyStart = new Date(now);
    weeklyStart.setDate(now.getDate() - diffToMonday);
    weeklyStart.setHours(0, 0, 0, 0);
    const weeklyEnd = new Date(weeklyStart);
    weeklyEnd.setDate(weeklyStart.getDate() + 6);
    weeklyEnd.setHours(23, 59, 59, 0);

    this.activeChallenges.weekly = {
      id: "intuit-weekly-fallback",
      type: "weekly",
      title: `"${weeklyTheme.title}"`,
      description: weeklyTheme.description,
      tags: weeklyTheme.tags,
      startDate: weeklyStart,
      endDate: weeklyEnd,
      isIntuit: true,
      prize: "Champion Badge + Social Media Feature + 250 Points",
      prizeValue: 250,
    };

    // Monthly
    const monthlyTheme =
      this.monthlyThemes[now.getMonth() % this.monthlyThemes.length];
    const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthlyEnd.setHours(23, 59, 59, 0);

    this.activeChallenges.monthly = {
      id: "intuit-monthly-fallback",
      type: "monthly",
      title: `"${monthlyTheme.title}"`,
      description: monthlyTheme.description,
      tags: monthlyTheme.tags,
      startDate: monthlyStart,
      endDate: monthlyEnd,
      isIntuit: true,
      prize: "Master Badge + Homepage Feature + 500 Points",
      prizeValue: 500,
    };

    // Yearly
    const yearlyTheme = this.yearlyThemes[0];
    const yearlyStart = new Date(now.getFullYear(), 0, 1);
    const yearlyEnd = new Date(now.getFullYear(), 11, 31);
    yearlyEnd.setHours(23, 59, 59, 0);

    this.activeChallenges.yearly = {
      id: "intuit-yearly-fallback",
      type: "yearly",
      title: `"${yearlyTheme.title}"`,
      description: yearlyTheme.description,
      tags: yearlyTheme.tags,
      startDate: yearlyStart,
      endDate: yearlyEnd,
      isIntuit: true,
      prize: "Soul Chaser Badge + Featured Artist + Custom Challenge Theme",
      prizeValue: 1000,
    };

    console.log("📝 Generated fallback challenges locally");
  }

  renderChallenges() {
    if (this.activeChallenges.daily) this.renderDailyChallenge();
    if (this.activeChallenges.weekly) this.renderWeeklyChallenge();
    if (this.activeChallenges.monthly) this.renderMonthlyChallenge();
    if (this.activeChallenges.yearly) this.renderYearlyChallenge();
  }

  renderDailyChallenge() {
    const c = this.activeChallenges.daily;

    const titleEl = document.getElementById("daily-prompt-title");
    const descEl = document.getElementById("daily-prompt-description");
    const dateEl = document.getElementById("challenge-date");
    const tagsEl = document.getElementById("daily-tags");

    if (titleEl) titleEl.textContent = c.title;
    if (descEl) descEl.textContent = c.description;
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    this.renderTags(tagsEl, c.tags);
  }

  renderWeeklyChallenge() {
    const c = this.activeChallenges.weekly;
    const titleEl = document.getElementById("weekly-title");
    const descEl = document.getElementById("weekly-description");
    const rangeEl = document.getElementById("weekly-date-range");
    const tagsEl = document.getElementById("weekly-tags");

    if (titleEl) titleEl.textContent = c.title;
    if (descEl) descEl.textContent = c.description;
    if (rangeEl && c.startDate && c.endDate) {
      const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      rangeEl.textContent = `${fmt(c.startDate)} - ${fmt(c.endDate)}`;
    }
    this.renderTags(tagsEl, c.tags);
  }

  renderMonthlyChallenge() {
    const c = this.activeChallenges.monthly;
    const titleEl = document.getElementById("monthly-title");
    const descEl = document.getElementById("monthly-description");
    const dateEl = document.getElementById("monthly-date");
    const tagsEl = document.getElementById("monthly-tags");

    if (titleEl) titleEl.textContent = c.title;
    if (descEl) descEl.textContent = c.description;
    if (dateEl && c.startDate) {
      dateEl.textContent = c.startDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    this.renderTags(tagsEl, c.tags);
  }

  renderYearlyChallenge() {
    const c = this.activeChallenges.yearly;
    const titleEl = document.getElementById("yearly-title");
    const descEl = document.getElementById("yearly-description");
    const dateEl = document.getElementById("yearly-date");
    const tagsEl = document.getElementById("yearly-tags");

    if (titleEl) titleEl.textContent = c.title;
    if (descEl) descEl.textContent = c.description;
    if (dateEl) dateEl.textContent = `${new Date().getFullYear()} Grand Challenge`;
    this.renderTags(tagsEl, c.tags);
  }

  renderTags(container, tags) {
    if (!container || !tags) return;
    const tagEls = container.querySelectorAll(".challenge-tag");
    tags.forEach((tag, i) => {
      if (tagEls[i]) {
        tagEls[i].textContent = `#${tag}`;
        tagEls[i].style.display = "inline-block";
      }
    });
    for (let i = tags.length; i < tagEls.length; i++) {
      tagEls[i].style.display = "none";
    }
  }

  // ============================================
  // COUNTDOWNS
  // ============================================
  startAllCountdowns() {
    Object.keys(this.countdownIntervals).forEach((key) => {
      if (this.countdownIntervals[key]) {
        clearInterval(this.countdownIntervals[key]);
        this.countdownIntervals[key] = null;
      }
    });

    this.startDailyCountdown();
    this.startWeeklyCountdown();
    this.startMonthlyCountdown();
    this.startYearlyCountdown();
  }

  startDailyCountdown() {
    const el = document.getElementById("countdown");
    if (!el) return;

    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    update();
    this.countdownIntervals.daily = setInterval(update, 1000);
  }

  startWeeklyCountdown() {
    const el = document.getElementById("weekly-days-left");
    if (!el) return;

    const update = () => {
      const now = new Date();
      const nextMonday = new Date(now);
      const daysUntil = (8 - now.getDay()) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntil);
      nextMonday.setHours(0, 0, 0, 0);
      const days = Math.floor((nextMonday - now) / 86400000);
      el.textContent = `${days} day${days === 1 ? "" : "s"} left`;
    };

    update();
    this.countdownIntervals.weekly = setInterval(update, 60000);
  }

  startMonthlyCountdown() {
    const el = document.getElementById("monthly-days-left");
    if (!el) return;

    const update = () => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 0);
      const days = Math.floor((endOfMonth - now) / 86400000);
      el.textContent = `${days} day${days === 1 ? "" : "s"} left`;
    };

    update();
    this.countdownIntervals.monthly = setInterval(update, 60000);
  }

  startYearlyCountdown() {
    const el = document.getElementById("yearly-days-left");
    if (!el) return;

    const update = () => {
      const now = new Date();
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 0);
      const days = Math.floor((endOfYear - now) / 86400000);
      el.textContent = `${days} day${days === 1 ? "" : "s"} left`;
    };

    update();
    this.countdownIntervals.yearly = setInterval(update, 3600000);
  }

  // ============================================
  // CHALLENGE STATS (real counts)
  // ============================================
  async loadChallengeStats() {
    const participantsEl = document.getElementById("daily-participants");
    const submissionsEl = document.getElementById("daily-submissions");

    if (!participantsEl && !submissionsEl) return;

    try {
      const dailyId = this.activeChallenges.daily?.id;

      // Count participants for today's challenge
      let participants = 0;
      let submissions = 0;

      if (dailyId && !dailyId.startsWith("intuit-daily-fallback")) {
        const participantsSnap = await this.db
          .collection("userChallenges")
          .where("challengeId", "==", dailyId)
          .get();
        participants = participantsSnap.size;

        const submissionsSnap = await this.db
          .collection("challengeSubmissions")
          .where("challengeId", "==", dailyId)
          .get();
        submissions = submissionsSnap.size;
      }

      this.setStatValue(participantsEl, participants, "Be the first");
      this.setStatValue(submissionsEl, submissions, "Be the first");
    } catch (error) {
      console.error("Error loading challenge stats:", error);
      if (participantsEl) participantsEl.textContent = "—";
      if (submissionsEl) submissionsEl.textContent = "—";
    }
  }

  // ============================================
  // COMMUNITY STATS (fixed — no phantom elements)
  // ============================================
  async loadCommunityStats() {
    try {
      const [usersSnap, artworksSnap, submissionsSnap] = await Promise.all([
        this.db.collection("users").get(),
        this.db
          .collection("artworks")
          .where("status", "==", "published")
          .get(),
        this.db.collection("challengeSubmissions").get(),
      ]);

      const userCount = usersSnap.size;
      const artworkCount = artworksSnap.size;
      const submissionCount = submissionsSnap.size;

      // Total members / artworks
      this.setCountEl("total-members", userCount);
      this.setCountEl("total-artworks", artworkCount);

      // CTA stats
      this.setCountEl("cta-members", userCount);
      this.setCountEl("cta-artworks", artworkCount);
      this.setCountEl("cta-submissions", submissionCount);

            // Hero live stats
      this.setCountEl("heroStatArtists", userCount);
      this.setCountEl("heroStatArtworks", artworkCount);
      // Active challenges count
      const challengesSnap = await this.db
        .collection("challenges")
        .where("status", "==", "active")
        .get();
      this.setCountEl("heroStatChallenges", challengesSnap.size);

      console.log(
        `📊 Community stats: ${userCount} users, ${artworkCount} artworks, ${submissionCount} submissions`,
      );
    } catch (error) {
      console.error("Error loading community stats:", error);
      // Silent failure — the numbers just stay as their initial values
    }
  }

  setCountEl(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = this.formatCount(count);
  }

  setStatValue(el, count, emptyText) {
    if (!el) return;
    if (count === 0) {
      el.textContent = emptyText;
      el.style.fontSize = "0.9rem";
      el.style.opacity = "0.7";
    } else {
      el.textContent = count;
    }
  }

  formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  // ============================================
  // RECENT ACTIVITY
  // ============================================
  async loadRecentActivity() {
    const grid = document.getElementById("activity-grid");
    if (!grid) return;

    try {
      const snapshot = await this.db
        .collection("artworks")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (snapshot.empty) {
        grid.innerHTML = this.emptyState(
          "fas fa-clock",
          "No activity yet — be the first to upload!",
        );
        return;
      }

      const activities = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          title: data.title || "Untitled",
          artistName: data.artistName || "Anonymous",
          imageUrl: data.imageUrl,
          createdAt: data.createdAt,
        });
      });

      grid.innerHTML = activities
        .map(
          (a) => `
        <div class="activity-item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${a.id}'">
          <div class="activity-image" style="background-image: url('${a.imageUrl || ""}'); background-size: cover; background-position: center;">
            ${!a.imageUrl ? '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">No image</div>' : ""}
          </div>
          <div class="activity-content">
            <div class="activity-meta">
              <div class="activity-user">
                <div class="user-avatar">${a.artistName.charAt(0).toUpperCase()}</div>
                ${this.escapeHtml(a.artistName)}
              </div>
              <span>${this.formatTimeAgo(a.createdAt)}</span>
            </div>
            <div class="activity-title">${this.escapeHtml(a.title)}</div>
            <div class="activity-desc">New artwork uploaded to the gallery</div>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading recent activity:", error);
      grid.innerHTML = this.emptyState(
        "fas fa-exclamation-triangle",
        "Could not load activity right now.",
      );
    }
  }

  // ============================================
  // FEATURED ARTWORKS (efficient query)
  // ============================================
  async loadFeaturedArtworks() {
    const grid = document.getElementById("featured-artworks-grid");
    if (!grid) return;

    try {
      const snapshot = await this.db
        .collection("artworks")
        .where("status", "==", "published")
        .orderBy("likes", "desc")
        .limit(6)
        .get();

      if (snapshot.empty) {
        grid.innerHTML = this.emptyState(
          "fas fa-image",
          "No featured artworks yet — be the first to upload!",
        );
        return;
      }

      const artworks = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        artworks.push({
          id: doc.id,
          title: data.title || "Untitled",
          artistName: data.artistName || "Anonymous",
          imageUrl: data.imageUrl,
          likes: data.likes || 0,
          cheers: data.cheers || 0,
        });
      });

      grid.innerHTML = artworks
        .map(
          (art) => `
        <div class="artwork-card" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
          <div class="artwork-image" style="background-image: url('${art.imageUrl || ""}'); background-size: cover; background-position: center;">
            ${!art.imageUrl ? '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.7rem;">No image</div>' : ""}
          </div>
          <div class="artwork-info">
            <div class="artwork-title">${this.escapeHtml(art.title)}</div>
            <div class="artwork-artist">${this.escapeHtml(art.artistName)}</div>
            <div class="artwork-stats">
              <span><i class="fas fa-heart" style="color:#ef4444;"></i> ${art.likes}</span>
              <span><i class="fas fa-glass-cheers" style="color:#f59e0b;"></i> ${art.cheers}</span>
            </div>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading featured artworks:", error);
      grid.innerHTML = this.emptyState(
        "fas fa-exclamation-triangle",
        "Could not load artworks right now.",
      );
    }
  }

    // ============================================
  // FEATURED TUTORIALS (reads from tutorialData)
  // ============================================
  async loadFeaturedTutorials() {
    const grid = document.getElementById("featured-tutorials-grid");
    if (!grid) return;

    try {
      // Wait up to 2s for tutorialData to be available
      let waited = 0;
      while (!window.tutorialData && waited < 2000) {
        await new Promise((r) => setTimeout(r, 100));
        waited += 100;
      }

      if (!window.tutorialData) {
        grid.innerHTML = this.emptyState(
          "fas fa-graduation-cap",
          "Tutorials coming soon — check back!",
        );
        return;
      }

      const tutorials = window.tutorialData.getFeaturedTutorials(3);

      if (!tutorials || tutorials.length === 0) {
        grid.innerHTML = this.emptyState(
          "fas fa-graduation-cap",
          "No featured tutorials yet.",
        );
        return;
      }

      grid.innerHTML = tutorials
        .map((t) => {
          const diff = (t.difficulty || "beginner").toLowerCase();
          const imgStyle = t.image
            ? `background-image: url('${t.image}');`
            : "";
          const placeholder = t.image
            ? ""
            : `<i class="fas fa-graduation-cap"></i>`;

          return `
          <div class="tutorial-card" onclick="window.location.href='${t.file || "/pages/tutorials/tutorials.html"}'">
            <div class="tutorial-image" style="${imgStyle}">
              ${placeholder}
            </div>
            <div class="tutorial-info">
              <span class="tutorial-difficulty ${diff}">${diff}</span>
              <h3 class="tutorial-title">${this.escapeHtml(t.title)}</h3>
              <div class="tutorial-meta">
                <span><i class="fas fa-clock"></i> ${t.duration || 20} min</span>
                <span class="tutorial-read">Read Tutorial →</span>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading featured tutorials:", error);
      grid.innerHTML = this.emptyState(
        "fas fa-exclamation-triangle",
        "Could not load tutorials right now.",
      );
    }
  }

  // ============================================
  // FEATURED ARTISTS
  // ============================================
  async loadFeaturedArtists() {
    const grid = document.getElementById("featured-artists-grid");
    if (!grid) return;

    try {
      const usersSnap = await this.db.collection("users").get();
      const artworksSnap = await this.db
        .collection("artworks")
        .where("status", "==", "published")
        .get();

      const artworkCounts = {};
      artworksSnap.forEach((doc) => {
        const data = doc.data();
        const uid = data.userId || data.uid || data.artistId;
        if (uid) artworkCounts[uid] = (artworkCounts[uid] || 0) + 1;
      });

      const users = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;
        let followerCount = 0;
        if (data.followers) {
          if (Array.isArray(data.followers)) followerCount = data.followers.length;
          else if (typeof data.followers === "number") followerCount = data.followers;
        }

        users.push({
          id: uid,
          fullname: data.fullname || data.displayName || "Artist",
          username: data.username || "artist",
          artworks: artworkCounts[uid] || 0,
          followers: followerCount,
          avatarUrl: data.profilePicture || data.photoURL || null,
        });
      });

      users.sort((a, b) => b.artworks - a.artworks);
      const top = users.slice(0, 6);

      if (top.length === 0) {
        grid.innerHTML = this.emptyState(
          "fas fa-users",
          "No featured artists yet.",
        );
        return;
      }

      grid.innerHTML = top
        .map(
          (u) => `
        <div class="artist-card" onclick="window.location.href='/pages/community/profiles.html?user=${u.id}'">
          <div class="artist-cover">
            ${u.avatarUrl ? `<img src="${u.avatarUrl}" alt="${this.escapeHtml(u.fullname)}">` : `<div style="font-size:4rem;opacity:0.3;">🎨</div>`}
            <div class="artist-avatar-overlay">
              ${u.avatarUrl ? `<img src="${u.avatarUrl}" alt="${this.escapeHtml(u.fullname)}">` : this.escapeHtml(u.fullname.charAt(0).toUpperCase())}
            </div>
          </div>
          <div class="artist-info">
            <div class="artist-name">${this.escapeHtml(u.fullname)}</div>
            <div class="artist-specialty">@${this.escapeHtml(u.username)}</div>
            <div class="artist-stats">
              <div class="stat"><span class="number">${u.artworks}</span><span class="label">Artworks</span></div>
              <div class="stat"><span class="number">${u.followers}</span><span class="label">Followers</span></div>
            </div>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading featured artists:", error);
      grid.innerHTML = this.emptyState(
        "fas fa-exclamation-triangle",
        "Could not load artists right now.",
      );
    }
  }

  // ============================================
  // TOP CREATORS
  // ============================================
  async loadTopCreators() {
    const grid = document.getElementById("creators-grid");
    if (!grid) return;

    try {
      const [usersSnap, artworksSnap] = await Promise.all([
        this.db.collection("users").get(),
        this.db.collection("artworks").where("status", "==", "published").get(),
      ]);

      const artworkCounts = {};
      artworksSnap.forEach((doc) => {
        const data = doc.data();
        const uid = data.userId || data.uid || data.artistId;
        if (uid) artworkCounts[uid] = (artworkCounts[uid] || 0) + 1;
      });

      const users = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;
        let followerCount = 0;
        if (Array.isArray(data.followers)) followerCount = data.followers.length;
        else if (typeof data.followers === "number") followerCount = data.followers;

        const artworks = artworkCounts[uid] || 0;
        const likes = data.totalLikes || 0;
        const points = Math.round(artworks * 10 + followerCount * 2 + likes * 0.5);

        users.push({
          id: uid,
          fullname: data.fullname || data.displayName || "Artist",
          artworks,
          followers: followerCount,
          points,
          avatarUrl: data.profilePicture || data.photoURL || null,
        });
      });

      users.sort((a, b) => b.points - a.points);
      const top = users.slice(0, 10);

      if (top.length === 0) {
        grid.innerHTML = this.emptyState("fas fa-crown", "No creators yet.");
        return;
      }

      const rankClasses = ["gold", "silver", "bronze"];

      grid.innerHTML = top
        .map((u, i) => {
          const rank = i + 1;
          const rankClass = rank <= 3 ? rankClasses[i] : "normal";
          const medal =
            rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

          return `
          <div class="creator-card" onclick="window.location.href='/pages/community/profiles.html?user=${u.id}'">
            <div class="creator-rank ${rankClass}">${medal}</div>
            <div class="creator-avatar" style="background-image: url('${u.avatarUrl || ""}'); background-size: cover; background-position: center;">
              ${!u.avatarUrl ? this.escapeHtml(u.fullname.charAt(0).toUpperCase()) : ""}
            </div>
            <div class="creator-info">
              <div class="creator-name">${this.escapeHtml(u.fullname)}</div>
              <div class="creator-stats">
                <span><i class="fas fa-palette"></i> ${u.artworks} artworks</span>
                <span><i class="fas fa-users"></i> ${u.followers} followers</span>
              </div>
            </div>
            <div class="creator-points">${u.points} pts</div>
            ${rank <= 3 ? `<div class="creator-badge">${rank === 1 ? "🏆 Top Creator" : rank === 2 ? "🥈 Silver" : "🥉 Bronze"}</div>` : ""}
          </div>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading top creators:", error);
      grid.innerHTML = this.emptyState(
        "fas fa-exclamation-triangle",
        "Could not load leaderboard right now.",
      );
    }
  }

  // ============================================
  // WINNERS CAROUSEL — 3D ring, #1 special
  // ============================================
  async loadWinners() {
    const container = document.getElementById("winners-carousel");
    if (!container) return;

    try {
      const snapshot = await this.db
        .collection("challengeWinners")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      let winners = [];
      if (snapshot.empty) {
        winners = Array.from({ length: 10 }, (_, i) => ({
          id: `placeholder-${i}`,
          rank: i + 1,
          name: `Winner ${i + 1}`,
          imageUrl: null,
          artworkId: null,
        }));
      } else {
        snapshot.forEach((doc) => {
          const data = doc.data();
          winners.push({
            id: doc.id,
            rank: data.rank || winners.length + 1,
            name: data.winnerUserName || data.artistName || "Artist",
            imageUrl: data.imageUrl,
            artworkId: data.artworkId,
          });
        });
      }

      // Sort so #1 comes first, then by rank
      winners.sort((a, b) => a.rank - b.rank);
      this.renderWinnersCarousel(winners);
    } catch (error) {
      console.error("Error loading winners:", error);
      // Fallback: render empty placeholders
      const placeholders = Array.from({ length: 10 }, (_, i) => ({
        id: `placeholder-${i}`,
        rank: i + 1,
        name: `Winner ${i + 1}`,
        imageUrl: null,
        artworkId: null,
      }));
      this.renderWinnersCarousel(placeholders);
    }
  }

  renderWinnersCarousel(winners) {
    const container = document.getElementById("winners-carousel");
    if (!container) return;

    const count = winners.length;
    const anglePerCard = 360 / count;

    container.innerHTML = winners
      .map((w, i) => {
        const isFirst = w.rank === 1;
        const position = i + 1; // 1-based for CSS

        return `
          <div class="winner-item ${isFirst ? "first-place" : ""}" style="--position: ${position}; --angle: ${anglePerCard}deg;">
            ${isFirst ? '<div class="winner-crown">👑</div>' : ""}
            <div class="winner-card" onclick="window.location.href='/pages/community/artwork-detail.html?id=${w.artworkId || "#"}'">
              ${
                w.imageUrl
                  ? `<img src="${w.imageUrl}" alt="${this.escapeHtml(w.name)}">`
                  : `<div class="winner-placeholder">
                    <div class="placeholder-icon">${isFirst ? "🏆" : "🏅"}</div>
                    <div class="placeholder-rank">#${w.rank}</div>
                    <div class="placeholder-text">${this.escapeHtml(w.name)}</div>
                  </div>`
              }
              <div class="winner-overlay">
                <div class="winner-rank">#${w.rank} Winner</div>
                <div class="winner-name">${this.escapeHtml(w.name)}</div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Fixed banner below carousel showing #1 details
    const first = winners.find((w) => w.rank === 1) || winners[0];
    if (first) {
      let banner = document.getElementById("winners-featured-banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "winners-featured-banner";
        banner.className = "winners-featured-banner";
        const hallSection = container.closest(".zone-hall") || container.parentElement;
        hallSection.appendChild(banner);

      }
      banner.innerHTML = `
        <div class="featured-crown">👑</div>
        <div class="featured-info">
          <div class="featured-label">Reigning Champion</div>
          <div class="featured-name">${this.escapeHtml(first.name)}</div>
          <a href="/pages/community/artwork-detail.html?id=${first.artworkId || "#"}" class="featured-link">
            Click to view winning piece →
          </a>
        </div>
      `;
    }
  }

  // ============================================
  // BULLETIN SLIDER
  // ============================================
  async loadBulletinPosts() {
    const slider = document.getElementById("bulletin-slider");
    const dotsContainer = document.getElementById("bulletinDots");
    if (!slider) return;

    try {
      const snapshot = await this.db
        .collection("bulletinPosts")
        .orderBy("createdAt", "desc")
        .limit(8)
        .get();

      if (snapshot.empty) {
        slider.innerHTML = `
          <div class="bulletin-slide-empty">
            <i class="fas fa-newspaper"></i>
            <p>No announcements yet — check back soon!</p>
          </div>
        `;
        if (dotsContainer) dotsContainer.innerHTML = "";
        this.attachBulletinSliderHandlers(0);
        return;
      }

      const posts = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title || "Untitled",
          content: data.content || "",
          link: data.link || "",
          imageUrl: data.imageUrl || "",
          createdAt: data.createdAt,
        });
      });

      slider.innerHTML = posts
        .map((post, i) => this.buildBulletinSlide(post, i))
        .join("");

      if (dotsContainer) {
        dotsContainer.innerHTML = posts
          .map(
            (_, i) =>
              `<button class="dot ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`,
          )
          .join("");
      }

      this.attachBulletinSliderHandlers(posts.length);
    } catch (error) {
      console.error("Error loading bulletin posts:", error);
      slider.innerHTML = `
        <div class="bulletin-slide-empty">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Could not load announcements right now.</p>
        </div>
      `;
      if (dotsContainer) dotsContainer.innerHTML = "";
    }
  }

  buildBulletinSlide(post, index) {
    const excerpt =
      post.content.length > 260
        ? post.content.substring(0, 260) + "…"
        : post.content;

    const imageBlock = post.imageUrl
      ? `<img src="${post.imageUrl}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'bulletin-image-placeholder\\'><i class=\\'fas fa-newspaper\\'></i><span>Announcement</span></div>'">`
      : `<div class="bulletin-image-placeholder">
           <i class="fas fa-newspaper"></i>
           <span>Announcement</span>
         </div>`;

    return `
      <div class="bulletin-slide" data-index="${index}">
        <div class="bulletin-slide-image">
          ${imageBlock}
        </div>
        <div class="bulletin-slide-content">
          <span class="bulletin-tag">✦ ${this.formatTimeAgo(post.createdAt)}</span>
          <h3>${this.escapeHtml(post.title)}</h3>
          <p>${this.escapeHtml(excerpt)}</p>
          ${
            post.link
              ? `<a href="${post.link}" target="_blank" rel="noopener" class="bulletin-slide-link">
                   Read More <i class="fas fa-arrow-right"></i>
                 </a>`
              : ""
          }
        </div>
      </div>
    `;
  }

  attachBulletinSliderHandlers(totalSlides) {
    const slider = document.getElementById("bulletin-slider");
    const dots = document.querySelectorAll("#bulletinDots .dot");
    const prevBtn = document.getElementById("bulletinPrevBtn");
    const nextBtn = document.getElementById("bulletinNextBtn");
    const container = document.getElementById("bulletin-slider-container");

    if (!slider || totalSlides === 0) return;

    // Clear any previous interval
    if (this.bulletinInterval) {
      clearInterval(this.bulletinInterval);
      this.bulletinInterval = null;
    }

    const goTo = (index) => {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      this.bulletinCurrentSlide = index;
      slider.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === index));
    };

    this.bulletinCurrentSlide = 0;

    // Replace buttons to kill old listeners
    if (prevBtn) {
      const newPrev = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      newPrev.addEventListener("click", () =>
        goTo(this.bulletinCurrentSlide - 1),
      );
    }
    if (nextBtn) {
      const newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);
      newNext.addEventListener("click", () =>
        goTo(this.bulletinCurrentSlide + 1),
      );
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () =>
        goTo(parseInt(dot.dataset.index, 10)),
      );
    });

    // Auto-advance
    if (totalSlides > 1) {
      this.bulletinInterval = setInterval(() => {
        goTo(this.bulletinCurrentSlide + 1);
      }, 8000);
    }

    // Pause on hover
    if (container) {
      container.addEventListener("mouseenter", () => {
        if (this.bulletinInterval) {
          clearInterval(this.bulletinInterval);
          this.bulletinInterval = null;
        }
      });
      container.addEventListener("mouseleave", () => {
        if (this.bulletinInterval) clearInterval(this.bulletinInterval);
        if (totalSlides > 1) {
          this.bulletinInterval = setInterval(() => {
            goTo(this.bulletinCurrentSlide + 1);
          }, 8000);
        }
      });
    }
  }

   // ============================================
  // BULLETIN ADMIN — with image upload
  // ============================================
  setupBulletinToggle() {
    const area = document.querySelector(".bulletin-admin-area");
    const toggleBtn = document.getElementById("bulletinToggle");
    const adminPanel = document.getElementById("bulletinAdmin");
    const submitBtn = document.getElementById("submit-bulletin-post");

    if (!area || !toggleBtn || !adminPanel) return;

    // Show/hide the admin area based on admin status
    if (this.isAdmin) {
      area.classList.add("admin-visible");
    } else {
      area.classList.remove("admin-visible");
    }

    toggleBtn.addEventListener("click", () => {
      if (!this.isAdmin) {
        this.showToast("Admins only.", "error");
        return;
      }
      const visible = adminPanel.classList.contains("visible");
      if (visible) {
        adminPanel.classList.remove("visible");
        toggleBtn.textContent = "📝 Add Announcement";
      } else {
        adminPanel.classList.add("visible");
        toggleBtn.textContent = "✖ Close";
      }
    });

    if (submitBtn) {
      submitBtn.addEventListener("click", () => this.submitBulletinPost());
    }

    // Wire up image picker
    this.setupBulletinImageUpload();
  }

  setupBulletinImageUpload() {
    const drop = document.getElementById("bulletinImageDrop");
    const fileInput = document.getElementById("bulletin-image-input");
    const emptyState = document.getElementById("bulletinImageEmpty");
    const preview = document.getElementById("bulletinImagePreview");
    const thumb = document.getElementById("bulletinImageThumb");
    const removeBtn = document.getElementById("bulletinImageRemove");

    if (!drop || !fileInput) return;

    // Reset state on load
    this.bulletinImageFile = null;

    const clearImage = () => {
      this.bulletinImageFile = null;
      fileInput.value = "";
      if (thumb) thumb.src = "";
      if (preview) preview.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      drop.classList.remove("dragover");
    };

    const acceptFile = (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        this.setBulletinStatus("Please select an image file.", "error");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        this.setBulletinStatus("Image must be under 15MB.", "error");
        return;
      }
      this.bulletinImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (thumb) thumb.src = e.target.result;
        if (preview) preview.style.display = "flex";
        if (emptyState) emptyState.style.display = "none";
        this.setBulletinStatus("");
      };
      reader.readAsDataURL(file);
    };

    // Click to open file picker
    drop.addEventListener("click", (e) => {
      // Don't trigger picker if clicking remove button
      if (e.target.closest("#bulletinImageRemove")) return;
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        acceptFile(e.target.files[0]);
      }
    });

    // Drag and drop
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("dragover");
    });
    drop.addEventListener("dragleave", () => {
      drop.classList.remove("dragover");
    });
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        acceptFile(e.dataTransfer.files[0]);
      }
    });

    // Remove button
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearImage();
      });
    }

    // Expose clearer for post-submit reset
    this.clearBulletinImage = clearImage;
  }

  setBulletinStatus(msg, type = "") {
    const el = document.getElementById("bulletinAdminStatus");
    if (!el) return;
    el.textContent = msg;
    el.className = "bulletin-admin-status" + (type ? " " + type : "");
  }

  async submitBulletinPost() {
    if (!this.isAdmin) {
      this.showToast("Admins only.", "error");
      return;
    }

    const titleEl = document.getElementById("bulletin-title");
    const contentEl = document.getElementById("bulletin-content");
    const linkEl = document.getElementById("bulletin-link");
    const submitBtn = document.getElementById("submit-bulletin-post");

    const title = titleEl?.value.trim();
    const content = contentEl?.value.trim();
    const link = linkEl?.value.trim();

    if (!title || !content) {
      this.setBulletinStatus("Title and content are required.", "error");
      return;
    }

    const originalLabel = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing…';
    }

    try {
      let imageUrl = "";

      // 1. Upload image if present
      if (this.bulletinImageFile) {
        this.setBulletinStatus("Uploading image…");
        const storage = firebase.storage();
        const safeName = this.bulletinImageFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_",
        );
        const path = `bulletin/${Date.now()}_${safeName}`;
        const snap = await storage.ref(path).put(this.bulletinImageFile);
        imageUrl = await snap.ref.getDownloadURL();
        this.setBulletinStatus("Image uploaded. Saving post…");
      }

      // 2. Write Firestore doc
      await this.db.collection("bulletinPosts").add({
        title,
        content,
        link: link || "",
        imageUrl: imageUrl || "",
        author:
          this.currentUser?.displayName ||
          this.currentUser?.email ||
          "Admin",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Reset form
      if (titleEl) titleEl.value = "";
      if (contentEl) contentEl.value = "";
      if (linkEl) linkEl.value = "";
      if (typeof this.clearBulletinImage === "function") {
        this.clearBulletinImage();
      }

      this.setBulletinStatus("✅ Post published!", "success");
      setTimeout(() => this.setBulletinStatus(""), 2500);

      // 4. Refresh slider
      this.loadBulletinPosts();
    } catch (error) {
      console.error("Error publishing post:", error);
      let msg = "Error publishing post.";
      if (error.code === "storage/unauthorized") {
        msg = "Storage permission denied — check Storage Rules.";
      } else if (error.code === "storage/canceled") {
        msg = "Upload canceled.";
      } else if (error.message) {
        msg = error.message;
      }
      this.setBulletinStatus(msg, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    }
  }

  // ============================================
  // ADMIN CHECK
  // ============================================
  async checkAdminStatus() {
    try {
      const doc = await this.db
        .collection("users")
        .doc(this.currentUser.uid)
        .get();
      if (doc.exists) {
        const data = doc.data();
        this.isAdmin =
          data.role === "admin" ||
          data.role === "moderator" ||
          data.isAdmin === true;

        const toggle = document.querySelector(".bulletin-admin-toggle");
        const panel = document.querySelector(".bulletin-admin");
        const heroControls = document.querySelector(".hero-controls");

        if (this.isAdmin) {
          if (toggle) {
            toggle.classList.add("visible");
            toggle.style.display = "block";
          }
          if (panel) {
            panel.classList.add("visible");
            panel.style.display = "block";
          }
          if (heroControls) {
            heroControls.classList.add("visible");
            heroControls.style.display = "flex";
          }
          console.log("✅ Admin mode activated!");
        } else {
          if (toggle) toggle.style.display = "none";
          if (panel) panel.style.display = "none";
          if (heroControls) heroControls.style.display = "none";
          console.log("👤 User mode (not admin)");
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }

  // ============================================
  // THEME TOGGLE
  // ============================================
  setupThemeToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    if (!toggleBtn) return;

    const saved = localStorage.getItem("theme") || "dark";
    this.applyTheme(saved);

    toggleBtn.addEventListener("click", () => {
      const current = document.body.classList.contains("light-mode")
        ? "light"
        : "dark";
      const next = current === "light" ? "dark" : "light";
      this.applyTheme(next);
      localStorage.setItem("theme", next);
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
    document.documentElement.setAttribute("data-theme", theme);
  }

  // ============================================
  // HERO CONTROLS (prep for later — wired but not styled yet)
  // ============================================
  setupHeroControls() {
    const layer1Upload = document.getElementById("layer1Upload");
    const layer2Upload = document.getElementById("layer2Upload");

    if (layer1Upload) {
      layer1Upload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) this.uploadHeroLayer(file, "layer1");
      });
    }
    if (layer2Upload) {
      layer2Upload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) this.uploadHeroLayer(file, "layer2");
      });
    }
  }

  async uploadHeroLayer(file, layer) {
    if (!this.isAdmin) {
      this.showToast("You do not have permission.", "error");
      return;
    }

    try {
      const storageRef = firebase.storage().ref();
      const filePath = `hub-hero/${layer}/${Date.now()}_${file.name}`;
      const snapshot = await storageRef.child(filePath).put(file);
      const url = await snapshot.ref.getDownloadURL();

      await this.db
        .collection("settings")
        .doc("hubHero")
        .set(
          {
            [`${layer}Url`]: url,
            [`${layer}Type`]: file.type.startsWith("video/") ? "video" : "image",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: this.currentUser.uid,
          },
          { merge: true },
        );

      this.showToast("Hero updated successfully! ✅");
    } catch (error) {
      console.error("Error uploading hero layer:", error);
      this.showToast("Error uploading. Try again.", "error");
    }
  }

    // ============================================
  // SUGGESTION MODAL
  // ============================================
  setupSuggestionBox() {
    const overlay = document.getElementById("suggestionModalOverlay");
    const openBtn = document.getElementById("open-suggestion-modal");
    const closeBtn = document.getElementById("suggestionModalClose");
    const form = document.getElementById("suggestion-form");
    const submitBtn = document.getElementById("suggestionSubmitBtn");

    if (!overlay || !form) return;

    const openModal = () => {
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    };

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        closeModal();
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const idea = document.getElementById("suggestion-idea")?.value.trim();
      const name =
        document.getElementById("suggestion-name")?.value.trim() || "Anonymous";

      if (!idea) {
        this.showToast("Please share your idea!", "error");
        return;
      }

      const originalHTML = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
      }

      try {
        await this.db.collection("suggestions").add({
          idea,
          name,
          userId: this.currentUser?.uid || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: "pending",
        });

        this.showToast("Thank you for your suggestion! 🌟");
        form.reset();
        closeModal();
      } catch (error) {
        console.error("Error submitting suggestion:", error);
        this.showToast("Error submitting. Try again.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
      }
    });
  }


  // ============================================
  // EVENT LISTENERS
  // ============================================
  setupEventListeners() {
    const bind = (id, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", handler);
    };

    bind("start-challenge-btn", () => this.handleStartChallenge("daily"));
    bind("share-challenge-btn", () => this.shareChallenge("daily"));
    bind("view-submissions-btn", () =>
      this.viewSubmissions("daily"),
    );
    bind("daily-challenges-btn", () => {
      window.location.href = "/pages/community/challenges.html";
    });

    bind("weekly-start-btn", () => this.handleStartChallenge("weekly"));
    bind("weekly-share-btn", () => this.shareChallenge("weekly"));
    bind("weekly-view-btn", () => this.viewSubmissions("weekly"));

    bind("monthly-start-btn", () => this.handleStartChallenge("monthly"));
    bind("monthly-share-btn", () => this.shareChallenge("monthly"));
    bind("monthly-view-btn", () => this.viewSubmissions("monthly"));

    bind("yearly-start-btn", () => this.handleStartChallenge("yearly"));
    bind("yearly-share-btn", () => this.shareChallenge("yearly"));
    bind("yearly-view-btn", () => this.viewSubmissions("yearly"));

    bind("submit-bulletin-post", () => this.submitBulletinPost());
  }

  handleStartChallenge(type) {
    if (!this.currentUser) {
      window.location.href =
        "/pages/auth/login.html?redirect=" +
        encodeURIComponent(window.location.pathname);
      return;
    }
    const challenge = this.activeChallenges[type];
    if (challenge) {
      window.location.href = `/pages/community/upload.html?challenge=${challenge.id}`;
    }
  }

  viewSubmissions(type) {
    window.location.href = `/pages/community/gallery.html?filter=${type}`;
  }

  shareChallenge(type) {
    const c = this.activeChallenges[type];
    if (!c) return;
    const text = `🎨 Join me in the ${type} Art Mecca challenge: "${c.title}"!`;
    if (navigator.share) {
      navigator.share({ title: "Art Mecca Challenge", text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(`${text}\n${window.location.href}`)
        .then(() => this.showToast("Link copied! 📋"))
        .catch(() => this.showToast("Failed to copy", "error"));
    }
  }

  // ============================================
  // UTILITIES
  // ============================================
  emptyState(iconClass, message) {
    return `
      <div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-muted);">
        <i class="${iconClass}" style="font-size:2rem;display:block;margin-bottom:0.75rem;opacity:0.3;"></i>
        <p style="font-family:var(--font-condensed);font-size:0.9rem;">${message}</p>
      </div>
    `;
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";

    let date;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else if (timestamp instanceof Date) date = timestamp;
    else date = new Date(timestamp);

    if (isNaN(date.getTime())) return "Just now";

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

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
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(12px);
        color: white; padding: 12px 24px; border-radius: 12px; z-index: 9999;
        font-weight: 500; border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: all 0.3s ease;
        opacity: 0; transform: translateX(-50%) translateY(20px);
        pointer-events: none; max-width: 90%;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    const colors = {
      success: "rgba(16,185,129,0.3)",
      error: "rgba(239,68,68,0.3)",
      info: "rgba(59,130,246,0.3)",
    };
    toast.style.borderColor = colors[type] || colors.success;

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
  }
}

// ============================================
// INITIALIZE
// ============================================
let communityHubInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  const start = () => {
    if (typeof firebase !== "undefined" && firebase.auth) {
      communityHubInstance = new CommunityHub();
      window.communityHubInstance = communityHubInstance;
      console.log("✅ CommunityHub initialized");
    } else {
      console.warn("Firebase not ready, retrying...");
      setTimeout(start, 500);
    }
  };
  start();
});

window.CommunityHub = CommunityHub;
window.getCommunityHubInstance = () => communityHubInstance;
