/**
 * Header Loader - Loads and initializes the header
 * Single source of truth for all pages
 */

class HeaderLoader {
  constructor() {
    this.headerPath = "/components/header.html";
    this.footerPath = "/components/footer.html";
    this.headerContainerId = "header-container";
    this.footerContainerId = "footer-container";
    this.init();
  }

  async init() {
    await this.loadHeader();
    await this.loadFooter();
    this.initHeaderEvents();
    this.initAuth();
    this.initSearch();
    this.initNotifications();
    this.fixDropdowns();
    this.fixHoverIssues();
  }

  async loadHeader() {
    const container = document.getElementById(this.headerContainerId);
    if (!container) {
      console.warn("Header container not found");
      return;
    }

    try {
      const response = await fetch(this.headerPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      container.innerHTML = html;
      console.log("✅ Header loaded successfully");

      // Dispatch event for other scripts
      document.dispatchEvent(
        new CustomEvent("headerLoaded", {
          detail: { message: "Header loaded successfully" },
        }),
      );
    } catch (error) {
      console.error("Error loading header:", error);
      container.innerHTML = this.getFallbackHeader();
    }
  }

  async loadFooter() {
    const container = document.getElementById(this.footerContainerId);
    if (!container) {
      console.warn("Footer container not found");
      return;
    }

    try {
      const response = await fetch(this.footerPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      container.innerHTML = html;
      console.log("✅ Footer loaded successfully");
    } catch (error) {
      console.error("Error loading footer:", error);
      container.innerHTML = this.getFallbackFooter();
    }
  }

  getFallbackHeader() {
    return `
            <header class="main-header" style="background: rgba(10,5,8,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,0,234,0.15); padding: 12px 20px; border-radius: 4px; margin: 12px 20px 0;">
                <div class="container">
                    <nav style="display: flex; justify-content: space-between; align-items: center;">
                        <a href="/" class="logo" style="color: white; text-decoration: none; font-size: 1.2rem; font-weight: 700;">
                            <span style="color: #ff00ea; animation: logoGlowPulse 2s ease-in-out infinite;">✧</span> Art Mecca
                        </a>
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <a href="/" style="color: rgba(255,255,255,0.7); text-decoration: none;">Home</a>
                            <a href="/#about" style="color: rgba(255,255,255,0.7); text-decoration: none;">About</a>
                            <a href="pages/auth/login.html" style="color: white; text-decoration: none; padding: 6px 16px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px;">Login</a>
                            <a href="pages/auth/register.html" style="color: white; text-decoration: none; padding: 6px 16px; background: linear-gradient(135deg, #ff00ea, #ad03fc); border-radius: 4px;">Sign Up</a>
                        </div>
                    </nav>
                </div>
            </header>
        `;
  }

  getFallbackFooter() {
    return `
            <footer style="background: rgba(10,5,8,0.85); border-top: 1px solid rgba(255,0,234,0.15); padding: 30px 20px; margin-top: 40px;">
                <div class="container" style="max-width: 1200px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                        <div>
                            <div style="color: white; font-size: 1.1rem; font-weight: 700;">✧ Art Mecca</div>
                            <p style="color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-top: 4px;">cyber den & studio ✦ est. 2026</p>
                        </div>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                            <a href="#" style="color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.75rem;">about</a>
                            <a href="#" style="color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.75rem;">support</a>
                            <a href="#" style="color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.75rem;">privacy</a>
                        </div>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.06); margin-top: 16px; padding-top: 16px; text-align: center; color: rgba(255,255,255,0.3); font-size: 0.65rem;">
                        &copy; 2026 Art Mecca. All rights reserved.
                    </div>
                </div>
            </header>
        `;
  }

  initHeaderEvents() {
    const menuBtn = document.getElementById("mobile-menu-btn");
    const navLinks = document.getElementById("nav-links");

    if (menuBtn && navLinks) {
      menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("open");
        menuBtn.classList.toggle("open");
      });
    }

    const header = document.getElementById("main-header");
    if (header) {
      window.addEventListener(
        "scroll",
        () => {
          header.classList.toggle("scrolled", window.scrollY > 50);
        },
        { passive: true },
      );
    }

    this.updateHomeLink();
  }

  updateHomeLink() {
    const homeLink = document.getElementById("navHome");
    if (!homeLink) return;

    const user = firebase?.auth()?.currentUser;
    if (user) {
      homeLink.href = "/home.html";
      homeLink.textContent = "Dashboard";
    } else {
      homeLink.href = "/";
      homeLink.textContent = "Home";
    }
  }

  initAuth() {
    if (typeof firebase === "undefined") {
      console.warn("Firebase not available");
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      const authButtons = document.getElementById("authButtons");
      const avatarContainer = document.getElementById("navAvatar");
      const hybridStatus = document.getElementById("hybridStatus");

      if (user) {
        if (authButtons) {
          authButtons.innerHTML = `
                        <button class="btn-icon" id="logoutBtn" title="Logout" style="background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 1.1rem; padding: 8px;">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    `;
          const logoutBtn = document.getElementById("logoutBtn");
          if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
              firebase.auth().signOut();
              window.location.href = "/";
            });
          }
        }

