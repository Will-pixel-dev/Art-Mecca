// Parallax Scrolling Effect
class ParallaxController {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        this.cacheElements();
        this.addEventListeners();
        this.startAnimation();
    }

    cacheElements() {
        this.elements = document.querySelectorAll('[data-speed]');
    }

    addEventListeners() {
        let ticking = false;

        const updateParallax = () => {
            this.updateElements();
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', this.cacheElements.bind(this));
    }

    updateElements() {
        const scrollY = window.pageYOffset;
        const windowHeight = window.innerHeight;

        this.elements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-speed')) || 0.2;
            const rect = element.getBoundingClientRect();

            if (rect.bottom < 0 || rect.top > windowHeight) return;

            const elementCenterY = rect.top + rect.height / 2;
            const viewportCenterY = windowHeight / 2;
            const distanceFromCenter = elementCenterY - viewportCenterY;

            const base = -distanceFromCenter * speed * 0.18;
            const maxShift = Math.max(120, windowHeight * 0.25);
            const yPos = Math.max(-maxShift, Math.min(maxShift, base));

            if (element.classList.contains('parallax-bg') ||
                element.classList.contains('parallax-about-bg') ||
                element.classList.contains('parallax-features-bg') ||
                element.classList.contains('parallax-social-bg')) {
                element.style.transform = `translate3d(0, ${yPos}px, 0)`;
            } else if (element.classList.contains('parallax-clouds')) {
                const x = yPos * 0.35;
                element.style.transform = `translate3d(${x}px, ${yPos}px, 0)`;
            } else {
                const contentY = yPos * 0.5;
                element.style.transform = `translate3d(0, ${contentY}px, 0)`;
            }
        });
    }

    startAnimation() {
        this.updateElements();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParallaxController();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});


