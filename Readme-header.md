/\* HEADER.CSS NEW
/_ ================================================================
HEADER — HOLOGRAPHIC NEON HUD GRAFFITI STYLE
================================================================ _/

/\* ============================================================

1.  FONTS
    ============================================================ \*/
    @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap");
    @import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap");
    @import url("https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap");

/_ ============================================================ 2. CSS VARIABLES
============================================================ _/
:root {
--bg-body: #13051992;
--bg-card: rgba(255, 0, 234, 0.06);
--bg-card-hover: rgba(255, 0, 234, 0.12);
--bg-card-border: rgba(255, 0, 234, 0.15);
--bg-nav: rgba(11, 2, 21, 0.92);

--text-primary: #f5eaff;
--text-secondary: #b8a0d0;
--text-muted: #5a3a6a;
--text-inverse: #0a0508;

--shadow-card: 0 8px 32px rgba(0, 0, 0, 0.6);
--shadow-card-hover: 0 12px 48px rgba(0, 0, 0, 0.7);
--border-color: rgba(255, 0, 234, 0.15);

--neon-magenta: #ff00ea;
--neon-deep-purple: #ad03fc;
--neon-cyan: #58ebfe;
--neon-gold: #ffc72e;
--neon-green: #4ff3a6;
--neon-blue: #00d4ff;

--spray-red: #ff0040;
--spray-orange: #ff6b00;
--spray-yellow: #ffcc00;

--gradient-neon: linear-gradient(135deg, #ff00ea, #ad03fc);
--gradient-cyber: linear-gradient(135deg, #ff00ea, #ad03fc, #58ebfe);
--gradient-holo: linear-gradient(135deg, #ff00ea, #58ebfe, #ffc72e, #4ff3a6, #ad03fc);

--glow-magenta: 0 0 40px rgba(255, 0, 234, 0.3), 0 0 80px rgba(255, 0, 234, 0.1);
--glow-purple: 0 0 40px rgba(173, 3, 252, 0.3), 0 0 80px rgba(173, 3, 252, 0.1);
--glow-cyan: 0 0 40px rgba(88, 235, 254, 0.3), 0 0 80px rgba(88, 235, 254, 0.1);

--font-display: "Orbitron", "Rajdhani", monospace;
--font-condensed: "Rajdhani", "Orbitron", sans-serif;
--font-mono: "Share Tech Mono", monospace;
--font-tag: "Rubik Spray Paint", "Permanent Marker", cursive;
--font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

--transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--transition-slow: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

[data-theme="light"] {
--bg-body: #f5f0e86b;
--bg-card: rgba(255, 255, 255, 0.5);
--bg-card-hover: rgba(255, 255, 255, 0.7);
--bg-nav: rgba(245, 240, 232, 0.92);
--text-primary: #1a102a;
--text-secondary: #4a3a5a;
--text-muted: #8a7a9a;
--text-inverse: #f5f0e8;
--shadow-card: 0 8px 32px rgba(0, 0, 0, 0.06);
--shadow-card-hover: 0 12px 48px rgba(0, 0, 0, 0.1);
--border-color: rgba(173, 3, 252, 0.15);
--glow-magenta: 0 0 40px rgba(255, 0, 234, 0.08), 0 0 80px rgba(255, 0, 234, 0.03);
--glow-purple: 0 0 40px rgba(173, 3, 252, 0.08), 0 0 80px rgba(173, 3, 252, 0.03);
--glow-cyan: 0 0 40px rgba(88, 235, 254, 0.08), 0 0 80px rgba(88, 235, 254, 0.03);
}

/_ ============================================================ 3. KEYFRAMES
============================================================ _/
@keyframes dropdownSlideDown {
from { opacity: 0; transform: translateY(-10px) scale(0.98); }
to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes statusPulse {
0%, 100% { opacity: 0.4; }
50% { opacity: 1; }
}

@keyframes logoGlowPulse {
0%, 100% {
color: #ff00ea;
text-shadow: 0 0 20px rgba(255, 0, 234, 0.4), 0 0 40px rgba(255, 0, 234, 0.2);
transform: scale(1);
}
50% {
color: #58ebfe;
text-shadow: 0 0 30px rgba(88, 235, 254, 0.6), 0 0 60px rgba(88, 235, 254, 0.3);
transform: scale(1.1);
}
}

@keyframes sparklePulse {
0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
50% { opacity: 0.3; transform: scale(1.3) rotate(20deg); }
}

@keyframes trulyGlowPulse {
0%, 100% { text-shadow: 0 0 20px rgba(255, 0, 234, 0.15); opacity: 0.9; }
50% { text-shadow: 0 0 40px rgba(255, 0, 234, 0.4), 0 0 80px rgba(255, 0, 234, 0.15); opacity: 1; }
}

@keyframes searchFadeIn {
from { opacity: 0; transform: translateY(-20px) scale(0.98); }
to { opacity: 1; transform: translateY(0) scale(1); }
}

/_ ============================================================ 4. HEADER — MAIN CONTAINER
============================================================ _/
.main-header {
position: sticky !important;
top: 12px !important;
z-index: 1000 !important;
left: 0 !important;
right: 0 !important;
width: auto !important;
margin: 12px 20px 0 !important;
padding: 0 20px !important;
background: rgba(10, 5, 8, 0.55) !important;
backdrop-filter: blur(10px) !important;
-webkit-backdrop-filter: blur(10px) !important;
border: 1px solid var(--border-color) !important;
border-radius: 4px !important;
box-shadow: var(--shadow-card), var(--glow-magenta) !important;
transition: all var(--transition) !important;
overflow: visible !important;
position: relative;
pointer-events: auto !important;
}

[data-theme="light"] .main-header {
background: rgba(245, 240, 232, 0.55) !important;
}

.main-header .container {
overflow: visible !important;
max-width: 1200px !important;
margin: 0 auto !important;
padding: 0 2rem !important;
position: relative !important;
z-index: 1 !important;
pointer-events: auto !important;
}

/_ ============================================================ 5. NAVBAR
============================================================ _/
.navbar {
display: flex !important;
align-items: center !important;
justify-content: space-between !important;
height: 64px !important;
gap: 16px !important;
position: relative !important;
z-index: 1 !important;
overflow: visible !important;
pointer-events: auto !important;
width: 100% !important;
}

/_ ============================================================ 6. LOGO
============================================================ _/
.nav-brand {
flex-shrink: 0 !important;
margin-right: 20px !important;
}

.nav-brand .logo {
display: flex;
align-items: center;
gap: 10px;
text-decoration: none;
font-size: 1.1rem;
font-weight: 700;
letter-spacing: 2px;
transition: all var(--transition);
position: relative;
pointer-events: auto !important;
font-family: var(--font-display);
}

.nav-brand .logo .logo-icon {
font-size: 1.3rem !important;
display: inline-block !important;
transition: transform var(--transition) !important;
animation: logoGlowPulse 2s ease-in-out infinite !important;
filter: drop-shadow(0 0 20px rgba(255, 0, 234, 0.3)) !important;
}

.nav-brand .logo .logo-icon::before,
.nav-brand .logo .logo-icon::after {
content: none !important;
display: none !important;
}

.nav-brand .logo:hover .logo-icon {
animation: logoGlowPulse 0.8s ease-in-out infinite !important;
transform: rotate(-8deg) scale(1.15) !important;
}

.nav-brand .logo .logo-text {
background: var(--gradient-cyber);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
filter: drop-shadow(0 0 30px rgba(255, 0, 234, 0.1));
}

.nav-brand .hud-tag {
font-family: var(--font-mono);
font-size: 0.45rem;
color: var(--neon-cyan);
opacity: 0.3;
letter-spacing: 2px;
margin-left: 4px;
padding: 2px 6px;
border: 1px solid rgba(88, 235, 254, 0.1);
border-radius: 2px;
background: rgba(88, 235, 254, 0.03);
}

/_ ============================================================ 7. NAV LINKS
============================================================ _/
.nav-links {
display: flex !important;
align-items: center !important;
gap: 20px !important;
flex: 1 1 auto !important;
justify-content: center !important;
list-style: none !important;
margin: 0 !important;
padding: 0 !important;
overflow: visible !important;
pointer-events: auto !important;
}

.nav-links li {
overflow: visible !important;
pointer-events: auto !important;
}

.nav-links .nav-link {
font-size: 0.8rem;
font-weight: 600;
letter-spacing: 1px;
text-transform: uppercase;
color: var(--text-muted);
padding: 6px 0;
transition: all var(--transition);
position: relative;
text-decoration: none;
cursor: pointer;
pointer-events: auto !important;
z-index: 10 !important;
font-family: var(--font-condensed);
}

.nav-links .dropdown-arrow {
display: inline-block;
font-size: 0.5rem;
margin-left: 4px;
transition: transform 0.3s ease;
pointer-events: none !important;
}

.nav-dropdown:hover .dropdown-arrow {
transform: rotate(180deg);
}

.nav-links .nav-link::after {
content: "";
position: absolute;
bottom: -2px;
left: 50%;
width: 0;
height: 1px;
background: var(--gradient-holo);
transition: all var(--transition);
transform: translateX(-50%);
box-shadow: 0 0 20px rgba(88, 235, 254, 0.2);
pointer-events: none !important;
}

.nav-links .nav-link:hover::after,
.nav-links .nav-link.active::after {
width: 100%;
}

.nav-links .nav-link:hover {
color: var(--text-primary);
text-shadow: 0 0 30px rgba(88, 235, 254, 0.2);
}

.nav-links .nav-link.active {
color: var(--text-primary);
text-shadow: 0 0 30px rgba(88, 235, 254, 0.3);
}

.nav-links .nav-link.active::before {
content: "✦";
position: absolute;
left: -18px;
opacity: 1;
color: var(--neon-cyan);
animation: sparklePulse 1.5s ease-in-out infinite;
pointer-events: none !important;
}

/_ Truly Yours Link _/
.nav-links .truly-yours-link {
color: var(--neon-magenta) !important;
font-size: 0.95rem;
letter-spacing: 2px;
text-shadow: 0 0 30px rgba(255, 0, 234, 0.2);
pointer-events: auto !important;
font-family: var(--font-condensed);
position: relative;
animation: trulyGlowPulse 2.5s ease-in-out infinite;
}

.nav-links .truly-yours-link::before {
content: "";
position: absolute;
inset: -4px -8px;
border-radius: 4px;
background: radial-gradient(circle at center, rgba(255, 0, 234, 0.08), transparent 70%);
opacity: 0;
z-index: -1;
pointer-events: none;
}

.nav-links .truly-yours-link:hover {
color: #ff66f0 !important;
text-shadow: 0 0 40px rgba(255, 0, 234, 0.6), 0 0 80px rgba(255, 0, 234, 0.3);
transform: scale(1.05);
}

.nav-links .truly-yours-link:hover::before {
opacity: 1;
}

/_ ============================================================ 8. DROPDOWN MENU
============================================================ _/
.nav-dropdown {
position: relative !important;
z-index: 9999 !important;
overflow: visible !important;
pointer-events: auto !important;
}

.nav-dropdown > a {
position: relative !important;
z-index: 10 !important;
cursor: pointer !important;
pointer-events: auto !important;
}

.dropdown-menu {
position: absolute !important;
top: calc(100% + 8px) !important;
left: 50% !important;
transform: translateX(-50%) translateY(8px) !important;
background: var(--bg-nav) !important;
backdrop-filter: blur(20px) !important;
-webkit-backdrop-filter: blur(20px) !important;
border: 1px solid var(--border-color) !important;
border-radius: 4px !important;
padding: 8px 0 !important;
min-width: 220px !important;
box-shadow: var(--shadow-card), var(--glow-magenta) !important;
opacity: 0 !important;
visibility: hidden !important;
pointer-events: none !important;
transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
list-style: none !important;
margin: 0 !important;
z-index: 99999 !important;
overflow: visible !important;
}

.nav-dropdown:hover .dropdown-menu {
opacity: 1 !important;
visibility: visible !important;
pointer-events: all !important;
transform: translateX(-50%) translateY(0) !important;
}

.dropdown-menu li a {
display: flex !important;
align-items: center !important;
gap: 10px !important;
padding: 10px 20px !important;
font-size: 0.8rem !important;
font-weight: 500 !important;
color: var(--text-muted) !important;
text-decoration: none !important;
transition: all 0.25s ease !important;
white-space: nowrap !important;
position: relative !important;
border-radius: 4px !important;
margin: 2px 8px !important;
cursor: pointer !important;
z-index: 1 !important;
pointer-events: auto !important;
border: none !important;
background: transparent !important;
font-family: var(--font-condensed);
}

.dropdown-menu li a:hover {
color: #ffffff !important;
background: rgba(88, 235, 254, 0.06) !important;
padding-left: 32px !important;
transform: translateX(3px) !important;
border-left: 2px solid var(--neon-cyan) !important;
}

/_ ============================================================ 9. NAV ACTIONS
============================================================ _/
.nav-actions {
display: flex !important;
align-items: center !important;
gap: 12px !important;
position: relative !important;
z-index: 10 !important;
pointer-events: auto !important;
margin-left: auto !important;
flex-shrink: 0 !important;
flex-wrap: nowrap !important;
}

.nav-actions > \* {
flex-shrink: 0 !important;
}

.hybrid-status {
font-family: var(--font-mono);
font-size: 0.65rem;
color: var(--neon-green);
letter-spacing: 1px;
animation: statusPulse 2s ease-in-out infinite;
display: inline-flex !important;
align-items: center;
gap: 6px;
padding: 4px 12px;
border-radius: 20px;
background: rgba(79, 243, 166, 0.05);
border: 1px solid rgba(79, 243, 166, 0.1);
white-space: nowrap;
visibility: visible !important;
opacity: 1 !important;
flex-shrink: 0 !important;
}

.hybrid-status::before {
content: "●";
font-size: 0.5rem;
color: var(--neon-green);
animation: statusPulse 2s ease-in-out infinite;
}

.hybrid-status.offline {
color: var(--text-muted);
border-color: rgba(255, 255, 255, 0.05);
background: rgba(255, 255, 255, 0.02);
}

.hybrid-status.offline::before {
color: var(--text-muted);
}

/_ ============================================================ 10. NOTIFICATION SYSTEM
============================================================ _/
.notification-container {
position: relative !important;
z-index: 100 !important;
overflow: visible !important;
pointer-events: auto !important;
}

.notification-btn {
cursor: pointer !important;
pointer-events: auto !important;
z-index: 101 !important;
position: relative !important;
}

.notification-badge {
position: absolute;
top: -4px;
right: -4px;
background: var(--spray-red);
color: #fff;
font-family: var(--font-mono);
font-size: 0.55rem;
font-weight: 700;
padding: 1px 6px;
border-radius: 99px;
min-width: 18px;
text-align: center;
box-shadow: 0 0 20px rgba(255, 0, 64, 0.3);
z-index: 2;
pointer-events: none !important;
}

.notification-dropdown {
position: absolute !important;
top: calc(100% + 12px) !important;
right: -10px !important;
width: 340px !important;
max-height: 400px !important;
background: rgba(10, 5, 8, 0.95) !important;
backdrop-filter: blur(20px) !important;
-webkit-backdrop-filter: blur(20px) !important;
border: 1px solid var(--border-color) !important;
border-radius: 12px !important;
box-shadow: var(--shadow-card), var(--glow-magenta) !important;
overflow: hidden !important;
z-index: 99999 !important;
display: none !important;
padding: 0 !important;
min-width: 280px !important;
}

.notification-dropdown.active {
display: block !important;
animation: dropdownSlideDown 0.25s ease !important;
}

/_ ============================================================ 11. AVATAR
============================================================ _/
.nav-avatar-container {
position: relative !important;
display: inline-flex !important;
align-items: center !important;
justify-content: center !important;
cursor: pointer !important;
z-index: 100 !important;
overflow: visible !important;
pointer-events: auto !important;
}

.avatar-dropdown {
z-index: 999999 !important;
background: rgba(10, 5, 8, 0.95) !important;
backdrop-filter: blur(20px) !important;
-webkit-backdrop-filter: blur(20px) !important;
border-radius: 12px !important;
box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 0, 234, 0.1) !important;
min-width: 220px !important;
border: 1px solid var(--border-color) !important;
padding: 8px 0 !important;
overflow: visible !important;
display: none !important;
}

.avatar-dropdown.active,
.avatar-dropdown[style*="display: block"] {
display: block !important;
animation: dropdownSlideDown 0.25s ease !important;
}

/_ ============================================================ 12. AUTH BUTTONS
============================================================ _/
.auth-buttons {
display: flex !important;
align-items: center !important;
gap: 8px !important;
position: relative !important;
z-index: 10 !important;
pointer-events: auto !important;
}

.auth-buttons .btn {
display: inline-flex;
align-items: center;
justify-content: center;
gap: 6px;
padding: 6px 18px;
border: none;
border-radius: 4px;
font-weight: 600;
font-size: 0.7rem;
letter-spacing: 1px;
text-transform: uppercase;
cursor: pointer;
transition: all var(--transition);
text-decoration: none;
position: relative;
overflow: hidden;
pointer-events: auto !important;
}

.auth-buttons .btn-outline {
background: var(--bg-card);
color: var(--text-primary);
border: 1px solid var(--border-color);
}

.auth-buttons .btn-outline:hover {
background: var(--bg-card-hover);
border-color: var(--neon-cyan);
box-shadow: var(--glow-cyan);
transform: translateY(-2px);
}

.auth-buttons .btn-primary {
background: var(--gradient-neon);
color: var(--text-inverse);
box-shadow: var(--glow-magenta);
}

.auth-buttons .btn-primary:hover {
transform: translateY(-2px) scale(1.02);
box-shadow: var(--glow-purple), 0 0 60px rgba(255, 0, 234, 0.15);
}

/_ ============================================================ 13. BUTTON ICON
============================================================ _/
.btn-icon {
background: transparent;
border: none;
color: var(--text-muted);
cursor: pointer;
font-size: 1.2rem;
padding: 8px;
transition: all var(--transition);
border-radius: 4px;
position: relative;
pointer-events: auto !important;
}

.btn-icon:hover {
color: var(--text-primary);
background: var(--bg-card-hover);
box-shadow: var(--glow-cyan);
}

/_ ============================================================ 14. MOBILE MENU BUTTON
============================================================ _/
.mobile-menu-btn {
display: none;
flex-direction: column;
align-items: center;
justify-content: center;
background: transparent;
border: none;
cursor: pointer;
padding: 8px 12px;
transition: all var(--transition);
pointer-events: auto !important;
z-index: 999999;
width: 44px;
height: 44px;
min-width: 44px;
min-height: 44px;
touch-action: manipulation;
position: relative;
}

.mobile-menu-btn span {
display: block;
width: 26px;
height: 2.5px;
background: var(--text-primary);
margin: 3px 0;
transition: all 0.3s ease;
border-radius: 2px;
pointer-events: none;
flex-shrink: 0;
}

.mobile-menu-btn.open span:nth-child(1) {
transform: rotate(45deg) translate(5px, 5px);
}
.mobile-menu-btn.open span:nth-child(2) {
opacity: 0;
transform: scale(0);
}
.mobile-menu-btn.open span:nth-child(3) {
transform: rotate(-45deg) translate(6px, -6px);
}

.mobile-menu-btn:hover span {
background: var(--neon-cyan);
}

/_ ============================================================ 15. SEARCH OVERLAY
============================================================ _/
.search-overlay {
position: fixed !important;
top: 0 !important;
left: 0 !important;
width: 100% !important;
height: 100vh !important;
background: rgba(10, 5, 8, 0.92) !important;
backdrop-filter: blur(20px) !important;
-webkit-backdrop-filter: blur(20px) !important;
z-index: 9999 !important;
display: none !important;
align-items: flex-start !important;
justify-content: center !important;
padding: 100px 24px 40px !important;
overflow-y: auto !important;
animation: searchFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.search-overlay.active {
display: flex !important;
}

.search-overlay .search-container {
width: 100% !important;
max-width: 720px !important;
margin: 0 auto !important;
display: flex !important;
flex-direction: column !important;
min-height: 0 !important;
}

.search-overlay .search-box {
display: flex !important;
align-items: center !important;
background: rgba(173, 3, 252, 0.06) !important;
backdrop-filter: blur(16px) !important;
-webkit-backdrop-filter: blur(16px) !important;
border: 1px solid rgba(173, 3, 252, 0.15) !important;
border-radius: 8px !important;
padding: 4px 16px !important;
gap: 12px !important;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.645), 0 0 60px rgba(173, 3, 252, 0.15) !important;
transition: all 0.3s ease !important;
flex-shrink: 0 !important;
}

.search-overlay .search-input-wrapper {
flex: 1 !important;
display: flex !important;
align-items: center !important;
gap: 12px !important;
}

.search-overlay .search-input-wrapper .search-icon {
color: rgba(245, 234, 255, 0.3) !important;
font-size: 1.1rem !important;
flex-shrink: 0 !important;
transition: color 0.3s ease !important;
}

.search-overlay .search-input-wrapper input {
flex: 1 !important;
background: none !important;
border: none !important;
outline: none !important;
color: #f5eaff !important;
font-size: 1.1rem !important;
font-family: var(--font-body) !important;
padding: 14px 0 !important;
min-width: 0 !important;
width: 100% !important;
}

.search-overlay .search-input-wrapper input::placeholder {
color: rgba(245, 234, 255, 0.3) !important;
font-weight: 300 !important;
}

.search-overlay .search-close {
background: none !important;
border: none !important;
color: rgba(245, 234, 255, 0.3) !important;
font-size: 1.2rem !important;
cursor: pointer !important;
padding: 8px !important;
border-radius: 4px !important;
transition: all 0.3s ease !important;
flex-shrink: 0 !important;
}

.search-overlay .search-close:hover {
color: #f5eaff !important;
background: rgba(173, 3, 252, 0.12) !important;
}

.search-overlay .search-results {
margin-top: 16px !important;
background: rgba(173, 3, 252, 0.06) !important;
backdrop-filter: blur(16px) !important;
-webkit-backdrop-filter: blur(16px) !important;
border: 1px solid rgba(173, 3, 252, 0.15) !important;
border-radius: 8px !important;
overflow: hidden !important;
max-height: calc(100vh - 260px) !important;
overflow-y: auto !important;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.645) !important;
flex-shrink: 1 !important;
}

/_ ============================================================ 16. MOBILE RESPONSIVE — FIXED
============================================================ _/
@media (max-width: 768px) {
.main-header {
margin: 8px 8px 0 !important;
top: 8px !important;
padding: 0 12px !important;
overflow: visible !important;
position: sticky !important;
z-index: 9999 !important;
background: rgba(10, 5, 8, 0.92) !important;
backdrop-filter: blur(20px) !important;
-webkit-backdrop-filter: blur(20px) !important;
}

.navbar {
height: 56px !important;
overflow: visible !important;
flex-wrap: nowrap !important;
min-height: 56px !important;
position: relative !important;
}

.nav-brand .hud-tag {
display: none !important;
}
.hybrid-status {
display: none !important;
}

/_ ===== MOBILE MENU BUTTON — VISIBLE ===== _/
.mobile-menu-btn {
display: flex !important;
order: 5 !important;
margin-left: 4px !important;
}

/_ ===== NAV LINKS — HIDDEN BY DEFAULT ===== _/
.nav-links {
display: none !important;
flex-direction: column !important;
position: absolute !important;
top: calc(100% + 8px) !important;
left: 0 !important;
right: 0 !important;
background: rgba(10, 5, 8, 0.98) !important;
backdrop-filter: blur(20px) !important;
-webkit-backdrop-filter: blur(20px) !important;
border: 1px solid var(--border-color) !important;
border-radius: 4px !important;
padding: 16px !important;
box-shadow: var(--shadow-card), var(--glow-magenta) !important;
gap: 4px !important;
align-items: stretch !important;
z-index: 99999 !important;
overflow-y: auto !important;
max-height: 70vh !important;
width: 100% !important;
min-width: 0 !important;
pointer-events: none !important;
}

.nav-links.open {
display: flex !important;
pointer-events: auto !important;
animation: dropdownSlideDown 0.25s ease !important;
}

.nav-links li {
width: 100% !important;
list-style: none !important;
}

.nav-links .nav-link {
padding: 12px 16px !important;
font-size: 0.85rem !important;
width: 100% !important;
display: block !important;
text-align: left !important;
border-radius: 4px !important;
}

.nav-links .nav-link::before {
display: none !important;
}
.nav-links .nav-link.active::before {
display: none !important;
}
.nav-links .nav-link.active {
color: var(--neon-cyan) !important;
background: rgba(88, 235, 254, 0.06) !important;
}

.nav-links .truly-yours-link {
font-size: 1rem !important;
padding: 12px 16px !important;
display: block !important;
text-align: left !important;
}

/_ ===== DROPDOWN ON MOBILE ===== _/
.nav-dropdown {
position: relative !important;
width: 100% !important;
}

.nav-dropdown > a {
display: flex !important;
justify-content: space-between !important;
align-items: center !important;
width: 100% !important;
cursor: pointer !important;
padding: 12px 16px !important;
border-radius: 4px !important;
}

.nav-dropdown > a .dropdown-arrow {
transition: transform 0.3s ease !important;
font-size: 0.6rem !important;
margin-left: 8px !important;
flex-shrink: 0 !important;
}

.nav-dropdown.open > a .dropdown-arrow {
transform: rotate(180deg) !important;
}

.nav-dropdown .dropdown-menu {
position: static !important;
transform: none !important;
opacity: 1 !important;
visibility: visible !important;
pointer-events: all !important;
box-shadow: none !important;
background: rgba(255, 255, 255, 0.03) !important;
border: none !important;
border-left: 2px solid var(--neon-magenta) !important;
padding: 4px 0 4px 12px !important;
display: none !important;
width: 100% !important;
z-index: 1 !important;
overflow: visible !important;
margin: 4px 0 !important;
border-radius: 0 !important;
min-width: auto !important;
backdrop-filter: none !important;
-webkit-backdrop-filter: none !important;
}

.nav-dropdown.open .dropdown-menu {
display: block !important;
animation: none !important;
}

.dropdown-menu li a {
padding: 10px 16px !important;
font-size: 0.75rem !important;
margin: 0 !important;
border-radius: 4px !important;
justify-content: flex-start !important;
white-space: normal !important;
word-wrap: break-word !important;
}

.dropdown-menu li a::before,
.dropdown-menu li a::after {
display: none !important;
}
.dropdown-menu li a:hover {
padding-left: 20px !important;
background: rgba(88, 235, 254, 0.06) !important;
border-left: none !important;
}

/_ ===== NAV ACTIONS ===== _/
.nav-actions {
gap: 4px !important;
flex-shrink: 0 !important;
margin-left: auto !important;
position: relative !important;
z-index: 999999 !important;
}

.nav-actions .auth-buttons .btn {
padding: 6px 12px !important;
font-size: 0.6rem !important;
}
.nav-actions .auth-buttons .btn-outline {
display: none !important;
}
.nav-actions .btn-icon {
font-size: 1rem !important;
padding: 6px !important;
position: relative !important;
z-index: 999999 !important;
pointer-events: auto !important;
}

.notification-badge {
font-size: 0.45rem !important;
min-width: 14px !important;
padding: 0 4px !important;
}

.notification-dropdown {
position: fixed !important;
top: 60px !important;
right: 8px !important;
left: 8px !important;
width: auto !important;
max-height: 60vh !important;
min-width: auto !important;
}

.avatar-dropdown {
position: fixed !important;
top: 56px !important;
right: 8px !important;
left: 8px !important;
width: auto !important;
min-width: auto !important;
}
}

/_ ===== SMALL MOBILE ===== _/
@media (max-width: 480px) {
.main-header {
margin: 4px 4px 0 !important;
top: 4px !important;
padding: 0 8px !important;
}

.navbar {
min-height: 48px !important;
height: 48px !important;
}

.nav-brand .logo {
font-size: 0.8rem !important;
}
.nav-brand .logo .logo-icon {
font-size: 0.9rem !important;
}

.mobile-menu-btn {
width: 38px !important;
height: 38px !important;
min-width: 38px !important;
min-height: 38px !important;
padding: 6px 8px !important;
}

.mobile-menu-btn span {
width: 20px !important;
height: 2px !important;
margin: 2.5px 0 !important;
}

.mobile-menu-btn.open span:nth-child(1) {
transform: rotate(45deg) translate(4px, 4px) !important;
}
.mobile-menu-btn.open span:nth-child(3) {
transform: rotate(-45deg) translate(4px, -4px) !important;
}

.nav-links {
top: calc(100% + 6px) !important;
padding: 12px !important;
max-height: 60vh !important;
}

.nav-links .nav-link {
font-size: 0.75rem !important;
padding: 10px 14px !important;
}

.nav-links .truly-yours-link {
font-size: 0.85rem !important;
padding: 10px 14px !important;
}

.nav-dropdown > a {
padding: 10px 14px !important;
font-size: 0.75rem !important;
}

.dropdown-menu li a {
padding: 8px 14px !important;
font-size: 0.7rem !important;
}

.nav-actions .btn-icon {
font-size: 0.85rem !important;
padding: 4px !important;
}

.nav-actions .auth-buttons .btn-primary {
padding: 4px 10px !important;
font-size: 0.5rem !important;
}

.notification-dropdown {
top: 52px !important;
}
.avatar-dropdown {
top: 48px !important;
}
}

/_ ===== OVERFLOW FIXES ===== _/
.main-header .container {
overflow: visible !important;
position: relative !important;
z-index: 1 !important;
}

.navbar {
overflow: visible !important;
position: relative !important;
}

@media (max-width: 768px) {
.nav-links.open {
z-index: 99999 !important;
}
.nav-dropdown .dropdown-menu {
pointer-events: auto !important;
}
}

HEADER.JS NEW
/\*\*

- HEADER — Complete Header System
- Standalone header with auth, avatar, notifications, and search
  \*/

// ============================================================
// HEADER INITIALIZATION
// ============================================================

function initHeader() {
console.log("🔧 Initializing header system...");

if (typeof firebase === "undefined" || !firebase.auth) {
console.warn("⚠️ Firebase not ready, waiting...");
setTimeout(initHeader, 500);
return;
}

// Force nav-links to be hidden initially on mobile
const navLinks = document.getElementById("nav-links");
if (navLinks && window.innerWidth <= 768) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
}

initMobileMenu();
initSearch();
initAuth();
setTimeout(initNotificationSystem, 800);
initAvatarManager();
}

// ============================================================
// MOBILE MENU — COMPLETE FIXED VERSION
// ============================================================

function initMobileMenu() {
const menuBtn = document.getElementById("mobile-menu-btn");
const navLinks = document.getElementById("nav-links");
const navDropdowns = document.querySelectorAll(".nav-dropdown");

console.log("📱 Initializing mobile menu...");

if (!menuBtn) {
console.warn("⚠️ Mobile menu button not found");
return;
}
if (!navLinks) {
console.warn("⚠️ Nav links not found");
return;
}

console.log("✅ Mobile menu elements found");

// Ensure nav-links are hidden initially on mobile
if (window.innerWidth <= 768) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
}

// Remove old event listeners by cloning
const newMenuBtn = menuBtn.cloneNode(true);
menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

// ===== MENU BUTTON CLICK =====
newMenuBtn.addEventListener("click", function (e) {
e.stopPropagation();
e.preventDefault();

    const isOpen = navLinks.classList.contains("open");
    console.log(`📱 Toggling mobile menu: ${isOpen ? 'closing' : 'opening'}`);

    if (isOpen) {
      navLinks.classList.remove("open");
      navLinks.style.display = "none";
      this.classList.remove("open");
      navDropdowns.forEach((d) => d.classList.remove("open"));
    } else {
      navLinks.classList.add("open");
      navLinks.style.display = "flex";
      this.classList.add("open");
    }

});

// ===== MOBILE DROPDOWN TOGGLE =====
navDropdowns.forEach((dropdown) => {
const link = dropdown.querySelector("a");
if (link) {
const newLink = link.cloneNode(true);
link.parentNode.replaceChild(newLink, link);

      newLink.addEventListener("click", function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();

          const parent = this.closest(".nav-dropdown");
          if (parent) {
            const isOpen = parent.classList.contains("open");
            navDropdowns.forEach((d) => {
              if (d !== parent) d.classList.remove("open");
            });
            parent.classList.toggle("open");
            console.log(`📱 Toggled dropdown: ${isOpen ? 'closed' : 'opened'}`);
          }
        }
      });
    }

});

