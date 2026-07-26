// ================================================================
// SEARCH.JS — COMPLETE VERSION WITH DYNAMIC LOADING
// ================================================================

class SearchEngine {
  constructor() {
    this.searchData = [];
    this.isLoading = false;
    this.loadComplete = false;
    this.init();
  }

  async init() {
    console.log("🔍 Initializing search engine...");
    await this.loadAllData();
    this.setupSearchListeners();
    console.log(
      "✅ Search engine initialized with",
      this.searchData.length,
      "items",
    );
  }

  // ============================================================
  // LOAD ALL DATA DYNAMICALLY
  // ============================================================
  async loadAllData() {
    this.isLoading = true;
    this.searchData = [];

    try {
      // Load all in parallel for speed
      const [tutorials, artists, artworks, tools, resources] =
        await Promise.all([
          this.loadTutorials(),
          this.loadArtists(),
          this.loadArtworks(),
          this.loadTools(),
          this.loadResources(),
        ]);

      this.searchData = [
        ...tutorials,
        ...artists,
        ...artworks,
        ...tools,
        ...resources,
      ];

      this.loadComplete = true;
      console.log(`📊 Loaded ${this.searchData.length} searchable items`);
    } catch (error) {
      console.error("Error loading search data:", error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============================================================
  // LOAD TUTORIALS FROM FIRESTORE
  // ============================================================
  async loadTutorials() {
    try {
      const snapshot = await firebase
        .firestore()
        .collection("tutorials")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) {
        console.warn("⚠️ No tutorials found in Firestore, using fallback data");
        return this.getFallbackTutorials();
      }

      const tutorials = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tutorials.push({
          id: doc.id,
          title: data.title || "Untitled Tutorial",
          type: "tutorial",
          category: data.category || "tutorial",
          description:
            data.description || data.excerpt || "Learn digital art techniques",
          tags: data.tags || [],
          url: data.url || `pages/tutorials/tutorial-detail.html?id=${doc.id}`,
          difficulty: data.difficulty || "intermediate",
          createdAt: data.createdAt,
          imageUrl: data.imageUrl || null,
        });
      });

      console.log(`📚 Loaded ${tutorials.length} tutorials from Firestore`);
      return tutorials;
    } catch (error) {
      console.warn("Error loading tutorials, using fallback:", error);
      return this.getFallbackTutorials();
    }
  }

  // ============================================================
  // FALLBACK TUTORIALS (for when Firestore is empty)
  // ============================================================
  getFallbackTutorials() {
    return [
      {
        id: "eye-basics",
        title: "Eye Rendering Basics",
        type: "tutorial",
        category: "eyes",
        description:
          "Learn fundamental eye rendering techniques for digital art",
        tags: ["eyes", "rendering", "basics", "digital painting"],
        url: "pages/tutorials/eye-render-tutorial.html",
        difficulty: "beginner",
      },
      {
        id: "eye-advanced",
        title: "Advanced Eye Rendering",
        type: "tutorial",
        category: "eyes",
        description: "Master advanced eye rendering with realistic reflections",
        tags: ["eyes", "advanced", "realistic", "reflections"],
        url: "pages/tutorials/advanced-eye-rendering.html",
        difficulty: "advanced",
      },
      {
        id: "nose-basics",
        title: "Nose Anatomy & Rendering",
        type: "tutorial",
        category: "nose",
        description: "Complete guide to nose anatomy and rendering techniques",
        tags: ["nose", "anatomy", "rendering", "face"],
        url: "pages/tutorials/nose-rendering-tutorial.html",
        difficulty: "beginner",
      },
      {
        id: "lips-basics",
        title: "Lip Rendering Techniques",
        type: "tutorial",
        category: "lips",
        description:
          "Learn to render realistic lips with proper texture and lighting",
        tags: ["lips", "rendering", "texture", "lighting"],
        url: "pages/tutorials/lip-rendering-tutorial.html",
        difficulty: "intermediate",
      },
      {
        id: "skin-rendering",
        title: "Skin Texture & Rendering",
        type: "tutorial",
        category: "skin",
        description:
          "Master skin rendering with pores, subsurface scattering and textures",
        tags: ["skin", "texture", "rendering", "pores"],
        url: "pages/tutorials/skin-rendering-tutorial.html",
        difficulty: "advanced",
      },
      {
        id: "facial-anatomy",
        title: "Facial Anatomy Basics",
        type: "tutorial",
        category: "facial-features",
        description: "Learn the fundamental structure of the human face",
        tags: ["anatomy", "face", "proportions", "facial features"],
        url: "pages/tutorials/facial-anatomy-basics.html",
        difficulty: "beginner",
      },
      {
        id: "character-design",
        title: "Character Design Fundamentals",
        type: "tutorial",
        category: "character",
        description: "Learn to create compelling characters that tell a story",
        tags: ["character", "design", "sketching", "concept art"],
        url: "pages/tutorials/character-design.html",
        difficulty: "intermediate",
      },
      {
        id: "digital-painting",
        title: "Digital Painting Fundamentals",
        type: "tutorial",
        category: "digital-painting",
        description:
          "Essential techniques for creating stunning digital artwork",
        tags: ["digital painting", "brushes", "layers", "blending"],
        url: "pages/tutorials/digital-painting.html",
        difficulty: "intermediate",
      },
      {
        id: "color-theory",
        title: "Color Theory for Digital Artists",
        type: "tutorial",
        category: "color",
        description:
          "Understand color theory to create stunning digital artwork",
        tags: ["color", "theory", "harmony", "palette"],
        url: "pages/tutorials/color-theory.html",
        difficulty: "beginner",
      },
      {
        id: "composition-basics",
        title: "Composition Fundamentals",
        type: "tutorial",
        category: "composition",
        description:
          "Learn the principles of composition to improve your artwork",
        tags: ["composition", "design", "rule of thirds", "golden ratio"],
        url: "pages/tutorials/composition-basics.html",
        difficulty: "beginner",
      },
    ];
  }

