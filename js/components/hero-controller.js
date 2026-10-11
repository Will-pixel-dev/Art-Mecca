// ============================================================
// HERO CONTROLLER — 3-Layer System
// Reusable across all hero pages
// ============================================================

class HeroController {
  constructor(pageKey, options = {}) {
    this.pageKey = pageKey;
    this.adminControlsEnabled = options.adminControlsEnabled === true;
    this.root = document.querySelector(`[data-hero-key="${pageKey}"]`);
    this.layer1El = document.getElementById("heroLayer1");
    this.layer2El = document.getElementById("heroLayer2");

    this.settings = {
      layer1Url: null,
      layer1Type: "image",
      layer2Url: null,
      layer2Type: null,
      layer2Enabled: false,
      layer2Opacity: 0.6,
      layer2Blend: "screen",
      overlayOpacity: 0.4,
      contentAnchor: "center",
    };

    this.isAdmin = false;
    this.currentUser = null;
    this.uploadInProgress = false;

    // File size limits (per spec)
    this.MAX_IMAGE_MB = 15;
    this.MAX_VIDEO_MB = 80;

    this.init();
  }

  async init() {
    if (!this.root) {
      console.warn(`[HeroController] No [data-hero-key="${this.pageKey}"] found.`);
      return;
    }

    // Wait for Firebase
    this.waitForFirebase(async () => {
      await this.loadHeroData();
      this.applySettings();

      if (this.adminControlsEnabled) {
        firebase.auth().onAuthStateChanged(async (user) => {
          this.currentUser = user;
          if (user) {
            await this.checkAdmin();
            if (this.isAdmin) this.injectAdminUI();
          } else {
            this.removeAdminUI();
          }
        });
      }
    });
  }

  waitForFirebase(callback, attempts = 0) {
    if (typeof firebase !== "undefined" && firebase.firestore) {
      return callback();
    }
    if (attempts > 20) {
      console.warn("[HeroController] Firebase not available.");
      return;
    }
    setTimeout(() => this.waitForFirebase(callback, attempts + 1), 250);
  }

  async checkAdmin() {
    try {
      const db = firebase.firestore();
      const doc = await db.collection("users").doc(this.currentUser.uid).get();
      if (doc.exists) {
        const data = doc.data();
        this.isAdmin =
          data.role === "admin" ||
          data.role === "moderator" ||
          data.isAdmin === true;
      }
    } catch (err) {
      console.warn("[HeroController] Admin check failed:", err);
      this.isAdmin = false;
    }
  }

  // ============================================
  // LOAD FROM FIRESTORE
  // ============================================
  async loadHeroData() {
    try {
      const db = firebase.firestore();
      const doc = await db.collection("heroes").doc(this.pageKey).get();

      if (doc.exists) {
        this.settings = { ...this.settings, ...doc.data() };
        console.log(`✅ Hero loaded for "${this.pageKey}"`);
      } else {
        console.log(`ℹ️ No hero doc for "${this.pageKey}" — using defaults.`);
      }

      this.injectLayer1();
      this.injectLayer2();
    } catch (err) {
      console.error("[HeroController] Load failed:", err);
    }
  }

  // ============================================
  // INJECT LAYERS
  // ============================================
  injectLayer1() {
    if (!this.layer1El) return;
    this.layer1El.innerHTML = "";

    if (!this.settings.layer1Url) {
      // Fallback: gradient background stays as-is
      return;
    }

    if (this.settings.layer1Type === "video") {
      const vid = document.createElement("video");
      vid.src = this.settings.layer1Url;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      this.layer1El.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.src = this.settings.layer1Url;
      img.alt = "";
      this.layer1El.appendChild(img);
    }
  }

  injectLayer2() {
    if (!this.layer2El) return;
    this.layer2El.innerHTML = "";

    if (!this.settings.layer2Enabled || !this.settings.layer2Url) {
      this.layer2El.dataset.enabled = "false";
      return;
    }

    this.layer2El.dataset.enabled = "true";

    if (this.settings.layer2Type === "video") {
      const vid = document.createElement("video");
      vid.src = this.settings.layer2Url;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      this.layer2El.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.src = this.settings.layer2Url;
      img.alt = "";
      this.layer2El.appendChild(img);
    }
  }

