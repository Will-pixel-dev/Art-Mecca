// ============================================ */
// POINTS PAGE - FUNCTIONALITY                  */
// ============================================ */

class PointsPage {
  constructor() {
    this.currentUser = null;
    this.userData = null;
    this.points = 0;
    this.badges = [];
    this.wins = 0;

    this.init();
  }

  async init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Setup theme toggle
    this.setupThemeToggle();

    // Initialize Firebase auth
    firebase.auth().onAuthStateChanged(async (user) => {
      this.currentUser = user;

      if (user) {
        await this.loadUserData();
        this.updateUI();
        this.setupEventListeners();
      } else {
        // Show login prompt
        document.getElementById('totalPoints').textContent = '?';
        document.getElementById('badgesEarned').textContent = '?';
        document.getElementById('challengesWon').textContent = '?';
        document.getElementById('globalRank').textContent = 'Login';
      }
    });
  }

  // ============================================ */
  // THEME TOGGLE - FIXED                        */
  // ============================================ */
  setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) {
      console.warn('Theme toggle button not found');
      return;
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.applyTheme(savedTheme);

    // Remove existing listeners by cloning
    const newToggle = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);

    // Add click listener
    newToggle.addEventListener('click', (e) => {
      e.preventDefault();

      const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);

      console.log('Theme toggled to:', newTheme);
    });
  }

  applyTheme(theme) {
    const body = document.body;
    const toggleBtn = document.getElementById('themeToggle');

    // Remove both classes
    body.classList.remove('dark-mode', 'light-mode');

    if (theme === 'light') {
      body.classList.add('light-mode');
    } else {
      body.classList.add('dark-mode');
    }

    // Update button icons
    if (toggleBtn) {
      const moonIcon = toggleBtn.querySelector('.fa-moon');
      const sunIcon = toggleBtn.querySelector('.fa-sun');
      if (moonIcon && sunIcon) {
        if (theme === 'light') {
          moonIcon.style.display = 'none';
          sunIcon.style.display = 'block';
        } else {
          moonIcon.style.display = 'block';
          sunIcon.style.display = 'none';
        }
      }
    }

    console.log('Theme applied:', theme);
  }

  async loadUserData() {
    try {
      const doc = await firebase.firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .get();

      if (doc.exists) {
        this.userData = doc.data();

        // Calculate points from various sources
        const artworks = this.userData.artworks ?
          (Array.isArray(this.userData.artworks) ? this.userData.artworks.length : this.userData.artworks) : 0;
        const followers = this.userData.followers ?
          (Array.isArray(this.userData.followers) ? this.userData.followers.length : this.userData.followers) : 0;
        const likes = this.userData.totalLikes || 0;

        // Points calculation (matches the leaderboard)
        this.points = Math.round((artworks * 10) + (followers * 2) + (likes * 0.5));

        // Get badges - from user data or default
        this.badges = this.userData.badges || [];

        // Get wins count
        this.wins = this.userData.challengeWins || 0;

        // Save points to user document if needed
        await firebase.firestore()
          .collection('users')
          .doc(this.currentUser.uid)
          .set({
            points: this.points,
            totalPoints: this.points
          }, { merge: true });

      } else {
        // New user - initialize
        await firebase.firestore()
          .collection('users')
          .doc(this.currentUser.uid)
          .set({
            points: 0,
            totalPoints: 0,
            badges: [],
            challengeWins: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  updateUI() {
    // Update stats
    document.getElementById('totalPoints').textContent = this.points;
    document.getElementById('badgesEarned').textContent = this.badges.length;
    document.getElementById('challengesWon').textContent = this.wins;

    // Update rank (mock for now - could query all users)
    document.getElementById('globalRank').textContent = `#${Math.floor(Math.random() * 100) + 1}`;

    // Update badge gallery
    this.updateBadgeGallery();

    // Update shop buttons
    this.updateShopButtons();
  }

  updateBadgeGallery() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;

    const allBadges = [
      { id: 'grand_master', name: 'Grand Master', icon: '👑', unlocked: false },
      { id: 'monthly_master', name: 'Monthly Master', icon: '⭐', unlocked: false },
      { id: 'weekly_winner', name: 'Weekly Winner', icon: '✨', unlocked: false },
      { id: 'daily_doodle', name: 'Daily Doodle', icon: '🎨', unlocked: false },
      { id: 'supporter', name: 'Supporter', icon: '🌟', unlocked: false },
      { id: 'holiday_hero', name: 'Holiday Hero', icon: '🎄', unlocked: false },
      { id: 'community_champion', name: 'Community Champion', icon: '👥', unlocked: false },
      { id: 'art_duelist', name: 'Art Duelist', icon: '🏆', unlocked: false }
    ];

    // Mark earned badges
    allBadges.forEach(badge => {
      if (this.badges.includes(badge.id)) {
        badge.unlocked = true;
      }
    });

    grid.innerHTML = allBadges.map(badge => `
      <div class="badge-card ${badge.unlocked ? '' : 'locked'}">
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-name">${badge.name}</span>
        <span class="badge-status ${badge.unlocked ? 'earned' : 'locked'}">
          ${badge.unlocked ? '✅ Earned' : '🔒 Not Earned'}
        </span>
      </div>
    `).join('');
  }

  updateShopButtons() {
    document.querySelectorAll('.btn-redeem').forEach(btn => {
      const cost = parseInt(btn.dataset.cost);
      if (this.points < cost) {
        btn.disabled = true;
        btn.textContent = `Need ${cost} pts`;
      } else {
        btn.disabled = false;
        btn.textContent = 'Redeem';
      }
    });
  }

  // In PointsPage class
updateUI() {
    // Update stats with null checks
    const pointsEl = document.getElementById('totalPoints');
    const badgesEl = document.getElementById('badgesEarned');
    const winsEl = document.getElementById('challengesWon');
    const rankEl = document.getElementById('globalRank');

    if (pointsEl) pointsEl.textContent = this.points;
    if (badgesEl) badgesEl.textContent = this.badges.length;
    if (winsEl) winsEl.textContent = this.wins;
    if (rankEl) rankEl.textContent = `#${Math.floor(Math.random() * 100) + 1}`;

    // ... rest of the method
}

  setupEventListeners() {
    // Shop redeem buttons
    document.querySelectorAll('.btn-redeem').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const cost = parseInt(btn.dataset.cost);
        const itemName = btn.closest('.shop-item').querySelector('.shop-name').textContent;

        if (this.points < cost) {
          this.showToast(`You need ${cost} points to redeem this!`, 'error');
          return;
        }

        if (confirm(`Redeem "${itemName}" for ${cost} points?`)) {
          try {
            // Deduct points
            this.points -= cost;

            // Update in Firebase
            await firebase.firestore()
              .collection('users')
              .doc(this.currentUser.uid)
              .set({
                points: this.points,
                totalPoints: this.points
              }, { merge: true });

            // Update UI
            document.getElementById('totalPoints').textContent = this.points;
            this.updateShopButtons();

            this.showToast(`✅ You've redeemed "${itemName}"!`, 'success');
          } catch (error) {
            console.error('Error redeeming:', error);
            this.showToast('Error redeeming. Please try again.', 'error');
          }
        }
      });
    });
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
        background: rgba(26, 26, 46, 0.95);
        backdrop-filter: blur(12px);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        z-index: 9999;
        font-weight: 500;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
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
      toast.style.borderColor = 'rgba(239,68,68,0.3)';
      toast.style.boxShadow = '0 8px 32px rgba(239,68,68,0.2)';
    } else {
      toast.style.borderColor = 'rgba(16,185,129,0.3)';
      toast.style.boxShadow = '0 8px 32px rgba(16,185,129,0.2)';
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
  }
}

// ============================================ */
// INITIALIZE                                  */
// ============================================ */

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      new PointsPage();
    } else {
      console.warn('Firebase not ready, retrying...');
      setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
          new PointsPage();
        }
      }, 2000);
    }
  });
} else {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    new PointsPage();
  } else {
    console.warn('Firebase not ready, retrying...');
    setTimeout(() => {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        new PointsPage();
      }
    }, 2000);
  }
}
