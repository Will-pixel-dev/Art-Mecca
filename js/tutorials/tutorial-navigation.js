// Tutorial navigation system
class TutorialNavigation {
  constructor() {
    this.currentTutorialId = this.getCurrentTutorialId();
    console.log("Initialized with tutorial ID:", this.currentTutorialId);
    this.init();
  }

  init() {
    if (this.currentTutorialId) {
      this.setupNavigation();
      this.updateTutorialContent();
    } else {
      console.warn("No tutorial ID found for current page");
    }
  }

  getCurrentTutorialId() {
    // Extract tutorial ID from current page URL
    const path = window.location.pathname;
    const filename = path.split("/").pop().replace(".html", "");

    console.log("Current filename:", filename);
    console.log("Full path:", path);

    // Map filenames to tutorial IDs - using the exact filenames from your HTML
    const filenameToId = {
      // Facial Features
      "facial-anatomy-basics": "facial-anatomy-basics",
      "nose-rendering-tutorial": "nose-rendering-tutorial",
      "eye-render-tutorial": "eye-render-tutorial",
      "lip-rendering-tutorial": "lip-rendering-tutorial",
      "skin-rendering-tutorial": "skin-rendering-tutorial",
      "facial-expressions": "facial-expressions",

      // Character Design
      "character-design": "character-design",
      "creature-design": "creature-design",
      "costume-design": "costume-design",

      // Digital Painting
      "digital-painting": "digital-painting",
      "color-theory": "color-theory",
      "brush-techniques": "brush-techniques",
      "landscape-painting": "landscape-painting",

      // Color & Lighting
      "lighting-masterclass": "lighting-masterclass",
      "atmospheric-perspective": "atmospheric-perspective",

      // Software Guides
      "software-comparison": "software-comparison",
      "photoshop-basics": "photoshop-basics",
      "procreate-guide": "procreate-guide",

      // Workflow & Process
      "workflow-optimization": "workflow-optimization",
      "time-management": "time-management",
      "reference-usage": "reference-usage",
      "portfolio-preparation": "portfolio-preparation",
    };

    const tutorialId = filenameToId[filename] || null;
    console.log("Mapped tutorial ID:", tutorialId);
    return tutorialId;
  }

  setupNavigation() {
    this.setupPrevNextButtons();
    this.setupRelatedTutorials();
    this.setupBreadcrumbs();
  }

