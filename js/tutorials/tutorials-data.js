// Central tutorial database with ALL tutorials

class TutorialData {
  constructor() {
    this.tutorials = new Map();
    this.categories = new Map();
    this.init();
  }

  init() {
    this.loadTutorials();
    this.buildCategories();
    console.log(
      "✅ TutorialData loaded with",
      this.tutorials.size,
      "tutorials",
    );
  }

  loadTutorials() {
    // ============================================
    // CHARACTER DESIGN TUTORIALS
    // ============================================
    this.tutorials.set("character-design", {
      id: "character-design",
      title: "Dynamic Character Design",
      description:
        "Explore different methods for creating compelling characters that tell a story through their design.",
      category: "character-design",
      difficulty: "intermediate",
      duration: 45,
      image: "../../images/tutorials/character-design-hero.jpg",
      file: "../..pages/tutorials/character-design/character-design.html",
      nextTutorial: "creature-design",
      prevTutorial: null,
      relatedTutorials: ["creature-design"],
      author: "Maria Rodriguez",
      date: "2023-10-15",
      tags: [
        "character",
        "design",
        "silhouette",
        "shape language",
        "personality",
      ],
    });

    this.tutorials.set("creature-design", {
      id: "creature-design",
      title: "Creature Design Fundamentals",
      description:
        "Learn to design believable creatures from mythology and imagination - anatomy, ecology, and visual storytelling.",
      category: "character-design",
      difficulty: "intermediate",
      duration: 40,
      image: "../../images/tutorials/creature-design-hero.jpg",
      file: "../..pages/tutorials/character-design/creature-design.html",
      nextTutorial: null,
      prevTutorial: "character-design",
      relatedTutorials: ["character-design"],
      author: "Dr. Kenji Tanaka",
      date: "2023-11-20",
      tags: ["creature", "design", "mythology", "anatomy", "concept art"],
    });

    // ============================================
    // COLOR & LIGHTING TUTORIALS
    // ============================================
    this.tutorials.set("color-theory-fundamentals", {
      id: "color-theory-fundamentals",
      title: "Color Theory Fundamentals",
      description:
        "Learn the basics of color theory - color wheel, harmonies, temperature, and practical application in digital art.",
      category: "color-theory",
      difficulty: "beginner",
      duration: 30,
      image: "../../images/tutorials/color-theory-hero.jpg",
      file: "../..pages/tutorials/color&lighting/color-theory.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: [],
      author: "Dr. Kenji Tanaka",
      date: "2023-08-15",
      tags: [
        "color theory",
        "color wheel",
        "harmonies",
        "temperature",
        "psychology",
      ],
    });

    this.tutorials.set("lighting-masterclass", {
      id: "lighting-masterclass",
      title: "Lighting Masterclass",
      description:
        "Master the properties of light, shadow types, and how to render dramatic lighting conditions in your artwork.",
      category: "color-theory",
      difficulty: "advanced",
      duration: 45,
      image: "../../images/tutorials/lighting-hero.jpg",
      file: "../..pages/tutorials/color&lighting/lighting-masterclass.html",
      nextTutorial: null,
      prevTutorial: "color-theory-fundamentals",
      relatedTutorials: ["color-theory-fundamentals"],
      author: "Alex Chen",
      date: "2023-09-10",
      tags: ["lighting", "shadows", "rendering", "dramatic", "atmosphere"],
    });

    this.tutorials.set("atmospheric-perspective", {
      id: "atmospheric-perspective",
      title: "Atmospheric Perspective",
      description:
        "Learn how to create depth and atmosphere in your artwork using color, value, and atmospheric effects.",
      category: "color-theory",
      difficulty: "intermediate",
      duration: 35,
      image: "../../images/tutorials/atmospheric-hero.jpg",
      file: "../..pages/tutorials/color&lighting/atmospheric-perspective.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: ["lighting-masterclass"],
      author: "Sarah Johnson",
      date: "2024-01-15",
      tags: ["atmosphere", "depth", "landscape", "color", "value"],
    });

    // ============================================
    // DIGITAL PAINTING TUTORIALS
    // ============================================
    this.tutorials.set("digital-painting-basics", {
      id: "digital-painting-basics",
      title: "Digital Painting Basics",
      description:
        "Learn the fundamentals of digital painting including brush settings, layer management, and basic rendering techniques.",
      category: "digital-painting",
      difficulty: "beginner",
      duration: 25,
      image: "../../images/tutorials/digital-painting-hero.jpg",
      file: "../..pages/tutorials/digital-painting/digital-painting.html",
      nextTutorial: "brush-techniques",
      prevTutorial: null,
      relatedTutorials: ["brush-techniques"],
      author: "Alex Chen",
      date: "2023-05-10",
      tags: ["digital painting", "basics", "brushes", "layers", "rendering"],
    });

    this.tutorials.set("brush-techniques", {
      id: "brush-techniques",
      title: "Brush Techniques Masterclass",
      description:
        "Master different brush types, create custom brushes, and learn when to use each technique for optimal results.",
      category: "digital-painting",
      difficulty: "intermediate",
      duration: 30,
      image: "../../images/tutorials/brush-techniques-hero.jpg",
      file: "../..pages/tutorials/digital-painting/brush-techniques.html",
      nextTutorial: "landscape-masterclass",
      prevTutorial: "digital-painting-basics",
      relatedTutorials: ["digital-painting-basics"],
      author: "Maria Rodriguez",
      date: "2024-01-15",
      tags: [
        "brushes",
        "techniques",
        "custom brushes",
        "digital painting",
        "texture",
      ],
    });

    this.tutorials.set("landscape-masterclass", {
      id: "landscape-masterclass",
      title: "Landscape Painting Masterclass",
      description:
        "Learn to paint stunning landscapes - from composition and color to texture and atmospheric effects.",
      category: "digital-painting",
      difficulty: "intermediate",
      duration: 40,
      image: "../../images/tutorials/landscape-hero.jpg",
      file: "../..pages/tutorials/digital-painting/landscape-masterclass.html",
      nextTutorial: null,
      prevTutorial: "brush-techniques",
      relatedTutorials: ["brush-techniques", "color-theory-fundamentals"],
      author: "Sarah Johnson",
      date: "2024-02-20",
      tags: ["landscape", "composition", "color", "texture", "atmosphere"],
    });

    // ============================================
    // FACIAL FEATURES TUTORIALS
    // ============================================
    this.tutorials.set("facial-anatomy-basics", {
      id: "facial-anatomy-basics",
      title: "Facial Anatomy Basics",
      description:
        "Understand the fundamental structure of the human face - proportions, planes, and key landmarks for realistic portraits.",
      category: "facial-features",
      difficulty: "beginner",
      duration: 35,
      image: "../../images/tutorials/facial-anatomy-hero.jpg",
      file: "../..pages/tutorials/facial-features/facial-anatomy-basics.html",
      nextTutorial: "nose-rendering-tutorial",
      prevTutorial: null,
      relatedTutorials: ["nose-rendering-tutorial", "eye-render-tutorial"],
      author: "Dr. Kenji Tanaka",
      date: "2023-02-15",
      tags: ["facial", "anatomy", "basics", "structure", "proportions"],
    });

    this.tutorials.set("nose-rendering-tutorial", {
      id: "nose-rendering-tutorial",
      title: "Nose Anatomy & Rendering",
      description:
        "Complete guide to nose anatomy and rendering techniques - from structure to realistic shading.",
      category: "facial-features",
      difficulty: "beginner",
      duration: 20,
      image: "../../images/tutorials/nose-hero.jpg",
      file: "../..pages/tutorials/facial-features/nose-rendering-tutorial.html",
      nextTutorial: "eye-render-tutorial",
      prevTutorial: "facial-anatomy-basics",
      relatedTutorials: ["eye-render-tutorial", "facial-anatomy-basics"],
      author: "Maria Rodriguez",
      date: "2023-03-22",
      tags: ["nose", "anatomy", "rendering", "face", "shading"],
    });

    this.tutorials.set("eye-render-tutorial", {
      id: "eye-render-tutorial",
      title: "How I Render Eyes: A Step-by-Step Guide",
      description:
        "Learn my process for creating realistic, expressive eyes in digital painting - from iris details to catchlights.",
      category: "facial-features",
      difficulty: "intermediate",
      duration: 25,
      image: "../../images/tutorials/eyes-hero.jpg",
      file: "../..pages/tutorials/facial-features/eye-render-tutorial.html",
      nextTutorial: "lip-rendering-tutorial",
      prevTutorial: "nose-rendering-tutorial",
      relatedTutorials: ["nose-rendering-tutorial", "lip-rendering-tutorial"],
      author: "Alex Chen",
      date: "2023-04-10",
      tags: ["eyes", "rendering", "digital painting", "catchlights", "anatomy"],
    });

    this.tutorials.set("lip-rendering-tutorial", {
      id: "lip-rendering-tutorial",
      title: "Lip Rendering Techniques",
      description:
        "Learn to render realistic lips with proper texture, highlights, shadows, and lighting.",
      category: "facial-features",
      difficulty: "intermediate",
      duration: 18,
      image: "../../images/tutorials/lips-hero.jpg",
      file: "../..pages/tutorials/facial-features/lip-rendering-tutorial.html",
      nextTutorial: "skin-rendering-tutorial",
      prevTutorial: "eye-render-tutorial",
      relatedTutorials: ["eye-render-tutorial", "skin-rendering-tutorial"],
      author: "Sarah Johnson",
      date: "2023-06-08",
      tags: ["lips", "rendering", "texture", "lighting", "mouth"],
    });

    this.tutorials.set("skin-rendering-tutorial", {
      id: "skin-rendering-tutorial",
      title: "Skin Texture & Rendering",
      description:
        "Master skin rendering with pores, subsurface scattering, textures, and realistic lighting.",
      category: "facial-features",
      difficulty: "advanced",
      duration: 40,
      image: "../../images/tutorials/skin-hero.jpg",
      file: "../..pages/tutorials/facial-features/skin-rendering-tutorial.html",
      nextTutorial: "facial-expressions",
      prevTutorial: "lip-rendering-tutorial",
      relatedTutorials: ["lip-rendering-tutorial", "facial-expressions"],
      author: "Dr. Kenji Tanaka",
      date: "2023-07-12",
      tags: ["skin", "texture", "rendering", "pores", "subsurface scattering"],
    });

    this.tutorials.set("facial-expressions", {
      id: "facial-expressions",
      title: "Mastering Facial Expressions",
      description:
        "Learn to create realistic and emotional facial expressions - happiness, sadness, anger, surprise, and more.",
      category: "facial-features",
      difficulty: "intermediate",
      duration: 35,
      image: "../../images/tutorials/facial-expressions.jpg",
      file: "../..pages/tutorials/facial-features/facial-expressions.html",
      nextTutorial: null,
      prevTutorial: "skin-rendering-tutorial",
      relatedTutorials: ["skin-rendering-tutorial", "character-design"],
      author: "Alex Chen",
      date: "2023-09-20",
      tags: ["facial", "expressions", "emotion", "realistic", "acting"],
    });

    // ============================================
    // SOFTWARE GUIDES TUTORIALS
    // ============================================
    this.tutorials.set("clipstudio-basics", {
      id: "clipstudio-basics",
      title: "Clip Studio Paint Basics",
      description:
        "Learn the essentials of Clip Studio Paint - from interface navigation to essential tools for manga and illustration.",
      category: "software",
      difficulty: "beginner",
      duration: 35,
      image: "../../images/tutorials/clipstudio-hero.jpg",
      file: "../..pages/tutorials/software-guides/clipstudio-paint-basics.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: [],
      author: "Maria Rodriguez",
      date: "2024-03-01",
      tags: ["Clip Studio Paint", "CSP", "manga", "illustration", "software"],
    });

    this.tutorials.set("krita-basics", {
      id: "krita-basics",
      title: "Krita Basics",
      description:
        "Master the powerful open-source painting software Krita - brushes, layers, and professional features.",
      category: "software",
      difficulty: "beginner",
      duration: 30,
      image: "../../images/tutorials/krita-hero.jpg",
      file: "../..pages/tutorials/software-guides/krita-basics.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: [],
      author: "Sarah Johnson",
      date: "2024-03-15",
      tags: ["Krita", "open source", "painting", "software", "free"],
    });

    this.tutorials.set("photoshop-basics", {
      id: "photoshop-basics",
      title: "Photoshop for Digital Artists",
      description:
        "Learn Photoshop specifically for digital painting - brushes, layers, masks, and essential tools.",
      category: "software",
      difficulty: "intermediate",
      duration: 40,
      image: "../../images/tutorials/photoshop-hero.jpg",
      file: "../..pages/tutorials/software-guides/photoshop-basic.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: [],
      author: "Alex Chen",
      date: "2024-04-01",
      tags: ["Photoshop", "Adobe", "digital painting", "software", "tutorial"],
    });

    this.tutorials.set("procreate-guide", {
      id: "procreate-guide",
      title: "Procreate Guide for iPad Artists",
      description:
        "Master Procreate on iPad - from basic gestures to advanced illustration techniques.",
      category: "software",
      difficulty: "beginner",
      duration: 35,
      image: "../../images/tutorials/procreate-hero.jpg",
      file: "../..pages/tutorials/software-guides/procreate-guide.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: [],
      author: "Maria Rodriguez",
      date: "2024-04-15",
      tags: ["Procreate", "iPad", "digital painting", "software", "iOS"],
    });

    this.tutorials.set("software-comparison", {
      id: "software-comparison",
      title: "Software Comparison Guide",
      description:
        "Compare the best digital art software - Photoshop, Procreate, Clip Studio, Krita, and more to find your perfect match.",
      category: "software",
      difficulty: "beginner",
      duration: 25,
      image: "../../images/tutorials/software-comparison-hero.jpg",
      file: "../..pages/tutorials/software-guides/software-comparison.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: [],
      author: "Alex Chen",
      date: "2024-05-01",
      tags: ["software", "comparison", "Photoshop", "Procreate", "Clip Studio"],
    });

    // ============================================
    // WORKFLOW PROCESS TUTORIALS
    // ============================================
    this.tutorials.set("portfolio-preparation", {
      id: "portfolio-preparation",
      title: "Portfolio Preparation",
      description:
        "Learn how to build a professional art portfolio that stands out to clients and employers.",
      category: "workflow",
      difficulty: "intermediate",
      duration: 35,
      image: "../../images/tutorials/portfolio-hero.jpg",
      file: "../..pages/tutorials/workflow-process/portfolio-preparation.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: ["reference-usage", "time-management"],
      author: "Maria Rodriguez",
      date: "2024-02-01",
      tags: ["portfolio", "career", "professional", "art", "job"],
    });

    this.tutorials.set("reference-usage", {
      id: "reference-usage",
      title: "Effective Reference Usage",
      description:
        "Master the art of using references effectively without copying. Learn to gather, organize, and use references.",
      category: "workflow",
      difficulty: "beginner",
      duration: 25,
      image: "../../images/tutorials/reference-hero.jpg",
      file: "../..pages/tutorials/workflow-process/reference-usage.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: ["portfolio-preparation", "time-management"],
      author: "Sarah Johnson",
      date: "2024-02-15",
      tags: ["reference", "research", "technique", "learning", "practice"],
    });

    this.tutorials.set("time-management", {
      id: "time-management",
      title: "Time Management for Artists",
      description:
        "Learn to manage your time effectively, beat procrastination, and build a sustainable creative routine.",
      category: "workflow",
      difficulty: "beginner",
      duration: 30,
      image: "../../images/tutorials/time-management-hero.jpg",
      file: "../..pages/tutorials/workflow-process/time-management.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: ["portfolio-preparation", "reference-usage"],
      author: "Dr. Kenji Tanaka",
      date: "2024-03-01",
      tags: [
        "time management",
        "productivity",
        "routine",
        "workflow",
        "efficiency",
      ],
    });

    this.tutorials.set("workflow-optimization", {
      id: "workflow-optimization",
      title: "Workflow Optimization",
      description:
        "Streamline your creative process with organization techniques, shortcuts, and efficient practices.",
      category: "workflow",
      difficulty: "intermediate",
      duration: 40,
      image: "../../images/tutorials/workflow-optimization-hero.jpg",
      file: "../..pages/tutorials/workflow-process/workflow-optimization.html",
      nextTutorial: null,
      prevTutorial: null,
      relatedTutorials: ["time-management", "portfolio-preparation"],
      author: "Alex Chen",
      date: "2024-03-15",
      tags: [
        "workflow",
        "optimization",
        "organization",
        "efficiency",
        "productivity",
      ],
    });
  }

