/**
 * Profile — Full Cyberpunk Character Screen
 * Three-layer hero system with palette control
 */

class Profile {
  constructor() {
    this.userId = null;
    this.currentUser = null;
    this.userData = null;
    this.isOwnProfile = false;
    this.bioExpanded = false;
    this.currentTheme = 'dark';
    this.activePalette = '#ff00ea';
    this.uploadModalTags = [];
    this.uploadsPage = 1;
    this.likedPage = 1;
    this.savedPage = 1;
    this.hasMoreUploads = true;
    this.hasMoreLiked = true;
    this.hasMoreSaved = true;
    this.isNSFWCreator = false;
    this.init();
  }

  // ============================================
  // 🚀 INIT
  // ============================================
  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.userId = urlParams.get('user');

    if (!this.userId) {
      this.showError();
      return;
    }

    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
      setTimeout(() => this.init(), 500);
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;
      this.isOwnProfile = this.currentUser && this.currentUser.uid === this.userId;

      await this.loadUserData();

      // Check NSFW age gate BEFORE rendering profile
      const canView = await this.checkNSFWAgeGate();
      if (!canView) {
        document.getElementById('loadingState').style.display = 'none';
        return;
      }

      // Load the PROFILE OWNER's theme FIRST (before rendering)
      this.loadProfileOwnerTheme();

      this.renderProfile();

      // Apply portfolio mode if URL has mode=portfolio
      if (this.isPortfolioMode()) {
        this.applyPortfolioMode();
      }

      this.setupAvatarUpload();
      this.setupEventListeners();

      // Apply the PROFILE OWNER's palette and theme
      this.applyPalette(this.activePalette);
      this.applyPaletteToHeader(this.activePalette);
      this.setupDynamicStyles();

      // Update UI for profile type (own vs others)
      this.updateUIForProfileType();

