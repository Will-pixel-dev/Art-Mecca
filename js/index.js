// ============================================================
// ART MECCA — CYBERPUNK STREET ART LANDING PAGE
// Complete JavaScript with Particles, Glitches, Theme Toggle
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
// SOUND EFFECTS (Web Audio)
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
document.querySelectorAll('.btn, .social-link, .theme-toggle, .footer-nav a, .footer-links a, .slider-nav').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('hover'));
    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
        el.addEventListener('click', () => playSound('click'));
    }
});

// ============================================================
// PARTICLES (Canvas) — 100 particles with neon colors
// ============================================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let mouseX = -1000;
let mouseY = -1000;
const particleCount = 100;

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
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.3 + 0.05;

        const colors = ['#ff00ea', '#ad03fc', '#58ebfe', '#4ff3a6', '#ffc72e', '#ff0040', '#ff6b00', '#00d4ff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
            const force = (200 - dist) / 200 * 0.015;
            this.speedX += (dx / dist) * force;
            this.speedY += (dy / dist) * force;
        }

        this.speedX *= 0.999;
        this.speedY *= 0.999;

        const maxSpeed = 1.2;
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (speed > maxSpeed) {
            this.speedX = (this.speedX / speed) * maxSpeed;
            this.speedY = (this.speedY / speed) * maxSpeed;
        }

        if (this.x < 0) { this.x = canvas.width; this.reset(); }
        if (this.x > canvas.width) { this.x = 0; this.reset(); }
        if (this.y < 0) { this.y = canvas.height; this.reset(); }
        if (this.y > canvas.height) { this.y = 0; this.reset(); }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
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

            if (dist < 120) {
                const opacity = (1 - dist / 120) * 0.05;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = '#ff00ea';
                ctx.globalAlpha = opacity;
                ctx.lineWidth = 0.6;
                ctx.shadowColor = '#ff00ea';
                ctx.shadowBlur = 4;
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
// SLIDER FUNCTIONALITY
// ============================================================
let currentSlide = 0;
const totalSlides = 4;

function goToSlide(index) {
    currentSlide = index;
    const holder = document.querySelector('.wrapper-holder');
    if (holder) {
        holder.style.transform = `translateX(-${index * 25}%)`;
    }

    // Update buttons
    document.querySelectorAll('.button-holder .button').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
}

function changeSlide(direction) {
    let newSlide = currentSlide + direction;
    if (newSlide < 0) newSlide = totalSlides - 1;
    if (newSlide >= totalSlides) newSlide = 0;
    goToSlide(newSlide);
}

// Auto-slide
let autoSlideInterval = setInterval(() => {
    changeSlide(1);
}, 5000);

// Pause auto-slide on hover
const sliderWrapper = document.querySelector('.wrapper');
if (sliderWrapper) {
    sliderWrapper.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });
    sliderWrapper.addEventListener('mouseleave', () => {
        autoSlideInterval = setInterval(() => {
            changeSlide(1);
        }, 5000);
    });
}