  buildCategories() {
    this.categories.set("character-design", {
      name: "Character Design",
      tutorials: ["character-design", "creature-design"],
      description: "Create compelling characters and creatures",
      icon: "fas fa-user",
      color: "#ff9500",
    });

    this.categories.set("color-theory", {
      name: "Color & Lighting",
      tutorials: [
        "color-theory-fundamentals",
        "lighting-masterclass",
        "atmospheric-perspective",
      ],
      description: "Master color theory and lighting techniques",
      icon: "fas fa-palette",
      color: "#FFD700",
    });

    this.categories.set("digital-painting", {
      name: "Digital Painting",
      tutorials: [
        "digital-painting-basics",
        "brush-techniques",
        "landscape-masterclass",
      ],
      description: "Fundamentals and advanced techniques",
      icon: "fas fa-paint-brush",
      color: "#43eaa2",
    });

    this.categories.set("facial-features", {
      name: "Facial Features",
      tutorials: [
        "facial-anatomy-basics",
        "nose-rendering-tutorial",
        "eye-render-tutorial",
        "lip-rendering-tutorial",
        "skin-rendering-tutorial",
        "facial-expressions",
      ],
      description: "Master the art of rendering realistic facial features",
      icon: "fas fa-eye",
      color: "#ff69b4",
    });

    this.categories.set("software", {
      name: "Software Guides",
      tutorials: [
        "clipstudio-basics",
        "krita-basics",
        "photoshop-basics",
        "procreate-guide",
        "software-comparison",
      ],
      description: "Photoshop, Procreate, Clip Studio and more",
      icon: "fas fa-laptop",
      color: "#63dbee",
    });

    this.categories.set("workflow", {
      name: "Workflow & Process",
      tutorials: [
        "portfolio-preparation",
        "reference-usage",
        "time-management",
        "workflow-optimization",
      ],
      description: "Speed up your workflow and efficiency",
      icon: "fas fa-rocket",
      color: "#8b5cf6",
    });
  }

