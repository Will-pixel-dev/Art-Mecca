// Header functionality - No more fetch calls
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
      searchInput?.focus();
    });

    searchClose?.addEventListener("click", () => {
      searchOverlay.classList.remove("active");
    });

    // Close search when clicking outside
    searchOverlay.addEventListener("click", (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove("active");
      }
    });

    // Close with Escape key
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
    ".nav-dropdown > .nav-link",
  );

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      if (window.innerWidth <= 968) {
        e.preventDefault();
        const dropdown = toggle.parentElement;
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
    if (currentPath.includes(linkPath) && linkPath !== "/") {
      link.classList.add("active");
    } else if (currentPath === "/" && linkPath === "/") {
      link.classList.add("active");
    }
  });
}

// Enhanced Color Palette Generator with Local Storage & Social Features
class ColorPaletteGenerator {
  constructor() {
    this.canvas = document.getElementById("palette-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.currentColors = [];
    this.baseColor = "#f705d7";
    this.savedPalettes = this.loadSavedPalettes();
    this.featuredPalettes = this.getFeaturedPalettes();

    this.initializeEventListeners();
    this.generatePalette();
    this.loadSavedPalettesDisplay();
    this.loadFeaturedPalettes();
  }

  initializeEventListeners() {
    // Color controls
    document.getElementById("base-color").addEventListener("input", (e) => {
      this.baseColor = e.target.value;
      document.getElementById("base-color-hex").textContent = this.baseColor;
      this.generatePalette();
    });

    document.getElementById("harmony-select").addEventListener("change", () => {
      this.generatePalette();
    });

    document.getElementById("palette-size").addEventListener("change", () => {
      this.generatePalette();
    });

    document.getElementById("saturation").addEventListener("input", (e) => {
      document.getElementById("saturation-value").textContent =
        `${e.target.value}%`;
      this.generatePalette();
    });

    // Buttons
    document.getElementById("generate-btn").addEventListener("click", () => {
      this.generatePalette();
    });

    document.getElementById("random-btn").addEventListener("click", () => {
      this.generateRandomPalette();
    });

    document.getElementById("save-btn").addEventListener("click", () => {
      this.saveCurrentPalette();
    });

    // Export buttons
    document.getElementById("export-css").addEventListener("click", () => {
      this.exportCSS();
    });

    document.getElementById("export-json").addEventListener("click", () => {
      this.exportJSON();
    });

    document.getElementById("export-png").addEventListener("click", () => {
      this.exportPNG();
    });

    document.getElementById("copy-hex").addEventListener("click", () => {
      this.copyHEX();
    });

    // Clear saved palettes
    document.getElementById("clear-saved").addEventListener("click", () => {
      this.clearSavedPalettes();
    });

    // Social sharing
    document.querySelectorAll(".btn-share").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const platform = e.currentTarget.getAttribute("data-platform");
        this.sharePalette(platform);
      });
    });
  }

  // Local Storage Functions
  loadSavedPalettes() {
    const saved = localStorage.getItem("artisanHubSavedPalettes");
    return saved ? JSON.parse(saved) : [];
  }

  saveToLocalStorage() {
    localStorage.setItem(
      "artisanHubSavedPalettes",
      JSON.stringify(this.savedPalettes),
    );
  }

  saveCurrentPalette() {
    const name =
      document.getElementById("palette-name").value.trim() ||
      `Palette ${new Date().toLocaleDateString()}`;

    if (this.currentColors.length === 0) {
      this.showNotification("Generate a palette first!", "error");
      return;
    }

    const palette = {
      id: Date.now(),
      name: name,
      colors: this.currentColors,
      baseColor: this.baseColor,
      harmony: document.getElementById("harmony-select").value,
      createdAt: new Date().toISOString(),
    };

    // Add to beginning of array (most recent first)
    this.savedPalettes.unshift(palette);

    // Keep only last 12 palettes
    if (this.savedPalettes.length > 12) {
      this.savedPalettes = this.savedPalettes.slice(0, 12);
    }

    this.saveToLocalStorage();
    this.loadSavedPalettesDisplay();
    this.showNotification(`"${name}" saved successfully!`, "success");

    // Clear the name input
    document.getElementById("palette-name").value = "";
  }

  loadSavedPalettesDisplay() {
    const container = document.getElementById("saved-palettes");

    if (this.savedPalettes.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-palette"></i>
                    <h3>No palettes saved yet</h3>
                    <p>Generate and save your first color palette to see it here!</p>
                </div>
            `;
      return;
    }

    container.innerHTML = this.savedPalettes
      .map(
        (palette) => `
            <div class="saved-palette-card">
                <div class="palette-card-header">
                    <h4 class="palette-name">${this.escapeHtml(palette.name)}</h4>
                    <span class="palette-date">${new Date(palette.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="palette-colors-preview">
                    ${palette.colors
                      .map(
                        (color) => `
                        <div class="palette-color" style="background-color: ${color};" data-hex="${color.toUpperCase()}"></div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="palette-card-actions">
                    <button class="palette-action-btn" onclick="colorGenerator.loadPalette(${palette.id})">
                        <i class="fas fa-undo"></i>
                        Load
                    </button>
                    <button class="palette-action-btn" onclick="colorGenerator.sharePalette('link', ${palette.id})">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                    <button class="palette-action-btn delete" onclick="colorGenerator.deletePalette(${palette.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `,
      )
      .join("");
  }

  loadPalette(paletteId) {
    const palette = this.savedPalettes.find((p) => p.id === paletteId);
    if (!palette) return;

    this.currentColors = [...palette.colors];
    this.baseColor = palette.baseColor;

    // Update UI
    document.getElementById("base-color").value = palette.baseColor;
    document.getElementById("base-color-hex").textContent = palette.baseColor;
    document.getElementById("harmony-select").value = palette.harmony;
    document.getElementById("palette-name").value = palette.name;

    this.renderPalette();
    this.updateColorSwatches();
    this.showNotification(`"${palette.name}" loaded!`, "success");
  }

  deletePalette(paletteId) {
    this.savedPalettes = this.savedPalettes.filter((p) => p.id !== paletteId);
    this.saveToLocalStorage();
    this.loadSavedPalettesDisplay();
    this.showNotification("Palette deleted", "success");
  }

  clearSavedPalettes() {
    if (this.savedPalettes.length === 0) {
      this.showNotification("No palettes to clear", "info");
      return;
    }

    if (confirm("Are you sure you want to clear all saved palettes?")) {
      this.savedPalettes = [];
      this.saveToLocalStorage();
      this.loadSavedPalettesDisplay();
      this.showNotification("All palettes cleared", "success");
    }
  }

  // Featured Palettes
  getFeaturedPalettes() {
    return [
      {
        id: "featured-1",
        name: "Pink Dream",
        description:
          "A beautiful gradient of pink tones perfect for feminine designs",
        colors: ["#f705d7", "#ff4ae7", "#ff73e5", "#ffa8e6", "#ffd6f5"],
        creator: "Art Mecca",
      },
      {
        id: "featured-2",
        name: "Sunset Vibes",
        description:
          "Warm sunset colors that create a cozy, inviting atmosphere",
        colors: ["#FF6B6B", "#FF9E7D", "#FFD166", "#8ECAE6", "#219EBC"],
        creator: "Art Mecca",
      },
      {
        id: "featured-3",
        name: "Forest Magic",
        description: "Earthy greens and natural tones for organic designs",
        colors: ["#386641", "#6A994E", "#A7C957", "#F2E8CF", "#BC4749"],
        creator: "Art Mecca",
      },
      {
        id: "featured-4",
        name: "Ocean Depth",
        description: "Cool blues and teals inspired by the deep ocean",
        colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"],
        creator: "Art Mecca",
      },
    ];
  }

  loadFeaturedPalettes() {
    const container = document.getElementById("featured-palettes");

    container.innerHTML = this.featuredPalettes
      .map(
        (palette) => `
            <div class="featured-palette-card">
                <h3 class="featured-palette-name">${this.escapeHtml(palette.name)}</h3>
                <p class="featured-palette-description">${this.escapeHtml(palette.description)}</p>
                <div class="featured-palette-colors">
                    ${palette.colors
                      .map(
                        (color) => `
                        <div class="featured-color" style="background-color: ${color};" data-hex="${color.toUpperCase()}"></div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="featured-palette-actions">
                    <button class="btn btn-primary btn-small" onclick="colorGenerator.useFeaturedPalette('${palette.id}')" style="flex: 2;">
                        <i class="fas fa-magic"></i>
                        Use This Palette
                    </button>
                    <button class="btn btn-outline btn-small" onclick="colorGenerator.copyFeaturedPalette('${palette.id}')">
                        <i class="fas fa-copy"></i>
                        Copy
                    </button>
                </div>
            </div>
        `,
      )
      .join("");
  }

  useFeaturedPalette(paletteId) {
    const palette = this.featuredPalettes.find((p) => p.id === paletteId);
    if (!palette) return;

    this.currentColors = [...palette.colors];
    this.baseColor = palette.colors[0];

    // Update UI
    document.getElementById("base-color").value = this.baseColor;
    document.getElementById("base-color-hex").textContent = this.baseColor;
    document.getElementById("harmony-select").value = "pink-harmony";
    document.getElementById("palette-name").value = palette.name;

    this.renderPalette();
    this.updateColorSwatches();
    this.showNotification(`"${palette.name}" loaded!`, "success");
  }

  copyFeaturedPalette(paletteId) {
    const palette = this.featuredPalettes.find((p) => p.id === paletteId);
    if (!palette) return;

    const hexCodes = palette.colors.join(", ");
    this.copyToClipboard(hexCodes);
    this.showNotification(`"${palette.name}" colors copied!`, "success");
  }

  // Social Sharing
  sharePalette(platform, paletteId = null) {
    const palette = paletteId
      ? this.savedPalettes.find((p) => p.id === paletteId)
      : {
          name:
            document.getElementById("palette-name").value || "My Color Palette",
          colors: this.currentColors,
        };

    if (!palette || palette.colors.length === 0) {
      this.showNotification("Generate a palette first!", "error");
      return;
    }

    const colorsText = palette.colors.join(" ");
    const shareText = `Check out my color palette "${palette.name}" created with Art Mecca! ${colorsText}`;

    switch (platform) {
      case "twitter":
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(twitterUrl, "_blank");
        break;

      case "pinterest":
        // For Pinterest, we'd need an image. For now, just copy the colors.
        this.copyToClipboard(shareText);
        this.showNotification(
          "Palette copied! Paste it on Pinterest.",
          "success",
        );
        break;

      case "link":
        this.copyToClipboard(shareText);
        this.showNotification("Palette link copied to clipboard!", "success");
        break;

      case "download":
        this.exportPNG();
        break;
    }
  }

  // Existing color generation functions (keep all your existing methods)
  hexToHSL(hex) {
    hex = hex.replace("#", "");

    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  HSLToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r, g, b;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    r = Math.round((r + m) * 255)
      .toString(16)
      .padStart(2, "0");
    g = Math.round((g + m) * 255)
      .toString(16)
      .padStart(2, "0");
    b = Math.round((b + m) * 255)
      .toString(16)
      .padStart(2, "0");

    return `#${r}${g}${b}`;
  }

  generateHarmonyColors(baseHSL, harmonyType, count) {
    const colors = [baseHSL];
    const saturation = parseInt(document.getElementById("saturation").value);

    switch (harmonyType) {
      case "complementary":
        colors.push({
          h: (baseHSL.h + 180) % 360,
          s: saturation,
          l: baseHSL.l,
        });
        break;

      case "analogous":
        for (let i = 1; i < count; i++) {
          colors.push({
            h: (baseHSL.h + i * 30) % 360,
            s: saturation,
            l: baseHSL.l,
          });
        }
        break;

      case "triadic":
        colors.push(
          { h: (baseHSL.h + 120) % 360, s: saturation, l: baseHSL.l },
          { h: (baseHSL.h + 240) % 360, s: saturation, l: baseHSL.l },
        );
        break;

      case "tetradic":
        colors.push(
          { h: (baseHSL.h + 90) % 360, s: saturation, l: baseHSL.l },
          { h: (baseHSL.h + 180) % 360, s: saturation, l: baseHSL.l },
          { h: (baseHSL.h + 270) % 360, s: saturation, l: baseHSL.l },
        );
        break;

      case "monochromatic":
        for (let i = 1; i < count; i++) {
          const lightness = Math.max(10, Math.min(90, baseHSL.l + i * 15 - 30));
          colors.push({
            h: baseHSL.h,
            s: saturation,
            l: lightness,
          });
        }
        break;

      case "split-complementary":
        colors.push(
          { h: (baseHSL.h + 150) % 360, s: saturation, l: baseHSL.l },
          { h: (baseHSL.h + 210) % 360, s: saturation, l: baseHSL.l },
        );
        break;

      case "pink-harmony":
        // Special pink-focused harmony
        const pinkVariations = [
          { h: baseHSL.h, s: saturation, l: baseHSL.l }, // Original
          { h: (baseHSL.h + 330) % 360, s: saturation, l: baseHSL.l + 10 }, // Warmer pink
          { h: (baseHSL.h + 30) % 360, s: saturation - 20, l: baseHSL.l + 15 }, // Lighter pink
          { h: (baseHSL.h + 300) % 360, s: saturation + 10, l: baseHSL.l - 10 }, // Deeper pink
          { h: (baseHSL.h + 180) % 360, s: saturation - 30, l: baseHSL.l + 20 }, // Complementary light
        ];
        return pinkVariations.slice(0, count);
    }

    // Ensure we have exactly the requested number of colors
    while (colors.length < count) {
      const lastColor = colors[colors.length - 1];
      colors.push({
        h: (lastColor.h + 30) % 360,
        s: saturation,
        l: Math.max(20, Math.min(80, lastColor.l + 5)),
      });
    }

    return colors.slice(0, count);
  }

  generatePalette() {
    const baseHSL = this.hexToHSL(this.baseColor);
    const harmonyType = document.getElementById("harmony-select").value;
    const paletteSize = parseInt(document.getElementById("palette-size").value);

    const harmonyHSL = this.generateHarmonyColors(
      baseHSL,
      harmonyType,
      paletteSize,
    );
    this.currentColors = harmonyHSL.map((hsl) =>
      this.HSLToHex(hsl.h, hsl.s, hsl.l),
    );

    this.renderPalette();
    this.updateColorSwatches();
  }

  generateRandomPalette() {
    // Generate random base color
    const randomHex =
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    this.baseColor = randomHex;

    // Update UI
    document.getElementById("base-color").value = randomHex;
    document.getElementById("base-color-hex").textContent = randomHex;

    // Random harmony type
    const harmonies = [
      "complementary",
      "analogous",
      "triadic",
      "tetradic",
      "monochromatic",
      "split-complementary",
      "pink-harmony",
    ];
    const randomHarmony =
      harmonies[Math.floor(Math.random() * harmonies.length)];
    document.getElementById("harmony-select").value = randomHarmony;

    // Random saturation
    const randomSaturation = Math.floor(Math.random() * 50) + 50; // 50-100%
    document.getElementById("saturation").value = randomSaturation;
    document.getElementById("saturation-value").textContent =
      `${randomSaturation}%`;

    this.generatePalette();
  }

  renderPalette() {
    if (this.currentColors.length === 0) return;

    const width = this.canvas.width / this.currentColors.length;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.currentColors.forEach((color, index) => {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(index * width, 0, width, this.canvas.height);
    });
  }

  updateColorSwatches() {
    const container = document.getElementById("current-colors");

    container.innerHTML = this.currentColors
      .map(
        (color, index) => `
            <div class="color-swatch-compact">
                <div class="color-preview" style="background-color: ${color};"></div>
                <div class="color-info">
                    <span class="color-hex">${color.toUpperCase()}</span>
                    <button class="btn-copy-color" data-color="${color}" title="Copy HEX">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("");

    // Add copy functionality to color swatches
    container.querySelectorAll(".btn-copy-color").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const color = e.currentTarget.getAttribute("data-color");
        this.copyToClipboard(color);
        this.showNotification(`Copied ${color}`, "success");
      });
    });
  }

  // Export Functions
  exportCSS() {
    if (this.currentColors.length === 0) {
      this.showNotification("Generate a palette first!", "error");
      return;
    }

    const paletteName =
      document.getElementById("palette-name").value || "color-palette";
    const cssVars = this.currentColors
      .map((color, index) => `  --${paletteName}-${index + 1}: ${color};`)
      .join("\n");

    const css = `/* ${paletteName} Color Palette */\n:root {\n${cssVars}\n}`;

    this.displayExportOutput(css, "css");
    this.copyToClipboard(css);
    this.showNotification("CSS variables copied to clipboard!", "success");
  }

  exportJSON() {
    if (this.currentColors.length === 0) {
      this.showNotification("Generate a palette first!", "error");
      return;
    }

    const paletteData = {
      name: document.getElementById("palette-name").value || "My Color Palette",
      colors: this.currentColors,
      baseColor: this.baseColor,
      harmony: document.getElementById("harmony-select").value,
      generatedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(paletteData, null, 2);
    this.displayExportOutput(json, "json");
    this.copyToClipboard(json);
    this.showNotification("JSON data copied to clipboard!", "success");
  }

  exportPNG() {
    if (this.currentColors.length === 0) {
      this.showNotification("Generate a palette first!", "error");
      return;
    }

    // Create a temporary canvas for download
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = 800;
    tempCanvas.height = 400;

    // Draw background
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw color bars
    const colorWidth = tempCanvas.width / this.currentColors.length;
    this.currentColors.forEach((color, index) => {
      tempCtx.fillStyle = color;
      tempCtx.fillRect(
        index * colorWidth,
        0,
        colorWidth,
        tempCanvas.height - 100,
      );
    });

    // Add color labels
    tempCtx.fillStyle = "#333333";
    tempCtx.font = "bold 20px Inter, sans-serif";
    tempCtx.textAlign = "center";

    this.currentColors.forEach((color, index) => {
      const x = index * colorWidth + colorWidth / 2;
      const y = tempCanvas.height - 40;

      tempCtx.fillText(color.toUpperCase(), x, y);
    });

    // Add title
    const paletteName =
      document.getElementById("palette-name").value || "Color Palette";
    tempCtx.font = "bold 24px Inter, sans-serif";
    tempCtx.fillText(paletteName, tempCanvas.width / 2, tempCanvas.height - 70);

    // Download
    const link = document.createElement("a");
    link.download = `${paletteName.replace(/\s+/g, "-").toLowerCase()}-palette.png`;
    link.href = tempCanvas.toDataURL();
    link.click();

    this.showNotification("PNG image downloaded!", "success");
  }

  copyHEX() {
    if (this.currentColors.length === 0) {
      this.showNotification("Generate a palette first!", "error");
      return;
    }

    const hexCodes = this.currentColors.join(", ");
    this.copyToClipboard(hexCodes);
    this.showNotification("HEX codes copied to clipboard!", "success");
  }

  displayExportOutput(content, type) {
    const output = document.getElementById("export-output");
    output.innerHTML = `
            <div class="export-content">
                <div class="export-header">
                    <span class="export-type">${type.toUpperCase()}</span>
                    <button class="btn-copy-export" onclick="colorGenerator.copyToClipboard(\`${content.replace(/`/g, "\\`")}\`)">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <pre class="export-code">${this.escapeHtml(content)}</pre>
            </div>
        `;
  }

  // Utility Functions
  copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  showNotification(message, type = "info") {
    // Remove existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === "success" ? "check" : type === "error" ? "exclamation" : "info"}-circle"></i>
                <span>${message}</span>
            </div>
        `;

    // Add notification styles if not already added
    if (!document.querySelector("#notification-styles")) {
      const styles = document.createElement("style");
      styles.id = "notification-styles";
      styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-lg);
                    padding: var(--space-4);
                    border-left: 4px solid var(--primary);
                    z-index: 1000;
                    animation: slideInRight 0.3s ease;
                    max-width: 300px;
                }
                .notification-success {
                    border-left-color: var(--success);
                }
                .notification-error {
                    border-left-color: var(--error);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                }
                .notification-content i {
                    font-size: 1.2em;
                }
                .notification-success .notification-content i {
                    color: var(--success);
                }
                .notification-error .notification-content i {
                    color: var(--error);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  }
}

// Initialize the generator when DOM is loaded
let colorGenerator;
document.addEventListener("DOMContentLoaded", () => {
  colorGenerator = new ColorPaletteGenerator();
});
