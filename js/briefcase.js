// Enhanced Briefcase Component with Floating Documents
class Briefcase3D {
    constructor(container) {
        this.container = container;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createBriefcase();
        this.setupEventListeners();
        console.log('Briefcase initialized successfully!');
    }

    createBriefcase() {
        this.briefcase = document.createElement('div');
        this.briefcase.className = 'briefcase-3d';
        this.briefcase.innerHTML = `
            <div class="briefcase-container">
                <div class="briefcase-body">
                    <div class="briefcase-lid"></div>
                    <div class="briefcase-handle"></div>
                    <div class="briefcase-latches">
                        <div class="latch left"></div>
                        <div class="latch right"></div>
                    </div>
                    <div class="briefcase-content">
                        <div class="document"></div>
                        <div class="laptop"></div>
                        <div class="pencil"></div>
                        <div class="phone"></div>
                    </div>
                </div>
            </div>
            <div class="briefcase-controls">
                <button class="briefcase-toggle">
                    ${this.isOpen ? 'Close Portfolio' : 'Open Portfolio'}
                </button>
            </div>
            <div class="briefcase-status">
                ${this.isOpen ? '🎨 Portfolio items floating!' : '💼 Click to see portfolio items'}
            </div>
        `;

        this.container.appendChild(this.briefcase);
    }

    setupEventListeners() {
        const toggleBtn = this.briefcase.querySelector('.briefcase-toggle');
        const briefcase = this.briefcase.querySelector('.briefcase-container');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        briefcase.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Add hover effect
        briefcase.addEventListener('mouseenter', () => {
            if (!this.isOpen) {
                briefcase.style.transform = 'translateY(-8px) scale(1.05)';
            }
        });

        briefcase.addEventListener('mouseleave', () => {
            if (!this.isOpen) {
                briefcase.style.transform = 'translateY(0) scale(1)';
            }
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.updateState();
    }

    updateState() {
        const briefcase = this.briefcase.querySelector('.briefcase-container');
        const toggleBtn = this.briefcase.querySelector('.briefcase-toggle');
        const status = this.briefcase.querySelector('.briefcase-status');

        if (this.isOpen) {
            briefcase.classList.add('open');
            toggleBtn.textContent = 'Close Portfolio';
            status.textContent = '🎨 Portfolio items floating!';
            status.style.color = 'var(--primary)';
        } else {
            briefcase.classList.remove('open');
            toggleBtn.textContent = 'Open Portfolio';
            status.textContent = '💼 Click to see portfolio items';
            status.style.color = 'var(--dark)';
        }
    }
}

// Initialize briefcase when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing briefcase...');
    const briefcaseContainer = document.getElementById('briefcase-container');
    if (briefcaseContainer) {
        console.log('Briefcase container found, creating briefcase...');
        new Briefcase3D(briefcaseContainer);
    } else {
        console.error('Briefcase container not found!');
    }
});