// ===== CLOSE ON CLICK OUTSIDE =====
document.addEventListener("click", function (e) {
if (window.innerWidth <= 768) {
const header = document.querySelector(".main-header");
if (header && !header.contains(e.target)) {
if (navLinks.classList.contains("open")) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
newMenuBtn.classList.remove("open");
navDropdowns.forEach((d) => d.classList.remove("open"));
console.log("📱 Closed menu (click outside)");
}
}
}
});

// ===== CLOSE ON ESCAPE =====
document.addEventListener("keydown", function (e) {
if (e.key === "Escape" && window.innerWidth <= 768) {
if (navLinks.classList.contains("open")) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
newMenuBtn.classList.remove("open");
navDropdowns.forEach((d) => d.classList.remove("open"));
console.log("📱 Closed menu (Escape key)");
}
}
});

// ===== CLOSE ON RESIZE TO DESKTOP =====
window.addEventListener("resize", function () {
if (window.innerWidth > 768) {
if (navLinks.classList.contains("open")) {
navLinks.classList.remove("open");
navLinks.style.display = "";
newMenuBtn.classList.remove("open");
navDropdowns.forEach((d) => d.classList.remove("open"));
}
} else {
// Ensure hidden on mobile if not open
if (!navLinks.classList.contains("open")) {
navLinks.style.display = "none";
}
}
});

