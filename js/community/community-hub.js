// ============================================ */
// COMMUNITY HUB - COMPLETE FUNCTIONALITY      */
// SELF-UPDATING WEEKLY & MONTHLY CHALLENGES   */
// ============================================ */

class CommunityHub {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
    this.countdownIntervals = {
      daily: null,
      weekly: null,
      monthly: null,
      yearly: null,
    };

    this.dailyPrompts = [
      {
        title: "At the Top of the World",
        description:
          "Create artwork depicting the highest peaks, both literal and metaphorical. Show us what being 'at the top' means to you.",
        tags: ["mountain", "achievement", "perspective", "landscape"],
      },
      {
        title: "Breathe",
        description:
          "Capture the essence of breath, life, and moments of calm. Show us what it means to truly breathe.",
        tags: ["calm", "life", "meditation", "peace"],
      },
      {
        title: "Fallen",
        description:
          "Explore themes of descent, loss, or transformation. What does it mean to have fallen?",
        tags: ["descent", "transformation", "metaphor", "emotion"],
      },
      {
        title: "A Thousand Words",
        description:
          "Create an image that tells a complex story without using any text. Let your art speak volumes.",
        tags: ["storytelling", "narrative", "expression", "communication"],
      },
      {
        title: "Echoes of Silence",
        description:
          "Depict the powerful presence of silence and the echoes it leaves behind.",
        tags: ["quiet", "reflection", "space", "atmosphere"],
      },
      {
        title: "Uncharted Waters",
        description:
          "Venture into the unknown. Show us exploration, discovery, and new beginnings.",
        tags: ["exploration", "adventure", "unknown", "journey"],
      },
      {
        title: "Forgotten Memories",
        description:
          "Bring to life memories that have faded but not disappeared entirely.",
        tags: ["memory", "nostalgia", "past", "emotion"],
      },
      {
        title: "Neon Dreams",
        description:
          "Create a vibrant, neon-infused artwork that captures the energy of the night.",
        tags: ["neon", "night", "vibrant", "urban"],
      },
      {
        title: "Silent Echo",
        description:
          "Depict the powerful presence of silence and the echoes it leaves behind.",
        tags: ["quiet", "reflection", "space", "atmosphere"],
      },
      {
        title: "Golden Hour",
        description: "Capture the magic of golden hour light in your artwork.",
        tags: ["lighting", "warm", "magic", "sunset"],
      },
    ];

    // Monthly challenge themes (rotating)
    this.monthlyThemes = [
      {
        title: '"Mythical Realms Reimagined"',
        description:
          "Take a classic mythical creature or legend and give it a fresh, unexpected twist. What would a phoenix look like in a cyberpunk world? How does a dragon adapt to climate change? Your imagination is the only limit.",
        tags: ["mythology", "fantasy", "reimagine", "worldbuilding"],
      },
      {
        title: '"Urban Echoes"',
        description:
          "Capture the hidden stories of the city - the forgotten corners, the midnight alleys, the quiet moments between skyscrapers. Show us the soul of the city that others overlook.",
        tags: ["urban", "city", "hidden", "storytelling"],
      },
      {
        title: '"Ethereal Visions"',
        description:
          "Explore the space between dreams and reality. Create artwork that feels both familiar and otherworldly, where the boundaries of imagination blur.",
        tags: ["dreams", "surreal", "ethereal", "fantasy"],
      },
      {
        title: '"Elements Unleashed"',
        description:
          "Channel the raw power of earth, wind, fire, and water. Show us the elemental forces that shape our world in your unique visual language.",
        tags: ["elements", "nature", "power", "force"],
      },
      {
        title: '"Timeless Portraits"',
        description:
          "Create portraits that transcend time - figures that could belong to any era, any culture, any world. Tell a story through a single gaze.",
        tags: ["portraits", "timeless", "expression", "character"],
      },
      {
        title: '"Mechanical Dreams"',
        description:
          "Blend organic life with mechanical precision. Create creatures and worlds where technology and nature coexist in harmony or conflict.",
        tags: ["steampunk", "cyber", "mechanical", "organic"],
      },
      {
        title: '"Cosmic Wanderers"',
        description:
          "Journey through the cosmos - explore strange new worlds, alien landscapes, and the infinite possibilities of space.",
        tags: ["space", "cosmic", "alien", "infinite"],
      },
      {
        title: '"Whispers of the Past"',
        description:
          "Bring history to life through art. Reimagine ancient civilizations, lost cultures, and the echoes of bygone eras.",
        tags: ["history", "ancient", "culture", "heritage"],
      },
      {
        title: '"Flora & Fauna Fantasia"',
        description:
          "Create a vibrant celebration of the natural world. Reimagine plants and animals in fantastical ways that celebrate biodiversity.",
        tags: ["nature", "fantasy", "animals", "plants"],
      },
      {
        title: '"Architectural Dreams"',
        description:
          "Design impossible structures - buildings that defy physics, cities that float, homes that breathe. Show us the architecture of imagination.",
        tags: ["architecture", "design", "impossible", "dreams"],
      },
      {
        title: '"Shadow & Light"',
        description:
          "Explore the dramatic interplay between shadow and light. Create artwork where the darkness reveals as much as it conceals.",
        tags: ["shadows", "light", "contrast", "mystery"],
      },
      {
        title: '"Festival of Colors"',
        description:
          "Celebrate the joy of color - create vibrant, energetic artwork that captures the spirit of celebration and cultural festivity.",
        tags: ["color", "celebration", "festival", "vibrant"],
      },
    ];

