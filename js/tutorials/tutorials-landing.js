/**
 * tutorials-landing.js
 * Manages tutorial data display, filtering, and navigation
 *
 * ===== HOW TO ADD NEW TUTORIALS =====
 *
 * To add a new tutorial:
 * 1. Open js/tutorials/tutorials-data.js
 * 2. Add a new tutorial object to the TUTORIALS array:
 *
 * {
 *   id: "unique-id", // Use kebab-case (e.g., "watercolor-techniques")
 *   title: "Tutorial Title",
 *   description: "Short description (max 150 chars)",
 *   category: "category-id", // Must match one of the categories below
 *   difficulty: "beginner|intermediate|advanced",
 *   duration: 45, // in minutes
 *   file: "pages/tutorials/your-tutorial-file.html", // Path to tutorial HTML
 *   featured: true|false, // Set to true to show in featured section
 *   date: "2024-03-15" // YYYY-MM-DD format
 * }
 *
 * 3. Add a corresponding image in images/tutorials/ (optional but recommended)
 * 4. Update the tutorial count in the categories section if needed
 *
 * Available Categories:
 * - facial-features  (Facial Features)
 * - character-design (Character Design)
 * - digital-painting (Digital Painting)
 * - color-theory     (Color & Lighting)
 * - software         (Software Guides)
 * - workflow         (Workflow & Process)
 *
 * ===== TUTORIAL NAVIGATION =====
 *
 * The navigation between tutorials is handled automatically by:
 * - The "Read Tutorial" links on each card
 * - Previous/Next buttons on individual tutorial pages
 *
 * For individual tutorial pages (like nose-render-tutorial.html),
 * include this script at the bottom:
 *
 * <script src="../../js/tutorials/tutorial-navigation.js"></script>
 *
 * This will enable Previous/Next buttons automatically.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Tutorials Landing JS loaded');

    // ===========================================
    // GLOBAL VARIABLES
    // ===========================================

    let currentFilters = {
        category: 'all',
        difficulty: 'all',
        duration: 'all',
        search: ''
    };

    // ===========================================
    // INITIALIZATION
    // ===========================================

    function init() {
        console.log('Initializing tutorials page...');

        // Check if tutorialData exists
        if (typeof tutorialData === 'undefined') {
            console.error('tutorialData is not loaded! Make sure tutorials-data.js is included before this file.');
            showErrorMessage();
            return;
        }

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

        updateRealStats(); // Add this line
    console.log('Tutorials page initialized successfully');

        console.log('Tutorials page initialized successfully');
        // Update real stats from actual tutorial data
function updateRealStats() {
    const allTutorials = tutorialData.getAllTutorials();
    const totalTutorials = allTutorials.length;
    const totalHours = Math.floor(allTutorials.reduce((sum, t) => sum + t.duration, 0) / 60);
    const uniqueDifficulties = new Set(allTutorials.map(t => t.difficulty)).size;

    const tutorialCountEl = document.getElementById('tutorial-count');
    const hoursCountEl = document.querySelector('.hero-stats .stat:nth-child(2) .stat-number');
    const levelsCountEl = document.querySelector('.hero-stats .stat:nth-child(3) .stat-number');

    if (tutorialCountEl) tutorialCountEl.textContent = totalTutorials;
    if (hoursCountEl) hoursCountEl.textContent = totalHours;
    if (levelsCountEl) levelsCountEl.textContent = uniqueDifficulties;
}
    }

    // ===========================================
    // FEATURED TUTORIALS
    // ===========================================

    function loadFeaturedTutorials() {
        const featuredGrid = document.getElementById('featured-grid');
        if (!featuredGrid) {
            console.warn('Featured grid element not found');
            return;
        }

        const featuredTutorials = tutorialData.getFeaturedTutorials(6);

        if (featuredTutorials.length === 0) {
            featuredGrid.innerHTML = '<p class="no-tutorials">No featured tutorials available</p>';
            return;
        }

        featuredGrid.innerHTML = featuredTutorials.map(tutorial => {
            const category = tutorialData.categories.get(tutorial.category);

            return `
                <div class="featured-tutorial-card">
                    <div class="featured-image">
                        <img src="../../images/tutorials/${tutorial.id}.jpg"
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
                            <i class="fas fa-tag"></i> ${category ? category.name : 'Uncategorized'}
                        </div>
                        <a href="${tutorial.file}" class="tutorial-link">
                            Read Tutorial <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===========================================
    // ALL TUTORIALS GRID
    // ===========================================

    function loadAllTutorials() {
        const tutorialsGrid = document.getElementById('tutorials-grid');
        if (!tutorialsGrid) {
            console.warn('Tutorials grid element not found');
            return;
        }

        const filteredTutorials = filterTutorials();
        const noResults = document.getElementById('no-results');
        const loadingIndicator = document.getElementById('loading-indicator');

        if (filteredTutorials.length === 0) {
            tutorialsGrid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        if (loadingIndicator) loadingIndicator.style.display = 'none';

        tutorialsGrid.innerHTML = filteredTutorials.map(tutorial => {
            const category = tutorialData.categories.get(tutorial.category);

            return `
                <div class="tutorial-card">
                    <div class="tutorial-image">
                        <img src="../../images/tutorials/${tutorial.id}.jpg"
                             alt="${tutorial.title}"
                             onerror="this.src='../../images/tutorials/placeholder.jpg'; this.onerror=null;">
                    </div>
                    <div class="tutorial-content">
                        <h3>${tutorial.title}</h3>
                        <p>${tutorial.description}</p>
                        <div class="tutorial-meta">
                            <span class="tutorial-category">${category ? category.name : 'Uncategorized'}</span>
                            <span class="difficulty-badge ${tutorial.difficulty}">${tutorial.difficulty}</span>
                        </div>
                        <div class="tutorial-duration">
                            <i class="fas fa-clock"></i> ${tutorial.duration} min
                        </div>
                        <a href="${tutorial.file}" class="tutorial-link">
                            Read Tutorial <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===========================================
    // FILTERING FUNCTIONS
    // ===========================================

    function filterTutorials() {
        let tutorials = tutorialData.getAllTutorials();

        // Filter by category
        if (currentFilters.category !== 'all') {
            tutorials = tutorials.filter(t => t.category === currentFilters.category);
        }

        // Filter by difficulty
        if (currentFilters.difficulty !== 'all') {
            tutorials = tutorials.filter(t => t.difficulty === currentFilters.difficulty);
        }

        // Filter by duration
        if (currentFilters.duration !== 'all') {
            tutorials = tutorials.filter(t => {
                switch(currentFilters.duration) {
                    case 'short':
                        return t.duration < 15;
                    case 'medium':
                        return t.duration >= 15 && t.duration <= 30;
                    case 'long':
                        return t.duration > 30;
                    default:
                        return true;
                }
            });
        }

        // Filter by search term
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            tutorials = tutorials.filter(t =>
                t.title.toLowerCase().includes(searchTerm) ||
                t.description.toLowerCase().includes(searchTerm)
            );
        }

        return tutorials;
    }

    function applyFilters() {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';

        // Simulate loading delay for better UX
        setTimeout(() => {
            loadAllTutorials();
        }, 300);
    }

    // ===========================================
    // EVENT LISTENERS
    // ===========================================

    function setupCategoryCards() {
        const categoryCards = document.querySelectorAll('.category-card');

        categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                const category = this.dataset.category;

                // Remove active class from all cards
                categoryCards.forEach(c => c.classList.remove('active'));

                // Add active class to clicked card
                this.classList.add('active');

                // Update category filter
                const categoryFilter = document.getElementById('category-filter');
                if (categoryFilter) {
                    categoryFilter.value = category;
                }

                // Update current filters and apply
                currentFilters.category = category;
                applyFilters();

                // Scroll to tutorials section
                document.querySelector('.all-tutorials').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    }

    function setupFilters() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                currentFilters.category = this.value;

                // Update active category card
                const categoryCards = document.querySelectorAll('.category-card');
                categoryCards.forEach(card => {
                    if (card.dataset.category === this.value) {
                        card.classList.add('active');
                    } else {
                        card.classList.remove('active');
                    }
                });

                applyFilters();
            });
        }

        // Difficulty filter
        const difficultyFilter = document.getElementById('difficulty-filter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', function() {
                currentFilters.difficulty = this.value;
                applyFilters();
            });
        }

        // Duration filter
        const durationFilter = document.getElementById('duration-filter');
        if (durationFilter) {
            durationFilter.addEventListener('change', function() {
                currentFilters.duration = this.value;
                applyFilters();
            });
        }
    }

    function setupSearch() {
        const searchInput = document.getElementById('tutorial-search');
        if (!searchInput) return;

        let searchTimeout;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                currentFilters.search = this.value;
                applyFilters();
            }, 300); // Debounce search
        });
    }

    function setupCategoryFilterFromUrl() {
        // Check if URL has a category parameter
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');

        if (categoryParam) {
            // Update category filter
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) {
                categoryFilter.value = categoryParam;
                currentFilters.category = categoryParam;

                // Trigger change event
                const event = new Event('change');
                categoryFilter.dispatchEvent(event);
            }

            // Update active category card
            const categoryCards = document.querySelectorAll('.category-card');
            categoryCards.forEach(card => {
                if (card.dataset.category === categoryParam) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    function updateTutorialCount() {
        const tutorialCountElement = document.getElementById('tutorial-count');
        if (tutorialCountElement && tutorialData) {
            const count = tutorialData.getAllTutorials().length;
            tutorialCountElement.textContent = count + '+';
        }
    }

    function showErrorMessage() {
        const tutorialsGrid = document.getElementById('tutorials-grid');
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
    // TUTORIAL NAVIGATION FUNCTIONS (for individual tutorial pages)
    // ===========================================

    /**
     * Get adjacent tutorial for navigation
     * @param {string} currentId - Current tutorial ID
     * @param {string} direction - 'prev' or 'next'
     * @returns {object|null} Adjacent tutorial object or null
     */
    window.getAdjacentTutorial = function(currentId, direction) {
        if (typeof tutorialData === 'undefined') return null;

        const tutorials = tutorialData.getAllTutorials();
        const currentIndex = tutorials.findIndex(t => t.id === currentId);

        if (currentIndex === -1) return null;

        if (direction === 'prev' && currentIndex > 0) {
            return tutorials[currentIndex - 1];
        } else if (direction === 'next' && currentIndex < tutorials.length - 1) {
            return tutorials[currentIndex + 1];
        }

        return null;
    };

    /**
     * Setup previous/next navigation buttons on individual tutorial pages
     * Call this from tutorial-navigation.js
     */
    window.setupTutorialNavigation = function(currentId) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (!prevBtn && !nextBtn) return;

        const prevTutorial = window.getAdjacentTutorial(currentId, 'prev');
        const nextTutorial = window.getAdjacentTutorial(currentId, 'next');

        if (prevBtn) {
            if (prevTutorial) {
                prevBtn.onclick = function() {
                    window.location.href = prevTutorial.file;
                };
                prevBtn.disabled = false;
            } else {
                prevBtn.disabled = true;
                prevBtn.style.opacity = '0.5';
                prevBtn.style.cursor = 'not-allowed';
            }
        }

        if (nextBtn) {
            if (nextTutorial) {
                nextBtn.onclick = function() {
                    window.location.href = nextTutorial.file;
                };
                nextBtn.disabled = false;
            } else {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
            }
        }
    };

    // Fetch real tutorial count from Firestore