  setupPrevNextButtons() {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    console.log("Setting up navigation for:", this.currentTutorialId);
    console.log("Tutorial data available:", window.tutorialData);

    if (!window.tutorialData) {
      console.error("tutorialData not loaded!");
      return;
    }

    const currentTutorial = window.tutorialData.getTutorial(
      this.currentTutorialId,
    );
    console.log("Current tutorial:", currentTutorial);

    // Setup Previous Button
    if (prevBtn) {
      const prevTutorial = window.tutorialData.getPrevTutorial(
        this.currentTutorialId,
      );
      console.log("Previous tutorial:", prevTutorial);

      if (prevTutorial) {
        prevBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${prevTutorial.title}`;
        prevBtn.onclick = (e) => {
          e.preventDefault();
          this.navigateToTutorial(prevTutorial.id);
        };
        prevBtn.style.display = "flex";
        prevBtn.disabled = false;
      } else {
        prevBtn.style.display = "none";
      }
    }

    // Setup Next Button
    if (nextBtn) {
      const nextTutorial = window.tutorialData.getNextTutorial(
        this.currentTutorialId,
      );
      console.log("Next tutorial:", nextTutorial);

      if (nextTutorial) {
        nextBtn.innerHTML = `${nextTutorial.title} <i class="fas fa-arrow-right"></i>`;
        nextBtn.onclick = (e) => {
          e.preventDefault();
          this.navigateToTutorial(nextTutorial.id);
        };
        nextBtn.style.display = "flex";
        nextBtn.disabled = false;
      } else {
        nextBtn.style.display = "none";
      }
    }
  }

  setupRelatedTutorials() {
    const relatedContainer = document.getElementById("related-tutorials-grid");
    if (!relatedContainer) {
      console.log("Related tutorials container not found");
      return;
    }

    if (!window.tutorialData) {
      console.error("tutorialData not loaded!");
      return;
    }

    const relatedTutorials = window.tutorialData.getRelatedTutorials(
      this.currentTutorialId,
      3,
    );
    console.log("Related tutorials:", relatedTutorials);

    if (relatedTutorials && relatedTutorials.length > 0) {
      relatedContainer.innerHTML = relatedTutorials
        .map((tutorial) => {
          return `
                <div class="tutorial-card">
                    <img src="${tutorial.image || "../../images/placeholder.jpg"}"
                         alt="${tutorial.title}"
                         onerror="this.src='../../images/placeholder.jpg'">
                    <div class="card-content">
                        <h3>${tutorial.title}</h3>
                        <p>${tutorial.description || "Learn this technique in our comprehensive tutorial."}</p>
                        <div class="tutorial-meta">
                            <span class="difficulty-badge ${tutorial.difficulty || "beginner"}">${tutorial.difficulty || "Beginner"}</span>
                            <span class="duration">
                                <i class="fas fa-clock"></i> ${tutorial.duration || 20} min
                            </span>
                        </div>
                        <a href="${tutorial.file}" class="card-link" onclick="tutorialNavigation.navigateToTutorial('${tutorial.id}', event)">
                            Read Tutorial <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        })
        .join("");
    } else {
      relatedContainer.innerHTML =
        '<p class="no-tutorials">No related tutorials found. Check back soon for more content!</p>';
    }
  }

  setupBreadcrumbs() {
    const breadcrumb = document.querySelector(".breadcrumb");
    if (!breadcrumb) return;

    if (!window.tutorialData) {
      console.error("tutorialData not loaded!");
      return;
    }

    const currentTutorial = window.tutorialData.getTutorial(
      this.currentTutorialId,
    );
    if (!currentTutorial) return;

    const category = window.tutorialData.categories.get(
      currentTutorial.category,
    );

    breadcrumb.innerHTML = `
            <a href="../../tutorials.html">Tutorials</a> &gt;
            <a href="../../tutorials.html#${currentTutorial.category}">${category ? category.name : "Uncategorized"}</a> &gt;
            <span>${currentTutorial.title}</span>
        `;
  }

  updateTutorialContent() {
    if (!window.tutorialData) {
      console.error("tutorialData not loaded!");
      return;
    }

    const currentTutorial = window.tutorialData.getTutorial(
      this.currentTutorialId,
    );
    if (!currentTutorial) {
      console.warn("Tutorial not found:", this.currentTutorialId);
      return;
    }

    // Update page title
    document.title = `${currentTutorial.title} | Art Mecca`;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content =
      currentTutorial.description ||
      "Learn digital art techniques with our comprehensive tutorials";

    // Update Open Graph tags
    this.updateOpenGraphTags(currentTutorial);
  }

  updateOpenGraphTags(tutorial) {
    const properties = {
      "og:title": tutorial.title,
      "og:description": tutorial.description || "Learn digital art techniques",
      "og:image": tutorial.image || "../../images/default-og-image.jpg",
      "og:url": window.location.href,
      "og:type": "article",
    };

    Object.entries(properties).forEach(([property, content]) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("property", property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", content);
    });
  }

  navigateToTutorial(tutorialId, event = null) {
    if (event) {
      event.preventDefault();
    }

    if (!window.tutorialData) {
      console.error("tutorialData not loaded!");
      return;
    }

    const tutorial = window.tutorialData.getTutorial(tutorialId);
    if (tutorial && tutorial.file) {
      console.log("Navigating to:", tutorial.file);

      // Add smooth transition effect
      document.body.style.opacity = "0.7";
      document.body.style.transition = "opacity 0.3s ease";

      setTimeout(() => {
        window.location.href = tutorial.file;
      }, 300);
    } else {
      console.error("Tutorial or file not found:", tutorialId);
      alert("Tutorial not found: " + tutorialId);
    }
  }

  // Get progress through a tutorial series
  getSeriesProgress(tutorialId) {
    if (!window.tutorialData) return null;

    const category = this.getTutorialCategory(tutorialId);
    if (!category) return null;

    const tutorialsInCategory =
      window.tutorialData.getTutorialsByCategory(category);
    const currentIndex = tutorialsInCategory.findIndex(
      (t) => t.id === tutorialId,
    );

    if (currentIndex === -1) return null;

    return {
      current: currentIndex + 1,
      total: tutorialsInCategory.length,
      percentage: Math.round(
        ((currentIndex + 1) / tutorialsInCategory.length) * 100,
      ),
    };
  }

  getTutorialCategory(tutorialId) {
    if (!window.tutorialData) return null;

    const tutorial = window.tutorialData.getTutorial(tutorialId);
    return tutorial ? tutorial.category : null;
  }
}

// Make sure tutorialData is loaded before initializing
function initializeNavigation() {
  if (window.tutorialData) {
    console.log("tutorialData found, initializing navigation");
    window.tutorialNavigation = new TutorialNavigation();
  } else {
    console.log("Waiting for tutorialData to load...");
    setTimeout(initializeNavigation, 100);
  }
}

// Start initialization when DOM is ready
document.addEventListener("DOMContentLoaded", initializeNavigation);

// Also try to initialize immediately if tutorialData is already available
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initializeNavigation, 0);
}