        if (hybridStatus) {
          hybridStatus.textContent = "● ONLINE";
          hybridStatus.classList.remove("offline");
        }

        // Let AvatarManager handle the avatar rendering
        // Just make sure the container exists
        if (avatarContainer) {
          // If AvatarManager is already initialized, it will handle this
          // Otherwise, it will pick up the user state
          console.log(
            "✅ User logged in, avatar will be rendered by AvatarManager",
          );
        }

        this.updateHomeLink();
      } else {
        if (authButtons) {
          authButtons.innerHTML = `
                        <a href="pages/auth/login.html" class="btn btn-outline btn-sm" style="padding: 6px 16px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: white; text-decoration: none; font-size: 0.75rem; transition: all 0.3s;">Log In</a>
                        <a href="pages/auth/register.html" class="btn btn-primary btn-sm" style="padding: 6px 16px; background: linear-gradient(135deg, #ff00ea, #ad03fc); border-radius: 4px; color: white; text-decoration: none; font-size: 0.75rem; transition: all 0.3s;">Sign Up</a>
                    `;
        }

        if (hybridStatus) {
          hybridStatus.textContent = "● OFFLINE";
          hybridStatus.classList.add("offline");
        }

        if (avatarContainer) {
          avatarContainer.innerHTML = "";
        }

        this.updateHomeLink();
      }
    });
  }

  initSearch() {
    const searchBtn = document.getElementById("search-btn");
    const searchOverlay = document.getElementById("search-overlay");
    const searchClose = document.getElementById("search-close");
    const searchInput = document.getElementById("search-input");

    if (!searchBtn || !searchOverlay) return;

    searchBtn.addEventListener("click", () => {
      searchOverlay.classList.add("active");
      searchOverlay.style.display = "flex";
      searchInput?.focus();
    });

    searchClose?.addEventListener("click", () => {
      searchOverlay.classList.remove("active");
      searchOverlay.style.display = "none";
    });

    searchOverlay.addEventListener("click", (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove("active");
        searchOverlay.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
        searchOverlay.classList.remove("active");
        searchOverlay.style.display = "none";
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchOverlay.classList.toggle("active");
        if (searchOverlay.classList.contains("active")) {
          searchOverlay.style.display = "flex";
          searchInput?.focus();
        } else {
          searchOverlay.style.display = "none";
        }
      }
    });
  }

  initNotifications() {
    const notificationBtn = document.getElementById("notificationBtn");
    const notificationDropdown = document.getElementById(
      "notificationDropdown",
    );

    if (!notificationBtn || !notificationDropdown) {
      console.warn("Notification elements not found");
      return;
    }

    const newBtn = notificationBtn.cloneNode(true);
    notificationBtn.parentNode.replaceChild(newBtn, notificationBtn);

    newBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();

      console.log("🔔 Notification clicked!");

      const avatarDropdown = document.getElementById("avatarDropdown");
      if (avatarDropdown) {
        avatarDropdown.style.display = "none";
        avatarDropdown.classList.remove("active");
      }

      const isVisible = notificationDropdown.style.display === "block";
      notificationDropdown.style.display = isVisible ? "none" : "block";
      notificationDropdown.classList.toggle("active", !isVisible);

      console.log("Notification dropdown:", isVisible ? "closed" : "opened");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-container")) {
        notificationDropdown.style.display = "none";
        notificationDropdown.classList.remove("active");
      }
    });

    console.log("✅ Notification dropdown initialized");
  }

  fixDropdowns() {
    const dropdowns = document.querySelectorAll(".nav-dropdown");
    dropdowns.forEach((dropdown) => {
      const menu = dropdown.querySelector(".dropdown-menu");
      if (!menu) return;

      if (window.innerWidth > 768) {
        menu.style.opacity = "";
        menu.style.visibility = "";
        menu.style.pointerEvents = "";
        menu.style.transform = "";
        menu.style.display = "";

        const link = dropdown.querySelector("a");
        if (link) {
          link.style.pointerEvents = "auto";
        }
      }
    });

    if (window.innerWidth <= 768) {
      dropdowns.forEach((dropdown) => {
        const link = dropdown.querySelector("a");
        const menu = dropdown.querySelector(".dropdown-menu");
        if (link && menu) {
          const newLink = link.cloneNode(true);
          link.parentNode.replaceChild(newLink, link);

          newLink.addEventListener("click", (e) => {
            const isOpen = dropdown.classList.contains("open");
            if (!isOpen) {
              dropdowns.forEach((d) => d.classList.remove("open"));
              dropdown.classList.add("open");
              e.preventDefault();
            }
          });
        }
      });
    }

    console.log("✅ Dropdowns fixed");
  }

  fixHoverIssues() {
    const dropdownLinks = document.querySelectorAll(".dropdown-menu li a");
    dropdownLinks.forEach((link) => {
      link.style.pointerEvents = "auto";
      link.style.cursor = "pointer";
    });
    console.log("✅ Hover issues fixed");
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  if (typeof firebase === "undefined") {
    console.warn("Firebase not ready, waiting...");
    setTimeout(() => {
      window.headerLoader = new HeaderLoader();
    }, 1000);
  } else {
    window.headerLoader = new HeaderLoader();
  }
});