// ============================================================
// BRIEFCASE FUNCTIONALITY - ENHANCED
// ============================================================
const briefcaseContainer = document.getElementById('briefcase-container');
if (briefcaseContainer) {
    briefcaseContainer.innerHTML = `
        <div class="briefcase-3d">
            <div class="briefcase-container" id="briefcase">
                <div class="briefcase-body">
                    <div class="briefcase-lid">
                        <div class="briefcase-handle"></div>
                    </div>
                    <div class="briefcase-content">
                        <div class="document"></div>
                        <div class="laptop"></div>
                        <div class="pencil"></div>
                        <div class="phone"></div>
                    </div>
                </div>
            </div>
            <button class="briefcase-toggle" id="briefcaseToggle">
                <span class="btn-icon">📂</span>
                <span class="btn-text">OPEN PORTFOLIO</span>
            </button>
            <div class="briefcase-status" id="briefcaseStatus">✦ CLOSED ✦</div>
        </div>
    `;

    const briefcase = document.getElementById('briefcase');
    const toggleBtn = document.getElementById('briefcaseToggle');
    const status = document.getElementById('briefcaseStatus');
    let isOpen = false;

    if (toggleBtn && briefcase) {
        const toggleBriefcase = () => {
            isOpen = !isOpen;

            // Toggle classes
            briefcase.classList.toggle('open', isOpen);
            toggleBtn.classList.toggle('open', isOpen);
            status.classList.toggle('open', isOpen);

            // Update button text
            const btnText = toggleBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = isOpen ? 'CLOSE PORTFOLIO' : 'OPEN PORTFOLIO';
            }

            // Update icon
            const icon = toggleBtn.querySelector('.btn-icon');
            if (icon) {
                icon.textContent = isOpen ? '📂' : '📂';
            }

            // Update status
            status.textContent = isOpen ? '✦ OPEN ✦' : '✦ CLOSED ✦';

            // Play sound
            playSound('click');

            // Add glitch effect
            toggleBtn.classList.add('glitch');
            setTimeout(() => {
                toggleBtn.classList.remove('glitch');
            }, 400);

            // Haptic feedback simulation
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        };

        toggleBtn.addEventListener('click', toggleBriefcase);

        // Keyboard shortcut: Press 'B' to toggle
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'b' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                toggleBriefcase();
            }
        });

        // Enter key on the button
        toggleBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleBriefcase();
            }
        });
    }
}

// ============================================================
// RANDOM GLITCH ENGINE
// ============================================================

// ===== GLITCH TYPES =====
const glitchTypes = [
    'screenShake',
    'titleScramble',
    'statScramble',
    'colorFlash',
    'fullGlitch'
];

function getRandomGlitchType() {
    return glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
}

