/**
 * Page Redirect Handler
 * Manages landing vs home page based on auth status
 */

class PageRedirect {
  constructor() {
    this.init();
  }

  async init() {
    // Wait for Firebase
    if (typeof firebase === 'undefined') {
      setTimeout(() => this.init(), 500);
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      const currentPath = window.location.pathname;

      // If user is logged in and on landing page → redirect to home
      if (user && (currentPath === '/' || currentPath === '/index.html')) {
        window.location.href = '/home.html';
        return;
      }

      // If user is NOT logged in and on home page → redirect to landing
      if (!user && (currentPath === '/home.html')) {
        window.location.href = '/';
        return;
      }

      // If user is on home page but not logged in → show login prompt
      if (!user && currentPath === '/home.html') {
        // Optionally show a login overlay
        this.showLoginPrompt();
      }
    });
  }

  showLoginPrompt() {
    // Show a nice overlay asking to login
    const overlay = document.createElement('div');
    overlay.id = 'loginPrompt';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: #1a1a2e;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          max-width: 400px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
          <h2 style="color: white; margin-bottom: 16px;">Please Log In</h2>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 24px;">
            This page requires you to be logged in.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <a href="/pages/auth/login.html" class="btn btn-primary">Log In</a>
            <a href="/" class="btn btn-secondary">Go to Home</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Only run on index.html or home.html
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html' || path === '/home.html') {
    window.pageRedirect = new PageRedirect();
  }
});