      document.getElementById('loadingState').style.display = 'none';
      document.getElementById('profileContent').style.display = 'block';
    });
  }

  // ============================================
  // 🚨 NSFW AGE GATE
  // ============================================

  async checkNSFWAgeGate() {
    if (this.isOwnProfile) return true;

    const profileOwner = this.userData;
    if (!profileOwner) return true;

    if (profileOwner.isNSFWCreator !== true) {
      return true;
    }

    if (!this.currentUser) {
      this.showNSFWAgeGate();
      return false;
    }

    try {
      const viewerDoc = await db.collection('users').doc(this.currentUser.uid).get();
      if (viewerDoc.exists) {
        const viewerData = viewerDoc.data();
        const viewerAge = parseInt(viewerData.age) || 0;

        if (viewerAge < 18) {
          this.showNSFWAgeGate();
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Error checking viewer age:', error);
    }

    this.showNSFWAgeGate();
    return false;
  }

  showNSFWAgeGate() {
    const profileContent = document.getElementById('profileContent');
    const loadingState = document.getElementById('loadingState');

    if (loadingState) loadingState.style.display = 'none';

    if (profileContent) {
      profileContent.innerHTML = `
        <div class="age-gate-profile" style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          padding: 2rem;
          text-align: center;
        ">
          <div class="age-gate-content" style="
            max-width: 500px;
            padding: 3rem 2.5rem;
            background: rgba(10, 5, 8, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 0, 64, 0.08);
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(255,0,64,0.1);
          ">
            <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">🔞</span>
            <h2 style="font-family: 'Orbitron', monospace; color: #f5eaff; font-size: 1.4rem; margin-bottom: 0.5rem; letter-spacing: 1px;">
              Age Restricted Profile
            </h2>
            <p style="color: #b8a0d0; margin-bottom: 1.5rem; line-height: 1.6; font-family: 'Rajdhani', sans-serif;">
              This artist has marked their profile as containing mature content.
              You must be <strong style="color: #ff0040;">18 or older</strong> to view this profile.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="/pages/community/gallery.html" style="
                padding: 0.6rem 1.5rem;
                background: rgba(255, 255, 255, 0.02);
                color: #f5eaff;
                border: 1px solid rgba(255, 0, 64, 0.08);
                border-radius: 4px;
                text-decoration: none;
                font-family: 'Rajdhani', sans-serif;
                font-weight: 600;
                font-size: 0.8rem;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
              ">
                <i class="fas fa-arrow-left"></i> Back to Gallery
              </a>
            </div>
            <p style="font-size: 0.7rem; color: #5a3a6a; margin-top: 1rem; opacity: 0.5; font-family: 'Share Tech Mono', monospace;">
              If you believe you should have access, please log in with your account.
            </p>
          </div>
        </div>
      `;
      profileContent.style.display = 'block';
    }
  }

  // ============================================
  // 📦 LOAD USER DATA
  // ============================================
  async loadUserData() {
    try {
      const doc = await db.collection('users').doc(this.userId).get();
      if (!doc.exists) {
        await this.createUserDocument();
        const newDoc = await db.collection('users').doc(this.userId).get();
        this.userData = newDoc.data();
      } else {
        this.userData = doc.data();
      }

      // Load the PROFILE OWNER's accent color from Firestore
      this.activePalette = this.userData?.accentColor || '#ff00ea';
      this.isNSFWCreator = this.userData?.isNSFWCreator === true;

      console.log(`🎨 Profile owner's accent color: ${this.activePalette}`);
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showError();
    }
  }

  // ============================================
  // 🌓 LOAD PROFILE OWNER'S THEME
  // ============================================

  loadProfileOwnerTheme() {
    // Get the profile owner's theme from Firestore
    const ownerTheme = this.userData?.theme || 'dark';
    this.currentTheme = ownerTheme;

    // Apply the theme to the page
    this.applyTheme(ownerTheme);

    console.log(`🌓 Profile owner's theme: ${ownerTheme}`);
  }

  applyTheme(theme) {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const header = document.querySelector('.main-header');
    const html = document.documentElement;

    if (theme === 'light') {
      body.classList.add('light-theme');
      if (toggle) toggle.innerHTML = '<i class="fas fa-moon"></i>';
      if (header) header.setAttribute('data-theme', 'light');
      html.setAttribute('data-theme', 'light');
    } else {
      body.classList.remove('light-theme');
      if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i>';
      if (header) header.setAttribute('data-theme', 'dark');
      html.setAttribute('data-theme', 'dark');
    }

    this.currentTheme = theme;
    this.updateThemeDependentElements();
  }

  async saveThemeToFirestore(theme) {
    if (!this.isOwnProfile) return;

    try {
      await db.collection('users').doc(this.userId).update({
        theme: theme
      });
      console.log(`✅ Theme saved to Firestore: ${theme}`);
    } catch (error) {
      console.error('Error saving theme to Firestore:', error);
    }
  }

  createUserDocument() {
    const user = this.currentUser;
    return db.collection('users').doc(user.uid).set({
      fullname: user.displayName || user.email?.split('@')[0] || 'Artist',
      username: user.email?.split('@')[0] || 'artist',
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      stats: { artworks: 0, followers: 0, following: 0, totalLikes: 0 },
      bio: 'Hello! I am an artist on Art Mecca.',
      role: 'user',
      isAdult: false,
      ageVerified: false,
      socialLinks: {},
      heroBackground: '',
      heroOverlay: '',
      badge: null,
      isNSFWCreator: false,
      accentColor: '#ff00ea',
      theme: 'dark' // Default theme
    });
  }

  // ============================================
  // 🎨 RENDER PROFILE
  // ============================================
  renderProfile() {
    const data = this.userData;
    if (!data) return;

    // Name
    const nameEl = document.getElementById('profileName');
    if (nameEl) {
      nameEl.textContent = data.fullname || 'Artist';
      nameEl.setAttribute('data-text', data.fullname || 'Artist');
      const color = this.activePalette;
      nameEl.style.textShadow = `
        0 2px 4px rgba(0, 0, 0, 0.8),
        0 4px 8px rgba(0, 0, 0, 0.6),
        0 8px 16px rgba(0, 0, 0, 0.4),
        0 16px 32px rgba(0, 0, 0, 0.3),
        0 0 20px ${color}25,
        0 0 40px ${color}20,
        0 0 80px ${color}12,
        0 0 120px ${color}06
      `;
    }
    document.getElementById('profileUsername').textContent = `@${data.username || 'artist'}`;

    // Badges
    const badgesContainer = document.getElementById('heroBadges');
    badgesContainer.innerHTML = '';

    // NSFW Creator Badge
    if (this.isNSFWCreator === true) {
      badgesContainer.innerHTML += `<span class="badge nsfw-creator-badge"><i class="fas fa-shield-alt"></i> 🔞 NSFW Creator</span>`;
    }

    // Other badges
    if (data.isAdult && data.ageVerified) {
      badgesContainer.innerHTML += `<span class="badge verified"><i class="fas fa-check-circle"></i> Age Verified</span>`;
    }
    if (data.role && data.role !== 'user') {
      badgesContainer.innerHTML += `<span class="badge moderator">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</span>`;
    }
    badgesContainer.innerHTML += `<span class="badge artist"><i class="fas fa-palette"></i> Artist</span>`;

    // Artist Title
    const artistTitleEl = document.getElementById('artistTitleText');
    if (artistTitleEl) {
      const badge = this.userData?.badge || {};
      const specialty = badge.artistType || 'Artist';
      const typeLabels = {
        digital: 'Digital Artist',
        traditional: 'Traditional Artist',
        mixed: 'Mixed Media Artist',
        '3d': '3D Artist',
        photography: 'Photographer',
        animation: 'Animator'
      };
      artistTitleEl.textContent = typeLabels[specialty] || specialty || 'Digital Artist';
    }

    // Stats
    const stats = data.stats || {};
    document.querySelector('[data-stat="artworks"]').textContent = stats.artworks || 0;
    document.querySelector('[data-stat="followers"]').textContent = stats.followers || 0;
    document.querySelector('[data-stat="following"]').textContent = stats.following || 0;
    document.querySelector('[data-stat="likes"]').textContent = stats.totalLikes || 0;
    document.querySelector('[data-stat="points"]').textContent = data.points || 0;

    // Bio
    const bioText = document.querySelector('.bio-text');
    bioText.textContent = data.bio || 'No bio yet. Click to expand.';
    if (data.bio && data.bio.length > 120) {
      document.querySelector('.hero-bio').classList.add('collapsed');
    }

    // Social links
    this.renderSocialLinks(data.socialLinks || {});

    // Badge
    this.renderBadge(data.badge || null);

    // Layers
    if (data.heroBackground) {
      this.setLayer1(data.heroBackground);
      const bgRemove = document.getElementById('bgRemove');
      if (bgRemove) bgRemove.style.display = 'flex';
    } else {
      this.setLayer1('');
    }

    if (data.heroOverlay) {
      this.setLayer2(data.heroOverlay);
      const overlayRemove = document.getElementById('overlayRemove');
      if (overlayRemove) overlayRemove.style.display = 'flex';
    } else {
      this.setLayer2('');
    }

    // Load sections
    this.loadAboutData();
    this.loadUploads();
    this.loadLiked();
    this.loadSaved();
    this.loadTutorials();
    this.loadChallenges();
    this.loadBadges();
    this.loadBlog();
    this.loadCommission();
    this.renderPortfolio();
  }

  // ============================================
  // 🏷️ UPDATE UI FOR PROFILE TYPE (OWN VS OTHERS)
  // ============================================
  updateUIForProfileType() {
    const editBadgeBtn = document.getElementById('editBadgeBtn');
    const editSocialBtn = document.getElementById('editSocialBtn');
    const saveAboutBtn = document.getElementById('saveAboutBtn');
    const saveCommissionBtn = document.getElementById('saveCommissionBtn');
    const floatingUploadBtn = document.getElementById('floatingUploadBtn');

    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    const visibleActions = ['message', 'block', 'share', 'cv'];

    if (this.isOwnProfile) {
      if (editBadgeBtn) editBadgeBtn.style.display = 'flex';
      if (editSocialBtn) editSocialBtn.style.display = 'flex';
      if (saveAboutBtn) saveAboutBtn.style.display = 'flex';
      if (saveCommissionBtn) saveCommissionBtn.style.display = 'flex';
      if (floatingUploadBtn) floatingUploadBtn.style.display = 'flex';

      sidebarBtns.forEach(btn => {
        btn.style.display = 'flex';
      });

      const palettePicker = document.getElementById('palettePicker');
      const themeToggle = document.getElementById('themeToggle');
      if (palettePicker) palettePicker.style.display = 'flex';
      if (themeToggle) themeToggle.style.display = 'flex';

    } else {
      if (editBadgeBtn) editBadgeBtn.style.display = 'none';
      if (editSocialBtn) editSocialBtn.style.display = 'none';
      if (saveAboutBtn) saveAboutBtn.style.display = 'none';
      if (saveCommissionBtn) saveCommissionBtn.style.display = 'none';
      if (floatingUploadBtn) floatingUploadBtn.style.display = 'none';

      sidebarBtns.forEach(btn => {
        const action = btn.dataset.action;
        if (action === 'message' || action === 'block' || action === 'share' || action === 'cv') {
          btn.style.display = 'flex';
        } else {
          btn.style.display = 'none';
        }
      });

      // Hide palette picker and theme toggle on others' profiles
      const palettePicker = document.getElementById('palettePicker');
      const themeToggle = document.getElementById('themeToggle');
      if (palettePicker) palettePicker.style.display = 'none';
      if (themeToggle) themeToggle.style.display = 'none';

      document.querySelectorAll('#tab-about input, #tab-about textarea').forEach(el => {
        el.disabled = true;
      });

      document.querySelectorAll('#tab-commission input, #tab-commission textarea').forEach(el => {
        el.disabled = true;
      });
    }
  }

  // ============================================
  // 🔗 SOCIAL LINKS
  // ============================================
  renderSocialLinks(links) {
    const container = document.getElementById('socialIcons');
    container.innerHTML = '';
    const platforms = [
      { id: 'instagram', icon: 'fa-instagram', url: links.instagram },
      { id: 'tiktok', icon: 'fa-tiktok', url: links.tiktok },
      { id: 'youtube', icon: 'fa-youtube', url: links.youtube },
      { id: 'pinterest', icon: 'fa-pinterest', url: links.pinterest },
      { id: 'discord', icon: 'fa-discord', url: links.discord },
      { id: 'x', icon: 'fa-x-twitter', url: links.x },
      { id: 'vgen', icon: 'fa-user', url: links.vgen },
      { id: 'kofi', icon: 'fa-coffee', url: links.kofi }
    ];
    let hasLinks = false;
    platforms.forEach(p => {
      if (p.url) {
        hasLinks = true;
        const a = document.createElement('a');
        a.href = p.url;
        a.target = '_blank';
        a.title = p.id;
        a.innerHTML = `<i class="fab ${p.icon}"></i>`;
        container.appendChild(a);
      }
    });
    if (!hasLinks && !this.isOwnProfile) {
      container.innerHTML = '<span style="color:rgba(255,255,255,0.15);font-size:0.7rem;font-family:Share Tech Mono,monospace;">No social links</span>';
    }
  }

  // ============================================
  // 👤 AVATAR UPLOAD
  // ============================================
  setupAvatarUpload() {
    const avatarContainer = document.getElementById('navAvatar');
    if (!avatarContainer) return;

    let dropdown = document.querySelector('.avatar-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'avatar-dropdown';
      dropdown.style.cssText = `
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        min-width: 220px;
        background: rgba(10, 5, 20, 0.95);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 0, 234, 0.12);
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
        display: none;
        z-index: 1000;
      `;
      document.body.appendChild(dropdown);
    }

    const uploadOption = document.createElement('button');
    uploadOption.className = 'dropdown-item';
    uploadOption.style.cssText = `
      display: flex; align-items: center; gap: 10px; padding: 8px 16px;
      color: rgba(255, 255, 255, 0.8); text-decoration: none; font-size: 0.85rem;
      transition: all 0.2s ease; cursor: pointer; border: none; background: none;
      width: 100%; text-align: left; font-family: 'Inter', sans-serif;
    `;
    uploadOption.innerHTML = `<i class="fas fa-camera" style="width:20px;color:var(--accent);"></i><span>Change Profile Picture</span>`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'display: none;';
    fileInput.id = 'avatarUploadInput';

    uploadOption.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.uploadAvatar(file);
      }
      fileInput.value = '';
    });

    const divider = dropdown.querySelector('.dropdown-divider');
    if (divider) {
      dropdown.insertBefore(uploadOption, divider);
      dropdown.insertBefore(fileInput, divider);
    } else {
      dropdown.appendChild(uploadOption);
      dropdown.appendChild(fileInput);
    }
  }

  async uploadAvatar(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File must be less than 5MB', 'error');
      return;
    }

    try {
      this.showToast('Uploading avatar...');
      const storageRef = firebase.storage().ref();
      const filePath = `avatars/${this.userId}/${Date.now()}_${file.name}`;
      const uploadTask = storageRef.child(filePath).put(file);
      const snapshot = await uploadTask;
      const url = await snapshot.ref.getDownloadURL();

      await db.collection('users').doc(this.userId).update({ avatar: url });
      this.userData.avatar = url;

      const avatarContainer = document.querySelector('.nav-avatar-container');
      if (avatarContainer && window.avatarManager) {
        await window.avatarManager.updateAvatar(url);
      }

      const dropdown = document.querySelector('.avatar-dropdown');
      if (dropdown) dropdown.style.display = 'none';
      this.showToast('Profile picture updated! ✅');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      this.showToast('Error uploading avatar: ' + error.message, 'error');
    }
  }

  // ============================================
  // 🏅 BADGE
  // ============================================
  renderBadge(badge) {
    const typeLabels = {
      digital: '🎨 Digital Artist',
      traditional: '🖌️ Traditional Artist',
      mixed: '🎭 Mixed Media Artist',
      '3d': '🧊 3D Artist',
      photography: '📷 Photographer',
      animation: '🎬 Animator'
    };
    const typeIcons = {
      digital: 'fa-laptop',
      traditional: 'fa-paintbrush',
      mixed: 'fa-palette',
      '3d': 'fa-cube',
      photography: 'fa-camera',
      animation: 'fa-film'
    };

    const typeEl = document.getElementById('badgeArtistType');
    const specialtiesEl = document.getElementById('badgeSpecialties');
    const mediumsEl = document.getElementById('badgeMediumTags');
    const iconEl = document.getElementById('badgeIcon');
    const editBtn = document.getElementById('editBadgeBtn');

    if (editBtn) {
      editBtn.style.display = this.isOwnProfile ? 'flex' : 'none';
    }

    if (!badge) {
      typeEl.textContent = 'Not set';
      specialtiesEl.innerHTML = '<span class="tag">Not set</span>';
      mediumsEl.innerHTML = '<span class="tag">Not set</span>';
      iconEl.className = 'fas fa-palette';
      return;
    }

    typeEl.textContent = typeLabels[badge.artistType] || badge.artistType || 'Not set';
    iconEl.className = `fas ${typeIcons[badge.artistType] || 'fa-palette'}`;

    if (badge.specialties && badge.specialties.length > 0) {
      specialtiesEl.innerHTML = badge.specialties.map(s => `<span class="tag primary">${s.replace(/-/g, ' ')}</span>`).join('');
    } else {
      specialtiesEl.innerHTML = '<span class="tag">Not set</span>';
    }

    if (badge.mediums && badge.mediums.length > 0) {
      mediumsEl.innerHTML = badge.mediums.map(m => `<span class="tag">${m.replace(/-/g, ' ')}</span>`).join('');
    } else {
      mediumsEl.innerHTML = '<span class="tag">Not set</span>';
    }
  }

  // ============================================
  // 🖼️ LAYER FUNCTIONS
  // ============================================
  setLayer1(url) {
    const container = document.getElementById('layer1Content');
    if (!container) return;
    if (!url) {
      container.innerHTML = `<div class="layer-default-bg"></div>`;
      return;
    }
    const isVideo = url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes('video') || url.includes('.mp4') || url.includes('.webm');
    container.innerHTML = '';
    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
      container.appendChild(video);
      video.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Background';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
      container.appendChild(img);
      const removeBtn = document.getElementById('bgRemove');
      if (removeBtn) removeBtn.style.display = 'flex';
    }
  }

  setLayer2(url) {
    const container = document.getElementById('layer2Content');
    if (!container) return;
    if (!url) {
      container.innerHTML = `<div class="layer-default-avatar">🎨</div>`;
      return;
    }
    const isVideo = url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes('video') || url.includes('.mp4') || url.includes('.webm');
    container.innerHTML = '';
    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      container.appendChild(video);
      video.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Overlay';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      container.appendChild(img);
      const removeBtn = document.getElementById('overlayRemove');
      if (removeBtn) removeBtn.style.display = 'flex';
    }
  }

  // ============================================
  // 🎨 PALETTE — PER-USER STORAGE
  // ============================================

  applyPalette(color) {
    this.activePalette = color;

    const root = document.documentElement;
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-dim', `${color}15`);
    root.style.setProperty('--accent-glow', `0 0 40px ${color}25`);
    root.style.setProperty('--accent-glow-strong', `0 0 60px ${color}35`);
    root.style.setProperty('--accent-glow-soft', `0 0 80px ${color}10`);

    this.applyPaletteToHeader(color);

    const heroName = document.querySelector('.hero-name');
    if (heroName) {
      heroName.style.textShadow = `
        0 2px 4px rgba(0, 0, 0, 0.8),
        0 4px 8px rgba(0, 0, 0, 0.6),
        0 8px 16px rgba(0, 0, 0, 0.4),
        0 16px 32px rgba(0, 0, 0, 0.3),
        0 0 20px ${color}25,
        0 0 40px ${color}20,
        0 0 80px ${color}12,
        0 0 120px ${color}06
      `;
    }

    const styleTag = document.getElementById('heroNameGlowStyles');
    if (styleTag) {
      styleTag.textContent = `
        .hero-name:hover {
          text-shadow:
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 4px 8px rgba(0, 0, 0, 0.6),
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 16px 32px rgba(0, 0, 0, 0.3),
            0 0 30px ${color}40,
            0 0 60px ${color}30,
            0 0 100px ${color}20,
            0 0 150px ${color}10 !important;
        }
        .hero-name::before {
          color: ${color} !important;
          text-shadow: 2px 0 #58ebfe, -2px 0 ${color} !important;
        }
        .hero-name::after {
          color: #58ebfe !important;
          text-shadow: -2px 0 ${color}, 2px 0 #58ebfe !important;
        }
        @keyframes nameLoadGlitch {
          0% {
            text-shadow:
              0 2px 4px rgba(0, 0, 0, 0.8),
              0 4px 8px rgba(0, 0, 0, 0.6),
              0 8px 16px rgba(0, 0, 0, 0.4),
              0 16px 32px rgba(0, 0, 0, 0.3),
              0 0 50px ${color}50,
              0 0 100px ${color}30;
          }
          10% { opacity: 0.5; clip-path: inset(30% 0 40% 0); transform: scale(1.02) translateX(-3px); }
          20% { opacity: 0.8; clip-path: inset(10% 0 70% 0); transform: scale(0.98) translateX(3px); }
          30% { opacity: 1; clip-path: inset(60% 0 20% 0); transform: scale(1.01) translateX(-1px); }
          40% { clip-path: inset(0 0 0 0); transform: scale(1) translateX(0); }
          100% { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); }
        }
      `;
    }

    document.querySelectorAll('.gradient-text').forEach(el => {
      el.style.background = `linear-gradient(135deg, ${color}, #58ebfe)`;
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor = 'transparent';
      el.style.backgroundClip = 'text';
    });

    if (this.isOwnProfile) {
      document.querySelectorAll('.palette-swatch').forEach(el => {
        el.classList.toggle('active', el.dataset.color === color);
      });
    }
  }

  setupDynamicStyles() {
    const existingTag = document.getElementById('heroNameGlowStyles');
    if (existingTag) existingTag.remove();

    const styleTag = document.createElement('style');
    styleTag.id = 'heroNameGlowStyles';
    document.head.appendChild(styleTag);

    const color = this.activePalette;
    styleTag.textContent = `
      .hero-name {
        text-shadow:
          0 2px 4px rgba(0, 0, 0, 0.8),
          0 4px 8px rgba(0, 0, 0, 0.6),
          0 8px 16px rgba(0, 0, 0, 0.4),
          0 16px 32px rgba(0, 0, 0, 0.3),
          0 0 20px ${color}25,
          0 0 40px ${color}20,
          0 0 80px ${color}12,
          0 0 120px ${color}06 !important;
      }
      .hero-name:hover {
        text-shadow:
          0 2px 4px rgba(0, 0, 0, 0.8),
          0 4px 8px rgba(0, 0, 0, 0.6),
          0 8px 16px rgba(0, 0, 0, 0.4),
          0 16px 32px rgba(0, 0, 0, 0.3),
          0 0 30px ${color}40,
          0 0 60px ${color}30,
          0 0 100px ${color}20,
          0 0 150px ${color}10 !important;
      }
      .hero-name::before {
        color: ${color} !important;
        text-shadow: 2px 0 #58ebfe, -2px 0 ${color} !important;
      }
      .hero-name::after {
        color: #58ebfe !important;
        text-shadow: -2px 0 ${color}, 2px 0 #58ebfe !important;
      }
      @keyframes nameLoadGlitch {
        0% {
          text-shadow:
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 4px 8px rgba(0, 0, 0, 0.6),
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 16px 32px rgba(0, 0, 0, 0.3),
            0 0 50px ${color}50,
            0 0 100px ${color}30;
        }
        10% { opacity: 0.5; clip-path: inset(30% 0 40% 0); transform: scale(1.02) translateX(-3px); }
        20% { opacity: 0.8; clip-path: inset(10% 0 70% 0); transform: scale(0.98) translateX(3px); }
        30% { opacity: 1; clip-path: inset(60% 0 20% 0); transform: scale(1.01) translateX(-1px); }
        40% { clip-path: inset(0 0 0 0); transform: scale(1) translateX(0); }
        100% { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); }
      }
    `;
  }

  getColorName(color) {
    const names = {
      '#e90c0c': 'Red', '#ff9500': 'Orange', '#fbf304': 'Yellow',
      '#00e025': 'Green', '#00e1ff': 'Cyan', '#0008fa': 'Blue',
      '#ff00ea': 'Magenta', '#ff00bb': 'Pink', '#6b00b3': 'Purple',
      '#dde7ee': 'Ice', '#0f0033': 'Deep'
    };
    return names[color] || color;
  }

  applyPaletteToHeader(color) {
    const header = document.querySelector('.main-header');
    if (header) {
      header.style.setProperty('--neon-magenta', color);
      header.style.setProperty('--accent', color);
      header.style.boxShadow = `0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${color}15`;
    }
    document.querySelectorAll('.nav-link.active').forEach(link => {
      link.style.color = color;
      link.style.textShadow = `0 0 30px ${color}20`;
    });
  }

  async savePaletteToFirestore(color) {
    if (!this.isOwnProfile) return;

    try {
      await db.collection('users').doc(this.userId).update({
        accentColor: color
      });
      console.log(`✅ Palette saved to Firestore: ${color}`);
    } catch (error) {
      console.error('Error saving palette to Firestore:', error);
    }
  }

  // ============================================
  // 🌓 THEME TOGGLE — PER-USER STORAGE
  // ============================================

  toggleTheme() {
    // Only allow toggling on own profile
    if (!this.isOwnProfile) return;

    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';

    // Apply theme locally
    this.applyTheme(newTheme);

    // Save to Firestore
    this.saveThemeToFirestore(newTheme);

    this.showToast(`🌓 Theme switched to ${newTheme}`);
  }

  applyTheme(theme) {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const header = document.querySelector('.main-header');
    const html = document.documentElement;

    if (theme === 'light') {
      body.classList.add('light-theme');
      if (toggle) toggle.innerHTML = '<i class="fas fa-moon"></i>';
      if (header) header.setAttribute('data-theme', 'light');
      html.setAttribute('data-theme', 'light');
    } else {
      body.classList.remove('light-theme');
      if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i>';
      if (header) header.setAttribute('data-theme', 'dark');
      html.setAttribute('data-theme', 'dark');
    }

    this.currentTheme = theme;
    this.updateThemeDependentElements();
  }

  async saveThemeToFirestore(theme) {
    if (!this.isOwnProfile) return;

    try {
      await db.collection('users').doc(this.userId).update({
        theme: theme
      });
      console.log(`✅ Theme saved to Firestore: ${theme}`);
    } catch (error) {
      console.error('Error saving theme to Firestore:', error);
    }
  }

  updateThemeDependentElements() {
    const isLight = this.currentTheme === 'light';
    const hybridStatus = document.getElementById('hybridStatus');
    if (hybridStatus) hybridStatus.style.color = isLight ? '#1a102a' : '';
    const searchIcon = document.querySelector('.search-overlay .search-icon');
    if (searchIcon) searchIcon.style.color = isLight ? '#1a102a' : '';
    const searchInput = document.querySelector('.search-overlay #search-input');
    if (searchInput) {
      searchInput.style.color = isLight ? '#1a102a' : '';
      searchInput.style.setProperty('--placeholder-color', isLight ? 'rgba(26,16,42,0.3)' : 'rgba(255,255,255,0.3)');
    }
  }

  loadSavedTheme() {
    // This is now handled by loadProfileOwnerTheme()
    // Kept for compatibility but overridden
  }

  // ============================================
  // 📊 ABOUT DATA
  // ============================================
  loadAboutData() {
    const about = this.userData?.about || {};
    const fields = ['birthday', 'starSign', 'mbti', 'book', 'movie', 'show', 'colour', 'food', 'hobby', 'song', 'quote', 'dislikes'];
    fields.forEach(f => {
      const el = document.getElementById(`about${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (el) el.value = about[f] || '';
    });
    if (about.birthday) {
      const age = this.calculateAge(about.birthday);
      document.getElementById('aboutAge').textContent = age !== null ? `${age} years` : '—';
    }
    if (!this.isOwnProfile) {
      document.querySelectorAll('#tab-about input, #tab-about textarea').forEach(el => el.disabled = true);
      document.getElementById('saveAboutBtn').style.display = 'none';
    }
  }

  calculateAge(birthday) {
    if (!birthday) return null;
    try {
      const b = new Date(birthday);
      if (isNaN(b.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
      return age;
    } catch { return null; }
  }

  async saveAbout() {
    const about = {
      birthday: document.getElementById('aboutBirthday').value || null,
      starSign: document.getElementById('aboutStarSign').value.trim(),
      mbti: document.getElementById('aboutMbti').value.trim(),
      book: document.getElementById('aboutBook').value.trim(),
      movie: document.getElementById('aboutMovie').value.trim(),
      show: document.getElementById('aboutShow').value.trim(),
      colour: document.getElementById('aboutColour').value.trim(),
      food: document.getElementById('aboutFood').value.trim(),
      hobby: document.getElementById('aboutHobby').value.trim(),
      song: document.getElementById('aboutSong').value.trim(),
      quote: document.getElementById('aboutQuote').value.trim(),
      dislikes: document.getElementById('aboutDislikes').value.trim()
    };
    try {
      await db.collection('users').doc(this.userId).update({ about });
      this.userData.about = about;
      this.showToast('About info saved! ✅');
    } catch (error) {
      this.showToast('Error saving about info', 'error');
    }
  }

  // ============================================
  // 📤 UPLOADS
  // ============================================
  async loadUploads(reset = false) {
    if (reset) {
      this.uploads = [];
      this.uploadsPage = 1;
      this.hasMoreUploads = true;
      document.getElementById('uploadsMasonry').innerHTML = '';
    }
    if (!this.hasMoreUploads || this.loadingMore) return;
    this.loadingMore = true;
    const loading = document.getElementById('uploadsLoading');
    loading.style.display = 'block';

    try {
      let query = db.collection('artworks')
        .where('artistId', '==', this.userId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(12);
      if (this.uploads && this.uploads.length > 0) {
        const last = this.uploads[this.uploads.length - 1];
        if (last.createdAt) query = query.startAfter(last.createdAt);
      }
      const snapshot = await query.get();
      if (snapshot.empty) {
        this.hasMoreUploads = false;
      } else {
        const newArtworks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!this.uploads) this.uploads = [];
        this.uploads = [...this.uploads, ...newArtworks];
        this.uploadsPage++;
      }
      this.renderUploads();
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      this.loadingMore = false;
      loading.style.display = 'none';
    }
  }

  renderUploads() {
    const grid = document.getElementById('uploadsMasonry');
    if (!this.uploads || this.uploads.length === 0) {
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-upload"></i><p>No artworks uploaded yet</p></div>`;
      return;
    }
    grid.innerHTML = this.uploads.map(art => `
      <div class="item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
        <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" loading="lazy" />
        <div class="overlay">
          <div class="title">${art.isNSFW ? '🔞 ' : ''}${this.escapeHtml(art.title)}</div>
          <div class="meta">❤️ ${art.likes || 0} • 💬 ${art.comments || 0}</div>
        </div>
      </div>
    `).join('');
  }

  // ============================================
  // ❤️ LIKED
  // ============================================
  async loadLiked(reset = false) {
    if (reset) {
      this.liked = [];
      this.likedPage = 1;
      this.hasMoreLiked = true;
      document.getElementById('likedMasonry').innerHTML = '';
    }
    if (!this.hasMoreLiked || this.loadingMore) return;
    this.loadingMore = true;
    const loading = document.getElementById('likedLoading');
    loading.style.display = 'block';

    try {
      let query = db.collection('likes')
        .where('userId', '==', this.userId)
        .orderBy('createdAt', 'desc')
        .limit(12);
      if (this.liked && this.liked.length > 0) {
        const last = this.liked[this.liked.length - 1];
        if (last.likedAt) query = query.startAfter(last.likedAt);
      }
      const snapshot = await query.get();
      if (snapshot.empty) {
        this.hasMoreLiked = false;
      } else {
        const likeData = snapshot.docs.map(doc => ({ likeId: doc.id, ...doc.data() }));
        const artworks = await Promise.all(likeData.map(async (like) => {
          if (!like.artworkId) return null;
          try {
            const artDoc = await db.collection('artworks').doc(like.artworkId).get();
            if (artDoc.exists) return { id: artDoc.id, ...artDoc.data(), likedAt: like.createdAt };
          } catch { return null; }
          return null;
        }));
        const valid = artworks.filter(a => a !== null);
        if (!this.liked) this.liked = [];
        this.liked = [...this.liked, ...valid];
        this.likedPage++;
      }
      this.renderLiked();
    } catch (error) {
      console.error('Error loading liked:', error);
    } finally {
      this.loadingMore = false;
      loading.style.display = 'none';
    }
  }

  renderLiked() {
    const grid = document.getElementById('likedMasonry');
    if (!this.liked || this.liked.length === 0) {
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><p>No liked artworks yet</p></div>`;
      return;
    }
    grid.innerHTML = this.liked.map(art => `
      <div class="item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
        <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" loading="lazy" />
        <div class="overlay">
          <div class="title">${art.isNSFW ? '🔞 ' : ''}${this.escapeHtml(art.title)}</div>
          <div class="meta">❤️ ${art.likes || 0} • 💬 ${art.comments || 0}</div>
        </div>
      </div>
    `).join('');
  }

  // ============================================
  // 📑 SAVED
  // ============================================
  async loadSaved(reset = false) {
    if (reset) {
      this.saved = [];
      this.savedPage = 1;
      this.hasMoreSaved = true;
      document.getElementById('savedMasonry').innerHTML = '';
    }
    if (!this.hasMoreSaved || this.loadingMore) return;
    this.loadingMore = true;
    const loading = document.getElementById('savedLoading');
    loading.style.display = 'block';

    try {
      let query = db.collection('users')
        .doc(this.userId)
        .collection('savedArtworks')
        .orderBy('savedAt', 'desc')
        .limit(12);
      if (this.saved && this.saved.length > 0) {
        const last = this.saved[this.saved.length - 1];
        if (last.savedAt) query = query.startAfter(last.savedAt);
      }
      const snapshot = await query.get();
      if (snapshot.empty) {
        this.hasMoreSaved = false;
      } else {
        const saveData = snapshot.docs.map(doc => ({ saveId: doc.id, ...doc.data() }));
        const artworks = await Promise.all(saveData.map(async (save) => {
          if (!save.artworkId) return null;
          try {
            const artDoc = await db.collection('artworks').doc(save.artworkId).get();
            if (artDoc.exists) return { id: artDoc.id, ...artDoc.data(), savedAt: save.savedAt };
          } catch { return null; }
          return null;
        }));
        const valid = artworks.filter(a => a !== null);
        if (!this.saved) this.saved = [];
        this.saved = [...this.saved, ...valid];
        this.savedPage++;
      }
      this.renderSaved();
    } catch (error) {
      console.error('Error loading saved:', error);
    } finally {
      this.loadingMore = false;
      loading.style.display = 'none';
    }
  }

  renderSaved() {
    const grid = document.getElementById('savedMasonry');
    if (!this.saved || this.saved.length === 0) {
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-bookmark"></i><p>No saved artworks yet</p></div>`;
      return;
    }
    grid.innerHTML = this.saved.map(art => `
      <div class="item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
        <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" loading="lazy" />
        <div class="overlay">
          <div class="title">${art.isNSFW ? '🔞 ' : ''}${this.escapeHtml(art.title)}</div>
          <div class="meta">❤️ ${art.likes || 0} • 💬 ${art.comments || 0}</div>
        </div>
      </div>
    `).join('');
  }

  // ============================================
  // 📚 TUTORIALS
  // ============================================
  async loadTutorials() {
    const grid = document.getElementById('savedTutorialsGrid');
    try {
      const snapshot = await db.collection('users')
        .doc(this.userId)
        .collection('savedTutorials')
        .orderBy('savedAt', 'desc')
        .limit(10)
        .get();
      if (snapshot.empty) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-graduation-cap"></i><p>No saved tutorials yet</p></div>`;
        return;
      }
      grid.innerHTML = snapshot.docs.map(doc => {
        const data = doc.data();
        return `
          <div class="tutorial-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.8rem;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:2px;transition:all 0.3s ease;cursor:pointer;" onclick="window.location.href='${data.url || '#'}'">
            <span style="font-size:1.2rem;">${data.icon || '📚'}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-family:var(--font-condensed);color:rgba(255,255,255,0.7);font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(data.title)}</div>
              <div style="font-family:var(--font-mono);color:var(--profile-text-muted);font-size:0.55rem;">${this.escapeHtml(data.source || 'Art Mecca')}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading tutorials:', error);
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading tutorials</p></div>`;
    }
  }

  // ============================================
  // 🏆 CHALLENGES
  // ============================================
  async loadChallenges() {
    const container = document.getElementById('joinedChallengesContainer');
    try {
      const snapshot = await db.collection('userChallenges')
        .where('userId', '==', this.userId)
        .orderBy('joinedAt', 'desc')
        .get();
      if (snapshot.empty) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-trophy"></i><p>No challenges joined yet</p></div>`;
        return;
      }
      const challenges = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        challenges.push({ id: doc.id, challengeId: data.challengeId, type: data.challengeType || 'daily', status: data.status || 'active' });
      });
      container.innerHTML = challenges.map(c => `
        <div class="challenge-card" onclick="window.location.href='/pages/community/challenges.html?highlight=${c.challengeId}'">
          <span class="icon">${c.type === 'daily' ? '⚡' : c.type === 'weekly' ? '📅' : c.type === 'monthly' ? '🌟' : '🏆'}</span>
          <div class="info">
            <div class="name">${c.challengeId || 'Challenge'}</div>
            <div class="type">${c.type}</div>
          </div>
          <span class="status ${c.status}">${c.status === 'active' ? '🟢 Active' : '✅ Completed'}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading challenges:', error);
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading challenges</p></div>`;
    }
  }

  // ============================================
  // 🏅 BADGES
  // ============================================
  async loadBadges() {
    const container = document.getElementById('badgesContainer');
    const countEl = document.getElementById('badgeCount');
    try {
      const badges = [];
      if (this.userData?.badges) {
        this.userData.badges.forEach(b => badges.push({ icon: b.icon || '🏅', name: b.name || 'Badge' }));
      }
      const wins = await db.collection('challengeWinners')
        .where('winnerUserId', '==', this.userId)
        .get();
      wins.forEach(doc => {
        const data = doc.data();
        badges.push({ icon: '🏆', name: data.challengeTitle || 'Challenge Winner' });
      });
      if (badges.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-award"></i><p>No badges earned yet</p></div>`;
        countEl.textContent = '0 badges';
        return;
      }
      countEl.textContent = `${badges.length} badge${badges.length > 1 ? 's' : ''}`;
      container.innerHTML = badges.map(b => `
        <div class="badge-item" title="${this.escapeHtml(b.name)}">
          <span class="icon">${b.icon}</span>
          <span class="name">${this.escapeHtml(b.name)}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading badges:', error);
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading badges</p></div>`;
    }
  }

  // ============================================
  // 📝 BLOG
  // ============================================
  async loadBlog() {
    const grid = document.getElementById('savedBlogPostsGrid');
    const collectionsGrid = document.getElementById('blogCollectionsGrid');
    try {
      const colSnapshot = await db.collection('users')
        .doc(this.userId)
        .collection('blogCollections')
        .orderBy('createdAt', 'desc')
        .get();
      if (!colSnapshot.empty) {
        collectionsGrid.innerHTML = colSnapshot.docs.map(doc => {
          const data = doc.data();
          return `<div class="blog-collection-card"><span class="icon">📁</span><span class="name">${this.escapeHtml(data.name)}</span><span class="count">${data.count || 0}</span></div>`;
        }).join('');
      } else {
        collectionsGrid.innerHTML = `<div class="blog-collection-card" style="opacity:0.5;cursor:default;"><span class="icon">📁</span><span class="name" style="color:rgba(255,255,255,0.2);">No collections</span></div>`;
      }
      const postsSnapshot = await db.collection('users')
        .doc(this.userId)
        .collection('savedBlogPosts')
        .orderBy('savedAt', 'desc')
        .limit(10)
        .get();
      if (postsSnapshot.empty) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-blog"></i><p>No saved blog posts yet</p></div>`;
        return;
      }
      grid.innerHTML = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return `
          <div class="blog-post-item">
            <span class="icon">${data.icon || '📝'}</span>
            <div class="info">
              <div class="title">${this.escapeHtml(data.title)}</div>
              <div class="source">${this.escapeHtml(data.source || 'Art Mecca')}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading blog:', error);
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading blog posts</p></div>`;
    }
  }

  // ============================================
  // 💼 COMMISSION
  // ============================================
  loadCommission() {
    const comm = this.userData?.commission || {};
    const fields = ['contact', 'website', 'shop', 'experience', 'expertise', 'projects', 'rates'];
    fields.forEach(f => {
      const el = document.getElementById(`commission${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (el) el.value = comm[f] || '';
    });
    if (comm.cvUrl) {
      this.cvUrl = comm.cvUrl;
      document.getElementById('cvPreview').style.display = 'flex';
      document.getElementById('cvFileName').textContent = comm.cvName || 'CV.pdf';
      document.querySelector('.cv-drop-zone').style.display = 'none';
    }
    if (!this.isOwnProfile) {
      document.querySelectorAll('#tab-commission input, #tab-commission textarea').forEach(el => el.disabled = true);
      document.getElementById('saveCommissionBtn').style.display = 'none';
    }
  }

  async saveCommission() {
    const data = {
      contact: document.getElementById('commissionContact').value.trim(),
      website: document.getElementById('commissionWebsite').value.trim(),
      shop: document.getElementById('commissionShop').value.trim(),
      experience: document.getElementById('commissionExperience').value.trim(),
      expertise: document.getElementById('commissionExpertise').value.trim(),
      projects: document.getElementById('commissionProjects').value.trim(),
      rates: document.getElementById('commissionRates').value.trim(),
      cvUrl: this.cvUrl || null,
      cvName: this.cvFile?.name || null
    };
    try {
      await db.collection('users').doc(this.userId).update({ commission: data });
      this.userData.commission = data;
      this.showToast('Commission info saved! ✅');
    } catch (error) {
      this.showToast('Error saving commission info', 'error');
    }
  }

  // ============================================
  // 🖼️ PORTFOLIO
  // ============================================
  async renderPortfolio() {
    const container = document.getElementById('portfolioContent');
    if (!container) return;

    try {
      const snapshot = await db.collection('artworks')
        .where('artistId', '==', this.userId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const artworks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const user = this.userData || {};
      const badge = user.badge || {};
      const comm = user.commission || {};

      const typeLabels = {
        digital: '🎨 Digital Artist',
        traditional: '🖌️ Traditional Artist',
        mixed: '🎭 Mixed Media Artist',
        '3d': '🧊 3D Artist',
        photography: '📷 Photographer',
        animation: '🎬 Animator'
      };

      let html = `
        <div class="portfolio-artist-info">
          <div>
            <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);">${this.escapeHtml(user.fullname || 'Artist')}</h3>
            <p style="font-family:var(--font-mono);color:var(--profile-text-muted);font-size:0.85rem;">@${this.escapeHtml(user.username || 'artist')}</p>
            ${badge.artistType ? `<span style="display:inline-block;padding:2px 12px;border-radius:2px;background:var(--accent-dim);color:var(--accent);font-size:0.7rem;font-weight:600;margin-top:4px;">${typeLabels[badge.artistType] || badge.artistType}</span>` : ''}
            ${user.bio ? `<p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;margin-top:0.5rem;">${this.escapeHtml(user.bio)}</p>` : ''}
          </div>
          <div style="display:flex;gap:2rem;flex-wrap:wrap;">
            <div><div style="font-family:var(--font-display);font-size:1.5rem;color:var(--text-primary);">${artworks.length}</div><div style="font-family:var(--font-mono);color:var(--profile-text-muted);font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">Artworks</div></div>
            ${comm.rates ? `<div><div style="font-family:var(--font-display);font-size:1rem;color:#58ebfe;">${this.escapeHtml(comm.rates)}</div><div style="font-family:var(--font-mono);color:var(--profile-text-muted);font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">Rates</div></div>` : ''}
            ${comm.contact ? `<div><div style="font-family:var(--font-display);font-size:0.85rem;color:#4ff3a6;">${this.escapeHtml(comm.contact)}</div><div style="font-family:var(--font-mono);color:var(--profile-text-muted);font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;">Contact</div></div>` : ''}
          </div>
        </div>
        <div class="portfolio-artwork-grid">
      `;

      if (artworks.length === 0) {
        html += `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--profile-text-muted);"><i class="fas fa-paint-brush" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i><p>No artworks yet</p></div>`;
      } else {
        artworks.forEach(art => {
          html += `
            <div class="portfolio-artwork-item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
              <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" loading="lazy" />
              <div class="info">
                <div class="title">${art.isNSFW ? '🔞 ' : ''}${this.escapeHtml(art.title)}</div>
                <div class="meta"><span>❤️ ${art.likes || 0}</span><span>👁️ ${art.views || 0}</span></div>
              </div>
            </div>
          `;
        });
      }

      html += `</div>`;
      container.innerHTML = html;
    } catch (error) {
      console.error('Error rendering portfolio:', error);
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading portfolio</p></div>`;
    }
  }

  // ============================================
  // 📤 UPLOAD MODAL
  // ============================================
  setupUploadModal() {
    const fileInput = document.getElementById('uploadFile');
    const dropZone = document.getElementById('uploadDropZone');
    const preview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('uploadPreviewImg');
    const removeBtn = document.getElementById('removePreviewBtn');
    const nsfwToggle = document.getElementById('uploadNSFW');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleUploadFile(file);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleUploadFile(e.dataTransfer.files[0]);
      }
    });

    removeBtn.addEventListener('click', () => {
      this.uploadFile = null;
      preview.style.display = 'none';
      document.querySelector('.upload-placeholder').style.display = 'block';
      fileInput.value = '';
    });

    nsfwToggle.addEventListener('change', () => {
      document.getElementById('nsfwCategory').style.display = nsfwToggle.checked ? 'block' : 'none';
    });

    const tagsInput = document.getElementById('uploadTags');
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagsInput.value.trim();
        if (tag && this.uploadModalTags.length < 10 && !this.uploadModalTags.includes(tag)) {
          this.uploadModalTags.push(tag);
          this.renderUploadTags();
          tagsInput.value = '';
        }
      }
    });
  }

  renderUploadTags() {
    const display = document.getElementById('uploadTagsDisplay');
    display.innerHTML = this.uploadModalTags.map((tag, i) => `
      <span class="tag">${tag}<button class="remove" data-index="${i}"><i class="fas fa-times"></i></button></span>
    `).join('');
    display.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.uploadModalTags.splice(idx, 1);
        this.renderUploadTags();
      });
    });
  }

  handleUploadFile(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('File must be less than 10MB', 'error');
      return;
    }
    this.uploadFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('uploadPreviewImg').src = e.target.result;
      document.getElementById('uploadPreview').style.display = 'block';
      document.querySelector('.upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  async submitUpload() {
    const title = document.getElementById('uploadTitle').value.trim();
    if (!title) {
      this.showToast('Please enter a title', 'error');
      return;
    }
    if (!this.uploadFile) {
      this.showToast('Please select an artwork file', 'error');
      return;
    }
    const description = document.getElementById('uploadDescription').value.trim();
    const category = document.getElementById('uploadCategory').value;
    const software = document.getElementById('uploadSoftware').value.trim();
    const tags = this.uploadModalTags || [];
    const isNSFW = document.getElementById('uploadNSFW').checked;
    const nsfwCategory = document.getElementById('uploadNSFWCategory').value;

    const btn = document.getElementById('submitUploadBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    try {
      if (window.artworkManager) {
        await window.artworkManager.uploadArtwork({
          file: this.uploadFile,
          title: title,
          description: description,
          category: category,
          software: software,
          tags: tags,
          challenge: null,
          isNSFW: isNSFW,
          nsfwCategory: isNSFW ? nsfwCategory : null
        });
        this.closeUploadModal();
        this.showToast('Artwork uploaded! 🎉');
        this.loadUploads(true);
      } else {
        throw new Error('Artwork manager not available');
      }
    } catch (error) {
      this.showToast(error.message || 'Upload failed', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // ============================================
  // 📁 COLLECTIONS
  // ============================================
  async loadCollections() {
    const grid = document.getElementById('collectionsGrid');
    try {
      const snapshot = await db.collection('users')
        .doc(this.userId)
        .collection('collections')
        .orderBy('createdAt', 'desc')
        .get();
      if (snapshot.empty) {
        grid.innerHTML = `<div class="collection-card" style="opacity:0.5;cursor:default;"><div class="thumb">📁</div><div class="name" style="color:rgba(255,255,255,0.2);">No collections</div></div>`;
        return;
      }
      grid.innerHTML = snapshot.docs.map(doc => {
        const data = doc.data();
        return `
          <div class="collection-card" onclick="window.location.href='/pages/community/collection.html?id=${doc.id}&user=${this.userId}'">
            <div class="thumb">📁</div>
            <div class="name">${this.escapeHtml(data.name)}</div>
            <div class="count">${data.artworkIds?.length || 0} artworks</div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading collections:', error);
      grid.innerHTML = `<div class="collection-card" style="opacity:0.5;cursor:default;"><div class="thumb">📁</div><div class="name" style="color:rgba(255,255,255,0.2);">Error loading</div></div>`;
    }
  }

  // ============================================
  // 🎮 EVENT LISTENERS
  // ============================================
  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const targetContent = document.getElementById(`tab-${target}`);
        if (targetContent) targetContent.classList.add('active');
        if (target === 'portfolio' && !this.isPortfolioMode()) {
          this.renderPortfolio();
        }
      });
    });

    // Bio toggle
    const bio = document.querySelector('.hero-bio');
    const toggleBtn = document.querySelector('.bio-toggle');
    if (bio && toggleBtn) {
      bio.addEventListener('click', (e) => {
        if (e.target.classList.contains('bio-toggle')) return;
        bio.classList.toggle('collapsed');
        toggleBtn.textContent = bio.classList.contains('collapsed') ? 'Show more ▼' : 'Show less ▲';
      });
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bio.classList.toggle('collapsed');
        toggleBtn.textContent = bio.classList.contains('collapsed') ? 'Show more ▼' : 'Show less ▲';
      });
    }

    // Theme toggle - only works on own profile (saves to Firestore)
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
      // Remove existing listeners and add new one
      const newThemeToggle = themeToggleBtn.cloneNode(true);
      themeToggleBtn.parentNode.replaceChild(newThemeToggle, themeToggleBtn);

      newThemeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Palette - ONLY on own profile
    const paletteToggle = document.getElementById('paletteToggle');
    if (paletteToggle && this.isOwnProfile) {
      paletteToggle.addEventListener('click', () => {
        document.getElementById('paletteGrid').classList.toggle('active');
      });
    }

    // Palette swatches - save to Firestore when on own profile
    document.querySelectorAll('.palette-swatch').forEach(el => {
      el.addEventListener('click', async () => {
        const color = el.dataset.color;
        this.applyPalette(color);
        document.getElementById('paletteGrid').classList.remove('active');

        // Save to Firestore if viewing own profile
        if (this.isOwnProfile) {
          await this.savePaletteToFirestore(color);
        }
      });
    });

    // Layer controls
    document.getElementById('layerToggle').addEventListener('click', () => {
      document.getElementById('layerOptions').classList.toggle('active');
    });

    // Layer uploads
    const bgUpload = document.getElementById('bgUpload');
    const overlayUpload = document.getElementById('overlayUpload');
    const bgRemove = document.getElementById('bgRemove');
    const overlayRemove = document.getElementById('overlayRemove');

    if (bgUpload) {
      bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('📁 Background file selected:', file.name, file.size);
          this.uploadLayer(file, 'background');
        }
        bgUpload.value = '';
      });
    }
    if (overlayUpload) {
      overlayUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('📁 Overlay file selected:', file.name, file.size);
          this.uploadLayer(file, 'overlay');
        }
        overlayUpload.value = '';
      });
    }
    if (bgRemove) {
      bgRemove.addEventListener('click', () => this.removeLayer('background'));
    }
    if (overlayRemove) {
      overlayRemove.addEventListener('click', () => this.removeLayer('overlay'));
    }

    // Save buttons
    document.getElementById('saveAboutBtn').addEventListener('click', () => this.saveAbout());
    document.getElementById('saveCommissionBtn').addEventListener('click', () => this.saveCommission());

    // Social edit
    document.getElementById('editSocialBtn').addEventListener('click', () => this.openSocialModal());

    // Badge edit
    document.getElementById('editBadgeBtn').addEventListener('click', () => this.openBadgeModal());

    // Shadow
    document.getElementById('shadowBtn').addEventListener('click', () => this.toggleShadow());

    // Upload modal
    document.getElementById('floatingUploadBtn').addEventListener('click', () => this.openUploadModal());
    document.getElementById('closeUploadModal').addEventListener('click', () => this.closeUploadModal());
    document.getElementById('cancelUploadBtn').addEventListener('click', () => this.closeUploadModal());
    document.getElementById('submitUploadBtn').addEventListener('click', () => this.submitUpload());
    this.setupUploadModal();

    // Collection modal
    document.getElementById('newCollectionBtn').addEventListener('click', () => this.openCollectionModal());
    document.getElementById('closeCollectionModal').addEventListener('click', () => this.closeCollectionModal());
    document.getElementById('cancelCollectionBtn').addEventListener('click', () => this.closeCollectionModal());
    document.getElementById('saveCollectionBtn').addEventListener('click', () => this.saveCollection());

    // Portfolio
    document.getElementById('sharePortfolioBtn').addEventListener('click', () => this.sharePortfolio());
    document.getElementById('copyPortfolioBtn').addEventListener('click', () => this.copyPortfolioLink());
    document.getElementById('switchProfileBtn').addEventListener('click', () => this.switchToProfile());
    document.getElementById('togglePortfolioBtn')?.addEventListener('click', () => {
      this.togglePortfolioMode();
    });

    // CV upload
    document.getElementById('cvFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleCVFile(file);
    });
    document.getElementById('cvRemoveBtn').addEventListener('click', () => this.removeCV());
    document.getElementById('cvDownloadBtn').addEventListener('click', () => this.downloadCV());

    // Social modal
    document.getElementById('closeSocialModal').addEventListener('click', () => this.closeSocialModal());
    document.getElementById('cancelSocialBtn').addEventListener('click', () => this.closeSocialModal());
    document.getElementById('saveSocialBtn').addEventListener('click', () => this.saveSocialLinks());

    // Badge modal
    document.getElementById('closeBadgeModal').addEventListener('click', () => this.closeBadgeModal());
    document.getElementById('cancelBadgeBtn').addEventListener('click', () => this.closeBadgeModal());
    document.getElementById('saveBadgeBtn').addEventListener('click', () => this.saveBadge());

    // View all uploads
    document.getElementById('viewAllUploadsBtn').addEventListener('click', () => {
      window.location.href = `/pages/community/gallery.html?user=${this.userId}`;
    });

    // Sidebar actions
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch(action) {
          case 'palette':
            document.getElementById('paletteGrid').classList.toggle('active');
            break;
          case 'settings':
            window.location.href = '/pages/account/settings.html';
            break;
          case 'share':
            this.sharePortfolio();
            break;
          case 'message':
            // FIXED: Redirect to messages page with user parameter
            this.openMessageModal();
            break;
          case 'block':
            if (!this.isOwnProfile) this.openBlockModal();
            else this.showToast("You can't block yourself", 'error');
            break;
          case 'cv':
            this.downloadCV();
            break;
        }
      });
    });

    // Show layer controls for own profile
    if (this.isOwnProfile) {
      document.getElementById('layerControls').style.display = 'flex';
    }
  }

  // ============================================
  // 💬 OPEN MESSAGE MODAL — FIXED
  // ============================================

  openMessageModal() {
    if (!this.currentUser) {
      this.showToast('Please login first', 'error');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    if (this.isOwnProfile) {
      this.showToast("You can't message yourself", 'error');
      return;
    }

    // Redirect to messages page with the user parameter
    window.location.href = `/pages/community/messages.html?user=${this.userId}`;
  }

  // ============================================
  // 📤 LAYER UPLOAD / REMOVE
  // ============================================
  async uploadLayer(file, type) {
    if (!this.isOwnProfile) {
      this.showToast('You can only upload to your own profile', 'error');
      return;
    }
    if (!file) {
      this.showToast('No file selected', 'error');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      this.showToast('File must be less than 100MB', 'error');
      return;
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.showToast('Please upload an image or video file', 'error');
      return;
    }

    const key = type === 'background' ? 'heroBackground' : 'heroOverlay';
    const label = type === 'background' ? 'Background' : 'Overlay';
    const removeBtn = type === 'background' ? document.getElementById('bgRemove') : document.getElementById('overlayRemove');

    this.showToast(`Uploading ${label}...`, 'info');

    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `hero/${this.userId}/${type}/${timestamp}.${fileExt}`;
      const storageRef = firebase.storage().ref();
      const uploadTask = storageRef.child(filePath).put(file);
      const snapshot = await uploadTask;
      const downloadURL = await snapshot.ref.getDownloadURL();

      console.log(`✅ ${label} uploaded:`, downloadURL);
      await db.collection('users').doc(this.userId).update({ [key]: downloadURL });
      this.userData[key] = downloadURL;

      if (type === 'background') {
        this.setLayer1(downloadURL);
      } else {
        this.setLayer2(downloadURL);
      }
      if (removeBtn) removeBtn.style.display = 'flex';
      this.showToast(`${label} updated successfully! ✅`);
    } catch (error) {
      console.error('Upload error:', error);
      this.showToast(`Error uploading ${label}: ${error.message}`, 'error');
    }
  }

  async removeLayer(type) {
    if (!this.isOwnProfile) {
      this.showToast('You can only remove your own layers', 'error');
      return;
    }
    const key = type === 'background' ? 'heroBackground' : 'heroOverlay';
    const label = type === 'background' ? 'Background' : 'Overlay';
    const removeBtn = type === 'background' ? document.getElementById('bgRemove') : document.getElementById('overlayRemove');

    if (!confirm(`Remove your ${label}?`)) return;

    try {
      await db.collection('users').doc(this.userId).update({ [key]: '' });
      this.userData[key] = '';
      if (type === 'background') {
        this.setLayer1('');
      } else {
        this.setLayer2('');
      }
      if (removeBtn) removeBtn.style.display = 'none';
      this.showToast(`${label} removed`);
    } catch (error) {
      console.error('Remove error:', error);
      this.showToast(`Error removing ${label}: ${error.message}`, 'error');
    }
  }

  // ============================================
  // 🔗 SOCIAL LINKS MODAL
  // ============================================
  openSocialModal() {
    const links = this.userData?.socialLinks || {};
    document.getElementById('socialInstagram').value = links.instagram || '';
    document.getElementById('socialTikTok').value = links.tiktok || '';
    document.getElementById('socialYouTube').value = links.youtube || '';
    document.getElementById('socialPinterest').value = links.pinterest || '';
    document.getElementById('socialDiscord').value = links.discord || '';
    document.getElementById('socialX').value = links.x || '';
    document.getElementById('socialVGen').value = links.vgen || '';
    document.getElementById('socialKoFi').value = links.kofi || '';
    document.getElementById('socialModal').classList.add('active');
  }

  closeSocialModal() {
    document.getElementById('socialModal').classList.remove('active');
  }

  async saveSocialLinks() {
    const links = {
      instagram: document.getElementById('socialInstagram').value.trim(),
      tiktok: document.getElementById('socialTikTok').value.trim(),
      youtube: document.getElementById('socialYouTube').value.trim(),
      pinterest: document.getElementById('socialPinterest').value.trim(),
      discord: document.getElementById('socialDiscord').value.trim(),
      x: document.getElementById('socialX').value.trim(),
      vgen: document.getElementById('socialVGen').value.trim(),
      kofi: document.getElementById('socialKoFi').value.trim()
    };
    Object.keys(links).forEach(k => { if (!links[k]) delete links[k]; });

    try {
      await db.collection('users').doc(this.userId).update({ socialLinks: links });
      this.userData.socialLinks = links;
      this.renderSocialLinks(links);
      this.closeSocialModal();
      this.showToast('Social links updated! ✅');
    } catch (error) {
      this.showToast('Error saving social links', 'error');
    }
  }

  // ============================================
  // 🏅 BADGE MODAL
  // ============================================
  openBadgeModal() {
    const badge = this.userData?.badge || {};
    document.getElementById('artistType').value = badge.artistType || '';
    this.populateSpecialties(badge.artistType || '');
    document.getElementById('badgeModal').classList.add('active');
  }

  closeBadgeModal() {
    document.getElementById('badgeModal').classList.remove('active');
  }

  populateSpecialties(type) {
    const specialtyMap = {
      '': [],
      digital: ['character-design', 'portrait', 'anatomy', 'landscape', 'digital-painting', 'concept-art', 'illustration', 'manga', 'storyboarding', 'photo-manipulation'],
      traditional: ['oil-painting', 'watercolor', 'acrylic', 'charcoal', 'ink', 'pastel', 'mixed-media', 'collage', 'printmaking', 'sketching'],
      '3d': ['3d-modeling', 'sculpting', 'texturing', 'rigging', 'animation-3d', 'game-art'],
      photography: ['portrait-photography', 'landscape-photography', 'macro', 'street', 'fine-art', 'wildlife'],
      animation: ['2d-animation', 'stop-motion', 'motion-graphics', 'character-animation', 'experimental'],
      mixed: ['mixed-media', 'collage', 'assemblage', 'installation', 'digital-collage']
    };

    const mediumMap = {
      '': [],
      traditional: ['watercolor', 'acrylic', 'oil-paint', 'ink', 'graphite', 'charcoal-medium', 'pastel-medium', 'gouache', 'colored-pencil', 'marker'],
      digital: ['photoshop', 'procreate', 'clip-studio', 'krita', 'ibis-paint', 'affinity', 'corel-painter', 'blender', 'zbrush', 'maya'],
      '3d': ['blender', 'zbrush', 'maya', '3ds-max', 'cinema4d', 'unity', 'unreal-engine'],
      photography: ['digital-photography', 'film-photography', 'medium-format', 'large-format', 'polaroid', 'lomography'],
      animation: ['toon-boom', 'tv-paint', 'after-effects', 'animate', 'moho', 'spine']
    };

    const specGrid = document.getElementById('specialtiesGrid');
    const medGrid = document.getElementById('mediumGrid');

    // Specialties
    const specs = specialtyMap[type] || [];
    if (specs.length === 0) {
      specGrid.innerHTML = '<div class="empty-message">Select an artist type above to see specialties</div>';
    } else {
      const mid = Math.ceil(specs.length / 2);
      const col1 = specs.slice(0, mid);
      const col2 = specs.slice(mid);

      specGrid.innerHTML = `
        <div class="group">
          ${col1.map(s => `
            <label>
              <input type="checkbox" value="${s}" />
              ${s.replace(/-/g, ' ')}
            </label>
          `).join('')}
        </div>
        ${col2.length > 0 ? `<div class="group">${col2.map(s => `
          <label>
            <input type="checkbox" value="${s}" />
            ${s.replace(/-/g, ' ')}
          </label>
        `).join('')}</div>` : ''}
      `;
    }

    // Mediums
    const meds = mediumMap[type] || [];
    if (meds.length === 0) {
      medGrid.innerHTML = '<div class="empty-message">Select an artist type above to see mediums</div>';
    } else {
      const mid2 = Math.ceil(meds.length / 2);
      const col1 = meds.slice(0, mid2);
      const col2 = meds.slice(mid2);

      medGrid.innerHTML = `
        <div class="group">
          ${col1.map(m => `
            <label>
              <input type="checkbox" value="${m}" />
              ${m.replace(/-/g, ' ')}
            </label>
          `).join('')}
        </div>
        ${col2.length > 0 ? `<div class="group">${col2.map(m => `
          <label>
            <input type="checkbox" value="${m}" />
            ${m.replace(/-/g, ' ')}
          </label>
        `).join('')}</div>` : ''}
      `;
    }

    // Restore selected values if badge exists
    const badge = this.userData?.badge || {};
    if (badge.specialties) {
      specGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = badge.specialties.includes(cb.value);
      });
    }
    if (badge.mediums) {
      medGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = badge.mediums.includes(cb.value);
      });
    }
  }

  async saveBadge() {
    const type = document.getElementById('artistType').value;
    if (!type) {
      this.showToast('Please select an artist type', 'error');
      return;
    }
    const specialties = Array.from(document.querySelectorAll('#specialtiesGrid input:checked')).map(cb => cb.value);
    const mediums = Array.from(document.querySelectorAll('#mediumGrid input:checked')).map(cb => cb.value);

    if (specialties.length > 4) {
      this.showToast('Please select up to 4 specialties', 'error');
      return;
    }
    if (mediums.length > 3) {
      this.showToast('Please select up to 3 mediums', 'error');
      return;
    }

    const badge = { artistType: type, specialties, mediums };
    try {
      await db.collection('users').doc(this.userId).update({ badge });
      this.userData.badge = badge;
      this.renderBadge(badge);
      this.closeBadgeModal();
      this.showToast('Badge updated! 🎉');
    } catch (error) {
      this.showToast('Error saving badge', 'error');
    }
  }

  // ============================================
  // 👻 SHADOW
  // ============================================
  async toggleShadow() {
    if (!this.currentUser || this.currentUser.uid === this.userId) {
      this.showToast(this.currentUser?.uid === this.userId ? "You can't shadow yourself" : 'Please login first', 'error');
      return;
    }

    const btn = document.getElementById('shadowBtn');
    const icon = btn.querySelector('.shadow-icon');
    const text = btn.querySelector('.shadow-text');

    try {
      const shadowsRef = db.collection('shadows');
      const existing = await shadowsRef
        .where('shadowerId', '==', this.currentUser.uid)
        .where('targetId', '==', this.userId)
        .get();

      if (!existing.empty) {
        await existing.docs[0].ref.delete();
        icon.textContent = '👤';
        text.textContent = 'Shadow';
        btn.classList.remove('shadowing');
      } else {
        await shadowsRef.add({
          shadowerId: this.currentUser.uid,
          shadowerName: this.currentUser.displayName || 'User',
          targetId: this.userId,
          targetName: this.userData?.fullname || 'Artist',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        icon.textContent = '✨';
        text.textContent = 'Shadowing';
        btn.classList.add('shadowing');
      }
    } catch (error) {
      this.showToast('Error toggling shadow', 'error');
    }
  }

  // ============================================
  // 📤 UPLOAD MODAL (Open/Close)
  // ============================================
  openUploadModal() {
    this.uploadFile = null;
    this.uploadModalTags = [];
    document.getElementById('uploadTitle').value = '';
    document.getElementById('uploadDescription').value = '';
    document.getElementById('uploadSoftware').value = '';
    document.getElementById('uploadTags').value = '';
    document.getElementById('uploadNSFW').checked = false;
    document.getElementById('nsfwCategory').style.display = 'none';
    document.getElementById('uploadTagsDisplay').innerHTML = '';
    document.getElementById('uploadPreview').style.display = 'none';
    document.querySelector('.upload-placeholder').style.display = 'block';
    document.getElementById('uploadFile').value = '';
    document.getElementById('uploadModal').classList.add('active');
  }

  closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
  }

  // ============================================
  // 📁 COLLECTION MODAL
  // ============================================
  async openCollectionModal() {
    const modal = document.getElementById('collectionModal');
    document.getElementById('collectionName').value = '';
    document.getElementById('collectionDescription').value = '';

    const select = document.getElementById('collectionArtworks');
    try {
      const snapshot = await db.collection('artworks')
        .where('artistId', '==', this.userId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      if (snapshot.empty) {
        select.innerHTML = '<p style="color:rgba(255,255,255,0.2);font-size:0.8rem;">No artworks found</p>';
      } else {
        select.innerHTML = snapshot.docs.map(doc => {
          const data = doc.data();
          return `
            <label class="artwork-option">
              <input type="checkbox" value="${doc.id}" />
              <img src="${data.imageUrl}" alt="${data.title}" />
              <span>${this.escapeHtml(data.title)}</span>
            </label>
          `;
        }).join('');
      }
    } catch (error) {
      select.innerHTML = '<p style="color:rgba(255,255,255,0.2);font-size:0.8rem;">Error loading artworks</p>';
    }
    modal.classList.add('active');
  }

  closeCollectionModal() {
    document.getElementById('collectionModal').classList.remove('active');
  }

  async saveCollection() {
    const name = document.getElementById('collectionName').value.trim();
    if (!name) {
      this.showToast('Please enter a collection name', 'error');
      return;
    }
    const selected = Array.from(document.querySelectorAll('#collectionArtworks input:checked')).map(cb => cb.value);

    try {
      await db.collection('users').doc(this.userId).collection('collections').add({
        name: name,
        description: document.getElementById('collectionDescription').value.trim(),
        artworkIds: selected,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.closeCollectionModal();
      this.loadCollections();
      this.showToast('Collection created! ✅');
    } catch (error) {
      this.showToast('Error creating collection', 'error');
    }
  }

  // ============================================
  // 📄 CV
  // ============================================
  async handleCVFile(file) {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Please upload a PDF, DOC, or DOCX file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File must be less than 5MB', 'error');
      return;
    }

    this.cvFile = file;

    try {
      const storageRef = firebase.storage().ref();
      const filePath = `cvs/${this.userId}/${Date.now()}_${file.name}`;
      const uploadTask = storageRef.child(filePath).put(file);
      const snapshot = await uploadTask;
      const url = await snapshot.ref.getDownloadURL();

      this.cvUrl = url;
      document.getElementById('cvPreview').style.display = 'flex';
      document.getElementById('cvFileName').textContent = file.name;
      document.querySelector('.cv-drop-zone').style.display = 'none';

      await db.collection('users').doc(this.userId).update({
        'commission.cvUrl': url,
        'commission.cvName': file.name
      });
      this.showToast('CV uploaded! ✅');
    } catch (error) {
      this.showToast('Error uploading CV', 'error');
    }
  }

  removeCV() {
    this.cvFile = null;
    this.cvUrl = null;
    document.getElementById('cvPreview').style.display = 'none';
    document.querySelector('.cv-drop-zone').style.display = 'block';
    document.getElementById('cvFileInput').value = '';
    db.collection('users').doc(this.userId).update({
      'commission.cvUrl': firebase.firestore.FieldValue.delete(),
      'commission.cvName': firebase.firestore.FieldValue.delete()
    }).catch(() => {});
    this.showToast('CV removed');
  }

  downloadCV() {
    if (this.cvUrl) {
      window.open(this.cvUrl, '_blank');
    } else if (this.userData?.commission?.cvUrl) {
      window.open(this.userData.commission.cvUrl, '_blank');
    } else {
      this.showToast('No CV found', 'error');
    }
  }

  // ============================================
  // 🔗 PORTFOLIO SHARING
  // ============================================
  sharePortfolio() {
    const url = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'mode=portfolio';
    if (navigator.share) {
      navigator.share({
        title: `${this.userData?.fullname || 'Artist'}'s Portfolio`,
        text: `Check out ${this.userData?.fullname || 'Artist'}'s art portfolio!`,
        url: url
      }).catch(() => {});
    } else {
      this.copyPortfolioLink();
    }
  }

  copyPortfolioLink() {
    const url = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'mode=portfolio';
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('📋 Portfolio link copied!');
    }).catch(() => {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showToast('📋 Portfolio link copied!');
    });
  }

  switchToProfile() {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.location.href = url.toString();
  }

  // ============================================
  // 🚫 BLOCK
  // ============================================
  openBlockModal() {
    if (!this.currentUser) {
      this.showToast('Please login first', 'error');
      window.location.href = '/pages/auth/login.html';
      return;
    }

    if (this.isOwnProfile) {
      this.showToast("You can't block yourself", 'error');
      return;
    }

    if (confirm(`Block ${this.userData?.fullname || 'this user'}? They won't be able to interact with you.`)) {
      this.confirmBlock();
    }
  }

  async confirmBlock() {
    try {
      await db.collection('users')
        .doc(this.currentUser.uid)
        .collection('blockedUsers')
        .doc(this.userId)
        .set({
          blockedUserId: this.userId,
          blockedUserName: this.userData?.fullname || 'Artist',
          blockedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      this.showToast('User blocked ✅');
      setTimeout(() => window.location.href = '/pages/community/hub.html', 1500);
    } catch (error) {
      this.showToast('Error blocking user', 'error');
    }
  }

  // ============================================
  // 🎯 PORTFOLIO MODE
  // ============================================
  isPortfolioMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'portfolio';
  }

  applyPortfolioMode() {
    if (!this.isPortfolioMode()) return;
    console.log('🎯 Portfolio mode activated');

    const portfolioTab = document.querySelector('[data-tab="portfolio"]');
    if (portfolioTab) portfolioTab.click();

    const toggleText = document.getElementById('portfolioToggleText');
    const toggleBtn = document.getElementById('togglePortfolioBtn');
    if (toggleText) toggleText.textContent = 'Disable Portfolio Mode';
    if (toggleBtn) {
      toggleBtn.style.background = 'var(--accent-dim)';
      toggleBtn.style.borderColor = 'var(--accent)';
      toggleBtn.style.boxShadow = 'var(--accent-glow)';
    }

    const tabs = document.querySelectorAll('.tab');
    const tabsToKeep = ['about', 'uploads', 'portfolio'];
    tabs.forEach(tab => {
      const tabId = tab.dataset.tab;
      tab.style.display = tabsToKeep.includes(tabId) ? 'flex' : 'none';
    });

    const sidebar = document.querySelector('.hero-sidebar');
    if (sidebar) {
      const iconsToHide = ['message', 'block', 'settings', 'cv'];
      const icons = sidebar.querySelectorAll('.sidebar-btn');
      icons.forEach(icon => {
        const action = icon.dataset.action;
        if (iconsToHide.includes(action)) {
          icon.style.display = 'none';
        }
      });
    }

    const shadowBtn = document.getElementById('shadowBtn');
    if (shadowBtn) shadowBtn.style.display = 'none';

    const editSocialBtn = document.getElementById('editSocialBtn');
    if (editSocialBtn) editSocialBtn.style.display = 'none';

    const editBadgeBtn = document.getElementById('editBadgeBtn');
    if (editBadgeBtn) editBadgeBtn.style.display = 'none';

    const badgesContainer = document.getElementById('heroBadges');
    if (badgesContainer) {
      let portfolioBadge = badgesContainer.querySelector('.badge.portfolio');
      if (!portfolioBadge) {
        portfolioBadge = document.createElement('span');
        portfolioBadge.className = 'badge portfolio';
        portfolioBadge.innerHTML = '<i class="fas fa-folder-open"></i> Portfolio';
        badgesContainer.appendChild(portfolioBadge);
      }
    }

    this.renderPortfolio();
    const nameEl = document.getElementById('profileName');
    if (nameEl) {
      document.title = `${nameEl.textContent} - Portfolio | Art Mecca`;
    }
  }

  togglePortfolioMode() {
    const url = new URL(window.location.href);
    const isPortfolio = url.searchParams.get('mode') === 'portfolio';
    if (isPortfolio) {
      url.searchParams.delete('mode');
    } else {
      url.searchParams.set('mode', 'portfolio');
    }
    window.location.href = url.toString();
  }

  // ============================================
  // 🛠️ UTILITY
  // ============================================
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = 'success') {
    let toast = document.getElementById('customToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'customToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 5, 20, 0.95);
        backdrop-filter: blur(12px);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 9999;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 500;
        border: 1px solid rgba(255, 0, 234, 0.12);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
        pointer-events: none;
        max-width: 90%;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    if (type === 'error') {
      toast.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    } else if (type === 'info') {
      toast.style.borderColor = 'rgba(88, 235, 254, 0.2)';
      toast.style.boxShadow = '0 8px 32px rgba(88, 235, 254, 0.1)';
    } else {
      toast.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
  }

  showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
    window.profile = new Profile();
  } else {
    setTimeout(() => {
      window.profile = new Profile();
    }, 1000);
  }
});