console.log("✅ Mobile menu initialized");
}

// ============================================================
// SEARCH OVERLAY
// ============================================================

function initSearch() {
const searchBtn = document.getElementById("search-btn");
const searchOverlay = document.getElementById("search-overlay");
const searchClose = document.getElementById("search-close");
const searchInput = document.getElementById("search-input");

if (!searchBtn || !searchOverlay) return;

const newSearchBtn = searchBtn.cloneNode(true);
searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

newSearchBtn.addEventListener("click", () => {
searchOverlay.classList.add("active");
searchOverlay.style.display = "flex";
searchInput?.focus();
});

if (searchClose) {
const newSearchClose = searchClose.cloneNode(true);
searchClose.parentNode.replaceChild(newSearchClose, searchClose);

    newSearchClose.addEventListener("click", () => {
      searchOverlay.classList.remove("active");
      searchOverlay.style.display = "none";
    });

}

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

// ============================================================
// AUTH STATE
// ============================================================

function initAuth() {
if (typeof firebase === "undefined" || !firebase.auth) {
console.warn("⚠️ Firebase auth not available");
return;
}

firebase.auth().onAuthStateChanged(function (user) {
console.log("🔐 Auth state changed:", user ? "Logged in" : "Logged out");

    const hybridStatus = document.getElementById("hybridStatus");
    const authButtons = document.getElementById("authButtons");
    const avatarContainer = document.getElementById("navAvatar");

    if (user) {
      if (hybridStatus) {
        hybridStatus.textContent = "● ONLINE";
        hybridStatus.classList.remove("offline");
      }

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

      if (avatarContainer && window.avatarManager) {
        setTimeout(() => {
          window.avatarManager.renderAllAvatars();
          setTimeout(() => window.avatarManager.setupAvatarClickHandlers(), 100);
        }, 200);
      }

      setTimeout(initNotificationSystem, 300);
    } else {
      if (hybridStatus) {
        hybridStatus.textContent = "● OFFLINE";
        hybridStatus.classList.add("offline");
      }

      if (authButtons) {
        authButtons.innerHTML = `
          <a href="/pages/auth/login.html" class="btn btn-outline btn-sm">Log In</a>
          <a href="/pages/auth/register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `;
      }

      if (avatarContainer) {
        avatarContainer.innerHTML = "";
      }

      const badge = document.getElementById("notificationBadge");
      if (badge) badge.style.display = "none";
    }

});
}

// ============================================================
// AVATAR MANAGER
// ============================================================

function initAvatarManager() {
if (typeof window.avatarManager !== "undefined") {
console.log("✅ AvatarManager already exists");
return;
}

if (typeof AvatarManager === "undefined") {
console.warn("⚠️ AvatarManager class not found");
return;
}

if (typeof firebase !== "undefined" && firebase.auth) {
setTimeout(() => {
window.avatarManager = new AvatarManager({
containerSelector: ".nav-avatar-container",
size: "md",
});
console.log("✅ AvatarManager initialized");
}, 500);
}
}

// ============================================================
// NOTIFICATION SYSTEM
// ============================================================

function initNotificationSystem() {
console.log("🔔 Initializing notification system...");

const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationBadge = document.getElementById("notificationBadge");

if (!notificationBtn) {
console.error("❌ Notification button not found");
return;
}

console.log("✅ Notification elements found");

const newBtn = notificationBtn.cloneNode(true);
notificationBtn.parentNode.replaceChild(newBtn, notificationBtn);

newBtn.addEventListener("click", function (e) {
e.stopPropagation();
e.preventDefault();

    console.log("🔔 Notification bell clicked");

    const avatarDropdown = document.getElementById("avatarDropdown");
    if (avatarDropdown) {
      avatarDropdown.style.display = "none";
      avatarDropdown.classList.remove("active");
    }

    const isVisible = notificationDropdown.style.display === "block";
    notificationDropdown.style.display = isVisible ? "none" : "block";
    notificationDropdown.classList.toggle("active", !isVisible);

    if (!isVisible) {
      const user = firebase.auth().currentUser;
      if (user) {
        loadNotifications(user.uid);
      }
    }

});

document.addEventListener("click", function (e) {
const container = e.target.closest(".notification-container");
if (!container) {
if (notificationDropdown) {
notificationDropdown.style.display = "none";
notificationDropdown.classList.remove("active");
}
}
});

const markAllBtn = document.getElementById("markAllReadBtn");
if (markAllBtn) {
const newMarkBtn = markAllBtn.cloneNode(true);
markAllBtn.parentNode.replaceChild(newMarkBtn, markAllBtn);
newMarkBtn.addEventListener("click", function (e) {
e.stopPropagation();
console.log("📋 Mark all as read clicked");
markAllNotificationsRead();
});
}

const user = firebase.auth().currentUser;
if (user) {
console.log("👤 User logged in, loading notifications");
setTimeout(() => loadNotifications(user.uid), 300);
setupNotificationListener(user.uid);
} else {
console.log("👤 No user logged in");
if (notificationBadge) notificationBadge.style.display = "none";
if (notificationDropdown) {
const list = notificationDropdown.querySelector(".notification-list");
if (list) {
list.innerHTML = `           <div class="notification-empty">
            <i class="fas fa-bell-slash"></i>
            <p>Log in to see notifications</p>
          </div>
        `;
}
}
}

console.log("✅ Notification system initialized");
}

// ============================================================
// NOTIFICATION LISTENER
// ============================================================

let notificationUnsubscribe = null;

function setupNotificationListener(userId) {
if (notificationUnsubscribe) {
notificationUnsubscribe();
notificationUnsubscribe = null;
}

console.log("📡 Setting up real-time notification listener for:", userId);

notificationUnsubscribe = firebase
.firestore()
.collection("users")
.doc(userId)
.collection("notifications")
.orderBy("createdAt", "desc")
.limit(10)
.onSnapshot(
(snapshot) => {
const notifications = [];
snapshot.forEach((doc) => {
const data = doc.data();
notifications.push({
id: doc.id,
type: data.type || "like",
read: data.read || false,
data: data.data || {},
createdAt: data.createdAt || null,
message: data.message || "",
});
});

        const unreadCount = notifications.filter((n) => !n.read).length;
        const badge = document.getElementById("notificationBadge");
        if (badge) {
          if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
            badge.style.display = "flex";
          } else {
            badge.style.display = "none";
          }
        }

        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown && dropdown.style.display === "block") {
          renderNotifications(notifications);
        }
      },
      (error) => {
        console.error("❌ Notification listener error:", error);
      }
    );

}

// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

async function loadNotifications(userId) {
const notificationList = document.getElementById("notificationList");
const notificationBadge = document.getElementById("notificationBadge");

if (!notificationList) return;

try {
console.log("📥 Loading notifications for user:", userId);

    const snapshot = await firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type || "like",
        read: data.read || false,
        data: data.data || {},
        createdAt: data.createdAt || null,
        message: data.message || "",
      });
    });

    console.log(`📥 Loaded ${notifications.length} notifications`);

    const unreadCount = notifications.filter((n) => !n.read).length;
    if (notificationBadge) {
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
        notificationBadge.style.display = "flex";
      } else {
        notificationBadge.style.display = "none";
      }
    }

    renderNotifications(notifications);

} catch (error) {
console.error("❌ Error loading notifications:", error);
notificationList.innerHTML = `       <div class="notification-empty">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading notifications</p>
      </div>
    `;
}
}

// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderNotifications(notifications) {
const notificationList = document.getElementById("notificationList");
if (!notificationList) return;

if (notifications.length === 0) {
notificationList.innerHTML = `       <div class="notification-empty">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications yet</p>
      </div>
    `;
return;
}

notificationList.innerHTML = notifications
.map((notif) => {
const type = notif.type || "like";
const data = notif.data || {};
const timeAgo = formatTimeAgo(notif.createdAt);
const unreadClass = notif.read ? "" : "unread";

      let iconClass = "like";
      let iconHtml = '<i class="fas fa-heart"></i>';
      let text = "New notification";
      let link = "#";

      const userName = data.fromUserName || data.userName || data.username || data.name || data.displayName || "Someone";
      const userId = data.fromUserId || data.userId || data.targetId || data.shadowerId || "";
      const artworkId = data.artworkId || data.artworkID || data.postId || "";
      const artworkTitle = data.artworkTitle || "artwork";
      const msgPreview = data.preview || data.message || "";

      switch (type) {
        case "like":
          iconClass = "like";
          iconHtml = '<i class="fas fa-heart"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> liked your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "cheer":
          iconClass = "cheer";
          iconHtml = '<i class="fas fa-glass-cheers"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> cheered for your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "shadow":
          iconClass = "shadow";
          iconHtml = '<i class="fas fa-eye"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> started shadowing you`;
          link = `/pages/community/profiles.html?user=${userId}`;
          break;
        case "comment":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-comment"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> commented on your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        default:
          iconClass = "like";
          iconHtml = '<i class="fas fa-bell"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> ${notif.message || "interacted with you"}`;
          link = notif.link || "#";
      }

      return `
        <a href="${link}" class="notification-item ${unreadClass}" data-id="${notif.id}" data-read="${notif.read || false}">
          <div class="notification-icon ${iconClass}">${iconHtml}</div>
          <div class="notification-content">
            <div class="notification-text">${text}</div>
            <div class="notification-time">${timeAgo}</div>
          </div>
        </a>
      `;
    })
    .join("");