  // ============================================
  // GETTER METHODS
  // ============================================

  getTutorial(id) {
    return this.tutorials.get(id);
  }

  getNextTutorial(currentTutorialId) {
    const current = this.tutorials.get(currentTutorialId);
    if (!current || !current.nextTutorial) return null;
    return this.tutorials.get(current.nextTutorial);
  }

  getPrevTutorial(currentTutorialId) {
    const current = this.tutorials.get(currentTutorialId);
    if (!current || !current.prevTutorial) return null;
    return this.tutorials.get(current.prevTutorial);
  }

  getRelatedTutorials(currentTutorialId, limit = 3) {
    const current = this.tutorials.get(currentTutorialId);
    if (!current || !current.relatedTutorials) return [];

    return current.relatedTutorials
      .map((id) => this.tutorials.get(id))
      .filter((tutorial) => tutorial !== undefined)
      .slice(0, limit);
  }

  getTutorialsByCategory(categoryId) {
    const category = this.categories.get(categoryId);
    if (!category) return [];

    return category.tutorials
      .map((id) => this.tutorials.get(id))
      .filter((tutorial) => tutorial !== undefined);
  }

  getAllTutorials() {
    return Array.from(this.tutorials.values());
  }

  getFeaturedTutorials(limit = 6) {
    const featuredIds = [
      "eye-render-tutorial",
      "character-design",
      "digital-painting-basics",
      "skin-rendering-tutorial",
      "lighting-masterclass",
      "clipstudio-basics",
    ];

    return featuredIds
      .map((id) => this.tutorials.get(id))
      .filter((tutorial) => tutorial !== undefined)
      .slice(0, limit);
  }

