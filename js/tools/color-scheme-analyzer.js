// Color Scheme Analyzer with Accessibility Testing
class ColorSchemeAnalyzer {
    constructor() {
        this.foregroundColor = '#000000';
        this.backgroundColor = '#ffffff';
        this.savedCombinations = this.loadSavedCombinations();

        this.initializeEventListeners();
        this.analyzeColors();
    }

    initializeEventListeners() {
        // Color input events
        document.getElementById('foreground').addEventListener('input', (e) => {
            this.foregroundColor = e.target.value;
            document.getElementById('foreground-hex').value = this.foregroundColor;
            this.analyzeColors();
        });

        document.getElementById('background').addEventListener('input', (e) => {
            this.backgroundColor = e.target.value;
            document.getElementById('background-hex').value = this.backgroundColor;
            this.analyzeColors();
        });

        // Hex input events
        document.getElementById('foreground-hex').addEventListener('input', (e) => {
            const hex = this.validateHex(e.target.value);
            if (hex) {
                this.foregroundColor = hex;
                document.getElementById('foreground').value = hex;
                this.analyzeColors();
            }
        });

        document.getElementById('background-hex').addEventListener('input', (e) => {
            const hex = this.validateHex(e.target.value);
            if (hex) {
                this.backgroundColor = hex;
                document.getElementById('background').value = hex;
                this.analyzeColors();
            }
        });

        // Swap colors
        document.getElementById('swap-colors').addEventListener('click', () => {
            [this.foregroundColor, this.backgroundColor] = [this.backgroundColor, this.foregroundColor];
            this.updateColorInputs();
            this.analyzeColors();
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fg = e.target.getAttribute('data-fg');
                const bg = e.target.getAttribute('data-bg');
                this.foregroundColor = fg;
                this.backgroundColor = bg;
                this.updateColorInputs();
                this.analyzeColors();
            });
        });

        // Action buttons
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzeColors();
        });

        document.getElementById('random-test-btn').addEventListener('click', () => {
            this.generateRandomTest();
        });

        document.getElementById('save-combination-btn').addEventListener('click', () => {
            this.saveCombination();
        });

        document.getElementById('clear-saved-combinations').addEventListener('click', () => {
            this.clearSavedCombinations();
        });
    }

    validateHex(hex) {
        // Add # if missing
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }

        // Validate hex format
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(hex)) {
            // Convert 3-digit hex to 6-digit
            if (hex.length === 4) {
                hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            }
            return hex;
        }
        return null;
    }

    updateColorInputs() {
        document.getElementById('foreground').value = this.foregroundColor;
        document.getElementById('foreground-hex').value = this.foregroundColor;
        document.getElementById('background').value = this.backgroundColor;
        document.getElementById('background-hex').value = this.backgroundColor;
    }

    // Color conversion utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Relative luminance calculation (WCAG)
    getLuminance(rgb) {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Contrast ratio calculation (WCAG)
    getContrastRatio(foreground, background) {
        const lum1 = this.getLuminance(this.hexToRgb(foreground));
        const lum2 = this.getLuminance(this.hexToRgb(background));
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // Color blindness simulation
    simulateColorBlindness(hex, type) {
        const rgb = this.hexToRgb(hex);
        let r = rgb.r, g = rgb.g, b = rgb.b;

        switch (type) {
            case 'protanopia':
                // Red-blind
                [r, g, b] = [0.567 * r + 0.433 * g + 0.000 * b,
                             0.558 * r + 0.442 * g + 0.000 * b,
                             0.000 * r + 0.242 * g + 0.758 * b];
                break;
            case 'deuteranopia':
                // Green-blind
                [r, g, b] = [0.625 * r + 0.375 * g + 0.000 * b,
                             0.700 * r + 0.300 * g + 0.000 * b,
                             0.000 * r + 0.300 * g + 0.700 * b];
                break;
            case 'tritanopia':
                // Blue-blind
                [r, g, b] = [0.950 * r + 0.050 * g + 0.000 * b,
                             0.000 * r + 0.433 * g + 0.567 * b,
                             0.000 * r + 0.475 * g + 0.525 * b];
                break;
        }

        return this.rgbToHex(
            Math.max(0, Math.min(255, Math.round(r))),
            Math.max(0, Math.min(255, Math.round(g))),
            Math.max(0, Math.min(255, Math.round(b)))
        );
    }

    analyzeColors() {
        const contrastRatio = this.getContrastRatio(this.foregroundColor, this.backgroundColor);

        this.updateVisualPreview();
        this.updateContrastResults(contrastRatio);
        this.updateWCAGCompliance(contrastRatio);
        this.updateColorBlindnessSimulation();
        this.updateRecommendations(contrastRatio);
    }

    updateVisualPreview() {
        const previewBox = document.getElementById('preview-box');
        previewBox.style.backgroundColor = this.backgroundColor;
        previewBox.style.color = this.foregroundColor;

        // Update buttons in preview
        const buttons = previewBox.querySelectorAll('.preview-btn');
        buttons.forEach(btn => {
            if (btn.classList.contains('secondary')) {
                btn.style.backgroundColor = 'transparent';
                btn.style.color = this.foregroundColor;
                btn.style.borderColor = this.foregroundColor;
            } else {
                btn.style.backgroundColor = this.foregroundColor;
                btn.style.color = this.backgroundColor;
            }
        });
    }

    updateContrastResults(contrastRatio) {
        const ratioElement = document.getElementById('contrast-ratio');
        ratioElement.textContent = contrastRatio.toFixed(2) + ':1';

        // Color code the ratio
        if (contrastRatio >= 7) {
            ratioElement.style.color = 'var(--success)';
        } else if (contrastRatio >= 4.5) {
            ratioElement.style.color = 'var(--warning)';
        } else {
            ratioElement.style.color = 'var(--error)';
        }
    }

    updateWCAGCompliance(contrastRatio) {
        const levels = {
            'aa-normal': 4.5,
            'aa-large': 3.0,
            'aaa-normal': 7.0,
            'aaa-large': 4.5
        };

        for (const [level, threshold] of Object.entries(levels)) {
            const element = document.getElementById(`wcag-${level}`);
            const container = element.closest('.compliance-item');

            const passes = contrastRatio >= threshold;
            element.textContent = passes ? 'Pass' : 'Fail';

            if (passes) {
                container.classList.remove('fail');
                container.classList.add('pass');
            } else {
                container.classList.remove('pass');
                container.classList.add('fail');
            }
        }
    }

    updateColorBlindnessSimulation() {
        const types = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];

        types.forEach(type => {
            const element = document.getElementById(`${type}-preview`);
            if (type === 'normal') {
                element.style.backgroundColor = this.backgroundColor;
                element.style.color = this.foregroundColor;
            } else {
                const simBg = this.simulateColorBlindness(this.backgroundColor, type);
                const simFg = this.simulateColorBlindness(this.foregroundColor, type);
                element.style.backgroundColor = simBg;
                element.style.color = simFg;
            }
        });
    }

    updateRecommendations(contrastRatio) {
        const recommendations = document.getElementById('recommendations');
        let recommendationsHTML = '';

        if (contrastRatio < 3) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <i class="fas fa-exclamation-triangle" style="color: var(--error)"></i>
                    <span>Very low contrast - consider different colors</span>
                </div>
            `;
        }

        if (contrastRatio >= 3 && contrastRatio < 4.5) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <i class="fas fa-info-circle" style="color: var(--warning)"></i>
                    <span>Minimum contrast for large text only</span>
                </div>
            `;
        }

        if (contrastRatio >= 4.5 && contrastRatio < 7) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Good contrast for normal text (WCAG AA)</span>
                </div>
            `;
        }

        if (contrastRatio >= 7) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Excellent contrast (WCAG AAA)</span>
                </div>
            `;
        }

        // Add color blindness recommendations
        const normalContrast = this.getContrastRatio(this.foregroundColor, this.backgroundColor);
        const protanopiaContrast = this.getContrastRatio(
            this.simulateColorBlindness(this.foregroundColor, 'protanopia'),
            this.simulateColorBlindness(this.backgroundColor, 'protanopia')
        );

        if (protanopiaContrast < normalContrast * 0.7) {
            recommendationsHTML += `
                <div class="recommendation-item">
                    <i class="fas fa-eye"></i>
                    <span>Consider testing with color blindness simulators</span>
                </div>
            `;
        }

        recommendations.innerHTML = recommendationsHTML || `
            <div class="recommendation-item">
                <i class="fas fa-check-circle"></i>
                <span>Colors are working well together</span>
            </div>
        `;
    }

    generateRandomTest() {
        // Generate random but readable color combinations
        const hues = [0, 30, 60, 120, 180, 240, 300, 330]; // Common hue values
        const randomHue = hues[Math.floor(Math.random() * hues.length)];

        // Generate background (usually lighter)
        const bgLightness = Math.random() * 40 + 60; // 60-100%
        const bgSaturation = Math.random() * 30 + 20; // 20-50%

        // Generate foreground (usually darker)
        const fgLightness = Math.random() * 40 + 10; // 10-50%
        const fgSaturation = Math.random() * 50 + 30; // 30-80%

        // Convert HSL to Hex (simplified)
        this.backgroundColor = this.hslToHex(randomHue, bgSaturation, bgLightness);
        this.foregroundColor = this.hslToHex((randomHue + 180) % 360, fgSaturation, fgLightness);

        this.updateColorInputs();
        this.analyzeColors();
    }

    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Saved Combinations
    loadSavedCombinations() {
        const saved = localStorage.getItem('artisanHubSavedCombinations');
        return saved ? JSON.parse(saved) : [];
    }

    saveToLocalStorage() {
        localStorage.setItem('artisanHubSavedCombinations', JSON.stringify(this.savedCombinations));
    }

    saveCombination() {
        const contrastRatio = this.getContrastRatio(this.foregroundColor, this.backgroundColor);
        const wcagAA = contrastRatio >= 4.5;
        const wcagAAA = contrastRatio >= 7;

        const combination = {
            id: Date.now(),
            foreground: this.foregroundColor,
            background: this.backgroundColor,
            contrastRatio: contrastRatio,
            wcagAA: wcagAA,
            wcagAAA: wcagAAA,
            createdAt: new Date().toISOString()
        };

        // Add to beginning (most recent first)
        this.savedCombinations.unshift(combination);

        // Keep only last 10 combinations
        if (this.savedCombinations.length > 10) {
            this.savedCombinations = this.savedCombinations.slice(0, 10);
        }

        this.saveToLocalStorage();
        this.loadSavedCombinationsDisplay();
        this.showNotification('Color combination saved!', 'success');
    }

    loadSavedCombinationsDisplay() {
        const container = document.getElementById('saved-combinations');

        if (this.savedCombinations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-palette"></i>
                    <h3>No combinations saved yet</h3>
                    <p>Analyze and save your first color combination to see it here!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.savedCombinations.map(combo => `
            <div class="saved-combination-card">
                <div class="combination-preview" style="background-color: ${combo.background};">
                    <div class="combination-foreground" style="background-color: ${combo.foreground}; color: ${combo.background};">
                        Aa
                    </div>
                </div>
                <div class="combination-info">
                    <div class="combination-ratio">${combo.contrastRatio.toFixed(1)}:1</div>
                    <div class="combination-status" style="background: ${combo.wcagAAA ? 'var(--success)' : combo.wcagAA ? 'var(--warning)' : 'var(--error)'}">
                        ${combo.wcagAAA ? 'AAA' : combo.wcagAA ? 'AA' : 'Fail'}
                    </div>
                </div>
                <div class="combination-card-actions">
                    <button class="palette-action-btn" onclick="colorAnalyzer.loadCombination(${combo.id})">
                        <i class="fas fa-undo"></i>
                        Load
                    </button>
                    <button class="palette-action-btn delete" onclick="colorAnalyzer.deleteCombination(${combo.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadCombination(combinationId) {
        const combination = this.savedCombinations.find(c => c.id === combinationId);
        if (!combination) return;

        this.foregroundColor = combination.foreground;
        this.backgroundColor = combination.background;

        this.updateColorInputs();
        this.analyzeColors();
        this.showNotification('Combination loaded!', 'success');
    }

    deleteCombination(combinationId) {
        this.savedCombinations = this.savedCombinations.filter(c => c.id !== combinationId);
        this.saveToLocalStorage();
        this.loadSavedCombinationsDisplay();
        this.showNotification('Combination deleted', 'success');
    }

    clearSavedCombinations() {
        if (this.savedCombinations.length === 0) {
            this.showNotification('No combinations to clear', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all saved combinations?')) {
            this.savedCombinations = [];
            this.saveToLocalStorage();
            this.loadSavedCombinationsDisplay();
            this.showNotification('All combinations cleared', 'success');
        }
    }

    showNotification(message, type = 'info') {
        // Reuse the notification system from your palette generator
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
}

// Initialize the analyzer when DOM is loaded
let colorAnalyzer;
document.addEventListener('DOMContentLoaded', () => {
    colorAnalyzer = new ColorSchemeAnalyzer();
});