document.querySelectorAll(".notification-item.unread").forEach((item) => {
item.addEventListener("click", function (e) {
const id = this.dataset.id;
if (id) {
markNotificationRead(id);
this.classList.remove("unread");
const badge = document.getElementById("notificationBadge");
if (badge) {
const current = parseInt(badge.textContent) || 0;
if (current > 0) {
badge.textContent = current - 1;
if (badge.textContent === "0") badge.style.display = "none";
}
}
}
});
});
}

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================

async function markNotificationRead(notificationId) {
try {
const user = firebase.auth().currentUser;
if (!user) return;

    await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .doc(notificationId)
      .update({ read: true });

    console.log("✅ Notification marked as read:", notificationId);

} catch (error) {
console.error("❌ Error marking notification as read:", error);
}
}

// ============================================================
// MARK ALL AS READ
// ============================================================

async function markAllNotificationsRead() {
try {
const user = firebase.auth().currentUser;
if (!user) return;

    const snapshot = await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();

    if (snapshot.empty) {
      console.log("📋 No unread notifications");
      return;
    }

    const batch = firebase.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    console.log("✅ All notifications marked as read");

    document.querySelectorAll(".notification-item.unread").forEach((item) => {
      item.classList.remove("unread");
    });

    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.style.display = "none";
    }

} catch (error) {
console.error("❌ Error marking all as read:", error);
}
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatTimeAgo(timestamp) {
if (!timestamp) return "Just now";

let date;
if (timestamp && timestamp.toDate) {
date = timestamp.toDate();
} else if (timestamp && timestamp.seconds) {
date = new Date(timestamp.seconds \* 1000);
} else if (timestamp instanceof Date) {
date = timestamp;
} else {
date = new Date(timestamp);
}

if (isNaN(date.getTime())) return "Just now";

const seconds = Math.floor((new Date() - date) / 1000);
if (seconds < 60) return "Just now";

const minutes = Math.floor(seconds / 60);
if (minutes < 60) return `${minutes} min ago`;

const hours = Math.floor(minutes / 60);
if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

const days = Math.floor(hours / 24);
if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

const weeks = Math.floor(days / 7);
if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

const months = Math.floor(days / 30);
if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

const years = Math.floor(days / 365);
return `${years} year${years === 1 ? "" : "s"} ago`;
}