  searchTutorials(query) {
    const searchTerms = query.toLowerCase().split(" ");
    return this.getAllTutorials().filter((tutorial) => {
      const searchableText = `
                ${tutorial.title}
                ${tutorial.description}
                ${tutorial.tags.join(" ")}
                ${tutorial.category}
                ${tutorial.author}
            `.toLowerCase();

      return searchTerms.some((term) => searchableText.includes(term));
    });
  }

  getTutorialsByDifficulty(difficulty) {
    return this.getAllTutorials().filter(
      (tutorial) => tutorial.difficulty === difficulty,
    );
  }

  getTutorialsByDuration(min, max) {
    return this.getAllTutorials().filter(
      (tutorial) => tutorial.duration >= min && tutorial.duration <= max,
    );
  }

  getCategoryCount(categoryId) {
    const category = this.categories.get(categoryId);
    if (!category) return 0;
    return category.tutorials.length;
  }

  getAllCategories() {
    return Array.from(this.categories.entries()).map(([id, data]) => ({
      id,
      ...data,
      count: data.tutorials.length,
    }));
  }
}

// Create global instance
window.tutorialData = new TutorialData();

console.log(
  "📚 Total tutorials:",
  window.tutorialData.getAllTutorials().length,
);
console.log(
  "📂 Categories:",
  window.tutorialData
    .getAllCategories()
    .map((c) => c.name)
    .join(", "),
);
