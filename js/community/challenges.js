// ============================================ */
// CHALLENGES SYSTEM - COMPLETE                */
// 3 Daily + 4 Weekly + 6 Monthly + 3 Yearly   */
// + 4 Intuit (Daily, Weekly, Monthly, Yearly) */
// AUTO-UPDATING: Daily (24hrs), Weekly (Mon)  */
// Monthly (1st), Yearly (Jan 1)               */
// ============================================ */

class ChallengesSystem {
  constructor() {
    this.currentUser = null;
    this.challenges = [];
    this.userChallenges = new Map();
    this.currentType = "all";
    this.countdownIntervals = [];
    this.hudMode = false;
    this.scanlinesEnabled = true;
    this.gridMode = false;
    this.db = firebase.firestore();

    // ============================================ //
    // DAILY PROMPTS (rotates daily)               //
    // ============================================ //
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

    // ============================================ //
    // WEEKLY THEMES (rotates weekly, resets Mon)  //
    // ============================================ //
    this.weeklyThemes = [
      {
        title: "Urban Jungle",
        description:
          "Create artwork that blends city architecture with natural elements. Think vines growing on skyscrapers, tree roots breaking through pavement, or wildlife adapting to urban environments.",
        tags: ["cityscape", "nature", "surreal", "contrast"],
      },
      {
        title: "Golden Hour Glow",
        description:
          "Capture the magic of the golden hour - that brief moment when the sun casts everything in warm, glowing light. Show us the beauty of transition.",
        tags: ["golden hour", "lighting", "warm", "transition"],
      },
      {
        title: "Silent Stories",
        description:
          "Create artwork that tells a story without words. Let the composition, color, and mood convey a narrative that speaks to the viewer.",
        tags: ["storytelling", "narrative", "silence", "expression"],
      },
      {
        title: "Fractured Realities",
        description:
          "Explore the beauty in broken things. Show us shattered perspectives, fragmented visions, and the art that emerges from the pieces.",
        tags: ["fractured", "abstract", "broken", "perspective"],
      },
      {
        title: "Midnight Musings",
        description:
          "Capture the introspection and mystery of the midnight hour. Create artwork that feels intimate, quiet, and deeply personal.",
        tags: ["night", "introspection", "quiet", "intimate"],
      },
      {
        title: "Abstract Emotions",
        description:
          "Translate feelings into abstract form. Let color, shape, and texture express what words cannot capture.",
        tags: ["abstract", "emotion", "feeling", "expression"],
      },
      {
        title: "Culinary Canvas",
        description:
          "Treat food as art - create stunning compositions that celebrate the beauty and creativity of cuisine.",
        tags: ["food", "culinary", "creative", "composition"],
      },
      {
        title: "Dance of the Elements",
        description:
          "Capture movement and energy in a single frame. Show us the grace, power, and beauty of things in motion.",
        tags: ["dance", "movement", "energy", "grace"],
      },
      {
        title: "Futuristic Visions",
        description:
          "Imagine the world of tomorrow. Create artwork that explores the possibilities of future technology, society, and human evolution.",
        tags: ["future", "technology", "futuristic", "imagination"],
      },
      {
        title: "Organic Abstracts",
        description:
          "Find the abstract beauty in the natural world. Create compositions inspired by organic forms, patterns, and textures.",
        tags: ["organic", "abstract", "nature", "patterns"],
      },
      {
        title: "Cultural Fusion",
        description:
          "Blend cultural elements from different traditions and eras to create something entirely new and beautiful.",
        tags: ["culture", "fusion", "diverse", "creative"],
      },
      {
        title: "Dreamscapes",
        description:
          "Bring your dreams to life. Create surreal landscapes and scenes that exist only in the realm of imagination.",
        tags: ["dreams", "surreal", "landscape", "imagination"],
      },
    ];

    // ============================================ //
    // MONTHLY THEMES (rotates monthly, resets 1st)//
    // ============================================ //
    this.monthlyThemes = [
      {
        title: "Mythical Realms Reimagined",
        description:
          "Take a classic mythical creature or legend and give it a fresh, unexpected twist. What would a phoenix look like in a cyberpunk world? How does a dragon adapt to climate change? Your imagination is the only limit.",
        tags: ["mythology", "fantasy", "reimagine", "worldbuilding"],
      },
      {
        title: "Urban Echoes",
        description:
          "Capture the hidden stories of the city - the forgotten corners, the midnight alleys, the quiet moments between skyscrapers. Show us the soul of the city that others overlook.",
        tags: ["urban", "city", "hidden", "storytelling"],
      },
      {
        title: "Ethereal Visions",
        description:
          "Explore the space between dreams and reality. Create artwork that feels both familiar and otherworldly, where the boundaries of imagination blur.",
        tags: ["dreams", "surreal", "ethereal", "fantasy"],
      },
      {
        title: "Elements Unleashed",
        description:
          "Channel the raw power of earth, wind, fire, and water. Show us the elemental forces that shape our world in your unique visual language.",
        tags: ["elements", "nature", "power", "force"],
      },
      {
        title: "Timeless Portraits",
        description:
          "Create portraits that transcend time - figures that could belong to any era, any culture, any world. Tell a story through a single gaze.",
        tags: ["portraits", "timeless", "expression", "character"],
      },
      {
        title: "Mechanical Dreams",
        description:
          "Blend organic life with mechanical precision. Create creatures and worlds where technology and nature coexist in harmony or conflict.",
        tags: ["steampunk", "cyber", "mechanical", "organic"],
      },
      {
        title: "Cosmic Wanderers",
        description:
          "Journey through the cosmos - explore strange new worlds, alien landscapes, and the infinite possibilities of space.",
        tags: ["space", "cosmic", "alien", "infinite"],
      },
      {
        title: "Whispers of the Past",
        description:
          "Bring history to life through art. Reimagine ancient civilizations, lost cultures, and the echoes of bygone eras.",
        tags: ["history", "ancient", "culture", "heritage"],
      },
      {
        title: "Flora & Fauna Fantasia",
        description:
          "Create a vibrant celebration of the natural world. Reimagine plants and animals in fantastical ways that celebrate biodiversity.",
        tags: ["nature", "fantasy", "animals", "plants"],
      },
      {
        title: "Architectural Dreams",
        description:
          "Design impossible structures - buildings that defy physics, cities that float, homes that breathe. Show us the architecture of imagination.",
        tags: ["architecture", "design", "impossible", "dreams"],
      },
      {
        title: "Shadow & Light",
        description:
          "Explore the dramatic interplay between shadow and light. Create artwork where the darkness reveals as much as it conceals.",
        tags: ["shadows", "light", "contrast", "mystery"],
      },
      {
        title: "Festival of Colors",
        description:
          "Celebrate the joy of color - create vibrant, energetic artwork that captures the spirit of celebration and cultural festivity.",
        tags: ["color", "celebration", "festival", "vibrant"],
      },
    ];

    // ============================================ //
    // YEARLY THEMES (rotates yearly, resets Jan 1)//
    // ============================================ //
    this.yearlyThemes = [
      {
        title: "Metamorphosis: A Year of Growth",
        description:
          "Document your artistic journey and personal growth over a year. Create 12 pieces that show your evolution as an artist.",
        tags: ["growth", "journey", "transformation", "evolution"],
      },
      {
        title: "Chronicles of Time: Seasonal Diary",
        description:
          "Create a visual diary of the seasons and passing of time. Capture the beauty of each season through your art.",
        tags: ["time", "seasons", "reflection", "nature"],
      },
      {
        title: "52 Weeks of Creative Exploration",
        description:
          "52 weeks of creative exploration, one piece per week. Push your boundaries and try new techniques.",
        tags: ["consistency", "exploration", "growth", "discipline"],
      },
    ];

    this.init();
  }

