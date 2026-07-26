/**
 * Software Comparison Page JavaScript
 * Handles interactive features like button clicks, notifications, and dynamic content
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Software comparison page loaded");

  // ---- Theme Toggle ----
  const darkBtn = document.getElementById("themeDark");
  const lightBtn = document.getElementById("themeLight");

  // Check for saved theme preference
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    lightBtn.classList.add("active");
    darkBtn.classList.remove("active");
  }

  darkBtn.addEventListener("click", function () {
    document.body.classList.remove("light-mode");
    darkBtn.classList.add("active");
    lightBtn.classList.remove("active");
    localStorage.setItem("theme", "dark");
  });

  lightBtn.addEventListener("click", function () {
    document.body.classList.add("light-mode");
    lightBtn.classList.add("active");
    darkBtn.classList.remove("active");
    localStorage.setItem("theme", "light");
  });

  // ---- "Read Journals" buttons - navigate to journals page with filter ----
  document.querySelectorAll(".btn-reviews").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      // The href already points to the journals page with query param
      // Let the browser handle the navigation
      const href = this.getAttribute("href");
      if (!href || href === "#") {
        e.preventDefault();
        window.location.href = "/pages/software/software-journals.html";
      }
      // Otherwise, let the browser navigate normally
    });
  });

  // ---- "Read Journals" CTA button ----
  const ctaJournalBtn = document.querySelector(".btn-secondary-soft");
  if (ctaJournalBtn) {
    ctaJournalBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/pages/software/software-journals.html";
    });
  }

  // ---- "Take the Quiz" CTA button ----
  const ctaQuizBtn = document.querySelector(".btn-primary-soft");
  if (ctaQuizBtn) {
    ctaQuizBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/pages/tools/software-quiz.html";
    });
  }

  // ---- Software Details Modal ----
  const compareButtons = document.querySelectorAll(".btn-compare");

  // Software details database with official features page links
  const softwareDetails = {
    Photoshop: {
      name: "Adobe Photoshop",
      description:
        "Industry-standard for raster graphics editing, digital painting, and photo manipulation.",
      features: [
        "Advanced brush engine",
        "3D editing",
        "AI-powered tools",
        "Cloud storage",
        "Neural filters",
      ],
      bestFor: "Professional illustrators, photographers, and designers",
      featuresPage: "https://www.adobe.com/products/photoshop/features.html",
      trialLink:
        "https://www.adobe.com/products/photoshop/free-trial-download.html",
    },
    Procreate: {
      name: "Procreate",
      description:
        "Powerful iPad illustration app with an intuitive interface and stunning performance.",
      features: [
        "Apple Pencil integration",
        "Over 200 brushes",
        "4K canvas support",
        "Animation assist",
        "ColorDrop",
      ],
      bestFor: "Digital artists on iPad, illustrators, and sketchers",
      featuresPage: "https://procreate.com/features",
      trialLink: "https://procreate.com/handbook",
    },
    ClipStudio: {
      name: "Clip Studio Paint",
      description:
        "The go-to software for manga, comics, and concept art with specialized tools.",
      features: [
        "Vector layers",
        "3D models support",
        "Frame border tools",
        "Inking stability",
        "Screen tone tools",
      ],
      bestFor: "Manga artists, comic creators, and illustrators",
      featuresPage: "https://www.clipstudio.net/en/features/",
      trialLink: "https://www.clipstudio.net/en/trial/",
    },
    Krita: {
      name: "Krita",
      description:
        "Free and open-source digital painting software loved by concept artists.",
      features: [
        "Brush stabilizers",
        "Wrap-around mode",
        "Pop-up palette",
        "Animation timeline",
        "Resource manager",
      ],
      bestFor:
        "Budget-conscious artists, illustrators, and open-source enthusiasts",
      featuresPage: "https://krita.org/en/features/highlights/",
      trialLink: "https://krita.org/en/download/",
    },
    Affinity: {
      name: "Affinity Photo",
      description:
        "Professional photo editing software with one-time purchase model.",
      features: [
        "Live filters",
        "Panorama stitching",
        "Focus stacking",
        "RAW editing",
        "HDR merge",
      ],
      bestFor: "Photographers and designers seeking Adobe alternative",
      featuresPage: "https://affinity.serif.com/en-us/photo/features/",
      trialLink: "https://affinity.serif.com/en-us/photo/trial/",
    },
  };

  // Add click handlers to each button - FIXED to open trial links
  compareButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const softwareKey = this.getAttribute("data-soft");

      if (softwareKey && softwareDetails[softwareKey]) {
        showSoftwareModal(softwareDetails[softwareKey]);
      } else {
        showGenericNotification();
      }
    });
  });

  /**
   * Display a modal with detailed software information
   */
  function showSoftwareModal(software) {
    // Create modal element
    const modal = document.createElement("div");
    modal.className = "software-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: var(--bg-deep, #0a0815);
      border-radius: 24px;
      max-width: 520px;
      width: 90%;
      padding: 2rem;
      position: relative;
      animation: slideUp 0.3s ease;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
      color: var(--text-primary, #f0edf7);
    `;

    modalContent.innerHTML = `
      <button class="modal-close" style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.8rem;
        cursor: pointer;
        color: var(--text-muted, #7a7290);
        transition: all 0.2s;
        line-height: 1;
      " onmouseover="this.style.color='#ff69b4'" onmouseout="this.style.color='var(--text-muted, #7a7290)'">&times;</button>

      <h2 style="
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #ff69b4, #8B5CF6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      ">${software.name}</h2>

      <p style="color: var(--text-secondary, #b0a8c8); line-height: 1.6; margin: 1rem 0;">
        ${software.description}
      </p>

      <div style="margin: 1.5rem 0;">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary, #b0a8c8);">🎯 Best For:</h3>
        <p style="color: var(--text-muted, #7a7290);">${software.bestFor}</p>
      </div>

      <div style="margin: 1.5rem 0;">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-secondary, #b0a8c8);">✨ Key Features:</h3>
        <ul style="list-style: none; padding: 0;">
          ${software.features.map((f) => `<li style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary, #b0a8c8);"><span style="color: #10b981;">✓</span> ${f}</li>`).join("")}
        </ul>
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
        <a href="${software.featuresPage}" target="_blank" rel="noopener noreferrer" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: #ff69b4;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          flex: 1;
          transition: all 0.2s;
          border: 2px solid #ff69b4;
          cursor: pointer;
        " onmouseover="this.style.backgroundColor='#ff69b4'; this.style.color='white'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#ff69b4'">
          <i class="fas fa-list"></i> View All Features
        </a>

        <a href="${software.trialLink}" target="_blank" rel="noopener noreferrer" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #ff69b4, #8B5CF6);
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          flex: 1;
          transition: all 0.2s;
          border: 2px solid transparent;
          cursor: pointer;
        " onmouseover="this.style.boxShadow='0 8px 32px rgba(255,105,180,0.35)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none'; this.style.transform='none'">
          <i class="fas fa-download"></i> Free Trial / Download
        </a>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal on click outside or close button
    const closeBtn = modalContent.querySelector(".modal-close");
    closeBtn.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // Add keydown listener for Escape
    const escHandler = (e) => {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  /**
   * Fallback notification for demo purposes
   */
  function showGenericNotification() {
    const toast = document.createElement("div");
    toast.textContent = "✨ More details coming soon! Check back for updates.";
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-deep, #0a0815);
      color: var(--text-primary, #f0edf7);
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      z-index: 10001;
      animation: slideUp 0.3s ease;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
      backdrop-filter: blur(12px);
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ---- Add animation keyframes dynamically ----
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styleSheet);

  // ---- Table row hover effect ----
  const tableRows = document.querySelectorAll(".comparison-table tbody tr");
  tableRows.forEach((row) => {
    row.addEventListener("mouseenter", function () {
      this.style.transition = "background 0.2s";
      this.style.backgroundColor = "rgba(255, 105, 180, 0.04)";
    });
    row.addEventListener("mouseleave", function () {
      this.style.backgroundColor = "";
    });
  });

  // ---- Mouse-following glow for feature cards ----
  document.querySelectorAll(".feature-compare-card").forEach((card) => {
    card.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      this.style.setProperty("--mouse-x", x + "%");
      this.style.setProperty("--mouse-y", y + "%");
    });
  });

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  console.log("✅ Software Comparison page initialized");
});
