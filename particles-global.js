// ========================================
// GLOBAL PARTICLE SYSTEM
// ========================================
// Usage: Add data-particle-color="your-color" to canvas element
// or it will use the default rainbow colors
// ========================================

(function() {
    'use strict';

    // ========================================
    // DETECT TOUCH DEVICE
    // ========================================
    const isTouchDevice = 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const isMobile = window.innerWidth < 768 || isTouchDevice;

    // ========================================
    // CONFIGURATION
    // ========================================
    const CONFIG = {
        // Mobile gets fewer particles
        particleCount: isMobile ? 25 : 80,
        // Shorter connections on mobile = less drawing
        connectionDistance: isMobile ? 80 : 120,
        // Smaller mouse radius on mobile
        mouseRadius: isMobile ? 120 : 200,
        // Max particle speed
        maxSpeed: isMobile ? 0.8 : 1.2,
        // Particle sizes (slightly smaller on mobile)
        minSize: isMobile ? 0.3 : 0.5,
        maxSize: isMobile ? 1.8 : 2.5,
        // Opacity range
        minOpacity: 0.05,
        maxOpacity: isMobile ? 0.2 : 0.35,
        // Connection opacity (lighter on mobile)
        connectionOpacity: isMobile ? 0.02 : 0.04,
        // How often to draw (skip frames on mobile)
        frameSkip: isMobile ? 1 : 0, // 0 = every frame, 1 = every other frame
    };

    // ========================================
    // COLOR PALETTES
    // ========================================
    const PALETTES = {
        rainbow: ['#ff0040', '#ff6b00', '#ffc72e', '#4ff3a6', '#58ebfe', '#0088ff', '#ad03fc', '#ff00ea'],
        neon: ['#ff00ff', '#00ffff', '#ff0055', '#55ff00', '#ffaa00'],
        blue: ['#0088ff', '#00ccff', '#4ff3a6', '#58ebfe', '#0066cc'],
        purple: ['#ad03fc', '#7b2ffc', '#ff00ea', '#cc00ff', '#9b59b6'],
        green: ['#4ff3a6', '#2ecc71', '#1abc9c', '#55ff00', '#00ff88'],
        red: ['#ff0040', '#ff6b00', '#ff3333', '#ff0055', '#cc0033'],
        white: ['#ffffff', '#e0e0e0', '#f5f5f5', '#cccccc', '#ffffff'],
    };

    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    function getPalette(canvas) {
        const colorAttr = canvas.getAttribute('data-particle-color');
        if (colorAttr && PALETTES[colorAttr]) {
            return PALETTES[colorAttr];
        }
        return PALETTES.rainbow;
    }

    // ========================================
    // TRACK ALL PARTICLE SYSTEMS
    // ========================================
    const systems = [];

    // ========================================
    // PARTICLE SYSTEM CLASS
    // ========================================
    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.mouseX = -1000;
            this.mouseY = -1000;
            this.animationId = null;
            this.isPaused = false;
            this.palette = getPalette(canvas);
            this.frameCount = 0;
            this.isTouchDevice = isTouchDevice;

            // Set particle count
            this.particleCount = CONFIG.particleCount;

            // On touch devices, disable pointer events on canvas
            // to allow smooth scrolling
            if (this.isTouchDevice) {
                this.canvas.style.pointerEvents = 'none';
            } else {
                // Desktop: enable mouse interaction
                this.canvas.style.pointerEvents = 'auto';
            }

            this.resize();
            this.initParticles();
            this.bindEvents();
            this.animate();

            systems.push(this);
        }

        resize() {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance

            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.ctx.scale(dpr, dpr);

            this.width = rect.width;
            this.height = rect.height;
        }

        initParticles() {
            this.particles = [];
            for (let i = 0; i < this.particleCount; i++) {
                this.particles.push(this.createParticle());
            }
        }

        createParticle() {
            return {
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity) + CONFIG.minOpacity,
                color: this.palette[Math.floor(Math.random() * this.palette.length)],
            };
        }

        bindEvents() {
            // ===== MOUSE EVENTS (Desktop only) =====
            const handleMouseMove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            };

            const handleMouseLeave = () => {
                this.mouseX = -1000;
                this.mouseY = -1000;
            };

            // ===== TOUCH EVENTS (Mobile) =====
            // Using passive: true allows scrolling to work normally
            const handleTouchMove = (e) => {
                if (e.touches && e.touches.length > 0) {
                    const rect = this.canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    this.mouseX = touch.clientX - rect.left;
                    this.mouseY = touch.clientY - rect.top;
                }
            };

            const handleTouchEnd = () => {
                // Slowly fade out the mouse influence instead of instantly disappearing
                // This creates a smoother experience on mobile
                setTimeout(() => {
                    this.mouseX = -1000;
                    this.mouseY = -1000;
                }, 300);
            };

            // Attach events
            this.canvas.addEventListener('mousemove', handleMouseMove);
            this.canvas.addEventListener('mouseleave', handleMouseLeave);

            // Mobile: passive: true prevents scroll blocking
            this.canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
            this.canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
            this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

            // ===== RESIZE EVENT =====
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.resize();
                    this.initParticles();
                }, 250);
            };
            window.addEventListener('resize', handleResize);

            // ===== VISIBILITY CHANGE - Pause when tab is hidden =====
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    this.isPaused = true;
                } else {
                    this.isPaused = false;
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // Store for cleanup
            this._handlers = {
                handleMouseMove,
                handleMouseLeave,
                handleTouchMove,
                handleTouchEnd,
                handleResize,
                handleVisibilityChange
            };
        }

        update() {
            if (this.isPaused) return;

            const particles = this.particles;
            const { mouseX, mouseY, width, height } = this;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Move
                p.x += p.speedX;
                p.y += p.speedY;

                // Mouse/Touch interaction
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.mouseRadius && dist > 0.5) {
                    const force = ((CONFIG.mouseRadius - dist) / CONFIG.mouseRadius) * 0.015;
                    p.speedX += (dx / dist) * force;
                    p.speedY += (dy / dist) * force;
                }

                // Damping
                p.speedX *= 0.999;
                p.speedY *= 0.999;

                // Speed limit
                const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
                if (speed > CONFIG.maxSpeed) {
                    p.speedX = (p.speedX / speed) * CONFIG.maxSpeed;
                    p.speedY = (p.speedY / speed) * CONFIG.maxSpeed;
                }

                // Reset if off screen
                if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
                    Object.assign(p, this.createParticle());
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            const particles = this.particles;

            // Clear with optimization - only clear if we're drawing
            ctx.clearRect(0, 0, this.width, this.height);

            // ===== DRAW CONNECTIONS =====
            // Only draw connections if particles exist
            if (particles.length > 1) {
                ctx.save();
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < CONFIG.connectionDistance) {
                            const opacity = (1 - dist / CONFIG.connectionDistance) * CONFIG.connectionOpacity;
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);

                            const gradient = ctx.createLinearGradient(
                                particles[i].x, particles[i].y,
                                particles[j].x, particles[j].y
                            );
                            gradient.addColorStop(0, particles[i].color);
                            gradient.addColorStop(1, particles[j].color);

                            ctx.strokeStyle = gradient;
                            ctx.globalAlpha = opacity;
                            ctx.lineWidth = 0.6;
                            ctx.shadowColor = particles[i].color;
                            ctx.shadowBlur = 4;
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();
            }

            // ===== DRAW PARTICLES =====
            ctx.save();
            for (const p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 15;
                ctx.fill();
            }
            ctx.restore();
        }

        animate() {
            // Frame skipping for mobile performance
            if (CONFIG.frameSkip > 0) {
                this.frameCount++;
                if (this.frameCount % (CONFIG.frameSkip + 1) === 0) {
                    if (!this.isPaused) {
                        this.update();
                        this.draw();
                    }
                }
            } else {
                if (!this.isPaused) {
                    this.update();
                    this.draw();
                }
            }

            this.animationId = requestAnimationFrame(() => this.animate());
        }

        togglePause() {
            this.isPaused = !this.isPaused;
            return this.isPaused;
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this._handlers) {
                window.removeEventListener('resize', this._handlers.handleResize);
                document.removeEventListener('visibilitychange', this._handlers.handleVisibilityChange);
            }
            const index = systems.indexOf(this);
            if (index > -1) {
                systems.splice(index, 1);
            }
        }

        setParticleCount(count) {
            this.particleCount = count;
            this.initParticles();
        }
    }

    // ========================================
    // AUTO-INITIALIZE ALL PARTICLE CANVASES
    // ========================================
    function initParticles() {
        const canvases = document.querySelectorAll('#particleCanvas');
        if (canvases.length === 0) {
            // No canvas found, wait and try again
            setTimeout(initParticles, 500);
            return;
        }

        canvases.forEach(canvas => {
            if (canvas._particleSystem) return;
            const system = new ParticleSystem(canvas);
            canvas._particleSystem = system;
        });

        console.log(`✅ Particle systems initialized (${canvases.length} canvas, ${isMobile ? 'Mobile' : 'Desktop'} mode)`);
    }

    // ========================================
    // GLOBAL CONTROLS
    // ========================================
    window.particleControls = {
        pauseAll: function() {
            systems.forEach(s => s.isPaused = true);
            console.log('⏸️ All particles paused');
        },
        resumeAll: function() {
            systems.forEach(s => s.isPaused = false);
            console.log('▶️ All particles resumed');
        },
        toggleAll: function() {
            const paused = systems.every(s => s.isPaused);
            systems.forEach(s => s.isPaused = !paused);
            return paused ? 'Resumed' : 'Paused';
        },
        setCount: function(count) {
            systems.forEach(s => s.setParticleCount(count));
            console.log(`🔢 Particle count set to ${count}`);
        },
        getStatus: function() {
            return {
                systems: systems.length,
                totalParticles: systems.reduce((sum, s) => sum + s.particleCount, 0),
                paused: systems.every(s => s.isPaused),
                mode: isMobile ? 'Mobile' : 'Desktop',
            };
        }
    };

    // ========================================
    // AUTO-INIT ON DOM READY
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParticles);
    } else {
        // DOM already loaded, initialize after a small delay
        setTimeout(initParticles, 100);
    }

    // ========================================
    // CLEANUP ON PAGE UNLOAD
    // ========================================
    window.addEventListener('beforeunload', function() {
        systems.forEach(s => s.destroy());
    });

})();