  // ============================================ */
  // INIT                                        */
  // ============================================ */
  async init() {
    // Apply saved theme immediately
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedColorTheme = localStorage.getItem("colorTheme") || "pink-purple";
    if (savedColorTheme === "blue-green") {
      document.body.classList.add("blue-green");
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      await this.loadChallenges();
      await this.loadUserChallenges();
      this.renderChallenges();
      this.setupEventListeners();
      this.setupThemeControls();
      this.setupHUDControls();
      this.startAllCountdowns();

      // Check for updates every minute
      setInterval(() => {
        this.checkAndUpdateChallenges();
      }, 60000);

      // Apply theme after render
      setTimeout(() => this.updateThemeElements(), 100);
    });
  }

  // ============================================ */
  // SAVE CHALLENGES TO FIRESTORE                */
  // ============================================ */
  async saveChallengesToFirestore() {
    try {
      const snapshot = await this.db.collection("challenges").get();
      const existingIds = new Set();
      snapshot.forEach((doc) => existingIds.add(doc.id));

      for (const challenge of this.challenges) {
        const challengeData = {
          ...challenge,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (!existingIds.has(challenge.id)) {
          await this.db
            .collection("challenges")
            .doc(challenge.id)
            .set({
              ...challengeData,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } else {
          await this.db
            .collection("challenges")
            .doc(challenge.id)
            .update(challengeData);
        }
      }

      console.log("✅ Challenges saved to Firestore");
    } catch (error) {
      console.error("Error saving challenges:", error);
    }
  }

  // ============================================ */
  // AUTO-COMPLETE CHECKER                       */
  // ============================================ */
  startAutoCompleteChecker() {
    this.autoCompleteInterval = setInterval(() => {
      this.checkAndCompleteChallenges();
    }, 300000);

    setTimeout(() => {
      this.checkAndCompleteChallenges();
    }, 5000);
  }

  async checkAndCompleteChallenges() {
    try {
      const now = new Date();
      const snapshot = await this.db
        .collection("challenges")
        .where("status", "==", "active")
        .get();

      let completedCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);

        if (now > endDate) {
          await this.db.collection("challenges").doc(doc.id).update({
            status: "ended",
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

          await this.selectChallengeWinner(doc.id);
          completedCount++;
        }
      }

      if (completedCount > 0) {
        console.log(
          `🏆 Completed ${completedCount} challenges with winners selected!`,
        );
        await this.loadChallenges();
        this.renderChallenges();
      }
    } catch (error) {
      console.error("Error checking completed challenges:", error);
    }
  }

  // ============================================ */
  // SELECT CHALLENGE WINNER                     */
  // ============================================ */
  async selectChallengeWinner(challengeId) {
    try {
      const submissionsSnapshot = await this.db
        .collection("challengeSubmissions")
        .where("challengeId", "==", challengeId)
        .where("status", "==", "pending")
        .get();

      if (submissionsSnapshot.empty) {
        console.log(`No submissions for challenge ${challengeId}`);
        return;
      }

      const challengeDoc = await this.db
        .collection("challenges")
        .doc(challengeId)
        .get();
      if (!challengeDoc.exists) return;
      const challengeData = challengeDoc.data();

      const submissions = [];
      submissionsSnapshot.forEach((doc) => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          ...data,
          votes: data.votes || 0,
        });
      });

      submissions.sort((a, b) => b.votes - a.votes);
      const winner = submissions[0];

      await this.db.collection("challengeSubmissions").doc(winner.id).update({
        status: "winner",
        wonAt: firebase.firestore.FieldValue.serverTimestamp(),
        rank: 1,
      });

      await this.db
        .collection("challenges")
        .doc(challengeId)
        .update({
          winnerId: winner.id,
          winnerArtworkId: winner.artworkId,
          winnerUserId: winner.userId,
          winnerUserName: winner.userName || "Anonymous",
          winnerVotes: winner.votes || 0,
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      const artworkDoc = await this.db
        .collection("artworks")
        .doc(winner.artworkId)
        .get();
      if (artworkDoc.exists) {
        await this.db
          .collection("artworks")
          .doc(winner.artworkId)
          .update({
            isWinner: true,
            winnerChallengeId: challengeId,
            winnerChallengeTitle: challengeData.title || "Challenge",
            winnerBadge: "🏆 Challenge Winner",
          });
      }

      const winBonus = challengeData.prizeValue || 200;
      await this.awardPointsToUser(
        winner.userId,
        winBonus,
        `🏆 Won challenge: ${challengeData.title || "Challenge"}`,
      );

      if (submissions.length > 1) {
        const runnerUp = submissions[1];
        await this.db
          .collection("challengeSubmissions")
          .doc(runnerUp.id)
          .update({
            status: "runner-up",
            rank: 2,
          });
        await this.awardPointsToUser(
          runnerUp.userId,
          Math.floor(winBonus * 0.5),
          `🥈 Runner-up in: ${challengeData.title || "Challenge"}`,
        );
      }

      await this.db.collection("challengeWinners").add({
        challengeId: challengeId,
        challengeTitle: challengeData.title || "Challenge",
        challengeType: challengeData.type || "daily",
        winnerId: winner.id,
        winnerUserId: winner.userId,
        winnerUserName: winner.userName || "Anonymous",
        artworkId: winner.artworkId,
        votes: winner.votes || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        prize: challengeData.prize || "Prize",
        prizeValue: challengeData.prizeValue || 0,
      });

      console.log(
        `🏆 Winner selected for challenge ${challengeId}: ${winner.userName || winner.userId}`,
      );
    } catch (error) {
      console.error("Error selecting winner:", error);
    }
  }

  async awardPointsToUser(userId, amount, reason) {
    try {
      const userRef = this.db.collection("users").doc(userId);
      await userRef.set(
        {
          points: firebase.firestore.FieldValue.increment(amount),
        },
        { merge: true },
      );

      await this.db.collection("pointsTransactions").add({
        userId: userId,
        amount: amount,
        reason: reason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  }

  // ============================================ */
  // CHECK AND UPDATE CHALLENGES                 */
  // ============================================ */
  checkAndUpdateChallenges() {
    const now = new Date();
    let needsUpdate = false;

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const storedDate = localStorage.getItem("challenges_last_update");
    if (storedDate) {
      const lastUpdate = new Date(storedDate);
      const lastUpdateDay = new Date(lastUpdate);
      lastUpdateDay.setHours(0, 0, 0, 0);

      if (today > lastUpdateDay) {
        needsUpdate = true;
        console.log("🔄 New day detected, updating challenges...");
      }
    } else {
      needsUpdate = true;
    }

    const dayOfWeek = now.getDay();
    if (dayOfWeek === 1) {
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - 7);
      lastMonday.setHours(0, 0, 0, 0);

      if (storedDate) {
        const lastUpdate = new Date(storedDate);
        if (lastUpdate < lastMonday) {
          needsUpdate = true;
          console.log("🔄 New week detected, updating challenges...");
        }
      }
    }

    if (now.getDate() === 1) {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      if (storedDate) {
        const lastUpdate = new Date(storedDate);
        if (lastUpdate < lastMonth) {
          needsUpdate = true;
          console.log("🔄 New month detected, updating challenges...");
        }
      }
    }

    if (now.getMonth() === 0 && now.getDate() === 1) {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      lastYear.setMonth(0);
      lastYear.setDate(1);
      lastYear.setHours(0, 0, 0, 0);

      if (storedDate) {
        const lastUpdate = new Date(storedDate);
        if (lastUpdate < lastYear) {
          needsUpdate = true;
          console.log("🔄 New year detected, updating challenges...");
        }
      }
    }

    if (needsUpdate) {
      this.generateChallenges();
      localStorage.setItem("challenges_last_update", now.toISOString());
      this.renderChallenges();
      console.log("✅ Challenges updated successfully!");
    }
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
  // GET DAY OF YEAR                             */
  // ============================================ */
  getDayOfYear() {
    const now = new Date();
    return Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
    );
  }

  // ============================================ */
  // GET THIS WEEK'S MONDAY                      */
  // ============================================ */
  getThisWeekMonday() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // ============================================ */
  // GET THIS WEEK'S SUNDAY                      */
  // ============================================ */
  getThisWeekSunday() {
    const monday = this.getThisWeekMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 0);
    return sunday;
  }

  // ============================================ */
  // LOAD CHALLENGES FROM FIRESTORE              */
  // ============================================ */
  async loadChallenges() {
    try {
      const snapshot = await this.db
        .collection("challenges")
        .where("status", "==", "active")
        .get();

      if (!snapshot.empty) {
        this.challenges = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          this.challenges.push({
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate?.() || new Date(data.startDate),
            endDate: data.endDate?.toDate?.() || new Date(data.endDate),
            participants: data.participants || 0,
            submissions: data.submissions || 0,
          });
        });
      } else {
        this.generateChallenges();
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
      this.generateChallenges();
    }
  }

  // ============================================ */
  // GENERATE ALL CHALLENGES                     */
  // ============================================ */
  generateChallenges() {
    const now = new Date();
    this.challenges = [];
    const dayOfYear = this.getDayOfYear();
    const weekNumber = this.getCurrentWeekNumber();
    const monthIndex = now.getMonth();

    // DAILY CHALLENGES (3)
    for (let i = 0; i < 3; i++) {
      const promptIndex = (dayOfYear + i) % this.dailyPrompts.length;
      const prompt = this.dailyPrompts[promptIndex];

      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 0);

      this.challenges.push({
        id: `daily-${i + 1}`,
        type: "daily",
        title: prompt.title,
        description: prompt.description,
        icon: ["🌅", "☕", "✏️"][i],
        tags: prompt.tags,
        startDate: start,
        endDate: end,
        prize: "50 Points + Daily Doodle Badge",
        prizeValue: 50,
        participants: 0,
        submissions: 0,
        status: "active",
        isIntuit: false,
        badge: "daily_doodle",
        color: "#ff38e4",
        expiresIn: "24 hours",
      });
    }

    // WEEKLY CHALLENGES (4)
    for (let i = 0; i < 4; i++) {
      const themeIndex = (weekNumber - 1 + i) % this.weeklyThemes.length;
      const theme = this.weeklyThemes[themeIndex];

      const start = this.getThisWeekMonday();
      const end = this.getThisWeekSunday();

      this.challenges.push({
        id: `weekly-${i + 1}`,
        type: "weekly",
        title: theme.title,
        description: theme.description,
        icon: ["🏙️", "🌺", "📖", "💡"][i],
        tags: theme.tags,
        startDate: start,
        endDate: end,
        prize: "100 Points + Weekly Winner Badge",
        prizeValue: 100,
        participants: 0,
        submissions: 0,
        status: "active",
        isIntuit: false,
        badge: "weekly_winner",
        color: "#4cd6eb",
        expiresIn: "7 days",
      });
    }

    // MONTHLY CHALLENGES (6)
    for (let i = 0; i < 6; i++) {
      const themeIndex = (monthIndex + i) % this.monthlyThemes.length;
      const theme = this.monthlyThemes[themeIndex];

      const start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 0);

      this.challenges.push({
        id: `monthly-${i + 1}`,
        type: "monthly",
        title: theme.title,
        description: theme.description,
        icon: ["🌙", "🌊", "👤", "⚙️", "🚀", "🏛️"][i],
        tags: theme.tags,
        startDate: start,
        endDate: end,
        prize: "200 Points + Monthly Master Badge",
        prizeValue: 200,
        participants: 0,
        submissions: 0,
        status: "active",
        isIntuit: false,
        badge: "monthly_master",
        color: "#8c35e9",
        expiresIn: "30 days",
      });
    }

    // YEARLY CHALLENGES (3)
    const yearlyColors = ["#f59e0b", "#f39716", "#fbbf24"];
    const yearlyIcons = ["🦋", "⏳", "📅"];

    for (let i = 0; i < 3; i++) {
      const theme = this.yearlyThemes[i];

      const start = new Date(now);
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 0);

      this.challenges.push({
        id: `yearly-${i + 1}`,
        type: "yearly",
        title: theme.title,
        description: theme.description,
        icon: yearlyIcons[i],
        tags: theme.tags,
        startDate: start,
        endDate: end,
        prize: "500 Points + Grand Master Badge",
        prizeValue: 500,
        participants: 0,
        submissions: 0,
        status: "active",
        isIntuit: false,
        badge: "grand_master",
        color: yearlyColors[i % yearlyColors.length],
        expiresIn: "365 days",
      });
    }

    // INTUIT CHALLENGES
    const intuitChallenges = this.getIntuitChallenges();
    this.challenges.push(...intuitChallenges);

    localStorage.setItem("challenges_last_update", now.toISOString());

    console.log(`✅ Generated ${this.challenges.length} challenges total`);
  }

  // ============================================ */
  // GET INTUIT CHALLENGES                       */
  // ============================================ */
  getIntuitChallenges() {
    if (window.communityHubInstance) {
      try {
        const intuitChallenges =
          window.communityHubInstance.getIntuitChallenges();
        if (intuitChallenges && intuitChallenges.length > 0) {
          intuitChallenges.forEach((c) => {
            c.status = "active";
            if (c.type === "weekly") {
              c.startDate = this.getThisWeekMonday();
              c.endDate = this.getThisWeekSunday();
            }
          });
          return intuitChallenges;
        }
      } catch (e) {
        console.warn("Could not get Intuit challenges from CommunityHub:", e);
      }
    }
    return this.generateFallbackIntuitChallenges();
  }

  // ============================================ */
  // FALLBACK INTUIT CHALLENGES                  */
  // ============================================ */
  generateFallbackIntuitChallenges() {
    const now = new Date();
    const weekNumber = this.getCurrentWeekNumber();
    const monthIndex = now.getMonth();
    const dayOfYear = this.getDayOfYear();

    const dailyPromptIndex = dayOfYear % this.dailyPrompts.length;
    const dailyPrompt = this.dailyPrompts[dailyPromptIndex];

    const dailyStart = new Date(now);
    dailyStart.setHours(0, 0, 0, 0);
    const dailyEnd = new Date(now);
    dailyEnd.setHours(23, 59, 59, 0);

    const intuitDaily = {
      id: "intuit-daily-1",
      type: "daily",
      title: `"${dailyPrompt.title}"`,
      description: dailyPrompt.description,
      icon: "🌟",
      tags: dailyPrompt.tags,
      startDate: dailyStart,
      endDate: dailyEnd,
      prize: "Daily Champion Badge + 100 Points + Featured on Homepage",
      prizeValue: 100,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "daily_champion",
      color: "#ff38e4",
      expiresIn: "24 hours",
    };

    const weeklyTheme =
      this.weeklyThemes[(weekNumber - 1) % this.weeklyThemes.length];
    const weeklyStart = this.getThisWeekMonday();
    const weeklyEnd = this.getThisWeekSunday();

    const intuitWeekly = {
      id: "intuit-weekly-1",
      type: "weekly",
      title: `"${weeklyTheme.title}"`,
      description: weeklyTheme.description,
      icon: "✨",
      tags: weeklyTheme.tags,
      startDate: weeklyStart,
      endDate: weeklyEnd,
      prize:
        "Champion Badge + Social Media Feature + Pinned in Community + 250 Points",
      prizeValue: 250,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "weekly_winner",
      color: "#ff38e4",
      expiresIn: "7 days",
    };

    const monthlyTheme =
      this.monthlyThemes[monthIndex % this.monthlyThemes.length];
    const monthlyStart = new Date(now);
    monthlyStart.setDate(1);
    monthlyStart.setHours(0, 0, 0, 0);
    const monthlyEnd = new Date(monthlyStart);
    monthlyEnd.setMonth(monthlyEnd.getMonth() + 1);
    monthlyEnd.setDate(0);
    monthlyEnd.setHours(23, 59, 59, 0);

    const intuitMonthly = {
      id: "intuit-monthly-1",
      type: "monthly",
      title: `"${monthlyTheme.title}"`,
      description: monthlyTheme.description,
      icon: "⭐",
      tags: monthlyTheme.tags,
      startDate: monthlyStart,
      endDate: monthlyEnd,
      prize:
        "Master Badge + Homepage Feature + Pick Next Monthly Theme + 500 Points",
      prizeValue: 500,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "monthly_master",
      color: "#ff38e4",
      expiresIn: "30 days",
    };

    const yearlyStart = new Date(now);
    yearlyStart.setMonth(0);
    yearlyStart.setDate(1);
    yearlyStart.setHours(0, 0, 0, 0);
    const yearlyEnd = new Date(yearlyStart);
    yearlyEnd.setFullYear(yearlyEnd.getFullYear() + 1);
    yearlyEnd.setDate(yearlyEnd.getDate() - 1);
    yearlyEnd.setHours(23, 59, 59, 0);

    const intuitYearly = {
      id: "intuit-yearly-1",
      type: "yearly",
      title: '"Metamorphosis: The Year of Transformation"',
      description:
        "Document transformation through 12 themed chapters - one for each month. From personal growth to environmental change, from character evolution to artistic style development. Create a cohesive body of work that tells a story of change and emergence.",
      icon: "👑",
      tags: ["transformation", "growth", "evolution", "series"],
      startDate: yearlyStart,
      endDate: yearlyEnd,
      prize:
        "Grand Master Badge + Featured Artist + Solo Exhibition + Design a Challenge + 1000 Points",
      prizeValue: 1000,
      participants: 0,
      submissions: 0,
      status: "active",
      isIntuit: true,
      badge: "grand_master",
      color: "#ff38e4",
      expiresIn: "365 days",
    };

    return [intuitDaily, intuitWeekly, intuitMonthly, intuitYearly];
  }

  // ============================================ */
  // LOAD USER CHALLENGES                        */
  // ============================================ */
  async loadUserChallenges() {
    if (!this.currentUser) return;

    try {
      const snapshot = await this.db
        .collection("userChallenges")
        .where("userId", "==", this.currentUser.uid)
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        this.userChallenges.set(data.challengeId, {
          docId: doc.id,
          joinedAt: data.joinedAt?.toDate?.() || new Date(data.joinedAt),
          status: data.status || "active",
        });
      });
    } catch (error) {
      console.error("Error loading user challenges:", error);
    }
  }

  // ============================================ */
  // JOIN CHALLENGE                              */
  // ============================================ */
  async joinChallenge(challengeId) {
    if (!this.currentUser) {
      window.location.href = `/pages/auth/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    if (this.userChallenges.has(challengeId)) {
      this.showToast("You've already joined this challenge!", "info");
      return;
    }

    try {
      await this.db.collection("userChallenges").add({
        userId: this.currentUser.uid,
        challengeId: challengeId,
        challengeType: challenge.type,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "active",
      });

      this.userChallenges.set(challengeId, {
        docId: null,
        joinedAt: new Date(),
        status: "active",
      });

      await this.awardPoints(10, `Joined ${challenge.title}`);
      challenge.participants++;
      this.renderChallenges();

      this.showToast(`🎨 Successfully joined "${challenge.title}"!`, "success");
    } catch (error) {
      console.error("Error joining challenge:", error);
      this.showToast("Error joining challenge. Please try again.", "error");
    }
  }

  // ============================================ */
  // LEAVE CHALLENGE                             */
  // ============================================ */
  async leaveChallenge(challengeId) {
    if (!this.currentUser) return;

    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const userChallenge = this.userChallenges.get(challengeId);
    if (!userChallenge) {
      this.showToast("You haven't joined this challenge.", "info");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to leave "${challenge.title}"? You'll lose your progress and any points earned from this challenge.`,
      )
    ) {
      return;
    }

    try {
      if (userChallenge.docId) {
        await this.db
          .collection("userChallenges")
          .doc(userChallenge.docId)
          .delete();
      } else {
        const snapshot = await this.db
          .collection("userChallenges")
          .where("userId", "==", this.currentUser.uid)
          .where("challengeId", "==", challengeId)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.delete();
        }
      }

      this.userChallenges.delete(challengeId);
      challenge.participants--;
      this.renderChallenges();

      this.showToast(`👋 Left "${challenge.title}"`, "info");
    } catch (error) {
      console.error("Error leaving challenge:", error);
      this.showToast("Error leaving challenge. Please try again.", "error");
    }
  }

  // ============================================ */
  // AWARD POINTS                                */
  // ============================================ */
  async awardPoints(amount, reason) {
    if (!this.currentUser) return;

    try {
      const userRef = this.db.collection("users").doc(this.currentUser.uid);
      await userRef.set(
        {
          points: firebase.firestore.FieldValue.increment(amount),
        },
        { merge: true },
      );

      await this.db.collection("pointsTransactions").add({
        userId: this.currentUser.uid,
        amount: amount,
        reason: reason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  }

  // ============================================ */
  // SUBMIT ARTWORK                              */
  // ============================================ */
  async submitArtwork(challengeId) {
    if (!this.currentUser) {
      window.location.href = `/pages/auth/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    if (!this.userChallenges.has(challengeId)) {
      this.showToast(
        "Please join the challenge first before submitting.",
        "warning",
      );
      return;
    }

    window.location.href = `/pages/community/upload.html?challenge=${challengeId}`;
  }

  // ============================================ */
  // COUNTDOWN SYSTEM                            */
  // ============================================ */
  startAllCountdowns() {
    this.countdownIntervals.forEach((interval) => clearInterval(interval));
    this.countdownIntervals = [];

    const interval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
    this.countdownIntervals.push(interval);

    this.updateCountdowns();
  }

  updateCountdowns() {
    document.querySelectorAll(".challenge-countdown").forEach((el) => {
      const endDateStr = el.dataset.end;
      if (!endDateStr) {
        const textEl = el.querySelector(".countdown-text");
        if (textEl) textEl.textContent = "No end date";
        return;
      }

      const endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        const textEl = el.querySelector(".countdown-text");
        if (textEl) textEl.textContent = "Invalid date";
        return;
      }

      const timeLeft = this.getTimeLeft(endDate);
      const textEl = el.querySelector(".countdown-text");
      if (textEl) {
        textEl.textContent = timeLeft;
        if (timeLeft === "Ended") {
          textEl.style.color = "#ef4444";
        } else if (timeLeft.includes("d") && parseInt(timeLeft) < 2) {
          textEl.style.color = "#f59e0b";
        } else {
          textEl.style.color = "var(--accent-1)";
        }
      }
    });
  }

  getTimeLeft(endDate) {
    if (!endDate) return "No end date";

    let end;
    try {
      if (endDate.toDate) {
        end = endDate.toDate();
      } else if (endDate instanceof Date) {
        end = endDate;
      } else if (typeof endDate === "string") {
        end = new Date(endDate);
      } else if (typeof endDate === "number") {
        end = new Date(endDate);
      } else {
        end = new Date(endDate);
      }
    } catch (e) {
      return "Invalid date";
    }

    if (isNaN(end.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % 86400000) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % 3600000) / (1000 * 60));
    const seconds = Math.floor((diff % 60000) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  // ============================================ */
  // RENDER CHALLENGES                           */
  // ============================================ */
  renderChallenges() {
    const grid = document.getElementById("challengesGrid");
    if (!grid) return;

    let filteredChallenges = this.challenges;

    if (this.currentType === "my") {
      filteredChallenges = this.challenges.filter((c) =>
        this.userChallenges.has(c.id),
      );
    } else if (this.currentType !== "all") {
      filteredChallenges = this.challenges.filter(
        (c) => c.type === this.currentType,
      );
    }

    filteredChallenges.sort((a, b) => {
      if (a.isIntuit && !b.isIntuit) return -1;
      if (!a.isIntuit && b.isIntuit) return 1;
      const typeOrder = { daily: 0, weekly: 1, monthly: 2, yearly: 3 };
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    });

    if (filteredChallenges.length === 0) {
      grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-trophy"></i>
                    <h3>No challenges found</h3>
                    <p>${this.currentType === "my" ? "You haven't joined any challenges yet." : "No challenges available in this category."}</p>
                    ${
                      this.currentType === "my"
                        ? `
                        <div class="empty-actions">
                            <a href="/pages/community/challenges.html" class="btn-empty primary">
                                <i class="fas fa-compass"></i> Browse Challenges
                            </a>
                            <a href="/pages/community/points.html" class="btn-empty secondary">
                                <i class="fas fa-coins"></i> View Prizes
                            </a>
                        </div>
                    `
                        : ""
                    }
                </div>
            `;
      return;
    }

    grid.innerHTML = filteredChallenges
      .map((challenge) => this.createChallengeCard(challenge))
      .join("");

    // Use event delegation for all buttons
    this.setupCardEventListeners();
  }

  // ============================================ */
  // SETUP CARD EVENT LISTENERS                  */
  // ============================================ */
  setupCardEventListeners() {
    document.querySelectorAll(".btn-challenge.join").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const challengeId = btn.dataset.id;
        this.joinChallenge(challengeId);
      });
    });

    document.querySelectorAll(".btn-challenge.leave").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const challengeId = btn.dataset.id;
        this.leaveChallenge(challengeId);
      });
    });

    document.querySelectorAll(".btn-challenge.submit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const challengeId = btn.dataset.id;
        this.submitArtwork(challengeId);
      });
    });

    // View Prizes buttons are <a> tags, they work natively
    // But we handle click for any that might be buttons
    document.querySelectorAll(".btn-challenge.view-prizes").forEach((btn) => {
      if (btn.tagName === "BUTTON") {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.location.href = "/pages/community/points.html";
        });
      }
    });
  }

  // ============================================ */
  // CREATE CHALLENGE CARD HTML                  */
  // ============================================ */
  createChallengeCard(challenge) {
    // Ensure endDate is a valid Date for the countdown
    let endDate = challenge.endDate;
    if (endDate && endDate.toDate) {
      endDate = endDate.toDate();
    } else if (endDate && typeof endDate === "string") {
      endDate = new Date(endDate);
    }

    const endDateForCountdown =
      endDate instanceof Date ? endDate : new Date(endDate);
    const timeLeft = this.getTimeLeft(endDateForCountdown);

    const isJoined = this.userChallenges.has(challenge.id);
    const typeName =
      challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1);
    const isActive = challenge.status === "active";

    const colorMap = {
      daily: "#4ff3a6",
      weekly: "#ffc72e",
      monthly: "#8A19E1",
      yearly: "#ff0040",
    };
    const accentColor = challenge.isIntuit
      ? "#ff00ea"
      : colorMap[challenge.type] || "#ffffff";

    const now = new Date();
    const end = endDateForCountdown;
    const hoursLeft = (end - now) / (1000 * 60 * 60);
    const isEndingSoon = hoursLeft < 24 && hoursLeft > 0;
    const isEnded = hoursLeft <= 0;

    let statusClass = "active";
    let statusText = "Active";
    if (isEnded) {
      statusClass = "ended";
      statusText = "Ended";
    } else if (isEndingSoon) {
      statusClass = "ending";
      statusText = "⚠️ Ending Soon";
    }

    const isMyChallenges = this.currentType === "my";
    const endDateString =
      endDateForCountdown instanceof Date
        ? endDateForCountdown.toISOString()
        : "";

    return `
            <div class="challenge-card" style="border-top: 3px solid ${accentColor}; ${challenge.isIntuit ? "box-shadow: 0 0 30px rgba(255,56,228,0.15);" : ""}">
                <div class="challenge-header" style="background: linear-gradient(135deg, ${accentColor}10, transparent);">
                    <div class="challenge-icon">${challenge.icon}</div>
                    <div class="challenge-badges">
                        <span class="challenge-type-badge ${challenge.type}">${typeName}</span>
                        ${
                          challenge.isIntuit
                            ? `
                            <span class="challenge-intuit-badge">⚡ Intuit</span>
                        `
                            : ""
                        }
                        <span class="challenge-status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="challenge-content">
                    <h3 class="challenge-title">${this.escapeHtml(challenge.title)}</h3>
                    <p class="challenge-description">${this.escapeHtml(challenge.description)}</p>

                    ${
                      challenge.tags
                        ? `
                        <div class="challenge-tags">
                            ${challenge.tags.map((tag) => `<span class="challenge-tag">#${tag}</span>`).join("")}
                        </div>
                    `
                        : ""
                    }

                    <div class="challenge-stats">
                        <div class="challenge-stat">
                            <span class="stat-value">${challenge.participants}</span>
                            <span class="stat-label">Participants</span>
                        </div>
                        <div class="challenge-stat">
                            <span class="stat-value">${challenge.submissions}</span>
                            <span class="stat-label">Submissions</span>
                        </div>
                        ${
                          challenge.expiresIn
                            ? `
                            <div class="challenge-stat">
                                <span class="stat-value" style="font-size:0.7rem;">⏱️</span>
                                <span class="stat-label">${challenge.expiresIn}</span>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="challenge-countdown" data-end="${endDateString}">
                        <i class="far fa-hourglass"></i>
                        <span class="countdown-text ${statusClass}">${timeLeft}</span>
                    </div>

                    <div class="challenge-prize" style="${challenge.isIntuit ? "background: linear-gradient(135deg, rgba(255,56,228,0.08), rgba(138,25,225,0.08)); border-color: rgba(255,56,228,0.15);" : ""}">
                        <i class="fas fa-gift"></i>
                        <span class="prize-text">${this.escapeHtml(challenge.prize)}</span>
                        ${
                          challenge.badge
                            ? `
                            <span class="prize-badge-icon">🏅 ${challenge.badge}</span>
                        `
                            : ""
                        }
                    </div>

                    <div class="challenge-actions">
                        ${
                          isJoined
                            ? `
                            <button class="btn-challenge joined" disabled>
                                <i class="fas fa-check-circle"></i> Joined
                            </button>
                            <button class="btn-challenge leave" data-id="${challenge.id}">
                                <i class="fas fa-times"></i> Leave
                            </button>
                        `
                            : `
                            <button class="btn-challenge join" data-id="${challenge.id}">
                                <i class="fas fa-plus-circle"></i> Join
                            </button>
                        `
                        }
                    </div>

                    ${
                      isJoined && isActive && !isEnded
                        ? `
                        <button class="btn-challenge submit" data-id="${challenge.id}" style="width:100%; margin-top:0.5rem;">
                            <i class="fas fa-upload"></i> Submit Artwork
                        </button>
                    `
                        : ""
                    }

                    ${
                      isJoined && isEnded
                        ? `
                        <div style="margin-top:0.5rem; padding:0.5rem; background:rgba(239,68,68,0.08); border-radius:var(--radius-sm); text-align:center; font-size:0.6rem; color:#ef4444; font-family:var(--font-mono);">
                            <i class="fas fa-hourglass-end"></i> This challenge has ended
                        </div>
                    `
                        : ""
                    }

                    <div class="challenge-actions" style="margin-top:0.5rem;">
                        ${
                          isMyChallenges
                            ? `
                            <a href="/pages/community/challenges.html" class="btn-challenge browse">
                                <i class="fas fa-compass"></i> Browse Challenges
                            </a>
                        `
                            : ""
                        }
                        <a href="/pages/community/points.html" class="btn-challenge view-prizes">
                            <i class="fas fa-coins"></i> View Prizes
                        </a>
                    </div>
                </div>
            </div>
        `;
  }

  // ============================================ */
  // THEME CONTROLS                              */
  // ============================================ */
  setupThemeControls() {
    const pinkPurpleBtn = document.getElementById("themePinkPurple");
    const blueGreenBtn = document.getElementById("themeBlueGreen");
    const darkBtn = document.getElementById("themeDark");
    const lightBtn = document.getElementById("themeLight");

    if (pinkPurpleBtn) {
      pinkPurpleBtn.addEventListener("click", () => {
        document.body.classList.remove("blue-green");
        pinkPurpleBtn.classList.add("active");
        blueGreenBtn?.classList.remove("active");
        localStorage.setItem("colorTheme", "pink-purple");
        this.updateThemeElements();
      });
    }

    if (blueGreenBtn) {
      blueGreenBtn.addEventListener("click", () => {
        document.body.classList.add("blue-green");
        blueGreenBtn.classList.add("active");
        pinkPurpleBtn?.classList.remove("active");
        localStorage.setItem("colorTheme", "blue-green");
        this.updateThemeElements();
      });
    }

    if (darkBtn) {
      darkBtn.addEventListener("click", () => {
        this.setTheme("dark");
        darkBtn.classList.add("active");
        lightBtn?.classList.remove("active");
      });
    }

    if (lightBtn) {
      lightBtn.addEventListener("click", () => {
        this.setTheme("light");
        lightBtn.classList.add("active");
        darkBtn?.classList.remove("active");
      });
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    this.updateThemeElements();
  }

  updateThemeElements() {
    const isBlueGreen = document.body.classList.contains("blue-green");
    const color1 = isBlueGreen ? "#58ebfe" : "#ff00ea";
    const color2 = isBlueGreen ? "#4ff3a6" : "#8A19E1";
    const color3 = isBlueGreen ? "#3B82F6" : "#ff69b4";
    const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;

    const header = document.querySelector(".page-header h1");
    if (header) {
      header.style.background = gradient;
      header.style.webkitBackgroundClip = "text";
      header.style.webkitTextFillColor = "transparent";
    }

    document.querySelectorAll(".challenge-stat .stat-value").forEach((el) => {
      el.style.color = color1;
    });

    document
      .querySelectorAll(".challenge-countdown .countdown-text")
      .forEach((el) => {
        el.style.color = color1;
      });

    document.querySelectorAll(".challenge-card::before").forEach((el) => {
      el.style.background = gradient;
    });

    document.querySelectorAll(".challenge-intuit-badge").forEach((el) => {
      el.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
    });

    document
      .querySelectorAll(".challenge-prize .prize-badge-icon")
      .forEach((el) => {
        el.style.background = gradient;
      });

    document.querySelectorAll(".btn-challenge.join").forEach((el) => {
      el.style.background = gradient;
    });

    document.querySelectorAll(".tab-btn.active").forEach((el) => {
      el.style.borderColor = color1;
      el.style.color = color1;
    });

    document.querySelectorAll(".empty-state i").forEach((el) => {
      el.style.background = gradient;
      el.style.webkitBackgroundClip = "text";
      el.style.webkitTextFillColor = "transparent";
    });

    document.querySelectorAll(".particle").forEach((p, i) => {
      const colors = [color1, color2, color3, color1, color2, color3];
      p.style.background = colors[i % colors.length];
      p.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
    });

    const bg = document.querySelector(".gradient-bg");
    if (bg) {
      bg.style.background = `
                radial-gradient(ellipse at 0% 0%, ${color2} 0%, transparent 50%),
                radial-gradient(ellipse at 100% 100%, ${color1} 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, ${color3} 0%, transparent 60%)
            `;
    }
  }

  // ============================================ */
  // HUD CONTROLS                                */
  // ============================================ */
  setupHUDControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "h" || e.key === "H") this.toggleHUD();
      if (e.key === "s" || e.key === "S") this.toggleScanlines();
      if (e.key === "g" || e.key === "G") this.toggleGrid();
    });

    const hudBtn = document.getElementById("hudToggle");
    const scanBtn = document.getElementById("scanlineToggle");
    const gridBtn = document.getElementById("gridToggle");

    if (hudBtn) hudBtn.addEventListener("click", () => this.toggleHUD());
    if (scanBtn)
      scanBtn.addEventListener("click", () => this.toggleScanlines());
    if (gridBtn) gridBtn.addEventListener("click", () => this.toggleGrid());
  }

  toggleHUD() {
    this.hudMode = !this.hudMode;
    document.body.classList.toggle("hud-mode", this.hudMode);
    const btn = document.getElementById("hudToggle");
    if (btn) btn.classList.toggle("active", this.hudMode);
  }

  toggleScanlines() {
    this.scanlinesEnabled = !this.scanlinesEnabled;
    const overlay = document.querySelector(".scanline-overlay");
    const btn = document.getElementById("scanlineToggle");
    if (overlay) overlay.classList.toggle("active", this.scanlinesEnabled);
    if (btn) btn.classList.toggle("active", this.scanlinesEnabled);
  }

  toggleGrid() {
    this.gridMode = !this.gridMode;
    document.body.classList.toggle("grid-mode", this.gridMode);
    const btn = document.getElementById("gridToggle");
    if (btn) btn.classList.toggle("active", this.gridMode);
  }

  // ============================================ */
  // SETUP EVENT LISTENERS                       */
  // ============================================ */
  setupEventListeners() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentType = btn.dataset.type;
        this.renderChallenges();
      });
    });
  }

  // ============================================ */
  // UTILITY FUNCTIONS                           */
  // ============================================ */
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = "success") {
    let toast = document.getElementById("challengeToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "challengeToast";
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
                text-align: center;
            `;
      document.body.appendChild(toast);
    }

    const colors = {
      success: "rgba(16,185,129,0.3)",
      error: "rgba(239,68,68,0.3)",
      info: "rgba(59,130,246,0.3)",
      warning: "rgba(245,158,11,0.3)",
    };

    toast.textContent = message;
    toast.style.borderColor = colors[type] || colors.success;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
  }
}

// ============================================ */
// INITIALIZE                                   */
// ============================================ */
let challengesSystemInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    challengesSystemInstance = new ChallengesSystem();
    window.challengesSystem = challengesSystemInstance;
    window.allChallenges = challengesSystemInstance.challenges;
    console.log(
      `✅ ChallengesSystem initialized with ${challengesSystemInstance.challenges.length} challenges`,
    );
  }, 500);
});