// ===== SCREEN SHAKE =====
function glitchScreenShake(intensity = 6) {
    const shakes = [
        [intensity, -intensity/2],
        [-intensity/2, intensity],
        [intensity/2, -intensity],
        [-intensity, intensity/2],
        [intensity/3, intensity/3],
        [-intensity/3, -intensity/3]
    ];

    shakes.forEach((pos, i) => {
        setTimeout(() => {
            document.body.style.transition = 'transform 0.03s ease';
            document.body.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`;
        }, i * 30);
    });

    setTimeout(() => {
        document.body.style.transform = '';
    }, shakes.length * 30 + 50);
}

// ===== TITLE SCRAMBLE =====
function glitchTitleScramble() {
    const title = document.querySelector('.title-line-2');
    if (!title) return;

    const original = title.textContent;
    let count = 0;
    const maxCount = 5 + Math.floor(Math.random() * 5);

    const interval = setInterval(() => {
        const glitched = original.split('').map((char, i) => {
            if (Math.random() > 0.3) {
                const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\\'"';
                return chars[Math.floor(Math.random() * chars.length)];
            }
            return char;
        }).join('');
        title.textContent = glitched;
        count++;
        if (count > maxCount) {
            clearInterval(interval);
            title.textContent = original;
        }
    }, 60 + Math.random() * 40);
}

// ===== STAT SCRAMBLE =====
function glitchStatScramble() {
    document.querySelectorAll('.stat-value').forEach(el => {
        const original = el.textContent;
        const glitchTexts = ['??', '!!!', '⚡', '∞', 'ERROR', '💀', '???', '--'];
        el.textContent = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
        setTimeout(() => {
            el.textContent = original;
        }, 300 + Math.random() * 300);
    });
}

// ===== COLOR FLASH =====
function glitchColorFlash() {
    const colors = ['#ff00ea', '#00ffea', '#ffc72e', '#4ff3a6', '#ff0040', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    document.body.style.transition = 'background 0.03s ease';
    document.body.style.background = color;
    setTimeout(() => {
        document.body.style.background = '';
    }, 60 + Math.random() * 80);
}

// ===== FULL GLITCH =====
function glitchFull() {
    const noise = document.getElementById('noiseOverlay');
    noise.classList.add('active');

    glitchScreenShake(8);
    glitchTitleScramble();
    glitchStatScramble();
    glitchColorFlash();

    setTimeout(() => {
        noise.classList.remove('active');
    }, 500);

    playSound('glitch');
}

// ===== MAIN GLITCH TRIGGER =====
function triggerRandomGlitch() {
    const type = getRandomGlitchType();

    switch(type) {
        case 'screenShake':
            glitchScreenShake(4 + Math.random() * 6);
            playSound('glitch');
            break;
        case 'titleScramble':
            glitchTitleScramble();
            playSound('glitch');
            break;
        case 'statScramble':
            glitchStatScramble();
            playSound('glitch');
            break;
        case 'colorFlash':
            glitchColorFlash();
            playSound('glitch');
            break;
        case 'fullGlitch':
            glitchFull();
            break;
        default:
            glitchFull();
    }
}

// ============================================================
// PAGE LOAD GLITCHES
// ============================================================
window.addEventListener('load', () => {
    setTimeout(() => {
        triggerRandomGlitch();
    }, 800);

    setTimeout(() => {
        triggerRandomGlitch();
    }, 2000);

    setTimeout(() => {
        triggerRandomGlitch();
    }, 3500);
});

// ============================================================
// PERIODIC RANDOM GLITCHES
// ============================================================
let glitchInterval = setInterval(() => {
    if (Math.random() < 0.2) {
        triggerRandomGlitch();
    }
}, 8000 + Math.random() * 7000);

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'g') {
        triggerRandomGlitch();
        playSound('glitch');
    }

    if (key === 's' || key === 'enter') {
        const startBtn = document.querySelector('.btn-primary');
        if (startBtn) {
            startBtn.click();
            startBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                startBtn.style.transform = '';
            }, 200);
        }
    }

    if (key === 'f') {
        glitchFull();
    }
});

// ============================================================
// CONSOLE EASTER EGG
// ============================================================
console.log('%c✧ ART MECCA — CYBERPUNK STREET ART EDITION', 'font-size:20px; font-weight:bold; color:#ff00ea; text-shadow: 0 0 20px #ff00ea;');
console.log('%c🎮 Press S or ENTER to start', 'font-size:12px; color:#58ebfe;');
console.log('%c⚡ Press G for random glitch | F for full glitch', 'font-size:12px; color:#4ff3a6;');
console.log('%c🔄 Glitches happen randomly while browsing!', 'font-size:12px; color:#ffc72e;');
console.log('%c🖌️ Keep it fresh. Hack the future.', 'font-size:14px; color:#ff6b00;');

// ============================================================
// HOME HERO — 3 Layer System
// ============================================================
class HomeHero {
    constructor() {
        this.userId = null;
        this.currentUser = null;
        this.isAdmin = false;
        this.layerControlsVisible = false;
        this.init();
    }

    async init() {
        if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
            firebase.auth().onAuthStateChanged(async (user) => {
                this.currentUser = user;
                if (user) {
                    try {
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            const data = doc.data();
                            this.isAdmin = data.role === 'admin' || data.role === 'moderator';
                            this.userId = user.uid;
                        }
                    } catch (e) {
                        console.error('Error checking admin status:', e);
                    }
                }

                if (this.isAdmin) {
                    this.setupLayerControls();
                }

                this.loadHeroData();
            });
        }

        this.loadStats();
    }

    async loadHeroData() {
        try {
            const doc = await db.collection('siteSettings').doc('hero').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.heroBackground) {
                    this.setLayer1Content(data.heroBackground);
                }
                if (data.heroOverlay) {
                    this.setLayer2Content(data.heroOverlay);
                }
            }
        } catch (error) {
            console.error('Error loading hero data:', error);
        }
    }

    setLayer1Content(url) {
        const container = document.getElementById('layer1Content');
        if (!container) return;

        if (!url) {
            container.innerHTML = `
                <img
                    src="assets/images/imported/backgroundi/Illustration2.png"
                    alt="Background"
                    class="hero-bg-image"
                    onload="this.classList.add('loaded')"
                    onerror="this.style.display='none'"
                />
                <div class="hero-bg-fallback"></div>
            `;
            return;
        }

        const isVideo = url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes('video');

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
        } else {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Background';
            img.className = 'hero-bg-image';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            img.onload = () => img.classList.add('loaded');
            container.appendChild(img);
            const fallback = document.createElement('div');
            fallback.className = 'hero-bg-fallback';
            container.appendChild(fallback);
        }
    }

    setLayer2Content(url) {
        const container = document.getElementById('layer2Content');
        if (!container) return;

        container.innerHTML = '';

        if (!url) {
            // Keep default neon orb and grid
            container.innerHTML = `
                <div class="neon-orb"></div>
                <div class="grid-overlay"></div>
                <span class="graffiti-tag tag-top-left">✧ FRESH</span>
                <span class="graffiti-tag tag-bottom-right">★ NEON</span>
                <div class="scan-line-hero"></div>
            `;
            return;
        }

        const isVideo = url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes('video');

        if (isVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            container.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Overlay';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            container.appendChild(img);
        }
    }

    setupLayerControls() {
        const existing = document.querySelector('.layer-controls-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'layer-controls-container';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'layer-toggle-btn';
        toggleBtn.innerHTML = '<i class="fas fa-layer-group"></i>';
        toggleBtn.title = 'Toggle Layer Controls';
        container.appendChild(toggleBtn);

        const wrapper = document.createElement('div');
        wrapper.className = 'layer-controls-wrapper';
        container.appendChild(wrapper);

        const layer1Control = this.createLayerControl('layer1', '🎨', 'Background');
        wrapper.appendChild(layer1Control);

        const layer2Control = this.createLayerControl('layer2', '🖼️', 'Overlay');
        wrapper.appendChild(layer2Control);

        document.body.appendChild(container);

        toggleBtn.addEventListener('click', () => {
            this.layerControlsVisible = !this.layerControlsVisible;
            wrapper.style.display = this.layerControlsVisible ? 'flex' : 'none';
            toggleBtn.style.background = this.layerControlsVisible
                ? 'rgba(254, 103, 234, 0.3)'
                : 'rgba(0, 0, 0, 0.6)';
            toggleBtn.style.borderColor = this.layerControlsVisible
                ? '#fe67ea'
                : 'rgba(255, 255, 255, 0.1)';
        });
    }

    createLayerControl(layer, icon, label) {
        const wrapper = document.createElement('div');
        wrapper.className = 'layer-control-item';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'layer-label';
        labelSpan.textContent = `${icon} ${label}`;
        wrapper.appendChild(labelSpan);

        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'layer-upload-btn';
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i>';
        uploadBtn.title = `Change ${label}`;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.style.display = 'none';

        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.uploadLayerFile(file, layer);
            }
            fileInput.value = '';
        });

        wrapper.appendChild(fileInput);
        wrapper.appendChild(uploadBtn);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'layer-remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = `Remove ${label}`;
        removeBtn.style.display = 'none';

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeLayerFile(layer);
        });

        wrapper.appendChild(removeBtn);
        wrapper.dataset.layer = layer;

        return wrapper;
    }

    async uploadLayerFile(file, layer) {
        if (!this.isAdmin) {
            this.showToast('Only admins can change the hero', 'error');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            this.showToast('File must be less than 100MB', 'error');
            return;
        }

        const validTypes = ['image/', 'video/'];
        const isValid = validTypes.some(type => file.type.startsWith(type));
        if (!isValid) {
            this.showToast('Please upload an image or video file', 'error');
            return;
        }

        const container = layer === 'layer1'
            ? document.getElementById('layer1Content')
            : document.getElementById('layer2Content');

        if (container) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('video/')) {
                    container.innerHTML = `
                        <video style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;" autoplay loop muted playsinline>
                            <source src="${e.target.result}" type="${file.type}">
                        </video>
                    `;
                } else {
                    container.innerHTML = `
                        <img src="${e.target.result}" alt="${layer} preview" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">
                    `;
                }
            };
            reader.readAsDataURL(file);
        }

        try {
            const storageRef = firebase.storage().ref();
            const filePath = `hero/home/${layer}/${Date.now()}_${file.name}`;
            const uploadTask = storageRef.child(filePath).put(file);

            this.showToast('Uploading...', 'info');

            const snapshot = await uploadTask;
            const downloadURL = await snapshot.ref.getDownloadURL();

            const updateData = {};
            if (layer === 'layer1') {
                updateData.heroBackground = downloadURL;
            } else {
                updateData.heroOverlay = downloadURL;
            }

            await db.collection('siteSettings').doc('hero').set(updateData, { merge: true });

            const controls = document.querySelectorAll('.layer-control-item');
            controls.forEach(ctrl => {
                if (ctrl.dataset.layer === layer) {
                    const removeBtn = ctrl.querySelector('.layer-remove-btn');
                    if (removeBtn) removeBtn.style.display = 'flex';
                }
            });

            this.showToast(`✅ ${label} updated successfully!`);
        } catch (error) {
            console.error('Error uploading:', error);
            this.showToast('Error uploading file: ' + error.message, 'error');
            this.loadHeroData();
        }
    }

    async removeLayerFile(layer) {
        if (!confirm(`Remove ${layer === 'layer1' ? 'background' : 'overlay'}?`)) return;

        try {
            const updateData = {};
            if (layer === 'layer1') {
                updateData.heroBackground = '';
            } else {
                updateData.heroOverlay = '';
            }

            await db.collection('siteSettings').doc('hero').set(updateData, { merge: true });

            if (layer === 'layer1') {
                this.setLayer1Content('');
            } else {
                this.setLayer2Content('');
            }

            const controls = document.querySelectorAll('.layer-control-item');
            controls.forEach(ctrl => {
                if (ctrl.dataset.layer === layer) {
                    const removeBtn = ctrl.querySelector('.layer-remove-btn');
                    if (removeBtn) removeBtn.style.display = 'none';
                }
            });

            this.showToast(`✅ ${layer === 'layer1' ? 'Background' : 'Overlay'} removed`);
        } catch (error) {
            console.error('Error removing layer:', error);
            this.showToast('Error removing file', 'error');
        }
    }

    async loadStats() {
        try {
            const [artworksSnap, usersSnap, tutorialsSnap] = await Promise.all([
                db.collection('artworks').get(),
                db.collection('users').get(),
                db.collection('tutorials').get()
            ]);

            const artworks = artworksSnap.size;
            const users = usersSnap.size;
            const tutorials = tutorialsSnap.size;

            const formatNumber = (num) => {
                if (num >= 1000) return (num / 1000).toFixed(1) + 'K+';
                if (num >= 100) return num + '+';
                return num;
            };

            const artworksEl = document.getElementById('heroArtworks');
            const artistsEl = document.getElementById('heroArtists');
            const tutorialsEl = document.getElementById('heroTutorials');

            if (artworksEl) artworksEl.textContent = formatNumber(artworks);
            if (artistsEl) artistsEl.textContent = formatNumber(users);
            if (tutorialsEl) tutorialsEl.textContent = formatNumber(tutorials);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    showToast(message, type = 'success') {
        let toast = document.getElementById('customToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'customToast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.borderColor = type === 'error'
            ? 'rgba(239,68,68,0.3)'
            : 'rgba(16,185,129,0.3)';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    }
}

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.homeHero = new HomeHero();
    }, 500);
});
