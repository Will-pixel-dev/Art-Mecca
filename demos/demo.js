// ============================================================
// ART MECCA — HOLOGRAM · IMMERSION · GLITCH
// Complete JavaScript
// ============================================================

// ============================================================
// THEME TOGGLE
// ============================================================
const toggle = document.getElementById('themeToggle');
const icon = toggle.querySelector('.toggle-icon');
const label = toggle.querySelector('.toggle-label');

const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateToggleUI(savedTheme);

toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateToggleUI(next);
    playSound('click');
    showToast('🌈', `Theme switched to ${next} mode`);
});

function updateToggleUI(theme) {
    if (theme === 'dark') {
        icon.textContent = '🌙';
        label.textContent = 'Dark';
    } else {
        icon.textContent = '☀️';
        label.textContent = 'Light';
    }
}

// ============================================================
// SOUND EFFECTS
// ============================================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'hover') {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'click') {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.type = 'square';
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === 'glitch') {
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.type = 'sawtooth';
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.1);
        }
    } catch (e) { /* Silently fail */ }
}

// ============================================================
// SOUND EVENT BINDING
// ============================================================
document.querySelectorAll('.btn, .nav-center a, .social-link, .hybrid-avatar, .theme-toggle').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('hover'));
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.classList.contains('hybrid-avatar')) {
        el.addEventListener('click', () => playSound('click'));
    }
});

// Cards hover sounds
document.querySelectorAll('.challenge-card, .gallery-item, .tool-card, .hero-card, .hybrid-nav').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('hover'));
});

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
const toastContainer = document.getElementById('toastContainer');

function showToast(icon, message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    toastContainer.appendChild(toast);

    // Trigger show animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }
    }, 4000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // Number keys 1-5 for navigation
    if (['1', '2', '3', '4', '5'].includes(key)) {
        const links = document.querySelectorAll('.nav-center a');
        const idx = parseInt(key) - 1;
        if (links[idx]) {
            links.forEach(l => l.classList.remove('active'));
            links[idx].classList.add('active');
            showToast('⌨️', `Navigated to ${links[idx].textContent}`);
            playSound('click');
        }
    }

    // 'g' for glitch
    if (key === 'g') {
        triggerRandomGlitch();
        showToast('⚡', 'GLITCH ACTIVATED!');
        playSound('glitch');
    }

    // 't' for toast
    if (key === 't') {
        const messages = [
            '✨ System nominal',
            '🔥 Creative energy surging',
            '🎨 Art detected',
            '💫 Hologram stable',
            '⚡ Power at 98%',
            '✧ Keep it fresh'
        ];
        showToast('🎯', messages[Math.floor(Math.random() * messages.length)]);
        playSound('click');
    }

    // 'f' for flip cards
    if (key === 'f') {
        document.querySelectorAll('.flip-card').forEach(card => {
            card.classList.toggle('flipped');
        });
        showToast('🔄', 'Flipped all cards!');
        playSound('click');
    }
});