  // ============================================
  // APPLY SETTINGS (anchor, opacities, blend)
  // ============================================
  applySettings() {
    if (!this.root) return;

    this.root.dataset.anchor = this.settings.contentAnchor || "center";

    this.root.style.setProperty(
      "--hero-overlay-opacity",
      String(this.settings.overlayOpacity ?? 0.4)
    );
    this.root.style.setProperty(
      "--hero-layer2-opacity",
      String(this.settings.layer2Opacity ?? 0.6)
    );
    this.root.style.setProperty(
      "--hero-layer2-blend",
      this.settings.layer2Blend || "screen"
    );
  }

  // ============================================
  // ADMIN UI
  // ============================================
  injectAdminUI() {
    if (document.getElementById("heroEditorTrigger")) return;

    const trigger = document.createElement("button");
    trigger.id = "heroEditorTrigger";
    trigger.className = "hero-editor-trigger";
    trigger.innerHTML = '⚙️ Hero Editor';
    trigger.addEventListener("click", () => this.togglePanel());
    document.body.appendChild(trigger);

    const panel = document.createElement("div");
    panel.id = "heroEditorPanel";
    panel.className = "hero-editor-panel";
    panel.innerHTML = this.panelHTML();
    document.body.appendChild(panel);

    this.bindPanelEvents();
    this.refreshPanelThumbs();
  }

  removeAdminUI() {
    document.getElementById("heroEditorTrigger")?.remove();
    document.getElementById("heroEditorPanel")?.remove();
  }

  togglePanel() {
    const panel = document.getElementById("heroEditorPanel");
    if (!panel) return;
    panel.classList.toggle("open");
  }

  panelHTML() {
    return `
      <div class="he-header">
        <h3>Hero — ${this.pageKey}</h3>
        <button class="he-close" type="button">×</button>
      </div>

      <div class="he-section">
        <label class="he-label">Layer 1 — Background</label>
        <button class="he-upload-btn" data-upload="layer1" type="button">
          ⬆ Upload Background
        </button>
        <input type="file" id="heLayer1Input" accept="image/*,video/*" style="display:none" />
        <div id="heLayer1Thumb"></div>
      </div>

      <div class="he-section">
        <label class="he-label">Layer 2 — Ambient Overlay</label>
        <label class="he-toggle">
          <input type="checkbox" id="heLayer2Enabled" />
          Enable overlay
        </label>
        <button class="he-upload-btn" data-upload="layer2" type="button" style="margin-top:0.5rem;">
          ⬆ Upload Overlay
        </button>
        <input type="file" id="heLayer2Input" accept="image/*,video/*" style="display:none" />
        <div id="heLayer2Thumb"></div>

        <label class="he-label" style="margin-top:0.75rem;">Blend Mode</label>
        <select id="heBlendMode">
          <option value="screen">screen (light overlays)</option>
          <option value="multiply">multiply (dark overlays)</option>
          <option value="overlay">overlay</option>
          <option value="lighten">lighten</option>
          <option value="darken">darken</option>
          <option value="normal">normal</option>
        </select>

        <label class="he-label" style="margin-top:0.75rem;">Overlay Opacity</label>
        <div class="he-slider-row">
          <input type="range" id="heLayer2Opacity" min="0" max="1" step="0.05" />
          <span class="he-value" id="heLayer2OpacityVal">0.6</span>
        </div>
      </div>

      <div class="he-section">
        <label class="he-label">Content Darkness</label>
        <div class="he-slider-row">
          <input type="range" id="heOverlayOpacity" min="0" max="0.9" step="0.05" />
          <span class="he-value" id="heOverlayOpacityVal">0.4</span>
        </div>
      </div>

      <div class="he-section">
        <label class="he-label">Content Position (desktop)</label>
        <div class="he-btn-row">
          <button class="he-anchor-btn" data-anchor="left" type="button">Left</button>
          <button class="he-anchor-btn" data-anchor="center" type="button">Center</button>
          <button class="he-anchor-btn" data-anchor="right" type="button">Right</button>
        </div>
        <p style="font-size:0.6rem;color:rgba(255,255,255,0.3);margin-top:0.4rem;font-family:var(--font-mono,monospace);">
          Mobile always centers content.
        </p>
      </div>

      <div class="he-status" id="heStatus"></div>
    `;
  }

