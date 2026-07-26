/**
 * Analytics Dashboard - Real Firestore Data
 * Tracks user's artwork performance: likes, cheers, engagement
 * FIXED: Uses data-theme attribute for header/footer light mode support
 */

class AnalyticsDashboard {
  constructor() {
    this.currentUser = null;
    this.artworks = [];
    this.filteredArtworks = [];
    this.currentPeriod = "week";
    this.unsubscribe = null;
    this.charts = {};
    this.isLoading = true;
    this.hudMode = false;
    this.scanlinesEnabled = true;
    this.gridMode = false;
    this.init();
  }

  async init() {
    this.showLoading(true);

    // Apply saved theme immediately for header/footer
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedColorTheme = localStorage.getItem("colorTheme") || "pink-purple";
    if (savedColorTheme === "blue-green") {
      document.body.classList.add("blue-green");
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        const authRequired = document.getElementById("authRequired");
        const analyticsContent = document.getElementById("analyticsContent");
        if (authRequired) authRequired.style.display = "block";
        if (analyticsContent) analyticsContent.style.display = "none";
        this.showLoading(false);
        return;
      }

      this.currentUser = user;
      const authRequired = document.getElementById("authRequired");
      const analyticsContent = document.getElementById("analyticsContent");
      if (authRequired) authRequired.style.display = "none";
      if (analyticsContent) analyticsContent.style.display = "block";

      await this.loadUserArtworks();
      this.setupThemeControls();
      this.setupHUDControls();
      this.setupEventListeners();
    });
  }

  async loadUserArtworks() {
    try {
      this.showLoading(true);

      const snapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("artistId", "==", this.currentUser.uid)
        .where("status", "==", "published")
        .get();

      this.artworks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      }));

      this.artworks.sort((a, b) => b.createdAt - a.createdAt);

      console.log(`✅ Loaded ${this.artworks.length} artworks for analytics`);

      this.setupRealtimeListener();
      this.applyFilters();
      this.renderAll();
    } catch (error) {
      console.error("Error loading artworks:", error);
      this.showError("Failed to load analytics data. Please refresh.");
    } finally {
      this.showLoading(false);
    }
  }

  setupRealtimeListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = firebase
      .firestore()
      .collection("artworks")
      .where("artistId", "==", this.currentUser.uid)
      .where("status", "==", "published")
      .onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const id = change.doc.id;

            if (change.type === "modified") {
              const index = this.artworks.findIndex((a) => a.id === id);
              if (index !== -1) {
                this.artworks[index] = {
                  id,
                  ...data,
                  createdAt:
                    data.createdAt?.toDate?.() || new Date(data.createdAt),
                };
              }
            } else if (change.type === "added") {
              this.artworks.push({
                id,
                ...data,
                createdAt:
                  data.createdAt?.toDate?.() || new Date(data.createdAt),
              });
              this.artworks.sort((a, b) => b.createdAt - a.createdAt);
            } else if (change.type === "removed") {
              this.artworks = this.artworks.filter((a) => a.id !== id);
            }
          });

          this.applyFilters();
          this.renderAll();
        },
        (error) => {
          console.error("Realtime listener error:", error);
        },
      );
  }

  applyFilters() {
    const now = new Date();
    let startDate;

    switch (this.currentPeriod) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "all":
      default:
        this.filteredArtworks = [...this.artworks];
        return;
    }

    this.filteredArtworks = this.artworks.filter((art) => {
      const artDate =
        art.createdAt instanceof Date ? art.createdAt : new Date(art.createdAt);
      return artDate >= startDate;
    });
  }

  renderAll() {
    this.renderStats();
    this.renderTopArtworks();
    this.renderCharts();
    this.renderEngagementTotal();
    // Update colors after render
    setTimeout(() => this.updateChartColors(), 100);
  }

  renderStats() {
    const artworks = this.filteredArtworks;

    const totalArtworks = artworks.length;
    const totalLikes = artworks.reduce((sum, art) => sum + (art.likes || 0), 0);
    const totalCheers = artworks.reduce(
      (sum, art) => sum + (art.cheers || 0),
      0,
    );
    const avgEngagement =
      totalArtworks > 0
        ? Math.round((totalLikes + totalCheers) / totalArtworks)
        : 0;

    document.getElementById("totalArtworks").textContent = totalArtworks;
    document.getElementById("totalLikes").textContent = totalLikes;
    document.getElementById("totalCheers").textContent = totalCheers;
    document.getElementById("avgEngagement").textContent = avgEngagement;
  }

  renderTopArtworks() {
    const container = document.getElementById("topArtworksList");
    const artworks = this.filteredArtworks;

    if (!container) return;

    if (artworks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-analytics">
          <i class="fas fa-palette"></i>
          <h4>No artworks yet</h4>
          <p>Upload your first artwork to see analytics!</p>
          <a href="/pages/community/upload.html" class="btn-upload-analytics">
            <i class="fas fa-plus"></i> Upload Artwork
          </a>
        </div>
      `;
      return;
    }

    const sortedArtworks = [...artworks]
      .sort(
        (a, b) =>
          (b.likes || 0) + (b.cheers || 0) - ((a.likes || 0) + (a.cheers || 0)),
      )
      .slice(0, 5);

    container.innerHTML = sortedArtworks
      .map((art, index) => {
        const totalEngagement = (art.likes || 0) + (art.cheers || 0);
        const medalEmojis = ["🥇", "🥈", "🥉"];
        const rankDisplay = index < 3 ? medalEmojis[index] : `#${index + 1}`;

        return `
        <div class="top-artwork-item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
          <div class="artwork-rank">${rankDisplay}</div>
          <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title || "Artwork")}" class="artwork-img" loading="lazy">
          <div class="artwork-info">
            <div class="artwork-title">${this.escapeHtml(art.title || "Untitled")}</div>
            <div class="artwork-stats">
              <span><i class="fas fa-heart" style="color: #ff69b4;"></i> ${art.likes || 0}</span>
              <span><i class="fas fa-glass-cheers" style="color: #f59e0b;"></i> ${art.cheers || 0}</span>
              <span><i class="fas fa-calendar"></i> ${this.formatDate(art.createdAt)}</span>
            </div>
          </div>
          <div class="engagement-score">${totalEngagement}</div>
        </div>
      `;
      })
      .join("");
  }

  renderCharts() {
    this.renderEngagementChart();
    this.renderBreakdownChart();
  }

  getTimeSeriesData() {
    const artworks = [...this.filteredArtworks].sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    const dateMap = new Map();

    artworks.forEach((art) => {
      const date =
        art.createdAt instanceof Date ? art.createdAt : new Date(art.createdAt);
      const dateKey = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { likes: 0, cheers: 0, date: date });
      }
      const entry = dateMap.get(dateKey);
      entry.likes += art.likes || 0;
      entry.cheers += art.cheers || 0;
    });

    const sortedEntries = Array.from(dateMap.entries()).sort(
      (a, b) => a[1].date - b[1].date,
    );

    const dates = sortedEntries.map((entry) => entry[0]);
    const likesData = sortedEntries.map((entry) => entry[1].likes);
    const cheersData = sortedEntries.map((entry) => entry[1].cheers);

    return { dates, likesData, cheersData };
  }

  renderEngagementChart() {
    const { dates, likesData, cheersData } = this.getTimeSeriesData();
    const ctx = document.getElementById("engagementChart");

    if (!ctx) return;

    if (this.charts.engagement) {
      this.charts.engagement.destroy();
    }

    if (
      dates.length === 0 ||
      (likesData.every((v) => v === 0) && cheersData.every((v) => v === 0))
    ) {
      this.showEmptyChart(ctx);
      return;
    }

    const isBlueGreen = document.body.classList.contains("blue-green");
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";

    let color1, color2, color1Rgba, color2Rgba, textColor, gridColor;

    if (isBlueGreen) {
      color1 = "#58ebfe";
      color2 = "#4ff3a6";
      color1Rgba = "rgba(88, 235, 254, 0.1)";
      color2Rgba = "rgba(79, 243, 166, 0.1)";
    } else {
      color1 = "#ff00ea";
      color2 = "#8A19E1";
      color1Rgba = "rgba(255, 0, 234, 0.1)";
      color2Rgba = "rgba(138, 25, 225, 0.1)";
    }

    textColor = isLight ? "#5a4a70" : "#b0a8c8";
    gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";

    this.charts.engagement = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Likes",
            data: likesData,
            borderColor: color1,
            backgroundColor: color1Rgba,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: color1,
            pointBorderColor: isLight ? "#fff" : "#fff",
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          },
          {
            label: "Cheers",
            data: cheersData,
            borderColor: color2,
            backgroundColor: color2Rgba,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: color2,
            pointBorderColor: isLight ? "#fff" : "#fff",
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 15,
              color: textColor,
            },
          },
          tooltip: {
            backgroundColor: isLight
              ? "rgba(255,255,255,0.95)"
              : "rgba(20, 15, 30, 0.95)",
            titleColor: isLight ? "#1a1528" : "#f0edf7",
            bodyColor: isLight ? "#5a4a70" : "#b0a8c8",
            padding: 12,
            cornerRadius: 8,
            borderColor: isLight
              ? "rgba(0,0,0,0.06)"
              : "rgba(255, 105, 180, 0.15)",
            borderWidth: 1,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor, drawBorder: false },
            ticks: { stepSize: 1, color: isLight ? "#8a7a9a" : "#7a7290" },
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              color: isLight ? "#8a7a9a" : "#7a7290",
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });
  }

  renderBreakdownChart() {
    const artworks = this.filteredArtworks;
    const totalLikes = artworks.reduce((sum, art) => sum + (art.likes || 0), 0);
    const totalCheers = artworks.reduce(
      (sum, art) => sum + (art.cheers || 0),
      0,
    );

    const ctx = document.getElementById("breakdownChart");

    if (!ctx) return;

    if (this.charts.breakdown) {
      this.charts.breakdown.destroy();
    }

    if (totalLikes === 0 && totalCheers === 0) {
      this.showEmptyChart(ctx);
      return;
    }

    const isBlueGreen = document.body.classList.contains("blue-green");
    let color1, color2;

    if (isBlueGreen) {
      color1 = "#58ebfe";
      color2 = "#4ff3a6";
    } else {
      color1 = "#ff00ea";
      color2 = "#8A19E1";
    }

    this.charts.breakdown = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Likes", "Cheers"],
        datasets: [
          {
            data: [totalLikes, totalCheers],
            backgroundColor: [color1, color2],
            hoverBackgroundColor: [color1 + "cc", color2 + "cc"],
            borderWidth: 0,
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              padding: 18,
              color:
                document.documentElement.getAttribute("data-theme") === "light"
                  ? "#5a4a70"
                  : "#b0a8c8",
            },
          },
          tooltip: {
            backgroundColor:
              document.documentElement.getAttribute("data-theme") === "light"
                ? "rgba(255,255,255,0.95)"
                : "rgba(20, 15, 30, 0.95)",
            titleColor:
              document.documentElement.getAttribute("data-theme") === "light"
                ? "#1a1528"
                : "#f0edf7",
            bodyColor:
              document.documentElement.getAttribute("data-theme") === "light"
                ? "#5a4a70"
                : "#b0a8c8",
            padding: 12,
            cornerRadius: 8,
            borderColor:
              document.documentElement.getAttribute("data-theme") === "light"
                ? "rgba(0,0,0,0.06)"
                : "rgba(255, 105, 180, 0.15)",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${context.raw} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "65%",
        animation: {
          animateRotate: true,
          duration: 1000,
        },
      },
    });
  }

  showEmptyChart(ctx) {
    if (this.charts.engagement) {
      this.charts.engagement.destroy();
    }

    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    const textColor = isLight ? "#8a7a9a" : "#7a7290";

    this.charts.engagement = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["No data yet"],
        datasets: [
          {
            label: "Likes",
            data: [0],
            borderColor: isLight
              ? "rgba(0,0,0,0.05)"
              : "rgba(255, 255, 255, 0.1)",
            backgroundColor: isLight
              ? "rgba(0,0,0,0.02)"
              : "rgba(255, 255, 255, 0.02)",
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: isLight ? "rgba(0,0,0,0.03)" : "rgba(255, 255, 255, 0.03)",
            },
            ticks: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor },
          },
        },
      },
    });
  }

  renderEngagementTotal() {
    const total = this.filteredArtworks.reduce(
      (sum, art) => sum + (art.likes || 0) + (art.cheers || 0),
      0,
    );
    const element = document.getElementById("totalEngagement");
    if (element) {
      element.textContent = total;
    }
  }

  // ============================================
  // THEME CONTROLS - FIXED for header/footer
  // ============================================
  setupThemeControls() {
    const pinkPurpleBtn = document.getElementById("themePinkPurple");
    const blueGreenBtn = document.getElementById("themeBlueGreen");
    const darkBtn = document.getElementById("themeDark");
    const lightBtn = document.getElementById("themeLight");

    // Color theme toggles
    if (pinkPurpleBtn) {
      pinkPurpleBtn.addEventListener("click", () => {
        document.body.classList.remove("blue-green");
        pinkPurpleBtn.classList.add("active");
        blueGreenBtn?.classList.remove("active");
        localStorage.setItem("colorTheme", "pink-purple");
        this.updateChartColors();
      });
    }

    if (blueGreenBtn) {
      blueGreenBtn.addEventListener("click", () => {
        document.body.classList.add("blue-green");
        blueGreenBtn.classList.add("active");
        pinkPurpleBtn?.classList.remove("active");
        localStorage.setItem("colorTheme", "blue-green");
        this.updateChartColors();
      });
    }

    // Dark/Light toggles - FIXED: Use data-theme attribute
    if (darkBtn) {
      darkBtn.addEventListener("click", () => {
        this.setTheme("dark");
        darkBtn.classList.add("active");
        lightBtn?.classList.remove("active");
      });
    }

    if (lightBtn) {
      lightBtn.addEventListener("click", () => {
        this.setTheme("light");
        lightBtn.classList.add("active");
        darkBtn?.classList.remove("active");
      });
    }
  }

  setTheme(theme) {
    // Set data-theme on html element for header/footer
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Also toggle body class for page-specific styles
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    // Update chart colors
    this.updateChartColors();

    // Update gradient background
    this.updateGradientColors();
  }

  updateGradientColors() {
    const isBlueGreen = document.body.classList.contains("blue-green");
    const bg = document.querySelector(".gradient-bg");
    if (!bg) return;

    let color1, color2, color3;
    if (isBlueGreen) {
      color1 = "#58ebfe";
      color2 = "#4ff3a6";
      color3 = "#3B82F6";
    } else {
      color1 = "#ff00ea";
      color2 = "#8A19E1";
      color3 = "#ff69b4";
    }

    bg.style.background = `
      radial-gradient(ellipse at 0% 0%, ${color2} 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, ${color1} 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, ${color3} 0%, transparent 60%)
    `;
  }

  updateChartColors() {
    const isBlueGreen = document.body.classList.contains("blue-green");
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";

    let color1, color2, color1Rgba, color2Rgba;

    if (isBlueGreen) {
      color1 = "#58ebfe";
      color2 = "#4ff3a6";
      color1Rgba = "rgba(88, 235, 254, 0.1)";
      color2Rgba = "rgba(79, 243, 166, 0.1)";
    } else {
      color1 = "#ff00ea";
      color2 = "#8A19E1";
      color1Rgba = "rgba(255, 0, 234, 0.1)";
      color2Rgba = "rgba(138, 25, 225, 0.1)";
    }

    // Update engagement chart
    if (this.charts.engagement) {
      this.charts.engagement.data.datasets[0].borderColor = color1;
      this.charts.engagement.data.datasets[0].backgroundColor = color1Rgba;
      this.charts.engagement.data.datasets[0].pointBackgroundColor = color1;
      this.charts.engagement.data.datasets[1].borderColor = color2;
      this.charts.engagement.data.datasets[1].backgroundColor = color2Rgba;
      this.charts.engagement.data.datasets[1].pointBackgroundColor = color2;

      // Update legend/text colors for light mode
      const textColor = isLight ? "#5a4a70" : "#b0a8c8";
      const gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";
      this.charts.engagement.options.plugins.legend.labels.color = textColor;
      this.charts.engagement.options.scales.y.grid.color = gridColor;
      this.charts.engagement.options.scales.y.ticks.color = isLight
        ? "#8a7a9a"
        : "#7a7290";
      this.charts.engagement.options.scales.x.ticks.color = isLight
        ? "#8a7a9a"
        : "#7a7290";

      this.charts.engagement.update();
    }

    // Update breakdown chart
    if (this.charts.breakdown) {
      this.charts.breakdown.data.datasets[0].backgroundColor = [color1, color2];
      this.charts.breakdown.data.datasets[0].hoverBackgroundColor = [
        color1 + "cc",
        color2 + "cc",
      ];
      this.charts.breakdown.options.plugins.legend.labels.color = isLight
        ? "#5a4a70"
        : "#b0a8c8";
      this.charts.breakdown.update();
    }

    // Update text colors
    document
      .querySelectorAll(".stat-value, .engagement-value, .page-header h1")
      .forEach((el) => {
        el.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
        el.style.webkitBackgroundClip = "text";
        el.style.webkitTextFillColor = "transparent";
      });

    // Update accent colors
    document
      .querySelectorAll(".stat-card::before, .engagement-card::before")
      .forEach((el) => {
        el.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
      });

    // Update particle colors
    document.querySelectorAll(".particle").forEach((p, i) => {
      const colors = [color1, color2, color1, color2, color1, color2];
      p.style.background = colors[i % colors.length];
      p.style.boxShadow = `0 0 10px ${colors[i % colors.length]}`;
    });
  }

  // ============================================
  // HUD CONTROLS
  // ============================================
  setupHUDControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "h" || e.key === "H") this.toggleHUD();
      if (e.key === "s" || e.key === "S") this.toggleScanlines();
      if (e.key === "g" || e.key === "G") this.toggleGrid();
    });

    const hudBtn = document.getElementById("hudToggle");
    const scanBtn = document.getElementById("scanlineToggle");
    const gridBtn = document.getElementById("gridToggle");

    if (hudBtn) hudBtn.addEventListener("click", () => this.toggleHUD());
    if (scanBtn)
      scanBtn.addEventListener("click", () => this.toggleScanlines());
    if (gridBtn) gridBtn.addEventListener("click", () => this.toggleGrid());
  }

  toggleHUD() {
    this.hudMode = !this.hudMode;
    document.body.classList.toggle("hud-mode", this.hudMode);
    const btn = document.getElementById("hudToggle");
    if (btn) btn.classList.toggle("active", this.hudMode);
  }

  toggleScanlines() {
    this.scanlinesEnabled = !this.scanlinesEnabled;
    const overlay = document.querySelector(".scanline-overlay");
    const btn = document.getElementById("scanlineToggle");
    if (overlay) overlay.classList.toggle("active", this.scanlinesEnabled);
    if (btn) btn.classList.toggle("active", this.scanlinesEnabled);
  }

  toggleGrid() {
    this.gridMode = !this.gridMode;
    document.body.classList.toggle("grid-mode", this.gridMode);
    const btn = document.getElementById("gridToggle");
    if (btn) btn.classList.toggle("active", this.gridMode);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  setupEventListeners() {
    const periodBtns = document.querySelectorAll(".period-btn");

    periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        periodBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentPeriod = btn.dataset.period;
        this.applyFilters();
        this.renderAll();
      });
    });
  }

  // ============================================
  // UTILITY
  // ============================================
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(timestamp) {
    if (!timestamp) return "Recently";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  showLoading(show) {
    const spinner = document.getElementById("analyticsLoading");
    if (spinner) {
      spinner.style.display = show ? "flex" : "none";
    }
  }

  showError(message) {
    const errorEl = document.getElementById("analyticsError");
    if (errorEl) {
      errorEl.style.display = "block";
      const span = errorEl.querySelector("span");
      if (span) span.textContent = message;
      setTimeout(() => {
        errorEl.style.display = "none";
      }, 5000);
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.analytics = new AnalyticsDashboard();
});