  // ============================================================
  // LOAD ARTISTS FROM FIRESTORE
  // ============================================================
  async loadArtists() {
    try {
      const snapshot = await firebase.firestore().collection("users").get();

      const artists = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only add if user has a display name
        if (data.displayName || data.fullname || data.username) {
          artists.push({
            id: doc.id,
            title:
              data.displayName || data.fullname || data.username || "Artist",
            type: "artist",
            category: "artist",
            description: data.bio || "Check out this artist's portfolio",
            tags: ["artist", "profile", data.username, data.displayName],
            url: `pages/community/profiles.html?user=${doc.id}`,
            avatar: data.photoURL || data.avatarUrl || null,
            username: data.username || data.displayName,
          });
        }
      });

      console.log(`👤 Loaded ${artists.length} artists from Firestore`);
      return artists;
    } catch (error) {
      console.warn("Error loading artists:", error);
      return [];
    }
  }

  // ============================================================
  // LOAD ARTWORKS FROM FIRESTORE (ALL)
  // ============================================================
  async loadArtworks() {
    try {
      // Load ALL published artworks with pagination
      let allArtworks = [];
      let lastDoc = null;
      let hasMore = true;
      const batchSize = 100;

      while (hasMore) {
        let query = firebase
          .firestore()
          .collection("artworks")
          .where("status", "==", "published")
          .orderBy("createdAt", "desc")
          .limit(batchSize);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        snapshot.forEach((doc) => {
          const data = doc.data();
          allArtworks.push({
            id: doc.id,
            title: data.title || "Untitled",
            type: "artwork",
            category: "artwork",
            description:
              data.description || data.caption || "View this artwork",
            tags: data.tags || [],
            url: `pages/community/artwork-detail.html?id=${doc.id}`,
            imageUrl: data.imageUrl || null,
            artistId: data.artistId || null,
            artistName: data.artistName || null,
          });
        });

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (snapshot.docs.length < batchSize) {
          hasMore = false;
        }
      }

      console.log(`🖼️ Loaded ${allArtworks.length} artworks from Firestore`);
      return allArtworks;
    } catch (error) {
      console.warn("Error loading artworks:", error);
      return [];
    }
  }

  // ============================================================
  // LOAD TOOLS FROM FIRESTORE
  // ============================================================
  async loadTools() {
    try {
      const snapshot = await firebase
        .firestore()
        .collection("tools")
        .where("status", "==", "published")
        .get();

      const tools = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tools.push({
          id: doc.id,
          title: data.title || "Untitled Tool",
          type: "tool",
          category: data.category || "tool",
          description: data.description || "Tool for digital artists",
          tags: data.tags || [],
          url: data.url || `pages/tools/tool-detail.html?id=${doc.id}`,
          icon: data.icon || null,
        });
      });

      console.log(`🛠️ Loaded ${tools.length} tools from Firestore`);
      return tools;
    } catch (error) {
      console.warn("Error loading tools:", error);
      return this.getFallbackTools();
    }
  }

  // ============================================================
  // FALLBACK TOOLS
  // ============================================================
  getFallbackTools() {
    return [
      {
        id: "color-palette",
        title: "Color Palette Generator",
        type: "tool",
        category: "color-tools",
        description: "Generate beautiful color palettes for your artwork",
        tags: ["color", "palette", "generator", "tools"],
        url: "pages/tools/color-palette-generator.html",
      },
      {
        id: "color-analyzer",
        title: "Color Scheme Analyzer",
        type: "tool",
        category: "color-tools",
        description:
          "Analyze and improve your color schemes for better harmony",
        tags: ["color", "analyzer", "scheme", "harmony"],
        url: "pages/tools/color-scheme-analyzer.html",
      },
      {
        id: "prompt-generator",
        title: "Character Prompt Generator",
        type: "tool",
        category: "prompt-tools",
        description: "Get inspired with random character creation prompts",
        tags: ["character", "prompt", "generator", "inspiration"],
        url: "pages/tools/prompt-generator.html",
      },
      {
        id: "software-quiz",
        title: "Software Quiz",
        type: "tool",
        category: "quiz",
        description: "Find your perfect digital art software",
        tags: ["quiz", "software", "recommendation"],
        url: "pages/tools/software-quiz.html",
      },
    ];
  }

  // ============================================================
  // LOAD RESOURCES FROM FIRESTORE
  // ============================================================
  async loadResources() {
    try {
      const snapshot = await firebase
        .firestore()
        .collection("resources")
        .where("status", "==", "published")
        .get();

      const resources = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        resources.push({
          id: doc.id,
          title: data.title || "Untitled Resource",
          type: "resource",
          category: data.category || "resource",
          description: data.description || "Resource for digital artists",
          tags: data.tags || [],
          url: data.url || `pages/resources/resource-detail.html?id=${doc.id}`,
        });
      });

      console.log(`📄 Loaded ${resources.length} resources from Firestore`);
      return resources;
    } catch (error) {
      console.warn("Error loading resources:", error);
      return [
        {
          id: "software-comparison",
          title: "Digital Art Software Comparison",
          type: "resource",
          category: "software-guides",
          description:
            "Compare Photoshop, Procreate, Clip Studio Paint and more",
          tags: ["software", "comparison", "photoshop", "procreate"],
          url: "pages/software/software-comparison.html",
        },
        {
          id: "equip",
          title: "Equip for Artists",
          type: "resource",
          category: "equip",
          description:
            "Portfolio templates, CV templates, and career resources",
          tags: ["portfolio", "cv", "career", "templates", "resources"],
          url: "pages/Equip/Equip.html",
        },
      ];
    }
  }

  // ============================================================
  // SEARCH SETUP (unchanged from your version)
  // ============================================================
  setupSearchListeners() {
    const searchBtn = document.getElementById("search-btn");
    const searchOverlay = document.getElementById("search-overlay");
    const searchClose = document.getElementById("search-close");
    const searchInput = document.getElementById("search-input");

    // Open search
    if (searchBtn && searchOverlay) {
      searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        searchOverlay.classList.add("active");
        setTimeout(() => searchInput?.focus(), 100);
        this.showPlaceholder();
      });
    }

    // Close search
    if (searchClose && searchOverlay) {
      searchClose.addEventListener("click", () => {
        searchOverlay.classList.remove("active");
        this.showPlaceholder();
      });
    }

    // Click outside to close
    if (searchOverlay) {
      searchOverlay.addEventListener("click", (e) => {
        if (e.target === searchOverlay) {
          searchOverlay.classList.remove("active");
          this.showPlaceholder();
        }
      });
    }

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchOverlay?.classList.contains("active")) {
        searchOverlay.classList.remove("active");
        this.showPlaceholder();
      }
    });

    // Search input
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (!this.loadComplete) {
            this.showLoading();
            return;
          }
          this.performSearch(e.target.value);
        }, 250);
      });

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.performSearch(e.target.value);
        }
      });
    }
  }

  // ============================================================
  // PERFORM SEARCH (improved)
  // ============================================================
  performSearch(query) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      this.showPlaceholder();
      return;
    }

    if (!this.loadComplete) {
      this.showLoading();
      return;
    }

    const results = this.searchData.filter((item) => {
      const searchableText = `
                ${item.title} ${item.description} ${item.tags?.join(" ") || ""}
                ${item.type} ${item.category || ""} ${item.difficulty || ""}
                ${item.username || ""} ${item.artistName || ""}
            `.toLowerCase();

      const terms = trimmedQuery.toLowerCase().split(" ");
      return terms.some((term) => searchableText.includes(term));
    });

    // Sort results by relevance
    const sortedResults = results.sort((a, b) => {
      const scoreA = this.calculateScore(a, trimmedQuery);
      const scoreB = this.calculateScore(b, trimmedQuery);
      return scoreB - scoreA;
    });

    this.displayResults(sortedResults, trimmedQuery);
  }

  // ============================================================
  // CALCULATE SCORE (improved)
  // ============================================================
  calculateScore(item, query) {
    let score = 0;
    const terms = query.toLowerCase().split(" ");
    const title = item.title.toLowerCase();
    const description = item.description?.toLowerCase() || "";
    const tags = item.tags?.join(" ").toLowerCase() || "";

    terms.forEach((term) => {
      // Exact title match - highest priority
      if (title === term) score += 30;
      else if (title.startsWith(term)) score += 20;
      else if (title.includes(term)) score += 10;

      // Tag matches - high priority
      if (tags.includes(term)) score += 8;

      // Description matches
      if (description.includes(term)) score += 4;

      // Type/category matches
      if (item.type?.toLowerCase().includes(term)) score += 3;
      if (item.category?.toLowerCase().includes(term)) score += 3;

      // Difficulty matches
      if (item.difficulty?.toLowerCase().includes(term)) score += 5;

      // Username/artist matches
      if (item.username?.toLowerCase().includes(term)) score += 5;
      if (item.artistName?.toLowerCase().includes(term)) score += 5;
    });

    // Boost tutorials with matching difficulty
    if (item.type === "tutorial" && item.difficulty) {
      const diff = item.difficulty.toLowerCase();
      if (terms.some((t) => diff.includes(t))) {
        score += 10;
      }
    }

    return score;
  }

  // ============================================================
  // DISPLAY RESULTS (improved with better grouping)
  // ============================================================
  displayResults(results, query) {
    const searchResults = document.getElementById("search-results");
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML = this.getNoResultsHTML(query);
      return;
    }

    const grouped = this.groupResults(results);

    let html = `
            <div class="search-results-header">
                <h3>Results for "${this.escapeHtml(query)}"</h3>
                <span class="results-count">${results.length} found</span>
            </div>
        `;

    Object.values(grouped).forEach((group) => {
      html += this.getGroupHTML(group);
    });

    searchResults.innerHTML = html;

    // Add click handlers
    searchResults.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const url = item.dataset.url;
        if (url) {
          const overlay = document.getElementById("search-overlay");
          if (overlay) overlay.classList.remove("active");
          window.location.href = url;
        }
      });
    });
  }

  // ============================================================
  // GROUP RESULTS (updated order)
  // ============================================================
  groupResults(results) {
    const groups = {
      artist: { title: "👤 Artists", items: [], order: 0 },
      artwork: { title: "🖼️ Artworks", items: [], order: 1 },
      tutorial: { title: "📚 Tutorials", items: [], order: 2 },
      tool: { title: "🛠️ Tools", items: [], order: 3 },
      resource: { title: "📄 Resources", items: [], order: 4 },
    };

    results.forEach((item) => {
      if (groups[item.type]) {
        groups[item.type].items.push(item);
      }
    });

    return Object.fromEntries(
      Object.entries(groups)
        .filter(([_, g]) => g.items.length > 0)
        .sort((a, b) => a[1].order - b[1].order),
    );
  }

  // ============================================================
  // GET GROUP HTML
  // ============================================================
  getGroupHTML(group) {
    return `
            <div class="results-group">
                <div class="group-title">${group.title}</div>
                ${group.items.map((item) => this.getResultItemHTML(item)).join("")}
            </div>
        `;
  }

  // ============================================================
  // GET RESULT ITEM HTML (improved)
  // ============================================================
  getResultItemHTML(item) {
    let badgeContent = "";
    let subtitle = "";

    switch (item.type) {
      case "artist":
        badgeContent = "👤";
        subtitle = `@${item.username || "artist"}`;
        break;
      case "artwork":
        badgeContent = "🖼️";
        subtitle = item.artistName ? `By ${item.artistName}` : "Artwork";
        break;
      case "tutorial":
        badgeContent = "📚";
        subtitle = item.difficulty ? `${item.difficulty} tutorial` : "Tutorial";
        break;
      case "tool":
        badgeContent = "🛠️";
        subtitle = "Tool";
        break;
      case "resource":
        badgeContent = "📄";
        subtitle = "Resource";
        break;
      default:
        badgeContent = "📄";
        subtitle = "Resource";
    }

    const difficultyBadge = item.difficulty
      ? `<span class="difficulty-badge ${item.difficulty}">${item.difficulty}</span>`
      : "";

    const tags =
      item.tags && item.tags.length > 0
        ? `<div class="result-tags">${item.tags
            .slice(0, 3)
            .map(
              (tag) =>
                `<span class="result-tag">${this.escapeHtml(tag)}</span>`,
            )
            .join("")}</div>`
        : "";

    return `
            <div class="search-result-item" data-type="${item.type}" data-url="${item.url}">
                <div class="result-type-badge">${badgeContent}</div>
                <div class="result-content">
                    <div class="result-title">${this.escapeHtml(item.title)}</div>
                    ${subtitle ? `<div class="result-subtitle">${this.escapeHtml(subtitle)}</div>` : ""}
                    <div class="result-meta">
                        ${difficultyBadge}
                        ${
                          item.category &&
                          item.type !== "artist" &&
                          item.type !== "artwork"
                            ? `<span class="result-category">${this.formatCategory(item.category)}</span>`
                            : ""
                        }
                    </div>
                    ${tags}
                </div>
                <div class="result-arrow"><i class="fas fa-chevron-right"></i></div>
            </div>
        `;
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  showLoading() {
    const searchResults = document.getElementById("search-results");
    if (searchResults) {
      searchResults.innerHTML = `
                <div class="search-loading">
                    <div class="spinner"></div>
                    <p>Loading search data...</p>
                </div>
            `;
    }
  }

  // ============================================================
  // PLACEHOLDER
  // ============================================================
  showPlaceholder() {
    const searchResults = document.getElementById("search-results");
    if (searchResults) {
      if (!this.loadComplete) {
        this.showLoading();
        return;
      }
      searchResults.innerHTML = `
                <div class="search-placeholder">
                    <p>🔍 Type to search tutorials, tools, artists, and artworks</p>
                    <div class="search-hints">
                        <span class="hint-tag">📚 tutorial</span>
                        <span class="hint-tag">🛠️ tool</span>
                        <span class="hint-tag">👤 artist</span>
                        <span class="hint-tag">🖼️ artwork</span>
                    </div>
                </div>
            `;
    }
  }

  // ============================================================
  // NO RESULTS
  // ============================================================
  getNoResultsHTML(query) {
    return `
            <div class="search-no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No results for "${this.escapeHtml(query)}"</h3>
                <p>Try adjusting your search terms or browse our categories:</p>
                <div class="search-suggestions">
                    <a href="pages/tutorials/tutorials.html" class="suggestion-link" onclick="closeSearch()">📚 Tutorials</a>
                    <a href="pages/tools/tools.html" class="suggestion-link" onclick="closeSearch()">🛠️ Tools</a>
                    <a href="pages/community/gallery.html" class="suggestion-link" onclick="closeSearch()">🖼️ Gallery</a>
                    <a href="pages/community/search-users.html" class="suggestion-link" onclick="closeSearch()">👤 Find Artists</a>
                </div>
            </div>
        `;
  }

  // ============================================================
  // UTILITY
  // ============================================================
  formatCategory(category) {
    if (!category) return "General";
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================================
// GLOBAL CLOSE FUNCTION
// ============================================================
function closeSearch() {
  const searchOverlay = document.getElementById("search-overlay");
  if (searchOverlay) {
    searchOverlay.classList.remove("active");
  }
}

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // Wait for Firebase
  const checkFirebase = () => {
    if (typeof firebase !== "undefined" && firebase.firestore) {
      // Small delay to ensure everything is ready
      setTimeout(() => {
        window.searchEngine = new SearchEngine();
      }, 300);
    } else {
      console.warn("⏳ Firebase not ready, retrying search...");
      setTimeout(checkFirebase, 500);
    }
  };

  checkFirebase();
});