  bindPanelEvents() {
    const panel = document.getElementById("heroEditorPanel");
    if (!panel) return;

    panel.querySelector(".he-close").addEventListener("click", () => this.togglePanel());

    // Upload buttons
    panel.querySelector('[data-upload="layer1"]').addEventListener("click", () => {
      document.getElementById("heLayer1Input").click();
    });
    panel.querySelector('[data-upload="layer2"]').addEventListener("click", () => {
      document.getElementById("heLayer2Input").click();
    });

    document.getElementById("heLayer1Input").addEventListener("change", (e) => {
      if (e.target.files[0]) this.uploadLayer("layer1", e.target.files[0]);
      e.target.value = "";
    });
    document.getElementById("heLayer2Input").addEventListener("change", (e) => {
      if (e.target.files[0]) this.uploadLayer("layer2", e.target.files[0]);
      e.target.value = "";
    });

    // Layer 2 toggle
    const l2Enabled = document.getElementById("heLayer2Enabled");
    l2Enabled.checked = !!this.settings.layer2Enabled;
    l2Enabled.addEventListener("change", async () => {
      this.settings.layer2Enabled = l2Enabled.checked;
      this.injectLayer2();
      await this.saveSetting("layer2Enabled", l2Enabled.checked);
    });

    // Blend mode
    const blendSel = document.getElementById("heBlendMode");
    blendSel.value = this.settings.layer2Blend || "screen";
    blendSel.addEventListener("change", async () => {
      this.settings.layer2Blend = blendSel.value;
      this.applySettings();
      await this.saveSetting("layer2Blend", blendSel.value);
    });

    // Layer 2 opacity
    const l2Opacity = document.getElementById("heLayer2Opacity");
    const l2OpacityVal = document.getElementById("heLayer2OpacityVal");
    l2Opacity.value = this.settings.layer2Opacity ?? 0.6;
    l2OpacityVal.textContent = Number(l2Opacity.value).toFixed(2);
    l2Opacity.addEventListener("input", () => {
      l2OpacityVal.textContent = Number(l2Opacity.value).toFixed(2);
      this.settings.layer2Opacity = parseFloat(l2Opacity.value);
      this.applySettings();
    });
    l2Opacity.addEventListener("change", () => {
      this.saveSetting("layer2Opacity", parseFloat(l2Opacity.value));
    });

    // Overlay darkness
    const overlay = document.getElementById("heOverlayOpacity");
    const overlayVal = document.getElementById("heOverlayOpacityVal");
    overlay.value = this.settings.overlayOpacity ?? 0.4;
    overlayVal.textContent = Number(overlay.value).toFixed(2);
    overlay.addEventListener("input", () => {
      overlayVal.textContent = Number(overlay.value).toFixed(2);
      this.settings.overlayOpacity = parseFloat(overlay.value);
      this.applySettings();
    });
    overlay.addEventListener("change", () => {
      this.saveSetting("overlayOpacity", parseFloat(overlay.value));
    });

    // Content anchor
    panel.querySelectorAll(".he-anchor-btn").forEach((btn) => {
      if (btn.dataset.anchor === (this.settings.contentAnchor || "center")) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", async () => {
        panel.querySelectorAll(".he-anchor-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.settings.contentAnchor = btn.dataset.anchor;
        this.applySettings();
        await this.saveSetting("contentAnchor", btn.dataset.anchor);
      });
    });
  }

  refreshPanelThumbs() {
    const l1 = document.getElementById("heLayer1Thumb");
    if (l1) {
      l1.innerHTML = this.settings.layer1Url
        ? `<div class="he-thumb">
             <img src="${this.settings.layer1Url}" alt="" />
             <span>${this.settings.layer1Type}</span>
             <button class="he-remove-btn" type="button" data-remove="layer1">Remove</button>
           </div>`
        : "";
      l1.querySelector("[data-remove]")?.addEventListener("click", () => this.removeLayer("layer1"));
    }

    const l2 = document.getElementById("heLayer2Thumb");
    if (l2) {
      l2.innerHTML = this.settings.layer2Url
        ? `<div class="he-thumb">
             <img src="${this.settings.layer2Url}" alt="" />
             <span>${this.settings.layer2Type}</span>
             <button class="he-remove-btn" type="button" data-remove="layer2">Remove</button>
           </div>`
        : "";
      l2.querySelector("[data-remove]")?.addEventListener("click", () => this.removeLayer("layer2"));
    }
  }

  setStatus(msg, type = "") {
    const el = document.getElementById("heStatus");
    if (!el) return;
    el.textContent = msg;
    el.className = "he-status" + (type ? " " + type : "");
  }

  // ============================================
  // UPLOAD
  // ============================================
  async uploadLayer(layer, file) {
    if (this.uploadInProgress) return;

    const isVideo = file.type.startsWith("video/");
    const sizeMB = file.size / (1024 * 1024);

    if (isVideo && sizeMB > this.MAX_VIDEO_MB) {
      this.setStatus(`Video too large (${sizeMB.toFixed(1)}MB / max ${this.MAX_VIDEO_MB}MB)`, "error");
      return;
    }
    if (!isVideo && sizeMB > this.MAX_IMAGE_MB) {
      this.setStatus(`Image too large (${sizeMB.toFixed(1)}MB / max ${this.MAX_IMAGE_MB}MB)`, "error");
      return;
    }

    this.uploadInProgress = true;
    this.setStatus(`Uploading ${layer}... (${sizeMB.toFixed(1)}MB)`);

    try {
      const storage = firebase.storage();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `heroes/${this.pageKey}/${layer}_${Date.now()}_${safeName}`;
      const snap = await storage.ref(path).put(file);
      const url = await snap.ref.getDownloadURL();

      const type = isVideo ? "video" : "image";

      this.settings[`${layer}Url`] = url;
      this.settings[`${layer}Type`] = type;
      if (layer === "layer2") {
        this.settings.layer2Enabled = true;
      }

      // Persist to Firestore
      const db = firebase.firestore();
      await db.collection("heroes").doc(this.pageKey).set(
        {
          [`${layer}Url`]: url,
          [`${layer}Type`]: type,
          ...(layer === "layer2" ? { layer2Enabled: true } : {}),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: this.currentUser.uid,
        },
        { merge: true }
      );

      // Refresh UI
      if (layer === "layer1") this.injectLayer1();
      if (layer === "layer2") {
        this.injectLayer2();
        const l2Enabled = document.getElementById("heLayer2Enabled");
        if (l2Enabled) l2Enabled.checked = true;
      }
      this.refreshPanelThumbs();
      this.applySettings();

      this.setStatus(`✅ ${layer} updated`, "success");
      setTimeout(() => this.setStatus(""), 3000);
    } catch (err) {
      console.error("[HeroController] Upload failed:", err);
      this.setStatus(`Upload failed: ${err.message || "unknown error"}`, "error");
    } finally {
      this.uploadInProgress = false;
    }
  }

  async removeLayer(layer) {
    if (!confirm(`Remove ${layer} from this hero?`)) return;

    try {
      const db = firebase.firestore();
      const updates = {
        [`${layer}Url`]: null,
        [`${layer}Type`]: null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      if (layer === "layer2") updates.layer2Enabled = false;

      await db.collection("heroes").doc(this.pageKey).set(updates, { merge: true });

      this.settings[`${layer}Url`] = null;
      this.settings[`${layer}Type`] = null;
      if (layer === "layer2") {
        this.settings.layer2Enabled = false;
        const l2Enabled = document.getElementById("heLayer2Enabled");
        if (l2Enabled) l2Enabled.checked = false;
      }

      if (layer === "layer1") this.injectLayer1();
      if (layer === "layer2") this.injectLayer2();
      this.refreshPanelThumbs();
      this.applySettings();

      this.setStatus(`✅ ${layer} removed`, "success");
      setTimeout(() => this.setStatus(""), 3000);
    } catch (err) {
      console.error("[HeroController] Remove failed:", err);
      this.setStatus(`Remove failed: ${err.message || "unknown error"}`, "error");
    }
  }

  // ============================================
  // SAVE A SINGLE SETTING
  // ============================================
  async saveSetting(key, value) {
    if (!this.isAdmin) return;
    try {
      const db = firebase.firestore();
      await db.collection("heroes").doc(this.pageKey).set(
        {
          [key]: value,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: this.currentUser.uid,
        },
        { merge: true }
      );
    } catch (err) {
      console.error(`[HeroController] Failed to save ${key}:`, err);
      this.setStatus(`Save failed for ${key}`, "error");
    }
  }
}

window.HeroController = HeroController;
