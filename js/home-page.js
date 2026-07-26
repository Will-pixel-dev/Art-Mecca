// ============================================================
// HOME PAGE — COMPLETE WITH KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🏠 Home page initializing...");

  // ============================================================
  // 1. TYPEWRITER EFFECT
  // ============================================================
  const typewriterElement = document.getElementById("typewriterText");
  if (typewriterElement) {
    const phrases = [
      "✦ Ready to create?",
      "✦ Go Mecca Star !.",
      "✦ Make your mark.",
      "✦ Art is waiting.",
      "✦ Cyber den awaits.",
      "✦ Tag the future.",
      "✦ Lets play!.",
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentText = "";

    function typeWriter() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        currentText = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
      } else {
        currentText = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
      }

      typewriterElement.textContent = currentText;

      let speed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        speed = 500;
      }

      setTimeout(typeWriter, speed);
    }

    typeWriter();
  }

  // ============================================================
  // 2. THEME TOGGLE
  // ============================================================
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const icon = themeToggle.querySelector(".toggle-icon");
    const label = themeToggle.querySelector(".toggle-label");
    if (icon) icon.textContent = savedTheme === "dark" ? "🌙" : "☀️";
    if (label) label.textContent = savedTheme === "dark" ? "Dark" : "Light";

    themeToggle.addEventListener("click", function (e) {
      e.preventDefault();
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);

      const iconEl = this.querySelector(".toggle-icon");
      const labelEl = this.querySelector(".toggle-label");
      if (iconEl) iconEl.textContent = next === "dark" ? "🌙" : "☀️";
      if (labelEl) labelEl.textContent = next === "dark" ? "Dark" : "Light";

      console.log("Theme toggled to:", next);
    });
  }

  // ============================================================
  // 3. TOAST NOTIFICATIONS — FIXED (no conflict)
  // ============================================================

  // Create toast container dynamically if it doesn't exist
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 360px;
        pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  function showToast(icon, message) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.cssText = `
        padding: 14px 20px;
        background: var(--bg-card);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        box-shadow: var(--shadow-card), var(--glow-magenta);
        color: var(--text-primary);
        font-family: var(--font-condensed);
        font-size: 0.85rem;
        transform: translateX(120%);
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    toast.innerHTML = `
        <span style="font-size: 1.4rem;">${icon}</span>
        <span>${message}</span>
        <button style="
            margin-left: auto;
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 1.1rem;
            transition: color 0.3s;
        ">&times;</button>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    toast.querySelector("button").addEventListener("click", () => {
      toast.style.transform = "translateX(120%)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transform = "translateX(120%)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
      }
    }, 4000);
  }

  // ============================================================
  // 4. SOUND EFFECTS
  // ============================================================
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function playSound(type) {
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "hover") {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          1200,
          audioCtx.currentTime + 0.05,
        );
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.05,
        );
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "click") {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          400,
          audioCtx.currentTime + 0.08,
        );
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.08,
        );
        osc.type = "square";
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === "glitch") {
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          800,
          audioCtx.currentTime + 0.1,
        );
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.1,
        );
        osc.type = "sawtooth";
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {
      /* Silently fail */
    }
  }

  // ============================================================
  // 5. KEYBOARD SHORTCUTS
  // ============================================================
  function triggerGlitch() {
    const noise = document.getElementById("noiseOverlay");
    if (noise) {
      noise.classList.add("active");
      setTimeout(() => noise.classList.remove("active"), 500);
    }

    // Screen shake
    document.body.style.transition = "transform 0.03s ease";
    const shakes = [
      [6, -3],
      [-3, 6],
      [3, -6],
      [-6, 3],
      [2, 2],
      [-2, -2],
    ];
    shakes.forEach((pos, i) => {
      setTimeout(() => {
        document.body.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`;
      }, i * 30);
    });
    setTimeout(
      () => {
        document.body.style.transform = "";
      },
      shakes.length * 30 + 50,
    );

    playSound("glitch");
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    // Number keys 1-5 for navigation
    if (["1", "2", "3", "4", "5"].includes(key)) {
      const navLinks = {
        1: "pages/community/gallery.html",
        2: "pages/community/challenges.html",
        3: "pages/tutorials/tutorials.html",
        4: "pages/tools/tools.html",
        5: "pages/community/hub.html",
      };

      const labels = {
        1: "Gallery",
        2: "Challenges",
        3: "Learn",
        4: "Tools",
        5: "Community",
      };

      // Update active state on nav center

      showToast("⌨️", `Navigated to ${labels[key]}`);
      playSound("click");

      // Navigate
      setTimeout(() => {
        window.location.href = navLinks[key];
      }, 300);
    }

    // 'g' for glitch
    if (key === "g") {
      triggerGlitch();
      showToast("⚡", "GLITCH ACTIVATED!");
      playSound("glitch");
    }

    // 't' for toast (test notification)
    if (key === "t") {
      const messages = [
        "✨ System nominal",
        "🔥 Creative energy surging",
        "🎨 Art detected",
        "💫 Hologram stable",
        "⚡ Power at 98%",
        "✧ Keep it fresh",
      ];
      showToast("🎯", messages[Math.floor(Math.random() * messages.length)]);
      playSound("click");
    }

    // 'f' for flip cards (if any exist)
    if (key === "f") {
      document.querySelectorAll(".flip-card").forEach((card) => {
        card.classList.toggle("flipped");
      });
      showToast("🔄", "Flipped all cards!");
      playSound("click");
    }
  });

  // ============================================================
  // 6. COMMUNITY NEWS SLIDER
  // ============================================================
  const newsSlider = document.getElementById("newsSlider");
  const newsDots = document.querySelectorAll("#newsDots .dot");
  const newsPrevBtn = document.getElementById("newsPrevBtn");
  const newsNextBtn = document.getElementById("newsNextBtn");
  let currentNewsSlide = 0;
  const totalNewsSlides = 7;

  function goToNewsSlide(index) {
    if (index < 0) index = totalNewsSlides - 1;
    if (index >= totalNewsSlides) index = 0;
    currentNewsSlide = index;

    if (newsSlider) {
      newsSlider.style.transform = `translateX(-${index * 100}%)`;
    }

    newsDots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  if (newsPrevBtn) {
    newsPrevBtn.addEventListener("click", () =>
      goToNewsSlide(currentNewsSlide - 1),
    );
  }
  if (newsNextBtn) {
    newsNextBtn.addEventListener("click", () =>
      goToNewsSlide(currentNewsSlide + 1),
    );
  }

  newsDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToNewsSlide(parseInt(dot.dataset.index));
    });
  });

  // Auto-play
  let newsInterval = setInterval(
    () => goToNewsSlide(currentNewsSlide + 1),
    8000,
  );
  const newsContainer = document.querySelector(".news-slider-container");
  if (newsContainer) {
    newsContainer.addEventListener("mouseenter", () =>
      clearInterval(newsInterval),
    );
    newsContainer.addEventListener("mouseleave", () => {
      newsInterval = setInterval(
        () => goToNewsSlide(currentNewsSlide + 1),
        8000,
      );
    });
  }

  // ============================================================
  // 7. WINNERS CAROUSEL — INIT (FIXED CONTROLS + AUTO-PLAY)
  // ============================================================
  let winnersCarouselInterval = null;

  function initWinnersCarousel() {
    const winnersCarousel = document.getElementById("winnersCarousel");
    const winnersPrevBtn = document.getElementById("winnersPrevBtn");
    const winnersNextBtn = document.getElementById("winnersNextBtn");
    const progressBar = document.getElementById("winnersProgressBar");
    let currentSlide = 0;

    function getSlidesPerView() {
      if (window.innerWidth <= 480) return 1;
      if (window.innerWidth <= 768) return 2;
      return 3;
    }

    function getTotalCards() {
      return document.querySelectorAll(".winner-card").length;
    }

    function getMaxIndex() {
      const total = getTotalCards();
      const perView = getSlidesPerView();
      return Math.max(0, total - perView);
    }

    function goToSlide(index) {
      const maxIndex = getMaxIndex();
      if (index < 0) index = 0;
      if (index > maxIndex) index = maxIndex;
      currentSlide = index;

      const perView = getSlidesPerView();
      const offset = -index * (100 / perView);

      if (winnersCarousel) {
        winnersCarousel.style.transform = `translateX(${offset}%)`;
        winnersCarousel.style.transition =
          "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
      }

      if (progressBar) {
        const totalSteps = maxIndex + 1;
        const progress = ((index + 1) / totalSteps) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
      }

      if (winnersPrevBtn) {
        winnersPrevBtn.style.opacity = index === 0 ? "0.3" : "1";
        winnersPrevBtn.style.cursor = index === 0 ? "not-allowed" : "pointer";
      }
      if (winnersNextBtn) {
        winnersNextBtn.style.opacity = index === maxIndex ? "0.3" : "1";
        winnersNextBtn.style.cursor =
          index === maxIndex ? "not-allowed" : "pointer";
      }
    }

    if (winnersPrevBtn) {
      winnersPrevBtn.onclick = () => {
        if (currentSlide > 0) goToSlide(currentSlide - 1);
      };
    }

    if (winnersNextBtn) {
      winnersNextBtn.onclick = () => {
        const maxIndex = getMaxIndex();
        if (currentSlide < maxIndex) goToSlide(currentSlide + 1);
      };
    }

    if (winnersCarouselInterval) {
      clearInterval(winnersCarouselInterval);
    }

    winnersCarouselInterval = setInterval(() => {
      const maxIndex = getMaxIndex();
      if (currentSlide < maxIndex) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(0);
      }
    }, 6000);

    const container = document.querySelector(".winners-carousel-container");
    if (container) {
      container.onmouseenter = () => {
        if (winnersCarouselInterval) {
          clearInterval(winnersCarouselInterval);
          winnersCarouselInterval = null;
        }
      };
      container.onmouseleave = () => {
        if (winnersCarouselInterval) {
          clearInterval(winnersCarouselInterval);
        }
        winnersCarouselInterval = setInterval(() => {
          const maxIndex = getMaxIndex();
          if (currentSlide < maxIndex) {
            goToSlide(currentSlide + 1);
          } else {
            goToSlide(0);
          }
        }, 6000);
      };
    }

    let resizeTimer;
    window.onresize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        goToSlide(currentSlide);
      }, 250);
    };

    goToSlide(0);
  }

  // ============================================================
  // 8. DATA LOADING — ACCURATE STATS FROM FIRESTORE
  // ============================================================

  // Format numbers
  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }

  function getTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  // ============================================================
  // 8a. LOAD STATS
  // ============================================================
  async function loadStats() {
    try {
      const [artworksSnap, usersSnap, challengesSnap] = await Promise.all([
        db.collection("artworks").where("status", "==", "published").get(),
        db.collection("users").get(),
        db.collection("challenges").where("status", "==", "active").get(),
      ]);

      let totalLikes = 0;
      artworksSnap.forEach((doc) => {
        totalLikes += doc.data().likes || 0;
      });

      const stats = {
        artworks: artworksSnap.size,
        users: usersSnap.size,
        challenges: challengesSnap.size,
        likes: totalLikes,
      };

      const elements = {
        heroTotalArtworks: document.getElementById("heroTotalArtworks"),
        heroTotalArtists: document.getElementById("heroTotalArtists"),
        heroActiveChallenges: document.getElementById("heroActiveChallenges"),
        heroTotalLikes: document.getElementById("heroTotalLikes"),
        crewCount: document.getElementById("crewCount"),
        totalArtworks: document.getElementById("totalArtworks"),
        totalArtists: document.getElementById("totalArtists"),
        activeChallenges: document.getElementById("activeChallenges"),
        totalLikes: document.getElementById("totalLikes"),
      };

      const artworks = formatNumber(stats.artworks);
      const users = formatNumber(stats.users);
      const challenges = formatNumber(stats.challenges);
      const likes = formatNumber(stats.likes);

      if (elements.heroTotalArtworks)
        elements.heroTotalArtworks.textContent = artworks;
      if (elements.heroTotalArtists)
        elements.heroTotalArtists.textContent = users;
      if (elements.heroActiveChallenges)
        elements.heroActiveChallenges.textContent = challenges;
      if (elements.heroTotalLikes) elements.heroTotalLikes.textContent = likes;
      if (elements.crewCount) elements.crewCount.textContent = users;
      if (elements.totalArtworks) elements.totalArtworks.textContent = artworks;
      if (elements.totalArtists) elements.totalArtists.textContent = users;
      if (elements.activeChallenges)
        elements.activeChallenges.textContent = challenges;
      if (elements.totalLikes) elements.totalLikes.textContent = likes;

      console.log("📊 Stats loaded:", stats);
    } catch (error) {
      console.error("Error loading stats:", error);
      const fallback = {
        artworks: "10K+",
        users: "5K+",
        challenges: "12",
        likes: "25K+",
      };
      ["heroTotalArtworks", "totalArtworks"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = fallback.artworks;
      });
      ["heroTotalArtists", "totalArtists", "crewCount"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = fallback.users;
      });
      ["heroActiveChallenges", "activeChallenges"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = fallback.challenges;
      });
      ["heroTotalLikes", "totalLikes"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = fallback.likes;
      });
    }
  }

  // ============================================================
  // 8b. LOAD RECENT ARTWORKS
  // ============================================================
  async function loadRecentArtworks() {
    const container = document.getElementById("recentArtworks");
    if (!container) return;

    try {
      const usersSnapshot = await db.collection("users").get();
      const userMap = {};
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        userMap[doc.id] = {
          displayName: data.username
            ? `@${data.username}`
            : data.fullname || "Artist",
        };
      });

      const snapshot = await db
        .collection("artworks")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(4)
        .get();

      if (snapshot.empty) {
        container.innerHTML = `
                    <div class="artwork-placeholder">
                        <i class="fas fa-paint-brush"></i>
                        <span>No artworks yet. Be the first to upload!</span>
                    </div>
                `;
        return;
      }

      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const artworkId = doc.id;
        const userId = data.artistId || data.userId || data.uid;
        const userInfo = userMap[userId] || {
          displayName: data.artistName || "Unknown Artist",
        };
        const displayName =
          userInfo.displayName || data.artistName || "Unknown Artist";

        const card = document.createElement("div");
        card.className = "artwork-card glass-panel";
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
          window.location.href = `pages/community/artwork-detail.html?id=${artworkId}`;
        });
        card.innerHTML = `
                    <div class="artwork-image">
                        ${
                          data.imageUrl
                            ? `
                            <img src="${data.imageUrl}" alt="${data.title || "Untitled"}" loading="lazy">
                        `
                            : `
                            <div class="artwork-placeholder-img"><i class="fas fa-image"></i></div>
                        `
                        }
                    </div>
                    <div class="artwork-info">
                        <h4>${data.title || "Untitled"}</h4>
                        <p>by ${displayName}</p>
                        <div class="artwork-meta">
                            <span><i class="fas fa-heart"></i> ${data.likes || 0}</span>
                            <span><i class="fas fa-glass-cheers"></i> ${data.cheers || 0}</span>
                            ${data.tags && data.tags.length > 0 ? `<span class="artwork-tag">${data.tags[0]}</span>` : ""}
                        </div>
                    </div>
                `;
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading artworks:", error);
      container.innerHTML = `
                <div class="artwork-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error loading artworks</span>
                </div>
            `;
    }
  }

  // ============================================================
  // 8c. LOAD ACTIVE CHALLENGES
  // ============================================================
  async function loadActiveChallenges() {
    const container = document.getElementById("activeChallenges");
    if (!container) return;

    try {
      let challenges = [];

      if (window.communityHubInstance) {
        try {
          const intuitChallenges =
            window.communityHubInstance.getIntuitChallenges();
          if (intuitChallenges && intuitChallenges.length > 0) {
            challenges = intuitChallenges.map((c) => ({
              id: c.id || "intuit-" + c.type,
              title: c.title || c.theme || "Challenge",
              description: c.description || "Join this challenge!",
              icon: c.icon || "⭐",
              participants: c.participants || 0,
              submissions: c.submissions || 0,
              type: c.type || "active",
              color: c.color || "#fe67ea",
              status: c.status || "active",
              isIntuit: true,
            }));
          }
        } catch (e) {
          console.warn("Error getting Intuit challenges:", e);
        }
      }

      if (challenges.length === 0) {
        try {
          const snapshot = await db
            .collection("challenges")
            .where("status", "==", "active")
            .limit(3)
            .get();

          if (!snapshot.empty) {
            snapshot.forEach((doc) => {
              const data = doc.data();
              challenges.push({
                id: doc.id,
                title: data.title || "Challenge",
                description: data.description || "Join now!",
                icon: data.icon || "🏆",
                participants: data.participants || 0,
                submissions: data.submissions || 0,
                type: data.type || "active",
                color: data.color || "#fe67ea",
                status: data.status || "active",
                isIntuit: false,
              });
            });
          }
        } catch (e) {
          console.warn("Firestore challenges not available");
        }
      }

      if (challenges.length === 0) {
        challenges = generateFallbackChallenges();
      }

      const typeOrder = { daily: 0, weekly: 1, monthly: 2, yearly: 3 };
      challenges.sort((a, b) => {
        const aType = a.type || "daily";
        const bType = b.type || "daily";
        return (typeOrder[aType] || 0) - (typeOrder[bType] || 0);
      });

      challenges = challenges.slice(0, 3);

      if (challenges.length === 0) {
        container.innerHTML = `
                    <div class="challenge-placeholder">
                        <i class="fas fa-trophy"></i>
                        <span>No active challenges. <a href="pages/community/challenges.html" style="color: var(--neon-cyan);">Browse all →</a></span>
                    </div>
                `;
        return;
      }

      renderChallenges(container, challenges);
    } catch (error) {
      console.error("Error loading challenges:", error);
      const fallbackChallenges = generateFallbackChallenges();
      renderChallenges(container, fallbackChallenges.slice(0, 3));
    }
  }

  function generateFallbackChallenges() {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
    );

    const dailyPrompts = [
      {
        title: "At the Top of the World",
        desc: "Create artwork depicting the highest peaks, both literal and metaphorical.",
      },
      {
        title: "Breathe",
        desc: "Capture the essence of breath, life, and moments of calm.",
      },
      {
        title: "Fallen",
        desc: "Explore themes of descent, loss, or transformation.",
      },
    ];

    const weeklyThemes = [
      {
        title: "Urban Jungle",
        desc: "Blend city architecture with natural elements.",
      },
      {
        title: "Golden Hour Glow",
        desc: "Capture the magic of the golden hour.",
      },
      {
        title: "Silent Stories",
        desc: "Create artwork that tells a story without words.",
      },
    ];

    const monthlyThemes = [
      {
        title: "Mythical Realms Reimagined",
        desc: "Take a classic mythical creature and give it a fresh twist.",
      },
      {
        title: "Urban Echoes",
        desc: "Capture the hidden stories of the city.",
      },
      {
        title: "Ethereal Visions",
        desc: "Explore the space between dreams and reality.",
      },
    ];

    const dailyIndex = dayOfYear % dailyPrompts.length;
    const weekNumber = Math.ceil(dayOfYear / 7);
    const weeklyIndex = weekNumber % weeklyThemes.length;
    const monthlyIndex = now.getMonth() % monthlyThemes.length;

    return [
      {
        id: "fallback-daily",
        title: dailyPrompts[dailyIndex].title,
        description: dailyPrompts[dailyIndex].desc,
        icon: "🌅",
        type: "daily",
        color: "#ff38e4",
        participants: 0,
        submissions: 0,
        isIntuit: true,
      },
      {
        id: "fallback-weekly",
        title: weeklyThemes[weeklyIndex].title,
        description: weeklyThemes[weeklyIndex].desc,
        icon: "📅",
        type: "weekly",
        color: "#4cd6eb",
        participants: 0,
        submissions: 0,
        isIntuit: true,
      },
      {
        id: "fallback-monthly",
        title: monthlyThemes[monthlyIndex].title,
        description: monthlyThemes[monthlyIndex].desc,
        icon: "🌟",
        type: "monthly",
        color: "#8c35e9",
        participants: 0,
        submissions: 0,
        isIntuit: true,
      },
    ];
  }

  function renderChallenges(container, challenges) {
    if (!challenges || challenges.length === 0) {
      container.innerHTML = `
                <div class="challenge-placeholder">
                    <i class="fas fa-trophy"></i>
                    <span>No active challenges. Check back soon!</span>
                </div>
            `;
      return;
    }

    container.innerHTML = "";
    challenges.forEach((challenge) => {
      const card = document.createElement("div");
      card.className = "challenge-card glass-panel";
      const color = challenge.color || "#fe67ea";
      const typeDisplay = challenge.type
        ? challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)
        : "Active";

      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        window.location.href = `pages/community/challenges.html?type=${challenge.type}`;
      });

      card.innerHTML = `
                <div class="challenge-icon" style="color: ${color};">${challenge.icon || "🏆"}</div>
                <div class="challenge-info">
                    <h4>${challenge.title || "Challenge"}</h4>
                    <p>${challenge.description || "Join now!"}</p>
                    <div class="challenge-stats-mini">
                        <span><i class="fas fa-users"></i> ${challenge.participants || 0}</span>
                        <span><i class="fas fa-upload"></i> ${challenge.submissions || 0}</span>
                        ${challenge.isIntuit ? `<span class="challenge-type-badge" style="background: ${color}; color: white;">⚡ ${typeDisplay}</span>` : ""}
                        ${!challenge.isIntuit && challenge.type ? `<span class="challenge-type-badge" style="background: ${color}; color: white;">${typeDisplay}</span>` : ""}
                    </div>
                </div>
                <a href="pages/community/challenges.html?type=${challenge.type}" class="challenge-join-btn" onclick="event.stopPropagation();">Join →</a>
            `;
      container.appendChild(card);
    });
  }

  // ============================================================
  // 8d. LOAD ACTIVITY FEED
  // ============================================================
  async function loadActivityFeed() {
    const container = document.getElementById("activityFeed");
    if (!container) return;

    try {
      const usersSnapshot = await db.collection("users").get();
      const userMap = {};
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        userMap[doc.id] = {
          displayName: data.username
            ? `@${data.username}`
            : data.fullname || "Artist",
        };
      });

      let snapshot = await db
        .collection("activity")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      if (snapshot.empty) {
        const artworksSnap = await db
          .collection("artworks")
          .where("status", "==", "published")
          .orderBy("createdAt", "desc")
          .limit(10)
          .get();

        if (artworksSnap.empty) {
          container.innerHTML = `
                        <div class="feed-placeholder">
                            <i class="fas fa-newspaper"></i>
                            <span>No recent activity</span>
                        </div>
                    `;
          return;
        }

        const activities = [];
        artworksSnap.forEach((doc) => {
          const data = doc.data();
          const userId = data.artistId || data.userId || data.uid;
          const userInfo = userMap[userId] || {
            displayName: data.artistName || "Someone",
          };

          activities.push({
            icon: "✿",
            message: `${userInfo.displayName} uploaded "${data.title || "artwork"}"`,
            time: data.createdAt,
            artworkId: doc.id,
            userId: userId,
          });
        });

        renderActivity(container, activities);
        return;
      }

      const activities = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId || data.artistId || data.uid;
        const userInfo = userMap[userId] || {
          displayName: data.userName || data.artistName || "Someone",
        };
        const displayName =
          userInfo.displayName || data.userName || data.artistName || "Someone";

        activities.push({
          icon: data.icon || "📢",
          message: data.message
            ? data.message.replace(/\{user\}/g, displayName)
            : `${displayName} ${data.action || "was active"}`,
          time: data.createdAt,
          userId: userId,
          targetId: data.targetId || data.artworkId,
        });
      });

      renderActivity(container, activities);
    } catch (error) {
      console.error("Error loading activity:", error);
      container.innerHTML = `
                <div class="feed-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error loading activity</span>
                </div>
            `;
    }
  }

  function renderActivity(container, activities) {
    if (!activities || activities.length === 0) {
      container.innerHTML = `
                <div class="feed-placeholder">
                    <i class="fas fa-newspaper"></i>
                    <span>No recent activity</span>
                </div>
            `;
      return;
    }

    container.innerHTML = "";
    activities.forEach((activity) => {
      const item = document.createElement("div");
      item.className = "feed-item glass-panel";
      item.style.cursor = "pointer";

      item.addEventListener("click", () => {
        if (activity.artworkId) {
          window.location.href = `pages/community/artwork-detail.html?id=${activity.artworkId}`;
        } else if (activity.userId) {
          window.location.href = `pages/community/profile.html?user=${activity.userId}`;
        } else if (activity.targetId) {
          window.location.href = `pages/community/artwork-detail.html?id=${activity.targetId}`;
        } else {
          window.location.href = "pages/community/gallery.html";
        }
      });

      const timeAgo = getTimeAgo(activity.time);
      item.innerHTML = `
                <div class="feed-icon">${activity.icon || "📢"}</div>
                <div class="feed-content">
                    <p>${activity.message}</p>
                    <span class="feed-time">${timeAgo}</span>
                </div>
            `;
      container.appendChild(item);
    });
  }

  // ============================================================
  // 8e. LOAD FEATURED ARTISTS - REAL STATS FROM FIRESTORE
  // ============================================================
  async function loadFeaturedArtists() {
    const container = document.getElementById("featuredArtists");
    if (!container) return;

    try {
      // Get top 4 users by points from Firestore
      const snapshot = await db
        .collection("users")
        .orderBy("points", "desc")
        .limit(4)
        .get();

      if (snapshot.empty) {
        container.innerHTML = `
                <div class="artist-placeholder">
                    <i class="fas fa-users"></i>
                    <span>No featured artists yet</span>
                </div>
            `;
        return;
      }

      container.innerHTML = "";

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const userId = doc.id;

        // Get REAL artwork count from Firestore
        let artworkCount = 0;
        try {
          const artworksSnap = await db
            .collection("artworks")
            .where("artistId", "==", userId)
            .where("status", "==", "published")
            .get();
          artworkCount = artworksSnap.size;
        } catch (e) {
          console.warn(`Could not fetch artworks for ${userId}:`, e.message);
        }

        // Get REAL points (directly from user document)
        let points = 0;
        if (data.points && typeof data.points === "number") {
          points = data.points;
        } else if (data.stats && typeof data.stats === "object") {
          points = data.stats.points || data.stats.totalPoints || 0;
        }

        // Get REAL followers count
        let followers = 0;
        try {
          const followersSnap = await db
            .collection("followers")
            .where("followingId", "==", userId)
            .get();
          followers = followersSnap.size;
        } catch (e) {
          // Followers collection might not exist yet
        }

        // Get REAL submission count
        let submissions = 0;
        try {
          const submissionsSnap = await db
            .collection("challengeSubmissions")
            .where("userId", "==", userId)
            .get();
          submissions = submissionsSnap.size;
        } catch (e) {
          // ChallengeSubmissions collection might not exist yet
        }

        const card = document.createElement("div");
        card.className = "artist-card glass-panel";
        card.style.cursor = "pointer";

        card.addEventListener("click", () => {
          window.location.href = `pages/community/profiles.html?user=${userId}`;
        });

        const fullname = data.fullname || data.displayName || "Artist";
        const username = data.username || data.handle || "artist";
        const displayName = username ? `@${username}` : fullname;
        const initials = fullname
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        // Get avatar URL
        let avatarUrl = null;
        if (
          data.avatar &&
          typeof data.avatar === "string" &&
          data.avatar.startsWith("http")
        ) {
          avatarUrl = data.avatar;
        } else if (
          data.profilePicture &&
          typeof data.profilePicture === "string" &&
          data.profilePicture.startsWith("http")
        ) {
          avatarUrl = data.profilePicture;
        } else if (
          data.avatarUrl &&
          typeof data.avatarUrl === "string" &&
          data.avatarUrl.startsWith("http")
        ) {
          avatarUrl = data.avatarUrl;
        } else if (
          data.photoURL &&
          typeof data.photoURL === "string" &&
          data.photoURL.startsWith("http")
        ) {
          avatarUrl = data.photoURL;
        }

        // Format numbers with K for thousands
        const formattedArtworks =
          artworkCount >= 1000
            ? (artworkCount / 1000).toFixed(1) + "K"
            : artworkCount.toString();
        const formattedPoints =
          points >= 1000 ? (points / 1000).toFixed(1) + "K" : points.toString();
        const formattedFollowers =
          followers >= 1000
            ? (followers / 1000).toFixed(1) + "K"
            : followers.toString();

        card.innerHTML = `
                <div class="artist-avatar">
                    ${
                      avatarUrl
                        ? `<img src="${avatarUrl}" alt="${fullname}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'artist-initials\\'>${initials}</span>'">`
                        : `<span class="artist-initials">${initials}</span>`
                    }
                </div>
                <h4>${fullname}</h4>
                <p>${displayName}</p>
                <div class="artist-stats">
                    <span><i class="fas fa-palette"></i> ${formattedArtworks}</span>
                    <span><i class="fas fa-star"></i> ${formattedPoints}</span>
                    <span><i class="fas fa-users"></i> ${formattedFollowers}</span>
                </div>
                <a href="pages/community/profiles.html?user=${userId}" class="artist-view-btn" onclick="event.stopPropagation();">View Profile →</a>
            `;
        container.appendChild(card);
      }

      console.log("✅ Featured artists loaded with real stats");
    } catch (error) {
      console.error("Error loading artists:", error);
      container.innerHTML = `
            <div class="artist-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Error loading artists</span>
            </div>
        `;
    }
  }

  // ============================================================
  // 8f. LOAD CHALLENGE WINNERS
  // ============================================================
  async function loadChallengeWinners() {
    const container = document.getElementById("winnersCarousel");
    if (!container) return;

    try {
      let winners = [];

      try {
        const snapshot = await db
          .collection("challengeWinners")
          .orderBy("createdAt", "desc")
          .limit(10)
          .get();

        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            const data = doc.data();
            winners.push({
              id: doc.id,
              rank: data.rank || 1,
              winnerName: data.winnerUserName || data.winnerName || "Artist",
              username: data.username || data.winnerUsername || "artist",
              artworkTitle: data.artworkTitle || "Artwork",
              icon: data.icon || "🎨",
              likes: data.votes || data.likes || 0,
              views: data.views || 0,
              imageUrl: data.imageUrl || null,
              artworkId: data.artworkId || null,
              userId: data.winnerUserId || null,
              color1: data.color1 || "#ff00ea",
              color2: data.color2 || "#ad03fc",
            });
          });
        }
      } catch (e) {
        console.warn("ChallengeWinners collection not found");
      }

      if (winners.length === 0) {
        winners = generatePlaceholderWinners();
      }

      renderWinners(container, winners);

      setTimeout(() => {
        initWinnersCarousel();
      }, 200);
    } catch (error) {
      console.error("Error loading winners:", error);
      renderWinners(container, generatePlaceholderWinners());
      setTimeout(() => {
        initWinnersCarousel();
      }, 200);
    }
  }

  function generatePlaceholderWinners() {
    const names = [
      "CyberArtist",
      "NeonDreamer",
      "PixelWizard",
      "GlitchMaster",
      "VoidWalker",
      "DigitalProphet",
      "CrystalMage",
      "StormChaser",
      "LunarArtist",
      "StarForger",
    ];
    const usernames = [
      "@cyber_art",
      "@neon_dream",
      "@pixel_wiz",
      "@glitch_master",
      "@void_walker",
      "@digital_prophet",
      "@crystal_mage",
      "@storm_chaser",
      "@lunar_artist",
      "@star_forger",
    ];
    const icons = ["🎨", "🖌️", "✨", "🌟", "🎭", "🌈", "💫", "🎯", "🌸", "⚡"];
    const colors1 = [
      "#ff00ea",
      "#58ebfe",
      "#ffc72e",
      "#ad03fc",
      "#ff00ea",
      "#4ff3a6",
      "#58ebfe",
      "#ff6b00",
      "#4ff3a6",
      "#ffc72e",
    ];
    const colors2 = [
      "#ad03fc",
      "#4ff3a6",
      "#ff6b00",
      "#ff00ea",
      "#58ebfe",
      "#ffc72e",
      "#ad03fc",
      "#ff00ea",
      "#58ebfe",
      "#ff6b00",
    ];
    const likes = [342, 298, 245, 210, 189, 167, 152, 138, 124, 112];
    const views = [4287, 3654, 2891, 2345, 1987, 1654, 1432, 1287, 1105, 987];

    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      winnerName: names[i],
      username: usernames[i],
      artworkTitle: names[i] + "'s Artwork",
      icon: icons[i],
      likes: likes[i],
      views: views[i],
      imageUrl: null,
      artworkId: `placeholder-${i}`,
      userId: null,
      color1: colors1[i % colors1.length],
      color2: colors2[i % colors2.length],
    }));
  }

  function renderWinners(container, winners) {
    container.innerHTML = "";

    function formatNum(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
      return num.toString();
    }

    function getRankData(rank) {
      if (rank === 1) return { class: "gold", label: "★ #1" };
      if (rank === 2) return { class: "silver", label: "★ #2" };
      if (rank === 3) return { class: "bronze", label: "★ #3" };
      return { class: "", label: `★ #${rank}` };
    }

    winners.forEach((winner, index) => {
      const rank = winner.rank || index + 1;
      const rankData = getRankData(rank);

      const card = document.createElement("div");
      card.className = "winner-card";
      card.setAttribute("data-rank", rank);
      card.style.cursor = "pointer";

      card.addEventListener("click", () => {
        if (winner.artworkId && !winner.artworkId.startsWith("placeholder-")) {
          window.location.href = `pages/community/artwork-detail.html?id=${winner.artworkId}`;
        } else if (winner.userId) {
          window.location.href = `pages/community/profile.html?user=${winner.userId}`;
        } else {
          window.location.href = "pages/community/gallery.html";
        }
      });

      const color1 = winner.color1 || "#ff00ea";
      const color2 = winner.color2 || "#ad03fc";

      card.innerHTML = `
                <span class="winner-rank ${rankData.class}">${rankData.label}</span>
                <div class="winner-avatar">${winner.icon || "🎨"}</div>
                <div class="card-scanline"></div>
                <div class="winner-artwork">
                    ${
                      winner.imageUrl
                        ? `<img src="${winner.imageUrl}" alt="${winner.artworkTitle}" loading="lazy">`
                        : `<div class="artwork-placeholder" style="background:radial-gradient(circle at 30% 40%, ${color1} 0%, transparent 60%), radial-gradient(circle at 70% 60%, ${color2} 0%, transparent 50%);">✦</div>`
                    }
                    <div class="glitch-overlay"></div>
                    <div class="artwork-hud">
                        <span class="hud-left">◆ ${formatNum(winner.views || 0)}</span>
                        <span class="hud-right">● ${formatNum(winner.likes || 0)}</span>
                    </div>
                </div>
                <div class="winner-info">
                    <span class="winner-name">${winner.winnerName}</span>
                    <span class="winner-username">${winner.username}</span>
                </div>
                <div class="winner-stats">
                    <span class="stat-item">
                        <span class="stat-icon">♥</span>
                        <span class="stat-value">${formatNum(winner.likes || 0)}</span>
                    </span>
                    <span class="stat-item">
                        <span class="stat-icon">◆</span>
                        <span class="stat-value">${formatNum(winner.views || 0)}</span>
                    </span>
                    <span class="stat-item">
                        <span class="stat-icon">🏆</span>
                        <span class="stat-value">#${rank}</span>
                    </span>
                </div>
            `;

      container.appendChild(card);
    });
  }

  // ============================================================
  // 9. PARTICLES (Canvas)
  // ============================================================
  const canvas = document.getElementById("particleCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouseX = -1000;
    let mouseY = -1000;
    const particleCount = 80;

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
        const colors = [
          "#ff00ea",
          "#ad03fc",
          "#58ebfe",
          "#4ff3a6",
          "#ffc72e",
          "#ff0040",
          "#ff6b00",
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
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
        )
          this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.05;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "#ff00ea";
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.6;
            ctx.shadowColor = "#ff00ea";
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

  // ============================================================
  // 10. INITIALIZE — Load all data
  // ============================================================
  function initializeData() {
    if (typeof firebase !== "undefined" && typeof db !== "undefined") {
      console.log("🔥 Firebase ready, loading data...");
      loadStats();
      loadRecentArtworks();
      loadActiveChallenges();
      loadActivityFeed();
      loadFeaturedArtists();
      loadChallengeWinners();
    } else {
      console.warn("⏳ Firebase not ready, retrying...");
      setTimeout(initializeData, 1000);
    }
  }

  setTimeout(initializeData, 500);
  console.log("✅ Home page initialized!");
});