// ============================================================
// RANDOM GLITCH EFFECT — ENHANCED
// ============================================================
function triggerRandomGlitch() {
    const noise = document.getElementById('noiseOverlay');
    const flash = document.getElementById('glitchFlash');

    // Activate noise
    noise.classList.add('active');

    // Flash overlay
    flash.classList.add('active');
    setTimeout(() => {
        flash.classList.remove('active');
    }, 400);

    // Screen shake
    document.body.style.transition = 'transform 0.05s ease';
    document.body.style.transform = 'translate(8px, -5px)';
    setTimeout(() => {
        document.body.style.transform = 'translate(-6px, 4px)';
    }, 50);
    setTimeout(() => {
        document.body.style.transform = 'translate(4px, -8px)';
    }, 100);
    setTimeout(() => {
        document.body.style.transform = 'translate(-3px, 6px)';
    }, 150);
    setTimeout(() => {
        document.body.style.transform = '';
    }, 250);

    // Screen color flash
    document.body.style.transition = 'background 0.05s ease';
    document.body.style.background = '#ff00ea';
    setTimeout(() => {
        document.body.style.background = '#00ffea';
    }, 60);
    setTimeout(() => {
        document.body.style.background = '#ffc72e';
    }, 120);
    setTimeout(() => {
        document.body.style.background = '';
    }, 200);

    // Glitch titles — more aggressive
    const title = document.getElementById('glitchTitle');
    if (title) {
        const original = title.textContent;
        let glitchCount = 0;
        const glitchInterval = setInterval(() => {
            const glitched = original.split('').map((char, i) => {
                if (Math.random() > 0.4) {
                    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\\'"';
                    return chars[Math.floor(Math.random() * chars.length)];
                }
                return char;
            }).join('');
            title.textContent = glitched;
            glitchCount++;
            if (glitchCount > 8) {
                clearInterval(glitchInterval);
                title.textContent = original;
            }
        }, 80);
    }

    // ============================================================
// GLITCH IMAGES ON HOVER
// ============================================================
document.querySelectorAll('.glitch-image').forEach(el => {
    el.addEventListener('mouseenter', () => {
        // Random chance to glitch on hover (50%)
        if (Math.random() > 0.5) {
            el.classList.add('glitching');
            setTimeout(() => {
                el.classList.remove('glitching');
            }, 600);
            playSound('glitch');
        }
    });
});

    // Random HUD status glitch
    const statusEl = document.getElementById('hudStatus');
    if (statusEl) {
        const original = statusEl.textContent;
        const glitchTexts = ['GLITCH', 'ERROR', '??', '⚡', '!!!', 'NOMINAL?', '⚠️'];
        let count = 0;
        const statusInterval = setInterval(() => {
            statusEl.textContent = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
            count++;
            if (count > 6) {
                clearInterval(statusInterval);
                statusEl.textContent = original;
            }
        }, 120);
    }

    // Random power glitch
    const powerEl = document.getElementById('hudPower');
    if (powerEl) {
        const original = powerEl.textContent;
        const powerValues = ['0%', '???', '💀', '∞', '666%', 'ERROR'];
        let count = 0;
        const powerInterval = setInterval(() => {
            powerEl.textContent = powerValues[Math.floor(Math.random() * powerValues.length)];
            count++;
            if (count > 6) {
                clearInterval(powerInterval);
                powerEl.textContent = original;
            }
        }, 120);
    }

    // Glitch text on gallery titles
    document.querySelectorAll('.glitch-text').forEach(el => {
        el.style.animation = 'none';
        setTimeout(() => {
            el.style.animation = 'glitchText 0.15s ease 5';
        }, 10);
    });

    // Remove noise overlay after delay
    setTimeout(() => {
        noise.classList.remove('active');
    }, 500);

    playSound('glitch');
}

// ============================================================
// 3D PERSPECTIVE TILT ON TOOL CARDS
// ============================================================
document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
            `translateY(-4px) rotateX(${y * 6}deg) rotateY(${x * 6}deg)`;
        card.style.transition = 'transform 0.05s ease';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.3s ease';
    });
});

// ============================================================
// 3D PERSPECTIVE TILT ON HERO DISPLAY
// ============================================================
const display = document.getElementById('holoDisplay');
if (display) {
    display.addEventListener('mousemove', (e) => {
        const rect = display.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        display.style.transform = `perspective(600px) rotateX(${y * 8}deg) rotateY(${x * 8}deg)`;
        display.style.transition = 'transform 0.05s ease';
    });

    display.addEventListener('mouseleave', () => {
        display.style.transform = '';
        display.style.transition = 'transform 0.5s ease';
    });
}

// ============================================================
// 3D PERSPECTIVE TILT ON HERO CARD
// ============================================================
const heroCard = document.getElementById('heroCard');
if (heroCard) {
    heroCard.addEventListener('mousemove', (e) => {
        const rect = heroCard.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        heroCard.style.transform =
            `perspective(1200px) rotateX(${y * 2}deg) rotateY(${x * 2}deg)`;
        heroCard.style.transition = 'transform 0.05s ease';
    });

    heroCard.addEventListener('mouseleave', () => {
        heroCard.style.transform = '';
        heroCard.style.transition = 'transform 0.5s ease';
    });
}

// ============================================================
// FLIP CARD TOGGLE
// ============================================================
document.querySelectorAll('.flip-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.flip-card');
        if (card) {
            card.classList.toggle('flipped');
            playSound('click');
            if (card.classList.contains('flipped')) {
                showToast('🔄', 'Bonus mission revealed!');
            }
        }
    });
});

// ============================================================
// ANIMATED COUNTERS (Count up on scroll)
// ============================================================
const counters = document.querySelectorAll('.counter');
let countersAnimated = false;

function animateCounters() {
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            counter.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        }
        requestAnimationFrame(updateCounter);
    });
}

