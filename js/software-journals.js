/**
 * Software Journals - Artist Journey Documentation
 * Firestore-powered with sample data for demonstration
 */

document.addEventListener("DOMContentLoaded", function () {
  // ---- Sample Journal Data (clearly marked as examples) ----
  const sampleJournals = [
    {
      id: "sample-1",
      title: "My Journey with Clip Studio Paint",
      software: "clipstudio",
      softwareName: "Clip Studio Paint",
      author: "Mira Chen",
      avatar: "MC",
      skillLevel: "intermediate",
      description:
        "From struggling with vectors to creating my first webtoon — my 6-month journey with CSP.",
      entries: 12,
      likes: 34,
      tags: ["manga", "webtoon", "vectors", "ipad"],
      createdAt: "2026-02-15T10:30:00Z",
      isExample: true,
    },
    {
      id: "sample-2",
      title: "Learning Procreate as a Photoshop User",
      software: "procreate",
      softwareName: "Procreate",
      author: "Alex Rivera",
      avatar: "AR",
      skillLevel: "intermediate",
      description:
        "Switching from Photoshop to Procreate was a journey. Here's what I learned about brushes, layers, and workflow.",
      entries: 8,
      likes: 27,
      tags: ["ipad", "sketching", "workflow", "brushes"],
      createdAt: "2026-02-10T14:45:00Z",
      isExample: true,
    },
    {
      id: "sample-3",
      title: "From Zero to Hero: My Krita Adventure",
      software: "krita",
      softwareName: "Krita",
      author: "Sam Taylor",
      avatar: "ST",
      skillLevel: "beginner",
      description:
        "I started with zero art experience. Here's my 3-month journey learning digital painting with free software.",
      entries: 15,
      likes: 42,
      tags: ["beginner", "free", "digital painting", "linux"],
      createdAt: "2026-02-05T09:15:00Z",
      isExample: true,
    },
    {
      id: "sample-4",
      title: "Photoshop for Photographers: A Love-Hate Story",
      software: "photoshop",
      softwareName: "Photoshop",
      author: "Jordan Lee",
      avatar: "JL",
      skillLevel: "advanced",
      description:
        "10 years of Photoshop, 1000+ edits. Here's my honest take on the good, the bad, and the subscription model.",
      entries: 20,
      likes: 56,
      tags: ["photography", "editing", "workflow", "subscription"],
      createdAt: "2026-01-28T16:20:00Z",
      isExample: true,
    },
    {
      id: "sample-5",
      title: "Affinity Photo: Breaking Free from Adobe",
      software: "affinity",
      softwareName: "Affinity Photo",
      author: "Taylor Kim",
      avatar: "TK",
      skillLevel: "advanced",
      description:
        "After 5 years with Photoshop, I made the switch. Here's what I gained and what I miss.",
      entries: 6,
      likes: 19,
      tags: ["transition", "one-time-payment", "alternatives"],
      createdAt: "2026-01-20T11:00:00Z",
      isExample: true,
    },
  ];

  // ---- State ----
  let journals = [];
  let filteredJournals = [];

  // ---- DOM References ----
  const grid = document.getElementById("journalsGrid");
  const filterSoftware = document.getElementById("filter-software");
  const filterSkill = document.getElementById("filter-skill");
  const filterSort = document.getElementById("filter-sort");
  const startBtns = document.querySelectorAll(
    "#startJournalBtn, #ctaStartJournal",
  );
  const totalJournalsEl = document.getElementById("totalJournals");
  const totalEntriesEl = document.getElementById("totalEntries");
  const activeWritersEl = document.getElementById("activeWriters");

  // ---- Toast ----
  function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");
    toastMsg.textContent = msg;
    toast.querySelector("i").className = isError
      ? "fas fa-exclamation-circle"
      : "fas fa-check-circle";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    setTimeout(() => toast.classList.remove("show"), 2800);
  }
  let toastTimer;

  // ---- Initialize with sample data ----
  function initJournals() {
    // In production, you would fetch from Firestore:
    // const snapshot = await db.collection('journals').get();
    // journals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    journals = [...sampleJournals];
    applyFilters();
    updateStats();
  }

  // ---- Apply Filters ----
  function applyFilters() {
    const software = filterSoftware.value;
    const skill = filterSkill.value;
    const sort = filterSort.value;

    filteredJournals = [...journals];

    // Filter by software
    if (software !== "all") {
      filteredJournals = filteredJournals.filter(
        (j) => j.software === software,
      );
    }

    // Filter by skill level
    if (skill !== "all") {
      filteredJournals = filteredJournals.filter((j) => j.skillLevel === skill);
    }

    // Sort
    switch (sort) {
      case "newest":
        filteredJournals.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        break;
      case "oldest":
        filteredJournals.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
        break;
      case "popular":
        filteredJournals.sort((a, b) => b.likes - a.likes);
        break;
      case "entries":
        filteredJournals.sort((a, b) => b.entries - a.entries);
        break;
    }

    renderJournals();
  }

  // ---- Render Journals ----
  function renderJournals() {
    if (filteredJournals.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <h3>No journals found</h3>
          <p>Be the first to share your software journey!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredJournals
      .map((journal) => {
        const skillColors = {
          beginner: "🟢",
          intermediate: "🟡",
          advanced: "🔴",
        };

        const date = new Date(journal.createdAt);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return `
        <div class="journal-card" data-id="${journal.id}">
          <div class="card-header">
            <span class="card-title">${journal.title}</span>
            <span class="card-software ${journal.software}">
              <i class="fas fa-${getSoftwareIcon(journal.software)}"></i>
              ${journal.softwareName}
              ${journal.isExample ? '<span class="example-badge"><i class="fas fa-info-circle"></i> Example</span>' : ""}
            </span>
          </div>

          <div class="card-meta">
            <span><i class="fas fa-user"></i> ${journal.author}</span>
            <span>${skillColors[journal.skillLevel] || "🟡"} ${capitalize(journal.skillLevel)}</span>
            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
            <span><i class="fas fa-file-alt"></i> ${journal.entries} entries</span>
          </div>

          <p class="card-description">${journal.description}</p>

          <div class="card-tags">
            ${journal.tags.map((tag) => `<span class="tag">#${tag}</span>`).join("")}
          </div>

          <div class="card-footer">
            <div class="card-author">
              <div class="avatar">${journal.avatar}</div>
              <div>
                <div class="name">${journal.author}</div>
                <div class="level">${capitalize(journal.skillLevel)}</div>
              </div>
            </div>
            <div class="card-stats">
              <span><i class="fas fa-heart"></i> ${journal.likes}</span>
              <span><i class="fas fa-comment"></i> ${Math.floor(journal.entries * 0.3)}</span>
              <span><i class="fas fa-bookmark"></i> ${Math.floor(journal.entries * 0.5)}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // Add click listeners to journal cards
    grid.querySelectorAll(".journal-card").forEach((card) => {
      card.addEventListener("click", function () {
        const id = this.dataset.id;
        const journal = journals.find((j) => j.id === id);
        if (journal) {
          showJournalDetail(journal);
        }
      });
    });
  }

  // ---- Show Journal Detail ----
  function showJournalDetail(journal) {
    // In production, navigate to a detail page or open a modal
    showToast(
      `📖 "${journal.title}" — ${journal.entries} entries by ${journal.author}`,
    );
    console.log("Journal detail:", journal);
  }

  // ---- Update Stats ----
  function updateStats() {
    const totalEntries = journals.reduce((sum, j) => sum + j.entries, 0);
    const uniqueAuthors = new Set(journals.map((j) => j.author));

    totalJournalsEl.textContent = journals.length;
    totalEntriesEl.textContent = totalEntries;
    activeWritersEl.textContent = uniqueAuthors.size;
  }

  // ---- Utility Functions ----
  function getSoftwareIcon(software) {
    const icons = {
      photoshop: "adobe",
      procreate: "paintbrush-fine",
      clipstudio: "pen-fancy",
      krita: "palette",
      affinity: "crown",
    };
    return icons[software] || "code";
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ---- Event Listeners ----
  filterSoftware.addEventListener("change", applyFilters);
  filterSkill.addEventListener("change", applyFilters);
  filterSort.addEventListener("change", applyFilters);

  startBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Check if user is logged in
      const user = firebase.auth().currentUser;
      if (user) {
        showToast("📝 Starting a new journal! Feature coming soon.");
        // In production: window.location.href = 'pages/software/create-journal.html';
      } else {
        showToast("🔐 Please log in to start a journal.", true);
        // In production: window.location.href = 'pages/auth/login.html';
      }
    });
  });

  // ---- Theme Toggle ----
  const darkBtn = document.getElementById("themeDark");
  const lightBtn = document.getElementById("themeLight");

  darkBtn.addEventListener("click", () => {
    document.body.classList.remove("light-mode");
    darkBtn.classList.add("active");
    lightBtn.classList.remove("active");
  });

  lightBtn.addEventListener("click", () => {
    document.body.classList.add("light-mode");
    lightBtn.classList.add("active");
    darkBtn.classList.remove("active");
  });

  // ---- Mobile Menu ----
  function initMobileMenu() {
    const btn = document.getElementById("mobile-menu-btn");
    const links = document.getElementById("nav-links");
    if (btn && links) {
      btn.addEventListener("click", () => {
        links.classList.toggle("active");
        btn.classList.toggle("active");
      });
    }
  }
  initMobileMenu();

  // ---- Initialize ----
  initJournals();

  // ---- Firebase Auth State ----
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log("User logged in:", user.displayName || user.email);
      // In production: load user's journals
    }
  });

  console.log("📖 Software Journals loaded successfully!");
});