async function fetchRealTutorialStats() {
    try {
        const db = firebase.firestore();
        const tutorialsSnapshot = await db.collection('tutorials').get();
        const totalTutorials = tutorialsSnapshot.size;

        // Calculate total minutes
        let totalMinutes = 0;
        tutorialsSnapshot.forEach(doc => {
            const duration = doc.data().duration || 0;
            totalMinutes += duration;
        });

        const totalHours = Math.floor(totalMinutes / 60);

        // Get unique difficulty levels
        const difficultySnapshot = await db.collection('tutorials').where('difficulty', '!=', null).get();
        const uniqueDifficulties = new Set();
        difficultySnapshot.forEach(doc => {
            uniqueDifficulties.add(doc.data().difficulty);
        });

        // Update UI
        const tutorialCountEl = document.getElementById('tutorial-count');
        const hoursCountEl = document.getElementById('hours-count');
        const levelsCountEl = document.getElementById('levels-count');

        if (tutorialCountEl) tutorialCountEl.textContent = totalTutorials;
        if (hoursCountEl) hoursCountEl.textContent = totalHours;
        if (levelsCountEl) levelsCountEl.textContent = uniqueDifficulties.size;

    } catch (error) {
        console.error('Error fetching tutorial stats:', error);
        // Fallback to local data
        updateRealStats();
    }
}

    // ===========================================
    // ADD NEW TUTORIAL NOTES (visible in console for developers)
    // ===========================================

    console.log(`
%c=== ADDING NEW TUTORIALS ===
To add a new tutorial:
1. Open js/tutorials/tutorials-data.js
2. Add a new object to the TUTORIALS array
3. Follow the format of existing tutorials
4. Update the tutorial count in HTML if needed

Example:
{
  id: "watercolor-techniques",
  title: "Watercolor Techniques in Digital Art",
  description: "Learn to mimic traditional watercolor effects digitally",
  category: "digital-painting",
  difficulty: "intermediate",
  duration: 35,
  file: "pages/tutorials/watercolor-techniques.html",
  featured: true,
  date: "2024-03-15"
}

Available categories:
- facial-features
- character-design
- digital-painting
- color-theory
- software
- workflow
`, 'color: #e67e22; font-weight: bold; font-size: 12px;');

    // Initialize everything
    init();
});