    // Weekly challenge themes
    this.weeklyThemes = [
      {
        title: '"Urban Jungle"',
        description:
          "Create artwork that blends city architecture with natural elements. Think vines growing on skyscrapers, tree roots breaking through pavement, or wildlife adapting to urban environments.",
        tags: ["cityscape", "nature", "surreal", "contrast"],
      },
      {
        title: '"Golden Hour Glow"',
        description:
          "Capture the magic of the golden hour - that brief moment when the sun casts everything in warm, glowing light. Show us the beauty of transition.",
        tags: ["golden hour", "lighting", "warm", "transition"],
      },
      {
        title: '"Silent Stories"',
        description:
          "Create artwork that tells a story without words. Let the composition, color, and mood convey a narrative that speaks to the viewer.",
        tags: ["storytelling", "narrative", "silence", "expression"],
      },
      {
        title: '"Fractured Realities"',
        description:
          "Explore the beauty in broken things. Show us shattered perspectives, fragmented visions, and the art that emerges from the pieces.",
        tags: ["fractured", "abstract", "broken", "perspective"],
      },
      {
        title: '"Midnight Musings"',
        description:
          "Capture the introspection and mystery of the midnight hour. Create artwork that feels intimate, quiet, and deeply personal.",
        tags: ["night", "introspection", "quiet", "intimate"],
      },
      {
        title: '"Abstract Emotions"',
        description:
          "Translate feelings into abstract form. Let color, shape, and texture express what words cannot capture.",
        tags: ["abstract", "emotion", "feeling", "expression"],
      },
      {
        title: '"Culinary Canvas"',
        description:
          "Treat food as art - create stunning compositions that celebrate the beauty and creativity of cuisine.",
        tags: ["food", "culinary", "creative", "composition"],
      },
      {
        title: '"Dance of the Elements"',
        description:
          "Capture movement and energy in a single frame. Show us the grace, power, and beauty of things in motion.",
        tags: ["dance", "movement", "energy", "grace"],
      },
      {
        title: '"Futuristic Visions"',
        description:
          "Imagine the world of tomorrow. Create artwork that explores the possibilities of future technology, society, and human evolution.",
        tags: ["future", "technology", "futuristic", "imagination"],
      },
      {
        title: '"Organic Abstracts"',
        description:
          "Find the abstract beauty in the natural world. Create compositions inspired by organic forms, patterns, and textures.",
        tags: ["organic", "abstract", "nature", "patterns"],
      },
      {
        title: '"Cultural Fusion"',
        description:
          "Blend cultural elements from different traditions and eras to create something entirely new and beautiful.",
        tags: ["culture", "fusion", "diverse", "creative"],
      },
      {
        title: '"Dreamscapes"',
        description:
          "Bring your dreams to life. Create surreal landscapes and scenes that exist only in the realm of imagination.",
        tags: ["dreams", "surreal", "landscape", "imagination"],
      },
    ];

