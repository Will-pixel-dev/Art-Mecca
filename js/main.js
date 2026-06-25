// main.js - Cleaned and Fixed Version

// ===== HEADER FUNCTIONALITY =====
function initHeader() {
  initMobileMenu();
  initSearch();
  initDropdowns();
  setActiveNavLink();
}

// Mobile menu functionality
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active");
    });

    // Close mobile menu when clicking on links
    const navLinksAll = navLinks.querySelectorAll("a");
    navLinksAll.forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        mobileMenuBtn.classList.remove("active");
      });
    });
  }
}

// Search functionality
function initSearch() {
  const searchBtn = document.getElementById("search-btn");
  const searchOverlay = document.getElementById("search-overlay");
  const searchClose = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener("click", () => {
      searchOverlay.classList.add("active");
      setTimeout(() => searchInput?.focus(), 100);
    });

    searchClose?.addEventListener("click", () => {
      searchOverlay.classList.remove("active");
    });

    searchOverlay.addEventListener("click", (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove("active");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
        searchOverlay.classList.remove("active");
      }
    });
  }
}

// Dropdown functionality for mobile
function initDropdowns() {
  const dropdownToggles = document.querySelectorAll(
    ".nav-dropdown > .nav-link"
  );

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      if (window.innerWidth <= 968) {
        e.preventDefault();
        const dropdown = toggle.parentElement;
        // Close other open dropdowns
        document.querySelectorAll('.nav-dropdown.active').forEach((openDropdown) => {
          if (openDropdown !== dropdown) {
            openDropdown.classList.remove('active');
          }
        });
        dropdown.classList.toggle("active");
      }
    });
  });
}

// Set active nav link based on current page
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (
      currentPath.includes(linkPath) &&
      linkPath !== "/" &&
      linkPath !== "#"
    ) {
      link.classList.add("active");
    } else if (currentPath === "/" && linkPath === "/") {
      link.classList.add("active");
    }
  });
}

// ===== BACK TO TOP FUNCTIONALITY =====
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");

  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}

// Slider.js
let currentSlide = 0;
let slideInterval;
const totalSlides = 4;
const autoPlayDelay = 5000; // 5 seconds

function initSlider() {
  // Get DOM elements
  const wrapperHolder = document.querySelector(".wrapper-holder");
  const buttons = document.querySelectorAll(".button-holder .button");

  // Initialize first slide
  goToSlide(0);

  // Start autoplay
  startAutoPlay();

  // Pause autoplay on hover
  const sliderContainer = document.querySelector(".slider-container");
  sliderContainer.addEventListener("mouseenter", stopAutoPlay);
  sliderContainer.addEventListener("mouseleave", startAutoPlay);

  // Add keyboard navigation
  document.addEventListener("keydown", handleKeyPress);
}

function changeSlide(direction) {
  const newSlide = currentSlide + direction;

  // Handle wrap-around
  if (newSlide < 0) {
    goToSlide(totalSlides - 1);
  } else if (newSlide >= totalSlides) {
    goToSlide(0);
  } else {
    goToSlide(newSlide);
  }
}

function goToSlide(slideIndex) {
  // Update current slide
  currentSlide = slideIndex;

  // Move the slider
  const wrapperHolder = document.querySelector(".wrapper-holder");
  const slideWidth = 25; // Each slide is 25% width
  wrapperHolder.style.transform = `translateX(-${slideIndex * slideWidth}%)`;

  // Update active button
  updateActiveButton(slideIndex);
}

function updateActiveButton(slideIndex) {
  const buttons = document.querySelectorAll(".button-holder .button");

  buttons.forEach((button, index) => {
    if (index === slideIndex) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function startAutoPlay() {
  if (slideInterval) {
    clearInterval(slideInterval);
  }
  slideInterval = setInterval(() => {
    changeSlide(1);
  }, autoPlayDelay);
}

function stopAutoPlay() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

function handleKeyPress(event) {
  switch (event.key) {
    case "ArrowLeft":
      changeSlide(-1);
      break;
    case "ArrowRight":
      changeSlide(1);
      break;
  }
}

// Optional: Add touch support for mobile devices
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(event) {
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event) {
  touchEndX = event.changedTouches[0].clientX;
  handleSwipe();
}

function handleSwipe() {
  const swipeThreshold = 50;
  const difference = touchStartX - touchEndX;

  if (Math.abs(difference) > swipeThreshold) {
    if (difference > 0) {
      // Swiped left - go to next slide
      changeSlide(1);
    } else {
      // Swiped right - go to previous slide
      changeSlide(-1);
    }
  }
}

// Add touch event listeners if you want mobile swipe support
function addTouchSupport() {
  const wrapper = document.querySelector(".wrapper");
  wrapper.addEventListener("touchstart", handleTouchStart, { passive: true });
  wrapper.addEventListener("touchend", handleTouchEnd);
}

// Call this after initSlider if you want touch support
document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  addTouchSupport(); // Optional: remove this line if you don't want swipe functionality
});

// ===== CARD FLIP FUNCTIONALITY =====
function initCardFlip() {
  const cards = document.querySelectorAll(".create-container .card");

  cards.forEach((card) => {
    card.addEventListener("click", function () {
      this.classList.toggle("flipped");
    });
  });
}

// ===== INITIALIZE EVERYTHING =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing components...");

  // Initialize header functionality
  initHeader();

  // Initialize back to top
  initBackToTop();

  // Initialize slider if it exists on the page
  if (document.querySelector(".wrapper-holder")) {
    setTimeout(() => {
      initSlider();
    }, 100); // Small delay to ensure DOM is ready
  }

  // Initialize card flip
  initCardFlip();

  console.log("All components initialized");
});

// Check and restore auth state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ User is signed in:', user.email);
                // Update UI to show logged-in state
                const authButtons = document.querySelector('.auth-buttons');
                if (authButtons && typeof authManager !== 'undefined') {
                    authManager.updateUI();
                }
            } else {
                console.log('❌ No user signed in');
            }
        });
    }
});
// At the bottom of main.js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize avatar system
    if (typeof AvatarManager !== 'undefined') {
        window.avatarManager = new AvatarManager();
    }
});
// ============================================
// AVATAR SYSTEM INITIALIZATION
// ============================================

// Initialize avatar manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if avatar manager is loaded
    if (typeof AvatarManager !== 'undefined') {
        // Wait for Firebase
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
                if (!window.avatarManager) {
                    window.avatarManager = new AvatarManager();
                }
            }
        }, 1000);
    }
});
