// ============================================================
// COOKIE CONSENT BANNER
// ============================================================

function initCookieBanner() {
    // Check if user already accepted
    if (localStorage.getItem('cookiesAccepted') === 'true') {
        return;
    }

    // Create banner element
    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        background: var(--card, #ffffff);
        border-top: 1px solid var(--border, rgba(0,0,0,0.06));
        padding: 14px 24px;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        font-family: var(--font-body, "Inter", sans-serif);
        backdrop-filter: blur(8px);
    `;

    // Build banner HTML
    banner.innerHTML = `
        <p style="
            font-size: 0.85rem;
            color: var(--text-muted, #6a5a7a);
            margin: 0;
            flex: 1;
            min-width: 200px;
            line-height: 1.5;
        ">
            <i class="fas fa-cookie" style="color: var(--primary, #6b4ecc); margin-right: 8px;"></i>
            We use cookies to enhance your experience. By continuing, you agree to our
            <a href="/pages/admin/privacy.html" style="
                color: var(--primary, #6b4ecc);
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: border-color 0.2s ease;
            " onmouseover="this.style.borderBottomColor='var(--primary, #6b4ecc)'" onmouseout="this.style.borderBottomColor='transparent'">
                Privacy Policy
            </a>.
        </p>
        <div style="display: flex; gap: 8px; flex-shrink: 0;">
            <button onclick="acceptCookies()" style="
                background: var(--primary, #6b4ecc);
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-family: var(--font-body, "Inter", sans-serif);
                font-size: 0.8rem;
                transition: all 0.2s ease;
            " onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 16px rgba(107,78,204,0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
                Accept
            </button>
            <button onclick="dismissCookies()" style="
                background: transparent;
                color: var(--text-muted, #6a5a7a);
                border: 1px solid var(--border, rgba(0,0,0,0.06));
                padding: 8px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-family: var(--font-body, "Inter", sans-serif);
                font-size: 0.8rem;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='var(--border, rgba(0,0,0,0.03))'" onmouseout="this.style.background='transparent'">
                Dismiss
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(banner);

    // Handle scroll to avoid hiding content
    document.body.style.paddingBottom = '80px';

    // Make functions globally accessible
    window.acceptCookies = function() {
        localStorage.setItem('cookiesAccepted', 'true');
        banner.style.display = 'none';
        document.body.style.paddingBottom = '0';
    };

    window.dismissCookies = function() {
        banner.style.display = 'none';
        document.body.style.paddingBottom = '0';
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner);
} else {
    initCookieBanner();
}