    this.init();
  }

  // ============================================ */
  // GET CURRENT WEEK NUMBER                     */
  // ============================================ */
  getCurrentWeekNumber() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  // ============================================ */
  // GET CURRENT MONTH THEME                     */
  // ============================================ */
  getCurrentMonthTheme() {
    const now = new Date();
    const monthIndex = now.getMonth(); // 0-11
    return this.monthlyThemes[monthIndex % this.monthlyThemes.length];
  }

  // ============================================ */
  // GET CURRENT WEEK THEME                      */
  // ============================================ */
  getCurrentWeekTheme() {
    const weekNumber = this.getCurrentWeekNumber();
    // Use week number to cycle through themes (minus 1 because week 1 = index 0)
    const themeIndex = (weekNumber - 1) % this.weeklyThemes.length;
    return this.weeklyThemes[themeIndex];
  }

  // ============================================ */
  // GET WEEK DATE RANGE                         */
  // ============================================ */
  getWeekDateRange() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1),
    );
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 0);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startStr = `${months[startOfWeek.getMonth()]} ${startOfWeek.getDate()}`;
    const endStr = `${months[endOfWeek.getMonth()]} ${endOfWeek.getDate()}`;
    return `${startStr} - ${endStr}`;
  }

  // ============================================ */
  // GET MONTH NAME                              */
  // ============================================ */
  getMonthName() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const now = new Date();
    const year = now.getFullYear();
    return `${months[now.getMonth()]} ${year}`;
  }

  // ============================================ */
  // INIT                                        */
  // ============================================ */
  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        await this.checkAdminStatus();
      }
      this.loadDailyChallenge();
      this.loadChallengeStats();
      this.loadWeeklyChallenge();
      this.loadMonthlyChallenge();
      this.loadYearlyChallenge();
      this.loadCommunityStats();
      this.loadRecentActivity();
      this.loadFeaturedArtworks();
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

  // ============================================ */
  // ALL COUNTDOWNS                              */
  // ============================================ */
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
    const countdownElement = document.getElementById("countdown");
    if (!countdownElement) return;

    const updateDaily = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow - now;

      if (diff <= 0) {
        const newTomorrow = new Date(now);
        newTomorrow.setDate(newTomorrow.getDate() + 1);
        newTomorrow.setHours(0, 0, 0, 0);
        const newDiff = newTomorrow - now;
        const hours = Math.floor(newDiff / (1000 * 60 * 60));
        const minutes = Math.floor((newDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((newDiff % (1000 * 60)) / 1000);
        countdownElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      countdownElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    updateDaily();
    if (this.countdownIntervals.daily) {
      clearInterval(this.countdownIntervals.daily);
    }
    this.countdownIntervals.daily = setInterval(updateDaily, 1000);
  }

  startWeeklyCountdown() {
    const countdownElement = document.getElementById("weekly-days-left");
    if (!countdownElement) return;

    const updateWeekly = () => {
      const now = new Date();

      // Calculate next Monday
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const diff = nextMonday - now;

      if (diff <= 0) {
        const newMonday = new Date(now);
        const newDaysUntilMonday = (8 - now.getDay()) % 7 || 7;
        newMonday.setDate(now.getDate() + newDaysUntilMonday);
        newMonday.setHours(0, 0, 0, 0);
        const newDiff = newMonday - now;
        const days = Math.floor(newDiff / (1000 * 60 * 60 * 24));
        countdownElement.textContent = `${days} days left`;
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      countdownElement.textContent = `${days} days left`;
    };

    updateWeekly();
    if (this.countdownIntervals.weekly) {
      clearInterval(this.countdownIntervals.weekly);
    }
    this.countdownIntervals.weekly = setInterval(updateWeekly, 60000);
  }

  startMonthlyCountdown() {
    const countdownElement = document.getElementById("monthly-days-left");
    if (!countdownElement) return;

    const updateMonthly = () => {
      const now = new Date();

      // Calculate end of month
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 0);

      const diff = endOfMonth - now;

      if (diff <= 0) {
        const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        nextMonthEnd.setHours(23, 59, 59, 0);
        const newDiff = nextMonthEnd - now;
        const days = Math.floor(newDiff / (1000 * 60 * 60 * 24));
        countdownElement.textContent = `${days} days left`;
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      countdownElement.textContent = `${days} days left`;
    };

    updateMonthly();
    if (this.countdownIntervals.monthly) {
      clearInterval(this.countdownIntervals.monthly);
    }
    this.countdownIntervals.monthly = setInterval(updateMonthly, 60000);
  }

  startYearlyCountdown() {
    const countdownElement = document.getElementById("yearly-days-left");
    if (!countdownElement) return;

    const updateYearly = () => {
      const now = new Date();

      const endOfYear = new Date(now.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 0);

      const diff = endOfYear - now;

      if (diff <= 0) {
        const nextYearEnd = new Date(now.getFullYear() + 1, 11, 31);
        nextYearEnd.setHours(23, 59, 59, 0);
        const newDiff = nextYearEnd - now;
        const days = Math.floor(newDiff / (1000 * 60 * 60 * 24));
        countdownElement.textContent = `${days} days left`;
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      countdownElement.textContent = `${days} days left`;
    };

    updateYearly();
    if (this.countdownIntervals.yearly) {
      clearInterval(this.countdownIntervals.yearly);
    }
    this.countdownIntervals.yearly = setInterval(updateYearly, 3600000);
  }

  // ============================================ */
  // WEEKLY CHALLENGE - SELF-UPDATING           */
  // ============================================ */
  loadWeeklyChallenge() {
    const weekNumber = this.getCurrentWeekNumber();
    const theme = this.getCurrentWeekTheme();
    const dateRange = this.getWeekDateRange();

    document.getElementById("weekly-title").textContent = theme.title;
    document.getElementById("weekly-description").textContent =
      theme.description;
    document.getElementById("weekly-date-range").textContent =
      `Week ${weekNumber} · ${dateRange}`;
    document.getElementById("weekly-prize").innerHTML =
      `<i class="fas fa-gem"></i> Prize: Featured artist spot + 500 community points`;

    const tags = document.querySelectorAll("#weekly-tags .challenge-tag");
    theme.tags.forEach((tag, index) => {
      if (tags[index]) {
        tags[index].textContent = `#${tag}`;
        tags[index].style.display = "inline-block";
      }
    });
    for (let i = theme.tags.length; i < tags.length; i++) {
      tags[i].style.display = "none";
    }
  }

  // ============================================ */
  // MONTHLY CHALLENGE - SELF-UPDATING          */
  // ============================================ */
  loadMonthlyChallenge() {
    const theme = this.getCurrentMonthTheme();
    const monthName = this.getMonthName();

    document.getElementById("monthly-title").textContent = theme.title;
    document.getElementById("monthly-description").textContent =
      theme.description;
    document.getElementById("monthly-date").textContent =
      `${monthName} · ${theme.tags[0] || "Creative"}`;
    document.getElementById("monthly-prize").innerHTML =
      `<i class="fas fa-trophy"></i> Prize: $100 gift card + 1-year premium membership + Featured exhibition`;

    const tags = document.querySelectorAll("#monthly-tags .challenge-tag");
    theme.tags.forEach((tag, index) => {
      if (tags[index]) {
        tags[index].textContent = `#${tag}`;
        tags[index].style.display = "inline-block";
      }
    });
    for (let i = theme.tags.length; i < tags.length; i++) {
      tags[i].style.display = "none";
    }
  }

  // ============================================ */
  // YEARLY CHALLENGE                            */
  // ============================================ */
  loadYearlyChallenge() {
    const year = new Date().getFullYear();
    const yearlyData = {
      title: '"Metamorphosis: The Year of Transformation"',
      description:
        "Document transformation through 12 themed chapters - one for each month. From personal growth to environmental change, from character evolution to artistic style development. Create a cohesive body of work that tells a story of change and emergence.",
      tags: ["transformation", "growth", "evolution", "series"],
      year: `${year} Grand Challenge`,
      prize:
        '$5,000 + Solo exhibition + Mentorship program + "Artisan of the Year" title + Soul Chaser Badge',
    };

    document.getElementById("yearly-title").textContent = yearlyData.title;
    document.getElementById("yearly-description").textContent =
      yearlyData.description;
    document.getElementById("yearly-date").textContent = yearlyData.year;
    document.getElementById("yearly-prize").innerHTML =
      `<i class="fas fa-crown"></i> Grand Prize: ${yearlyData.prize}`;

    const tags = document.querySelectorAll("#yearly-tags .challenge-tag");
    yearlyData.tags.forEach((tag, index) => {
      if (tags[index]) {
        tags[index].textContent = `#${tag}`;
        tags[index].style.display = "inline-block";
      }
    });
    for (let i = yearlyData.tags.length; i < tags.length; i++) {
      tags[i].style.display = "none";
    }
  }

  // ============================================ */
  // ADMIN CHECK - FIXED WITH TOGGLE VISIBILITY  */
  // ============================================ */
  async checkAdminStatus() {
    try {
      const doc = await firebase
        .firestore()
        .collection("users")
        .doc(this.currentUser.uid)
        .get();
      if (doc.exists) {
        const data = doc.data();
        this.isAdmin =
          data.role === "admin" ||
          data.role === "moderator" ||
          data.isAdmin === true;

        // Get all admin elements
        const adminToggle = document.querySelector(".bulletin-admin-toggle");
        const adminPanel = document.querySelector(".bulletin-admin");
        const heroControls = document.querySelector(".hero-controls");

        if (this.isAdmin) {
          // Show admin elements
          if (adminToggle) {
            adminToggle.classList.add("visible");
            adminToggle.style.display = "block";
          }
          if (adminPanel) {
            adminPanel.classList.add("visible");
            adminPanel.style.display = "block";
          }
          if (heroControls) {
            heroControls.classList.add("visible");
            heroControls.style.display = "flex";
          }
          console.log("✅ Admin mode activated!");
        } else {
          // Hide admin elements
          if (adminToggle) {
            adminToggle.classList.remove("visible");
            adminToggle.style.display = "none";
          }
          if (adminPanel) {
            adminPanel.classList.remove("visible");
            adminPanel.style.display = "none";
          }
          if (heroControls) {
            heroControls.classList.remove("visible");
            heroControls.style.display = "none";
          }
          console.log("👤 User mode (not admin)");
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }

  // ============================================ */
  // THEME TOGGLE                                */
  // ============================================ */
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
    const toggleBtn = document.getElementById("themeToggle");

    if (theme === "light") {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
      if (toggleBtn) {
        toggleBtn.innerHTML =
          '<i class="fas fa-moon"></i><i class="fas fa-sun"></i>';
      }
    } else {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
      if (toggleBtn) {
        toggleBtn.innerHTML =
          '<i class="fas fa-moon"></i><i class="fas fa-sun"></i>';
      }
    }
  }

  // ============================================ */
  // EXPORT INTUIT CHALLENGES FOR CHALLENGES.JS   */
  // ============================================ */
  getIntuitChallenges() {
    const now = new Date();
    const weekNumber = this.getCurrentWeekNumber();
    const monthIndex = now.getMonth();

    // Intuit Yearly
    const intuitYearly = {
      id: "intuit-yearly-1",
      type: "yearly",
      title: '"Metamorphosis: The Year of Transformation"',
      description:
        "Document transformation through 12 themed chapters - one for each month. From personal growth to environmental change, from character evolution to artistic style development. Create a cohesive body of work that tells a story of change and emergence.",
      icon: "👑",
      tags: ["transformation", "growth", "evolution", "series"],
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: new Date(now.getFullYear(), 11, 31),
      prize:
        "Grand Master Badge + Featured Artist + Solo Exhibition + Design a Challenge",
      prizeValue: 1000,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "grand_master",
      color: "#ff38e4",
    };

    // Intuit Monthly
    const monthlyTheme = this.getCurrentMonthTheme();
    const intuitMonthly = {
      id: "intuit-monthly-1",
      type: "monthly",
      title: `"${monthlyTheme.title}"`,
      description: monthlyTheme.description,
      icon: "⭐",
      tags: monthlyTheme.tags,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      prize: "Master Badge + Homepage Feature + Pick Next Monthly Theme",
      prizeValue: 500,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "monthly_master",
      color: "#ff38e4",
    };

    // Intuit Weekly
    const weeklyTheme = this.getCurrentWeekTheme();
    const intuitWeeklyStart = new Date(now);
    const daysUntilNextMonday = (7 - now.getDay() + 1) % 7 || 7;
    intuitWeeklyStart.setDate(now.getDate() + daysUntilNextMonday);
    intuitWeeklyStart.setHours(0, 0, 0, 0);

    const intuitWeeklyEnd = new Date(intuitWeeklyStart);
    intuitWeeklyEnd.setDate(intuitWeeklyEnd.getDate() + 6);
    intuitWeeklyEnd.setHours(23, 59, 59, 0);

    const intuitWeekly = {
      id: "intuit-weekly-1",
      type: "weekly",
      title: `"${weeklyTheme.title}"`,
      description: weeklyTheme.description,
      icon: "✨",
      tags: weeklyTheme.tags,
      startDate: intuitWeeklyStart,
      endDate: intuitWeeklyEnd,
      prize: "Champion Badge + Social Media Feature + Pinned in Community",
      prizeValue: 250,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "weekly_winner",
      color: "#ff38e4",
    };

    return [intuitYearly, intuitMonthly, intuitWeekly];
  }

  // ============================================ */
  // HERO CONTROLS                               */
  // ============================================ */
  setupHeroControls() {
    const layer1Upload = document.getElementById("layer1Upload");
    const layer2Upload = document.getElementById("layer2Upload");

    if (layer1Upload) {
      layer1Upload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          this.uploadHeroLayer(file, "layer1");
        }
      });
    }

    if (layer2Upload) {
      layer2Upload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          this.uploadHeroLayer(file, "layer2");
        }
      });
    }
  }

  async uploadHeroLayer(file, layer) {
    if (!this.isAdmin) {
      this.showToast(
        "You do not have permission to change the hero image.",
        "error",
      );
      return;
    }

    const loading = document.getElementById("uploadLoading");
    if (loading) {
      loading.style.display = "block";
      loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    try {
      const storageRef = firebase.storage().ref();
      const filePath = `hub-hero/${layer}/${Date.now()}_${file.name}`;
      const uploadTask = storageRef.child(filePath).put(file);
      const snapshot = await uploadTask;
      const downloadURL = await snapshot.ref.getDownloadURL();

      const container = document.getElementById(`${layer}Content`);
      if (container) {
        if (file.type.startsWith("video/")) {
          container.innerHTML = `<video src="${downloadURL}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
        } else {
          container.innerHTML = `<img src="${downloadURL}" alt="Hero background" style="width:100%;height:100%;object-fit:cover;">`;
        }
      }

      await firebase
        .firestore()
        .collection("settings")
        .doc("hubHero")
        .set(
          {
            [`${layer}Url`]: downloadURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: this.currentUser.uid,
          },
          { merge: true },
        );

      this.showToast("Hero image updated successfully! ✅");
    } catch (error) {
      console.error("Error uploading hero layer:", error);
      this.showToast("Error uploading image. Please try again.", "error");
    } finally {
      if (loading) loading.style.display = "none";
    }
  }

  // ============================================ */
  // DAILY CHALLENGE                             */
  // ============================================ */
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

    const tags = document.querySelectorAll("#daily-tags .challenge-tag");
    todayPrompt.tags.forEach((tag, index) => {
      if (tags[index]) {
        tags[index].textContent = `#${tag}`;
        tags[index].style.display = "inline-block";
      }
    });
    for (let i = todayPrompt.tags.length; i < tags.length; i++) {
      tags[i].style.display = "none";
    }
  }

  async loadChallengeStats() {
    try {
      const participantsSnapshot = await firebase
        .firestore()
        .collection("challengeParticipants")
        .get();
      const submissionsSnapshot = await firebase
        .firestore()
        .collection("submissions")
        .where("type", "==", "challenge")
        .get();

      const participants = participantsSnapshot.size || 0;
      const submissions = submissionsSnapshot.size || 0;

      document.getElementById("daily-participants").textContent =
        participants > 0 ? participants : "0";
      document.getElementById("daily-submissions").textContent =
        submissions > 0 ? submissions : "0";
    } catch (error) {
      console.error("Error loading challenge stats:", error);
      document.getElementById("daily-participants").textContent =
        Math.floor(Math.random() * 100) + 50;
      document.getElementById("daily-submissions").textContent =
        Math.floor(Math.random() * 70) + 30;
    }
  }

  // ============================================ */
  // COMMUNITY STATS                             */
  // ============================================ */
  async loadCommunityStats() {
    try {
      const usersSnapshot = await firebase
        .firestore()
        .collection("users")
        .get();
      const artworksSnapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .get();

      document.getElementById("total-members").textContent =
        usersSnapshot.size > 0 ? usersSnapshot.size : "0";
      document.getElementById("total-artworks").textContent =
        artworksSnapshot.size > 0 ? artworksSnapshot.size : "0";
      document.getElementById("active-challenges").textContent = "3";
      document.getElementById("trending-artworks").textContent = "12";

      document.getElementById("cta-members").textContent =
        usersSnapshot.size > 0 ? usersSnapshot.size : "0";
      document.getElementById("cta-artworks").textContent =
        artworksSnapshot.size > 0 ? artworksSnapshot.size : "0";
      document.getElementById("cta-submissions").textContent =
        Math.floor(Math.random() * 500) + 200;
    } catch (error) {
      console.error("Error loading community stats:", error);
    }
  }

  // ============================================ */
  // RECENT ACTIVITY                             */
  // ============================================ */
  async loadRecentActivity() {
    const grid = document.getElementById("activity-grid");
    if (!grid) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(6)
        .get();

      if (snapshot.empty) {
        grid.innerHTML = this.getEmptyActivityHTML();
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
          (activity) => `
        <div class="activity-item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${activity.id}'">
          <div class="activity-image" style="background-image: url('${activity.imageUrl || ""}'); background-size: cover; background-position: center;">
            ${!activity.imageUrl ? '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">No image</div>' : ""}
          </div>
          <div class="activity-content">
            <div class="activity-meta">
              <div class="activity-user">
                <div class="user-avatar">${activity.artistName.charAt(0).toUpperCase()}</div>
                ${activity.artistName}
              </div>
              <span>${this.formatTimeAgo(activity.createdAt)}</span>
            </div>
            <div class="activity-title">${this.escapeHtml(activity.title)}</div>
            <div class="activity-desc">New artwork uploaded to the gallery</div>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading recent activity:", error);
      grid.innerHTML = this.getEmptyActivityHTML();
    }
  }

  getEmptyActivityHTML() {
    return `
      <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
        <i class="fas fa-clock" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>
        <p>No recent activity yet. Be the first to upload!</p>
      </div>
    `;
  }

  // ============================================ */
  // FEATURED ARTWORKS - FIXED NO INDEX         */
  // ============================================ */
  async loadFeaturedArtworks() {
    const grid = document.getElementById("featured-artworks-grid");
    if (!grid) return;

    try {
      // First get all published artworks
      const snapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .get();

      if (snapshot.empty) {
        grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
          <i class="fas fa-image" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>
          <p>No featured artworks yet.</p>
        </div>
      `;
        return;
      }

      // Sort in memory instead of using orderBy (avoids index requirement)
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
          createdAt: data.createdAt,
        });
      });

      // Sort by likes (most liked first)
      artworks.sort((a, b) => b.likes - a.likes);
      const topArtworks = artworks.slice(0, 6);

      grid.innerHTML = topArtworks
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
      grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
        <p>Error loading artworks. Please refresh.</p>
      </div>
    `;
    }
  }
  // ============================================ */
  // FEATURED ARTISTS - FIXED                    */
  // ============================================ */
  async loadFeaturedArtists() {
    const grid = document.getElementById("featured-artists-grid");
    if (!grid) return;

    try {
      const usersSnapshot = await firebase
        .firestore()
        .collection("users")
        .get();

      // Get all artworks to count per user
      const artworksSnapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .get();

      // Count artworks per user
      const artworkCounts = {};
      artworksSnapshot.forEach((doc) => {
        const data = doc.data();
        const uid = data.userId || data.uid || data.artistId;
        if (uid) {
          artworkCounts[uid] = (artworkCounts[uid] || 0) + 1;
        }
      });

      // Get followers count from users
      const users = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;
        // Count followers - if followers is an array or subcollection
        let followerCount = 0;
        if (data.followers) {
          if (Array.isArray(data.followers)) {
            followerCount = data.followers.length;
          } else if (typeof data.followers === "number") {
            followerCount = data.followers;
          }
        }

        users.push({
          id: uid,
          fullname: data.fullname || data.displayName || "Artist",
          username: data.username || "artist",
          artworks: artworkCounts[uid] || 0,
          followers: followerCount,
          likes: data.totalLikes || 0,
          avatarUrl: data.profilePicture || data.photoURL || null,
          bio: data.bio || "",
        });
      });

      // Sort by artworks count (most active first)
      users.sort((a, b) => b.artworks - a.artworks);
      const topUsers = users.slice(0, 6);

      if (topUsers.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
            <i class="fas fa-users" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>
            <p>No featured artists yet.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = topUsers
        .map(
          (user) => `
        <div class="artist-card" onclick="window.location.href='/pages/community/profiles.html?user=${user.id}'">
          <div class="artist-cover">
            ${
              user.avatarUrl
                ? `<img src="${user.avatarUrl}" alt="${user.fullname}">`
                : `<div style="font-size:4rem;opacity:0.3;">🎨</div>`
            }
            <div class="artist-avatar-overlay">
              ${
                user.avatarUrl
                  ? `<img src="${user.avatarUrl}" alt="${user.fullname}">`
                  : user.fullname.charAt(0).toUpperCase()
              }
            </div>
          </div>
          <div class="artist-info">
            <div class="artist-name">${this.escapeHtml(user.fullname)}</div>
            <div class="artist-specialty">@${user.username}</div>
            <div class="artist-stats">
              <div class="stat">
                <span class="number">${user.artworks}</span>
                <span class="label">Artworks</span>
              </div>
              <div class="stat">
                <span class="number">${user.followers}</span>
                <span class="label">Followers</span>
              </div>
            </div>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Error loading featured artists:", error);
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
          <p>Error loading artists. Please refresh.</p>
        </div>
      `;
    }
  }

  // ============================================ */
  // TOP CREATORS - FIXED LEADERBOARD            */
  // ============================================ */
  async loadTopCreators() {
    const grid = document.getElementById("creators-grid");
    if (!grid) return;

    try {
      const usersSnapshot = await firebase
        .firestore()
        .collection("users")
        .get();

      // Get all artworks to count per user
      const artworksSnapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("status", "==", "published")
        .get();

      // Count artworks per user
      const artworkCounts = {};
      artworksSnapshot.forEach((doc) => {
        const data = doc.data();
        const uid = data.userId || data.uid || data.artistId;
        if (uid) {
          artworkCounts[uid] = (artworkCounts[uid] || 0) + 1;
        }
      });

      const users = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;

        // Count followers
        let followerCount = 0;
        if (data.followers) {
          if (Array.isArray(data.followers)) {
            followerCount = data.followers.length;
          } else if (typeof data.followers === "number") {
            followerCount = data.followers;
          }
        }

        const artworks = artworkCounts[uid] || 0;
        const likes = data.totalLikes || 0;
        // Calculate points: 10 points per artwork, 2 per follower, 0.5 per like
        const points = Math.round(
          artworks * 10 + followerCount * 2 + likes * 0.5,
        );

        users.push({
          id: uid,
          fullname: data.fullname || data.displayName || "Artist",
          username: data.username || "artist",
          artworks: artworks,
          followers: followerCount,
          likes: likes,
          points: points,
          avatarUrl: data.profilePicture || data.photoURL || null,
        });
      });

      // Sort by points (highest first)
      users.sort((a, b) => b.points - a.points);
      const topUsers = users.slice(0, 10);

      if (topUsers.length === 0) {
        grid.innerHTML = `
          <div style="text-align:center;padding:2rem;color:var(--text-muted);">
            <p>No top creators yet. Be the first!</p>
          </div>
        `;
        return;
      }

      const rankClasses = ["gold", "silver", "bronze"];

      grid.innerHTML = topUsers
        .map((user, index) => {
          const rank = index + 1;
          const rankClass = rank <= 3 ? rankClasses[index] : "normal";
          const medal =
            rank === 1
              ? "🥇"
              : rank === 2
                ? "🥈"
                : rank === 3
                  ? "🥉"
                  : `#${rank}`;

          return `
          <div class="creator-card" onclick="window.location.href='/pages/community/profiles.html?user=${user.id}'">
            <div class="creator-rank ${rankClass}">${medal}</div>
            <div class="creator-avatar" style="background-image: url('${user.avatarUrl || ""}'); background-size: cover; background-position: center;">
              ${!user.avatarUrl ? user.fullname.charAt(0).toUpperCase() : ""}
            </div>
            <div class="creator-info">
              <div class="creator-name">${this.escapeHtml(user.fullname)}</div>
              <div class="creator-stats">
                <span><i class="fas fa-palette"></i> ${user.artworks} artworks</span>
                <span><i class="fas fa-users"></i> ${user.followers} followers</span>
              </div>
            </div>
            <div class="creator-points">${user.points} pts</div>
            ${rank <= 3 ? `<div class="creator-badge">${rank === 1 ? "🏆 Top Creator" : rank === 2 ? "🥈 Silver" : "🥉 Bronze"}</div>` : ""}
          </div>
        `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading top creators:", error);
      grid.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--text-muted);">
          <p>Error loading top creators. Please refresh.</p>
        </div>
      `;
    }
  }

  // ============================================ */
  // WINNERS CAROUSEL                           */
  // ============================================ */
  async loadWinners() {
    const container = document.getElementById("winners-carousel");
    if (!container) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("challengeWinners")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      if (snapshot.empty) {
        const placeholders = Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `placeholder-${i}`,
            rank: i + 1,
            name: `Winner ${i + 1}`,
            imageUrl: null,
            artworkId: null,
          }));
        this.renderWinnersCarousel(placeholders);
        return;
      }

      const winners = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        winners.push({
          id: doc.id,
          rank: data.rank || winners.length + 1,
          name: data.artistName || "Artist",
          imageUrl: data.imageUrl,
          artworkId: data.artworkId,
        });
      });

      this.renderWinnersCarousel(winners);
    } catch (error) {
      console.error("Error loading winners:", error);
      const placeholders = Array(10)
        .fill(null)
        .map((_, i) => ({
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

    container.innerHTML = winners
      .map(
        (winner, index) => `
      <div class="winner-item" style="--position: ${index + 1}">
        <div class="winner-card" onclick="window.location.href='/pages/community/artwork-detail.html?id=${winner.artworkId || "#"}'">
          ${
            winner.imageUrl
              ? `<img src="${winner.imageUrl}" alt="${winner.name}">`
              : `<div class="winner-placeholder">
              <div class="placeholder-icon">🏆</div>
              <div class="placeholder-rank">#${winner.rank}</div>
              <div class="placeholder-text">${winner.name}</div>
            </div>`
          }
          <div class="winner-overlay">
            <div class="winner-rank">#${winner.rank} Winner</div>
            <div class="winner-name">${this.escapeHtml(winner.name)}</div>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // ============================================ */
  // BULLETIN BOARD - WITH EXPAND                 */
  // ============================================ */
  async loadBulletinPosts() {
    const grid = document.getElementById("bulletin-grid");
    if (!grid) return;

    try {
      const snapshot = await firebase
        .firestore()
        .collection("bulletinPosts")
        .orderBy("createdAt", "desc")
        .limit(6)
        .get();

      if (snapshot.empty) {
        grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
          <i class="fas fa-newspaper" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>
          <p>No announcements yet. Check back soon!</p>
        </div>
      `;
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
          createdAt: data.createdAt,
          author: data.author || "Admin",
        });
      });

      grid.innerHTML = posts
        .map((post, index) => {
          const isLong = post.content.length > 150;
          const shortContent = post.content.substring(0, 150);
          const expandId = `expand-${post.id}-${index}`;

          return `
        <div class="bulletin-post" id="post-${post.id}">
          <div class="post-date">${this.formatTimeAgo(post.createdAt)}</div>
          <div class="post-title">${this.escapeHtml(post.title)}</div>
          <div class="post-content-wrapper">
            <div class="post-excerpt" id="${expandId}-short">
              ${this.escapeHtml(shortContent)}${isLong ? "..." : ""}
            </div>
            ${
              isLong
                ? `
              <div class="post-excerpt-full" id="${expandId}-full" style="display:none;">
                ${this.escapeHtml(post.content)}
              </div>
              <button class="post-expand-btn" data-target="${expandId}">
                <span class="btn-text">Read More</span>
                <i class="fas fa-chevron-down"></i>
              </button>
            `
                : ""
            }
          </div>
          ${post.link ? `<a href="${post.link}" class="post-link" target="_blank">Visit Link <i class="fas fa-external-link-alt"></i></a>` : ""}
        </div>
      `;
        })
        .join("");

      // Add event listeners for all expand buttons
      document.querySelectorAll(".post-expand-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const targetId = btn.dataset.target;
          const shortEl = document.getElementById(`${targetId}-short`);
          const fullEl = document.getElementById(`${targetId}-full`);
          const btnText = btn.querySelector(".btn-text");
          const icon = btn.querySelector("i");

          if (shortEl && fullEl) {
            const isExpanded = fullEl.style.display === "block";

            if (isExpanded) {
              // Collapse
              fullEl.style.display = "none";
              shortEl.style.display = "block";
              btnText.textContent = "Read More";
              icon.className = "fas fa-chevron-down";
              btn.classList.remove("expanded");
            } else {
              // Expand
              fullEl.style.display = "block";
              shortEl.style.display = "none";
              btnText.textContent = "Show Less";
              icon.className = "fas fa-chevron-up";
              btn.classList.add("expanded");
            }
          }
        });
      });
    } catch (error) {
      console.error("Error loading bulletin posts:", error);
      grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
        <p>Error loading announcements. Please refresh.</p>
      </div>
    `;
    }
  }
  // ============================================ */
  // SUGGESTION BOX                              */
  // ============================================ */
  setupSuggestionBox() {
    const form = document.getElementById("suggestion-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const idea = document.getElementById("suggestion-idea").value.trim();
      const name =
        document.getElementById("suggestion-name").value.trim() || "Anonymous";

      if (!idea) {
        this.showToast("Please share your idea! 💭", "error");
        return;
      }

      try {
        await firebase
          .firestore()
          .collection("suggestions")
          .add({
            idea: idea,
            name: name,
            userId: this.currentUser?.uid || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending",
          });

        this.showToast("Thank you for your suggestion! 🌟");
        form.reset();
      } catch (error) {
        console.error("Error submitting suggestion:", error);
        this.showToast(
          "Error submitting suggestion. Please try again.",
          "error",
        );
      }
    });
  }

  // ============================================ */
  // CHALLENGE ACTIONS                           */
  // ============================================ */
  handleStartChallenge(challengeType = "daily") {
    if (!this.currentUser) {
      window.location.href =
        "/pages/auth/login.html?redirect=" +
        encodeURIComponent(window.location.pathname);
      return;
    }

    this.showChallengeModal(challengeType);
  }

  showChallengeModal(challengeType) {
    const existingModal = document.getElementById("challengeModal");
    if (existingModal) {
      existingModal.remove();
    }

    const promptMap = {
      daily:
        document.getElementById("daily-prompt-title")?.textContent ||
        "Create something amazing!",
      weekly: this.getCurrentWeekTheme().title || "Weekly Challenge",
      monthly: this.getCurrentMonthTheme().title || "Monthly Challenge",
      yearly: '"Metamorphosis: The Year of Transformation"',
    };

    const promptText = promptMap[challengeType] || "Create something amazing!";

    const modalHTML = `
      <div class="modal-overlay active" id="challengeModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3><i class="fas fa-paint-brush"></i> Start Creating</h3>
            <button class="modal-close" id="closeChallengeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="challenge-prompt">
              <h4>${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)} Challenge:</h4>
              <p>"${promptText}"</p>
            </div>
            <div class="create-options">
              <button class="create-option" id="upload-existing">
                <i class="fas fa-upload"></i>
                <span>Upload Existing Artwork</span>
                <small>Submit an artwork you've already created</small>
              </button>
              <button class="create-option" id="create-new">
                <i class="fas fa-plus"></i>
                <span>Create New Artwork</span>
                <small>Use our tools to create something fresh</small>
              </button>
              <button class="create-option" id="get-inspiration">
                <i class="fas fa-lightbulb"></i>
                <span>Get Inspiration</span>
                <small>Browse the gallery for ideas</small>
              </button>
            </div>
            <div class="modal-tips">
              <h5>💡 Quick Tips:</h5>
              <ul>
                <li>Use our <a href="/pages/tools/color-palette-generator.html" target="_blank">color tools</a></li>
                <li>Check <a href="/pages/tutorials/tutorials.html" target="_blank">tutorials</a> for guidance</li>
                <li>Share your process in the community</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.setupModalInteractions(challengeType);
  }

  setupModalInteractions(challengeType) {
    const modal = document.getElementById("challengeModal");
    const closeBtn = document.getElementById("closeChallengeModal");
    const uploadBtn = document.getElementById("upload-existing");
    const createBtn = document.getElementById("create-new");
    const inspirationBtn = document.getElementById("get-inspiration");

    const closeModal = () => {
      if (modal) modal.remove();
    };

    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("challengeModal")) {
        closeModal();
      }
    });

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        closeModal();
        window.location.href = `/pages/community/upload.html?challenge=${challengeType}`;
      });
    }

    if (createBtn) {
      createBtn.addEventListener("click", () => {
        closeModal();
        window.location.href = "/pages/tools/tools.html";
      });
    }

    if (inspirationBtn) {
      inspirationBtn.addEventListener("click", () => {
        closeModal();
        window.location.href = "/pages/community/gallery.html";
      });
    }
  }

  viewSubmissions(challengeType) {
    window.location.href = `/pages/community/gallery.html?filter=${challengeType}`;
  }

  shareChallenge() {
    const prompt =
      document.getElementById("daily-prompt-title")?.textContent ||
      "Today's challenge";
    const shareText = `🎨 Join me in today's Art Mecca challenge: "${prompt}"!\n\nCreate your interpretation and share it with our creative community.`;

    if (navigator.share) {
      navigator
        .share({
          title: "Art Mecca Daily Challenge",
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(`${shareText}\n${window.location.href}`)
        .then(() => this.showToast("Link copied to clipboard! 📋"))
        .catch(() => this.showToast("Failed to copy link", "error"));
    }
  }

  // ============================================ */
  // EVENT LISTENERS                             */
  // ============================================ */
  setupEventListeners() {
    document
      .getElementById("start-challenge-btn")
      ?.addEventListener("click", () => {
        this.handleStartChallenge("daily");
      });
    document
      .getElementById("share-challenge-btn")
      ?.addEventListener("click", () => {
        this.shareChallenge();
      });
    document
      .getElementById("view-submissions-btn")
      ?.addEventListener("click", () => {
        this.viewSubmissions("daily");
      });
    document
      .getElementById("daily-challenges-btn")
      ?.addEventListener("click", () => {
        window.location.href = "/pages/community/challenges.html";
      });

    document
      .getElementById("weekly-start-btn")
      ?.addEventListener("click", () => {
        this.handleStartChallenge("weekly");
      });
    document
      .getElementById("weekly-share-btn")
      ?.addEventListener("click", () => {
        this.shareChallenge();
      });
    document
      .getElementById("weekly-view-btn")
      ?.addEventListener("click", () => {
        this.viewSubmissions("weekly");
      });

    document
      .getElementById("monthly-start-btn")
      ?.addEventListener("click", () => {
        this.handleStartChallenge("monthly");
      });
    document
      .getElementById("monthly-share-btn")
      ?.addEventListener("click", () => {
        this.shareChallenge();
      });
    document
      .getElementById("monthly-view-btn")
      ?.addEventListener("click", () => {
        this.viewSubmissions("monthly");
      });

    document
      .getElementById("yearly-start-btn")
      ?.addEventListener("click", () => {
        this.handleStartChallenge("yearly");
      });
    document
      .getElementById("yearly-share-btn")
      ?.addEventListener("click", () => {
        this.shareChallenge();
      });
    document
      .getElementById("yearly-view-btn")
      ?.addEventListener("click", () => {
        this.viewSubmissions("yearly");
      });

    document.querySelectorAll(".feature-card").forEach((card) => {
      card.addEventListener("click", () => {
        const href = card.dataset.href;
        if (href) {
          window.location.href = href;
        } else if (card.dataset.soon) {
          this.showToast("Coming soon! 🚀");
        }
      });
    });

    document
      .getElementById("submit-bulletin-post")
      ?.addEventListener("click", () => {
        this.submitBulletinPost();
      });
  }

  // ============================================ */
  // BULLETIN ADMIN                              */
  // ============================================ */
  async submitBulletinPost() {
    // Double-check admin status
    if (!this.isAdmin) {
      this.showToast(
        "You do not have permission to post announcements.",
        "error",
      );
      return;
    }

    const title = document.getElementById("bulletin-title").value.trim();
    const content = document.getElementById("bulletin-content").value.trim();
    const link = document.getElementById("bulletin-link").value.trim();

    if (!title || !content) {
      this.showToast("Please fill in both title and content", "error");
      return;
    }

    try {
      await firebase
        .firestore()
        .collection("bulletinPosts")
        .add({
          title: title,
          content: content,
          link: link || "",
          author:
            this.currentUser?.displayName || this.currentUser?.email || "Admin",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      document.getElementById("bulletin-title").value = "";
      document.getElementById("bulletin-content").value = "";
      document.getElementById("bulletin-link").value = "";

      this.showToast("Post published successfully! ✅");
      this.loadBulletinPosts();
    } catch (error) {
      console.error("Error publishing post:", error);
      this.showToast("Error publishing post. Please try again.", "error");
    }
  }
  setupBulletinToggle() {
    const toggleBtn = document.getElementById("bulletinToggle");
    const adminPanel = document.getElementById("bulletinAdmin");

    if (toggleBtn && adminPanel) {
      toggleBtn.addEventListener("click", () => {
        // Only toggle if admin
        if (!this.isAdmin) {
          this.showToast(
            "You must be an admin to post announcements.",
            "error",
          );
          return;
        }

        const isVisible = adminPanel.classList.contains("visible");
        if (isVisible) {
          adminPanel.classList.remove("visible");
          adminPanel.style.display = "none";
          toggleBtn.textContent = "📝 Add Announcement";
        } else {
          adminPanel.classList.add("visible");
          adminPanel.style.display = "block";
          toggleBtn.textContent = "✖ Close";
        }
      });
    }
  }

  // ============================================ */
  // UTILITY FUNCTIONS                           */
  // ============================================ */
  formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

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

// ============================================ */
// INITIALIZE                                    */
// ============================================ */
// ============================================ */
// EXPOSE COMMUNITY HUB INSTANCE GLOBALLY      */
// ============================================ */

// Store the instance for other scripts to access
let communityHubInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof firebase !== "undefined" && firebase.auth) {
    communityHubInstance = new CommunityHub();
    window.communityHubInstance = communityHubInstance;
  } else {
    console.warn("Firebase not ready, retrying...");
    setTimeout(() => {
      if (typeof firebase !== "undefined" && firebase.auth) {
        communityHubInstance = new CommunityHub();
        window.communityHubInstance = communityHubInstance;
      }
    }, 2000);
  }
  // ====== RAINBOW PARTICLES ======
  const canvas = document.getElementById("particleCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouseX = -1000;
    let mouseY = -1000;
    const PARTICLE_COUNT = 80;

    // Rainbow colors for particles
    const rainbowColors = [
      "#ff0040",
      "#ff6b00",
      "#ffc72e",
      "#4ff3a6",
      "#58ebfe",
      "#0088ff",
      "#ad03fc",
      "#ff00ea",
    ];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.3 + 0.05;
        // Assign random rainbow color
        this.color =
          rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        // Random hue shift for more variety
        this.hueShift = Math.random() * 360;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = ((200 - dist) / 200) * 0.015;
          this.speedX += (dx / dist) * force;
          this.speedY += (dy / dist) * force;
        }

        this.speedX *= 0.999;
        this.speedY *= 0.999;

        const maxSpeed = 1.2;
        const speed = Math.sqrt(
          this.speedX * this.speedX + this.speedY * this.speedY,
        );
        if (speed > maxSpeed) {
          this.speedX = (this.speedX / speed) * maxSpeed;
          this.speedY = (this.speedY / speed) * maxSpeed;
        }

        if (
          this.x < 0 ||
          this.x > canvas.width ||
          this.y < 0 ||
          this.y > canvas.height
        ) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.04;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // Gradient connection line
            const gradient = ctx.createLinearGradient(
              particles[i].x,
              particles[i].y,
              particles[j].x,
              particles[j].y,
            );
            gradient.addColorStop(0, particles[i].color);
            gradient.addColorStop(1, particles[j].color);
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.6;
            ctx.shadowColor = particles[i].color;
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawConnections();
      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }
});

// Also export for direct use
window.CommunityHub = CommunityHub;
window.getCommunityHubInstance = () => communityHubInstance;
