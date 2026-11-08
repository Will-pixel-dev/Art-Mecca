/**
 * tutorials-landing.js
 * Manages tutorial data display, filtering, and navigation
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Tutorials Landing JS loaded");

  // ============================================================
  // PARTICLES SYSTEM (matching home page)
  // ============================================================


  // ===========================================
  // GLOBAL VARIABLES
  // ===========================================

  let currentFilters = {
    category: "all",
    difficulty: "all",
    duration: "all",
    search: "",
  };

  // ===========================================
  // INITIALIZATION
  // ===========================================

  function init() {
    console.log("Initializing tutorials page...");


    // Check if tutorialData exists
    if (typeof tutorialData === "undefined") {
      console.error(
        "tutorialData is not loaded! Make sure tutorials-data.js is included before this file.",
      );
      showErrorMessage();
      return;
    }

    console.log(
      "✅ tutorialData loaded, tutorials:",
      tutorialData.getAllTutorials().length,
    );

    // Load tutorials
    loadFeaturedTutorials();
    loadAllTutorials();

    // Setup event listeners
    setupCategoryCards();
    setupFilters();
    setupSearch();
    setupCategoryFilterFromUrl();


    // Update tutorial count in hero
    updateTutorialCount();
    updateRealStats();

    // Setup scroll animations - IMPORTANT: Call this AFTER loading tutorials
    setTimeout(setupScrollAnimations, 300);

    console.log("Tutorials page initialized successfully");
  }
  // ============================================================
  // 2. THEME TOGGLE
  // ============================================================
  const themeToggle = document.getElementById("themeToggle");
  console.log("[theme] toggle found:", !!themeToggle);
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

  // ===========================================
  // FEATURED TUTORIALS
  // ===========================================

  function loadFeaturedTutorials() {
    const featuredGrid = document.getElementById("featured-grid");
    if (!featuredGrid) {
      console.warn("Featured grid element not found");
      return;
    }

    const featuredTutorials = tutorialData.getFeaturedTutorials(6);

    if (featuredTutorials.length === 0) {
      featuredGrid.innerHTML =
        '<p class="no-tutorials">No featured tutorials available</p>';
      return;
    }

    featuredGrid.innerHTML = featuredTutorials
      .map((tutorial) => {
        const category = tutorialData.categories.get(tutorial.category);
        const imagePath =
          tutorial.image || "../../images/tutorials/placeholder.jpg";

        return `
                <div class="featured-tutorial-card">
                    <div class="featured-image">
                        <img src="${imagePath}"
                             alt="${tutorial.title}"
                             onerror="this.src='../../images/tutorials/placeholder.jpg'; this.onerror=null;">
                    </div>
                    <div class="featured-content">
                        <h3>${tutorial.title}</h3>
                        <p>${tutorial.description}</p>
                        <div class="featured-meta">
                            <span class="difficulty-badge ${tutorial.difficulty}">${tutorial.difficulty}</span>
                            <span class="duration">
                                <i class="fas fa-clock"></i> ${tutorial.duration} min
                            </span>
                        </div>
                        <div class="tutorial-category-tag">
                            <i class="fas fa-tag"></i> ${category ? category.name : "Uncategorized"}
                        </div>
                        <a href="${tutorial.file}" class="tutorial-link">
                            Read Tutorial <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // ===========================================
  // ALL TUTORIALS GRID - FIXED
  // ===========================================

  function loadAllTutorials() {
    const tutorialsGrid = document.getElementById("tutorials-grid");
    if (!tutorialsGrid) {
      console.warn("Tutorials grid element not found");
      return;
    }

    const filteredTutorials = filterTutorials();
    const noResults = document.getElementById("no-results");
    const loadingIndicator = document.getElementById("loading-indicator");

    console.log("Filtered tutorials:", filteredTutorials.length);

    if (filteredTutorials.length === 0) {
      tutorialsGrid.innerHTML = "";
      if (noResults) noResults.style.display = "block";
      if (loadingIndicator) loadingIndicator.style.display = "none";
      return;
    }

    if (noResults) noResults.style.display = "none";
    if (loadingIndicator) loadingIndicator.style.display = "none";

    tutorialsGrid.innerHTML = filteredTutorials
      .map((tutorial, index) => {
        const category = tutorialData.categories.get(tutorial.category);
        const imagePath =
          tutorial.image || "../../images/tutorials/placeholder.jpg";

        return `
                <div class="tutorial-card" data-index="${index}">
                    <div class="tutorial-image">
                        <img src="${imagePath}"
                             alt="${tutorial.title}"
                             onerror="this.src='../../images/tutorials/placeholder.jpg'; this.onerror=null;">
                    </div>
                    <div class="tutorial-content">
                        <h3>${tutorial.title}</h3>
                        <p>${tutorial.description}</p>
                        <div class="tutorial-meta">
                            <span class="tutorial-category">${category ? category.name : "Uncategorized"}</span>
                            <span class="difficulty-badge ${tutorial.difficulty}">${tutorial.difficulty}</span>
                        </div>
                        <div class="tutorial-duration">
                            <i class="fas fa-clock"></i> ${tutorial.duration} min
                        </div>
                        <a href="${tutorial.file}" class="tutorial-link-card">
                            Read Tutorial <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
      })
      .join("");

    // Trigger scroll animations after loading
    setTimeout(setupScrollAnimations, 100);
  }

  // ===========================================
  // FILTERING FUNCTIONS
  // ===========================================

  function filterTutorials() {
    let tutorials = tutorialData.getAllTutorials();

    console.log("Filtering tutorials. Current filters:", currentFilters);

    // Filter by category
    if (currentFilters.category !== "all") {
      tutorials = tutorials.filter(
        (t) => t.category === currentFilters.category,
      );
    }

    // Filter by difficulty
    if (currentFilters.difficulty !== "all") {
      tutorials = tutorials.filter(
        (t) => t.difficulty === currentFilters.difficulty,
      );
    }

    // Filter by duration
    if (currentFilters.duration !== "all") {
      tutorials = tutorials.filter((t) => {
        switch (currentFilters.duration) {
          case "short":
            return t.duration < 15;
          case "medium":
            return t.duration >= 15 && t.duration <= 30;
          case "long":
            return t.duration > 30;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      tutorials = tutorials.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm),
      );
    }

    return tutorials;
  }

  function applyFilters() {
    // Show loading indicator
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) loadingIndicator.style.display = "block";

    // Load filtered tutorials
    setTimeout(() => {
      loadAllTutorials();
    }, 300);
  }

  // ===========================================
  // SCROLL ANIMATIONS - FIXED
  // ===========================================

  function setupScrollAnimations() {
    const cards = document.querySelectorAll(".tutorial-card");
    console.log("Setting up scroll animations for", cards.length, "cards");

    if (cards.length === 0) {
      console.warn("No tutorial cards found for scroll animations");
      return;
    }

    // First, make all cards visible immediately
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("visible");
      }, index * 100);
    });

    // Then set up IntersectionObserver for additional cards
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    // Observe all cards that aren't already visible
    cards.forEach((card) => {
      if (!card.classList.contains("visible")) {
        observer.observe(card);
      }
    });
  }

  // ===========================================
  // COUNT-UP ANIMATION - "RUNNING UP" EFFECT
  // ===========================================

  function animateCountUp(element, targetValue, duration = 2000) {
    if (!element) return;

    // Store the original text content for later
    const originalText = element.textContent;

    // Parse the target value (remove any non-numeric characters except decimal)
    let numericTarget = parseFloat(String(targetValue).replace(/[^0-9.]/g, ""));
    if (isNaN(numericTarget)) numericTarget = 0;

    // Determine if we need to add a suffix (like 'K' for thousands)
    const hasSuffix =
      typeof targetValue === "string" && /[KkMm]$/.test(targetValue);
    let suffix = "";
    if (hasSuffix) {
      suffix = String(targetValue).replace(/[0-9.]/g, "");
    }

    const startValue = 0;
    const startTime = performance.now();

    // If the element already has a number, parse it
    const currentText = element.textContent;
    const currentNum = parseFloat(currentText.replace(/[^0-9.]/g, ""));
    const actualStart =
      !isNaN(currentNum) && currentNum > 0 ? currentNum : startValue;

    // Animate from current value to target
    function updateCount(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Ease out cubic for a smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue =
        actualStart + (numericTarget - actualStart) * easeOutCubic;

      // Format the number
      let displayValue;
      if (numericTarget >= 1000) {
        // For large numbers, show with K suffix if target has it
        if (hasSuffix) {
          const formatted = (currentValue / 1000).toFixed(1);
          displayValue = formatted + suffix;
        } else {
          displayValue = Math.round(currentValue).toLocaleString();
        }
      } else if (Number.isInteger(numericTarget)) {
        displayValue = Math.round(currentValue).toString();
      } else {
        displayValue = currentValue.toFixed(1);
      }

      element.textContent = displayValue;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        // Final value - ensure it matches exactly
        let finalDisplay;
        if (numericTarget >= 1000 && hasSuffix) {
          finalDisplay = (numericTarget / 1000).toFixed(1) + suffix;
        } else if (Number.isInteger(numericTarget)) {
          finalDisplay = numericTarget.toString();
        } else {
          finalDisplay = numericTarget.toFixed(1);
        }
        element.textContent = finalDisplay;
      }
    }

    // Start the animation
    requestAnimationFrame(updateCount);
  }

  function runStatsAnimation() {
    const tutorialCountEl = document.getElementById("tutorial-count");
    const hoursCountEl = document.getElementById("hours-count");
    const levelsCountEl = document.getElementById("levels-count");

    if (!tutorialCountEl || !hoursCountEl || !levelsCountEl) {
      console.warn("Stats elements not found for animation");
      return;
    }

    // Get the target values (current text content)
    const tutorialTarget = tutorialCountEl.textContent || "0";
    const hoursTarget = hoursCountEl.textContent || "0";
    const levelsTarget = levelsCountEl.textContent || "0";

    // Reset to 0 first (briefly)
    tutorialCountEl.textContent = "0";
    hoursCountEl.textContent = "0";
    levelsCountEl.textContent = "0";

    // Animate each stat with staggered timing
    setTimeout(() => {
      animateCountUp(tutorialCountEl, tutorialTarget, 1800);
    }, 300);

    setTimeout(() => {
      animateCountUp(hoursCountEl, hoursTarget, 1800);
    }, 500);

    setTimeout(() => {
      animateCountUp(levelsCountEl, levelsTarget, 1800);
    }, 700);
  }

  // ===========================================
  // EVENT LISTENERS
  // ===========================================

  function setupCategoryCards() {
    const categoryCards = document.querySelectorAll(".category-card");

    categoryCards.forEach((card) => {
      card.addEventListener("click", function () {
        const category = this.dataset.category;

        // Remove active class from all cards
        categoryCards.forEach((c) => c.classList.remove("active"));

        // Add active class to clicked card
        this.classList.add("active");

        // Update category filter
        const categoryFilter = document.getElementById("category-filter");
        if (categoryFilter) {
          categoryFilter.value = category;
        }

        // Update current filters and apply
        currentFilters.category = category;
        applyFilters();

        // Scroll to tutorials section
        document.querySelector(".all-tutorials").scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  function setupFilters() {
    // Category filter
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
      categoryFilter.addEventListener("change", function () {
        currentFilters.category = this.value;

        // Update active category card
        const categoryCards = document.querySelectorAll(".category-card");
        categoryCards.forEach((card) => {
          if (card.dataset.category === this.value) {
            card.classList.add("active");
          } else {
            card.classList.remove("active");
          }
        });

        applyFilters();
      });
    }

    // Difficulty filter
    const difficultyFilter = document.getElementById("difficulty-filter");
    if (difficultyFilter) {
      difficultyFilter.addEventListener("change", function () {
        currentFilters.difficulty = this.value;
        applyFilters();
      });
    }

    // Duration filter
    const durationFilter = document.getElementById("duration-filter");
    if (durationFilter) {
      durationFilter.addEventListener("change", function () {
        currentFilters.duration = this.value;
        applyFilters();
      });
    }
  }

  function setupSearch() {
    const searchInput = document.getElementById("tutorial-search");
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);

      searchTimeout = setTimeout(() => {
        currentFilters.search = this.value;
        applyFilters();
      }, 300);
    });
  }

  function setupCategoryFilterFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");

    if (categoryParam) {
      const categoryFilter = document.getElementById("category-filter");
      if (categoryFilter) {
        categoryFilter.value = categoryParam;
        currentFilters.category = categoryParam;
        applyFilters();
      }

      const categoryCards = document.querySelectorAll(".category-card");
      categoryCards.forEach((card) => {
        if (card.dataset.category === categoryParam) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
    }
  }



  // ===========================================
  // STATS
  // ===========================================

  function updateRealStats() {
    const allTutorials = tutorialData.getAllTutorials();
    const totalTutorials = allTutorials.length;
    const totalHours = Math.floor(
      allTutorials.reduce((sum, t) => sum + t.duration, 0) / 60,
    );
    const uniqueDifficulties = new Set(allTutorials.map((t) => t.difficulty))
      .size;

    const tutorialCountEl = document.getElementById("tutorial-count");
    const hoursCountEl = document.getElementById("hours-count");
    const levelsCountEl = document.getElementById("levels-count");

    // Set the final values (they'll be animated by runStatsAnimation)
    if (tutorialCountEl) tutorialCountEl.textContent = totalTutorials;
    if (hoursCountEl) hoursCountEl.textContent = totalHours;
    if (levelsCountEl) levelsCountEl.textContent = uniqueDifficulties;

    // Run the count-up animation after a short delay
    setTimeout(runStatsAnimation, 400);
  }

  function updateTutorialCount() {
    const tutorialCountElement = document.getElementById("tutorial-count");
    if (tutorialCountElement && tutorialData) {
      const count = tutorialData.getAllTutorials().length;
      tutorialCountElement.textContent = count;
    }
  }

  function showErrorMessage() {
    const tutorialsGrid = document.getElementById("tutorials-grid");
    if (tutorialsGrid) {
      tutorialsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Tutorials</h3>
                    <p>Unable to load tutorial data. Please check that tutorials-data.js is properly included.</p>
                </div>
            `;
    }
  }

  // ===========================================
  // INIT
  // ===========================================

  init();
});