function escapeHtml(text) {
if (!text) return "";
const div = document.createElement("div");
div.textContent = text;
return div.innerHTML;
}

// ============================================================
// INIT ON DOM READY
// ============================================================

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function () {
setTimeout(initHeader, 300);
});
} else {
setTimeout(initHeader, 300);
}

WORKING JS EVERY DROP DOWN

/\*\*

- HEADER — Complete Header System
- Standalone header with auth, avatar, notifications, and search
  \*/

// ============================================================
// HEADER INITIALIZATION
// ============================================================

function initHeader() {
console.log("🔧 Initializing header system...");

if (typeof firebase === "undefined" || !firebase.auth) {
console.warn("⚠️ Firebase not ready, waiting...");
setTimeout(initHeader, 500);
return;
}

// Force nav-links to be hidden initially on mobile
const navLinks = document.getElementById("nav-links");
if (navLinks && window.innerWidth <= 768) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
}

initMobileMenu();
initSearch();
initAuth();
setTimeout(initNotificationSystem, 800);
initAvatarManager();
}

// ============================================================
// MOBILE MENU — COMPLETE FIXED VERSION
// ============================================================

function initMobileMenu() {
const menuBtn = document.getElementById("mobile-menu-btn");
const navLinks = document.getElementById("nav-links");
const navDropdowns = document.querySelectorAll(".nav-dropdown");

console.log("📱 Initializing mobile menu...");

if (!menuBtn) {
console.warn("⚠️ Mobile menu button not found");
return;
}
if (!navLinks) {
console.warn("⚠️ Nav links not found");
return;
}

console.log("✅ Mobile menu elements found");

// Ensure nav-links are hidden initially on mobile
if (window.innerWidth <= 768) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
}

// Remove old event listeners by cloning
const newMenuBtn = menuBtn.cloneNode(true);
menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

// ===== MENU BUTTON CLICK =====
newMenuBtn.addEventListener("click", function (e) {
e.stopPropagation();
e.preventDefault();

    const isOpen = navLinks.classList.contains("open");
    console.log(`📱 Toggling mobile menu: ${isOpen ? 'closing' : 'opening'}`);

    if (isOpen) {
      navLinks.classList.remove("open");
      navLinks.style.display = "none";
      this.classList.remove("open");
      navDropdowns.forEach((d) => d.classList.remove("open"));
    } else {
      navLinks.classList.add("open");
      navLinks.style.display = "flex";
      this.classList.add("open");
    }

});