// Intersection Observer for counters
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !countersAnimated) {
            countersAnimated = true;
            animateCounters();
            showToast('📊', 'Stats loaded!');
        }
    });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    observer.observe(heroStats);
}

// ============================================================
// DROP TAG BUTTON
// ============================================================
document.getElementById('dropTagBtn')?.addEventListener('click', () => {
    const tags = ['✧ FRESH', '★ NEON', '✦ MECCA', '⚡ POWER', '🔥 HEAT', '💫 VIBE'];
    const tag = tags[Math.floor(Math.random() * tags.length)];
    showToast('🎨', `Tag dropped: ${tag}`);
    playSound('click');
});

// ============================================================
// SCAN WALL BUTTON
// ============================================================
document.getElementById('scanWallBtn')?.addEventListener('click', () => {
    const scans = [
        '🔍 Scanning gallery...',
        '📡 Holographic scan in progress...',
        '⚡ Wall analysis complete',
        '🎨 4 new pieces detected'
    ];
    const msg = scans[Math.floor(Math.random() * scans.length)];
    showToast('📡', msg);
    playSound('click');

    // Animate gallery items
    document.querySelectorAll('.gallery-item').forEach((item, i) => {
        setTimeout(() => {
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.transform = '';
            }, 200);
        }, i * 100);
    });
});

// ============================================================
// VIEW ALL LINK
// ============================================================
document.getElementById('viewAllLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('📚', 'Loading all challenges...');
    playSound('click');
});

// ============================================================
// AVATAR CLICK
// ============================================================
document.getElementById('avatarBtn')?.addEventListener('click', () => {
    const messages = [
        '👋 Hello, artist!',
        '✨ Your creativity is showing',
        '🎨 Ready to create?',
        '💫 Welcome back, crew member'
    ];
    showToast('👤', messages[Math.floor(Math.random() * messages.length)]);
    playSound('click');
});

// ============================================================
// PARTICLES (Canvas) — 120 particles
// ============================================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let mouseX = -1000;
let mouseY = -1000;
const particleCount = 120;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.35 + 0.08;

        const colors = ['#ff00ea', '#ad03fc', '#58ebfe', '#4ff3a6', '#ffc72e', '#ff0040', '#ff6b00'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 250) {
            const force = (250 - dist) / 250 * 0.02;
            this.speedX += (dx / dist) * force;
            this.speedY += (dy / dist) * force;
        }

        this.speedX *= 0.999;
        this.speedY *= 0.999;

        const maxSpeed = 1.5;
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (speed > maxSpeed) {
            this.speedX = (this.speedX / speed) * maxSpeed;
            this.speedY = (this.speedY / speed) * maxSpeed;
        }

        if (this.x < 0) { this.x = canvas.width;
            this.reset(); }
        if (this.x > canvas.width) { this.x = 0;
            this.reset(); }
        if (this.y < 0) { this.y = canvas.height;
            this.reset(); }
        if (this.y > canvas.height) { this.y = 0;
            this.reset(); }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                const opacity = (1 - dist / 150) * 0.06;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = '#ff00ea';
                ctx.globalAlpha = opacity;
                ctx.lineWidth = 0.8;
                ctx.shadowColor = '#ff00ea';
                ctx.shadowBlur = 5;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    drawConnections();

    requestAnimationFrame(animateParticles);
}

animateParticles();



// ============================================================
// INITIAL TOAST ON LOAD
// ============================================================
setTimeout(() => {
    showToast('✧', 'ART MECCA — Hologram · Immersion · Glitch');
    setTimeout(() => {
        showToast('⌨️', 'Try keys: 1-5 (nav) · G (glitch) · T (toast) · F (flip)');
    }, 1500);
}, 800);

// ============================================================
// CONSOLE EASTER EGG
// ============================================================
console.log('%c✧ ART MECCA — HOLOGRAM · IMMERSION · GLITCH', 'font-size:20px; font-weight:bold; color:#ff00ea; text-shadow: 0 0 20px #ff00ea;');
console.log('%c🔥 Cyberpunk Hologram · Full Immersion · Glitch Factory', 'font-size:12px; color:#58ebfe;');
console.log('%c⌨️ Keyboard shortcuts: 1-5 (nav) · G (glitch) · T (toast) · F (flip)', 'font-size:12px; color:#4ff3a6;');
console.log('%c🖌️ Keep it fresh. Hack the future.', 'font-size:14px; color:#ff6b00;');