// ===== MOBILE DROPDOWN TOGGLE =====
navDropdowns.forEach((dropdown) => {
const link = dropdown.querySelector("a");
if (link) {
const newLink = link.cloneNode(true);
link.parentNode.replaceChild(newLink, link);

      newLink.addEventListener("click", function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();

          const parent = this.closest(".nav-dropdown");
          if (parent) {
            const isOpen = parent.classList.contains("open");
            navDropdowns.forEach((d) => {
              if (d !== parent) d.classList.remove("open");
            });
            parent.classList.toggle("open");
            console.log(`📱 Toggled dropdown: ${isOpen ? 'closed' : 'opened'}`);
          }
        }
      });
    }

});

// ===== CLOSE ON CLICK OUTSIDE =====
document.addEventListener("click", function (e) {
if (window.innerWidth <= 768) {
const header = document.querySelector(".main-header");
if (header && !header.contains(e.target)) {
if (navLinks.classList.contains("open")) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
newMenuBtn.classList.remove("open");
navDropdowns.forEach((d) => d.classList.remove("open"));
console.log("📱 Closed menu (click outside)");
}
}
}
});

// ===== CLOSE ON ESCAPE =====
document.addEventListener("keydown", function (e) {
if (e.key === "Escape" && window.innerWidth <= 768) {
if (navLinks.classList.contains("open")) {
navLinks.classList.remove("open");
navLinks.style.display = "none";
newMenuBtn.classList.remove("open");
navDropdowns.forEach((d) => d.classList.remove("open"));
console.log("📱 Closed menu (Escape key)");
}
}
});

// ===== CLOSE ON RESIZE TO DESKTOP =====
window.addEventListener("resize", function () {
if (window.innerWidth > 768) {
if (navLinks.classList.contains("open")) {
navLinks.classList.remove("open");
navLinks.style.display = "";
newMenuBtn.classList.remove("open");
navDropdowns.forEach((d) => d.classList.remove("open"));
}
} else {
// Ensure hidden on mobile if not open
if (!navLinks.classList.contains("open")) {
navLinks.style.display = "none";
}
}
});

console.log("✅ Mobile menu initialized");
}

// ============================================================
// SEARCH OVERLAY
// ============================================================

function initSearch() {
const searchBtn = document.getElementById("search-btn");
const searchOverlay = document.getElementById("search-overlay");
const searchClose = document.getElementById("search-close");
const searchInput = document.getElementById("search-input");

if (!searchBtn || !searchOverlay) return;

const newSearchBtn = searchBtn.cloneNode(true);
searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

newSearchBtn.addEventListener("click", () => {
searchOverlay.classList.add("active");
searchOverlay.style.display = "flex";
searchInput?.focus();
});

if (searchClose) {
const newSearchClose = searchClose.cloneNode(true);
searchClose.parentNode.replaceChild(newSearchClose, searchClose);

    newSearchClose.addEventListener("click", () => {
      searchOverlay.classList.remove("active");
      searchOverlay.style.display = "none";
    });

}

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

// ============================================================
// AUTH STATE
// ============================================================

function initAuth() {
if (typeof firebase === "undefined" || !firebase.auth) {
console.warn("⚠️ Firebase auth not available");
return;
}

firebase.auth().onAuthStateChanged(function (user) {
console.log("🔐 Auth state changed:", user ? "Logged in" : "Logged out");

    const hybridStatus = document.getElementById("hybridStatus");
    const authButtons = document.getElementById("authButtons");
    const avatarContainer = document.getElementById("navAvatar");

    if (user) {
      if (hybridStatus) {
        hybridStatus.textContent = "● ONLINE";
        hybridStatus.classList.remove("offline");
      }

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

      if (avatarContainer && window.avatarManager) {
        setTimeout(() => {
          window.avatarManager.renderAllAvatars();
          setTimeout(() => window.avatarManager.setupAvatarClickHandlers(), 100);
        }, 200);
      }

      setTimeout(initNotificationSystem, 300);
    } else {
      if (hybridStatus) {
        hybridStatus.textContent = "● OFFLINE";
        hybridStatus.classList.add("offline");
      }

      if (authButtons) {
        authButtons.innerHTML = `
          <a href="/pages/auth/login.html" class="btn btn-outline btn-sm">Log In</a>
          <a href="/pages/auth/register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `;
      }

      if (avatarContainer) {
        avatarContainer.innerHTML = "";
      }

      const badge = document.getElementById("notificationBadge");
      if (badge) badge.style.display = "none";
    }

});
}

// ============================================================
// AVATAR MANAGER
// ============================================================

function initAvatarManager() {
if (typeof window.avatarManager !== "undefined") {
console.log("✅ AvatarManager already exists");
return;
}

if (typeof AvatarManager === "undefined") {
console.warn("⚠️ AvatarManager class not found");
return;
}

if (typeof firebase !== "undefined" && firebase.auth) {
setTimeout(() => {
window.avatarManager = new AvatarManager({
containerSelector: ".nav-avatar-container",
size: "md",
});
console.log("✅ AvatarManager initialized");
}, 500);
}
}

// ============================================================
// NOTIFICATION SYSTEM — COMPLETE (from Version 1)
// ============================================================

function initNotificationSystem() {
console.log("🔔 Initializing notification system...");

const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationBadge = document.getElementById("notificationBadge");

if (!notificationBtn) {
console.error("❌ Notification button not found");
return;
}

console.log("✅ Notification elements found");

const newBtn = notificationBtn.cloneNode(true);
notificationBtn.parentNode.replaceChild(newBtn, notificationBtn);

newBtn.addEventListener("click", function (e) {
e.stopPropagation();
e.preventDefault();

    console.log("🔔 Notification bell clicked");

    const avatarDropdown = document.getElementById("avatarDropdown");
    if (avatarDropdown) {
      avatarDropdown.style.display = "none";
      avatarDropdown.classList.remove("active");
    }

    const isVisible = notificationDropdown.style.display === "block";
    notificationDropdown.style.display = isVisible ? "none" : "block";
    notificationDropdown.classList.toggle("active", !isVisible);

    if (!isVisible) {
      const user = firebase.auth().currentUser;
      if (user) {
        loadNotifications(user.uid);
      }
    }

});

document.addEventListener("click", function (e) {
const container = e.target.closest(".notification-container");
if (!container) {
if (notificationDropdown) {
notificationDropdown.style.display = "none";
notificationDropdown.classList.remove("active");
}
}
});

const markAllBtn = document.getElementById("markAllReadBtn");
if (markAllBtn) {
const newMarkBtn = markAllBtn.cloneNode(true);
markAllBtn.parentNode.replaceChild(newMarkBtn, markAllBtn);
newMarkBtn.addEventListener("click", function (e) {
e.stopPropagation();
console.log("📋 Mark all as read clicked");
markAllNotificationsRead();
});
}

const user = firebase.auth().currentUser;
if (user) {
console.log("👤 User logged in, loading notifications");
setTimeout(() => loadNotifications(user.uid), 300);
setupNotificationListener(user.uid);
} else {
console.log("👤 No user logged in");
if (notificationBadge) notificationBadge.style.display = "none";
if (notificationDropdown) {
const list = notificationDropdown.querySelector(".notification-list");
if (list) {
list.innerHTML = `           <div class="notification-empty">
            <i class="fas fa-bell-slash"></i>
            <p>Log in to see notifications</p>
          </div>
        `;
}
}
}

console.log("✅ Notification system initialized");
}

// ============================================================
// SETUP REAL-TIME NOTIFICATION LISTENER
// ============================================================

let notificationUnsubscribe = null;

function setupNotificationListener(userId) {
if (notificationUnsubscribe) {
notificationUnsubscribe();
notificationUnsubscribe = null;
}

console.log("📡 Setting up real-time notification listener for:", userId);

try {
notificationUnsubscribe = firebase
.firestore()
.collection("users")
.doc(userId)
.collection("notifications")
.orderBy("createdAt", "desc")
.limit(10)
.onSnapshot(
(snapshot) => {
console.log(
"📡 Notification snapshot received, changes:",
snapshot.docChanges().length,
);

          const notifications = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
              id: doc.id,
              type: data.type || "like",
              read: data.read || false,
              data: data.data || {},
              createdAt: data.createdAt || null,
              message: data.message || "",
            });
          });

          const unreadCount = notifications.filter((n) => !n.read).length;
          const badge = document.getElementById("notificationBadge");
          if (badge) {
            if (unreadCount > 0) {
              badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
              badge.style.display = "flex";
            } else {
              badge.style.display = "none";
            }
          }

          const dropdown = document.getElementById("notificationDropdown");
          if (dropdown && dropdown.style.display === "block") {
            renderNotifications(notifications);
          }
        },
        (error) => {
          console.error("❌ Notification listener error:", error);
        }
      );

} catch (error) {
console.error("❌ Failed to setup notification listener:", error);
}
}

// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

async function loadNotifications(userId) {
const notificationList = document.getElementById("notificationList");
const notificationBadge = document.getElementById("notificationBadge");

if (!notificationList) return;

try {
console.log("📥 Loading notifications for user:", userId);

    const snapshot = await firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type || "like",
        read: data.read || false,
        data: data.data || {},
        createdAt: data.createdAt || null,
        message: data.message || "",
      });
    });

    console.log(`📥 Loaded ${notifications.length} notifications`);

    const unreadCount = notifications.filter((n) => !n.read).length;
    if (notificationBadge) {
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
        notificationBadge.style.display = "flex";
      } else {
        notificationBadge.style.display = "none";
      }
    }

    renderNotifications(notifications);

} catch (error) {
console.error("❌ Error loading notifications:", error);
notificationList.innerHTML = `       <div class="notification-empty">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading notifications</p>
      </div>
    `;
}
}

// ============================================================
// RENDER NOTIFICATIONS — COMPLETE (from Version 1)
// ============================================================

function renderNotifications(notifications) {
const notificationList = document.getElementById("notificationList");
if (!notificationList) return;

if (notifications.length === 0) {
notificationList.innerHTML = `       <div class="notification-empty">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications yet</p>
      </div>
    `;
return;
}

notificationList.innerHTML = notifications
.map((notif) => {
const type = notif.type || "like";
const data = notif.data || {};
const timeAgo = formatTimeAgo(notif.createdAt);
const unreadClass = notif.read ? "" : "unread";

      let iconClass = "like";
      let iconHtml = '<i class="fas fa-heart"></i>';
      let text = "New notification";
      let link = "#";

      const userName =
        data.fromUserName ||
        data.userName ||
        data.username ||
        data.name ||
        data.displayName ||
        "Someone";
      const userId =
        data.fromUserId ||
        data.userId ||
        data.targetId ||
        data.shadowerId ||
        "";
      const artworkId = data.artworkId || data.artworkID || data.postId || "";
      const commentId = data.commentId || "";
      const artworkTitle = data.artworkTitle || "artwork";
      const conversationId = data.conversationId || "";
      const msgPreview = data.preview || data.message || "";

      switch (type) {
        case "like":
          iconClass = "like";
          iconHtml = '<i class="fas fa-heart"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> liked your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "cheer":
          iconClass = "cheer";
          iconHtml = '<i class="fas fa-glass-cheers"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> cheered for your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "shadow":
          iconClass = "shadow";
          iconHtml = '<i class="fas fa-eye"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> started shadowing you`;
          link = `/pages/community/profiles.html?user=${userId}`;
          break;
        case "comment":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-comment"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> commented on your artwork <em>${escapeHtml(artworkTitle)}</em>`;
          link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          break;
        case "mention":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-at"></i>';
          const mentionPreview = data.commentPreview || data.preview || "";
          text = `<strong>${escapeHtml(userName)}</strong> mentioned you in a comment on <em>${escapeHtml(artworkTitle)}</em>`;
          if (commentId) {
            link = `/pages/community/artwork-detail.html?id=${artworkId}&comment=${commentId}`;
          } else {
            link = `/pages/community/artwork-detail.html?id=${artworkId}`;
          }
          if (mentionPreview) {
            text += `<div style="font-size: 0.75rem; color: var(--text-muted, #5a3a6a); margin-top: 2px; font-weight: normal;">"${escapeHtml(mentionPreview)}"</div>`;
          }
          break;
        case "message":
          iconClass = "comment";
          iconHtml = '<i class="fas fa-envelope"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> sent you a message`;
          if (msgPreview) {
            text += `<div style="font-size: 0.75rem; color: var(--text-muted, #5a3a6a); margin-top: 2px; font-weight: normal;">"${escapeHtml(msgPreview)}"</div>`;
          }
          link = `/pages/community/messages.html`;
          break;
        default:
          iconClass = "like";
          iconHtml = '<i class="fas fa-bell"></i>';
          text = `<strong>${escapeHtml(userName)}</strong> ${notif.message || "interacted with you"}`;
          link = notif.link || "#";
      }

      return `
        <a href="${link}" class="notification-item ${unreadClass}" data-id="${notif.id}" data-read="${notif.read || false}">
          <div class="notification-icon ${iconClass}">
            ${iconHtml}
          </div>
          <div class="notification-content">
            <div class="notification-text">${text}</div>
            <div class="notification-time">${timeAgo}</div>
          </div>
        </a>
      `;
    })
    .join("");

document.querySelectorAll(".notification-item.unread").forEach((item) => {
item.addEventListener("click", function (e) {
const id = this.dataset.id;
if (id) {
markNotificationRead(id);
this.classList.remove("unread");
const badge = document.getElementById("notificationBadge");
if (badge) {
const current = parseInt(badge.textContent) || 0;
if (current > 0) {
badge.textContent = current - 1;
if (badge.textContent === "0") badge.style.display = "none";
}
}
}
});
});
}

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================

async function markNotificationRead(notificationId) {
try {
const user = firebase.auth().currentUser;
if (!user) return;

    await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .doc(notificationId)
      .update({ read: true });

    console.log("✅ Notification marked as read:", notificationId);

} catch (error) {
console.error("❌ Error marking notification as read:", error);
}
}

// ============================================================
// MARK ALL AS READ
// ============================================================

async function markAllNotificationsRead() {
try {
const user = firebase.auth().currentUser;
if (!user) return;

    const snapshot = await firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("read", "==", false)
      .get();

    if (snapshot.empty) {
      console.log("📋 No unread notifications");
      return;
    }

    const batch = firebase.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    console.log("✅ All notifications marked as read");

    document.querySelectorAll(".notification-item.unread").forEach((item) => {
      item.classList.remove("unread");
    });

    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.style.display = "none";
    }

    const badgeCount = document.querySelector(".notification-badge");
    if (badgeCount) badgeCount.style.display = "none";

} catch (error) {
console.error("❌ Error marking all as read:", error);
}
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatTimeAgo(timestamp) {
if (!timestamp) return "Just now";

let date;
if (timestamp && timestamp.toDate) {
date = timestamp.toDate();
} else if (timestamp && timestamp.seconds) {
date = new Date(timestamp.seconds \* 1000);
} else if (timestamp instanceof Date) {
date = timestamp;
} else {
date = new Date(timestamp);
}

if (isNaN(date.getTime())) return "Just now";

const seconds = Math.floor((new Date() - date) / 1000);
if (seconds < 60) return "Just now";

const minutes = Math.floor(seconds / 60);
if (minutes < 60) return `${minutes} min ago`;

const hours = Math.floor(minutes / 60);
if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

const days = Math.floor(hours / 24);
if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

const weeks = Math.floor(days / 7);
if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

const months = Math.floor(days / 30);
if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

const years = Math.floor(days / 365);
return `${years} year${years === 1 ? "" : "s"} ago`;
}

function escapeHtml(text) {
if (!text) return "";
const div = document.createElement("div");
div.textContent = text;
return div.innerHTML;
}

// ============================================================
// INIT ON DOM READY
// ============================================================

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function () {
setTimeout(initHeader, 300);
});
} else {
setTimeout(initHeader, 300);
}
