// Enhanced Creative Prompt Generator with Detailed Categories
class PromptGenerator {
    constructor() {
        this.currentCategory = 'character';
        this.selectedOptions = {
            character: new Set(),
            landscape: new Set(),
            story: new Set()
        };
        this.savedPrompts = this.loadSavedPrompts();

        this.initializeEventListeners();
        this.loadCategoryOptions();
        this.loadSavedPromptsPreview();
        this.generatePrompt(); // Generate first prompt automatically
    }

    initializeEventListeners() {
        // Category selection
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentCategory = card.getAttribute('data-category');
                this.loadCategoryOptions();
                this.generatePrompt();
            });
        });

        // Generate button
        document.getElementById('generate-prompt-btn').addEventListener('click', () => {
            this.generatePrompt();
        });

        // Random all button
        document.getElementById('random-all-btn').addEventListener('click', () => {
            this.randomizeAllOptions();
            this.generatePrompt();
        });

        // Save prompt button
        document.getElementById('save-prompt-btn').addEventListener('click', () => {
            this.saveCurrentPrompt();
        });

        // Copy prompt button
        document.getElementById('copy-prompt-btn').addEventListener('click', () => {
            this.copyPromptToClipboard();
        });

        // Refresh prompt button
        document.getElementById('refresh-prompt-btn').addEventListener('click', () => {
            this.generatePrompt();
        });

        // Add sparkle effect to generate button
        const generateBtn = document.getElementById('generate-prompt-btn');
        generateBtn.addEventListener('click', function(e) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = (e.pageX - this.getBoundingClientRect().left) + 'px';
            sparkle.style.top = (e.pageY - this.getBoundingClientRect().top) + 'px';
            this.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1000);
        });
    }

    // Category Options Data
    getCategoryOptions() {
        return {
            character: {
                type: ['Monster', 'Angel', 'Demon', 'Human', 'Lion', 'Bunny', 'Horse', 'Stag', 'Dragon', 'Robot', 'Alien', 'Ghost'],
                status: ['Royal', 'Thief', 'Barbarian', 'Soldier', 'Royal Guard', 'Jester', 'Commoner', 'Celebrity', 'Musician', 'Dancer', 'Scholar', 'Merchant'],
                body: ['Vitiligo', 'Scars', 'Star Freckles', 'Tattoos', 'Many Eyes', 'Heterochromia', 'Amputation', 'Muscular', 'Chubby', 'Thick', 'Cracks', 'Cyborg', 'Wings', 'Tail', 'Horns'],
                season: ['Summer', 'Winter', 'Spring', 'Autumn'],
                accessories: ['Glasses', 'Gloves', 'Crown', 'Gun', 'Sword', 'Axe', 'Hammer', 'Motorbike', 'Jacket', 'Nothing', 'Hat', 'Crowbar', 'Pet', 'Mask', 'Jewelry']
            },
            landscape: {
                aesthetic: ['Light Fairy', 'Dark Fairy', 'Cyberpunk', 'Hydropunk', 'Biopunk', 'Solarpunk', 'Old England', 'Medieval', 'Tokyo 1931', 'Eastern Empire', 'Sky Islands', 'Steampunk'],
                climate: ['Hellscape', 'Oceanic', 'Hot Desert', 'Cold Desert', 'Dense Forest', 'Meadow', 'Mountains', 'Canyons', 'Tundra', 'Jungle', 'Volcanic'],
                timeOfDay: ['Night', 'Twilight', 'Sunset', 'Mid-day', 'Morning', 'Golden Hour', 'Blue Hour'],
                weather: ['Rain', 'Sunny', 'Storm', 'Snow', 'Fog', 'Windy', 'Clear', 'Overcast'],
                sky: ['Rainbow', 'Green Sky', 'Tornado', 'Aurora Borealis', 'Shooting Stars', 'Eclipse', 'Cracked Sky', 'Half n Half', 'Double Suns', 'Floating Islands']
            },
            story: {
                genre: ['Romance', 'Horror', 'Crime', 'Comedy', 'Fantasy', 'Sci-Fi', 'Mystery', 'Thriller', 'Drama', 'Adventure'],
                tone: ['Bittersweet', 'Heart Warming', 'Nostalgic', 'Tragic', 'Hopeful', 'Dark', 'Whimsical', 'Epic', 'Intimate'],
                plot: ['Rescue', 'Mental Breakdown', 'Falling in Love', 'Opposites Attract', 'Freak Friday', 'World is Ending', 'Amnesia', 'The Weirdest Dream', 'The World Ended Yesterday', 'Discovery', 'Revenge', 'Redemption'],
                characters: ['1', '2', '3', '4', '5', '6', '7', 'Large Cast'],
                protagonist: ['Villain', 'Hero', 'NPC', 'Thief', 'Princess', 'Prince', 'King', 'Queen', 'Jester', 'Uber Driver', 'Orphan', 'Detective', 'Zombie', 'Theater Kid', 'Gay Guy', 'Gay Girl', 'Non-binary'],
                protagonistAge: ['5-12', '13-17', '18-25', '26-35', '36-45', '46-55', '56-65', '66-75'],
                setting: ['Future', 'Past', 'Post Apocalyptic', 'Urban City', 'Overpopulated City', 'Middle of Nowhere', 'School', 'Office Job', 'Abandoned Gas Station', 'Space Station', 'Small Town', 'Fantasy Kingdom']
            }
        };
    }

    loadCategoryOptions() {
        const optionsContainer = document.getElementById('category-options');
        const categoryOptions = this.getCategoryOptions()[this.currentCategory];

        let optionsHTML = '<div class="options-grid">';

        for (const [category, items] of Object.entries(categoryOptions)) {
            optionsHTML += `
                <div class="option-group">
                    <h4><i class="fas fa-${this.getCategoryIcon(category)}"></i> ${this.formatCategoryName(category)}</h4>
                    <div class="options-list">
                        ${items.map(item => `
                            <div class="option-item" data-category="${category}" data-value="${item}">
                                <div class="option-checkbox"></div>
                                <span class="option-text">${item}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        optionsHTML += '</div>';
        optionsContainer.innerHTML = optionsHTML;

        // Add event listeners to option items
        optionsContainer.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = item.getAttribute('data-category');
                const value = item.getAttribute('data-value');
                const key = `${this.currentCategory}-${category}-${value}`;

                if (this.selectedOptions[this.currentCategory].has(key)) {
                    this.selectedOptions[this.currentCategory].delete(key);
                    item.classList.remove('active');
                } else {
                    this.selectedOptions[this.currentCategory].add(key);
                    item.classList.add('active');
                }

                this.generatePrompt();
            });
        });

        // Update category badge
        const categoryBadge = document.querySelector('.prompt-category-badge span');
        const categoryIcon = document.querySelector('.prompt-category-badge i');
        categoryBadge.textContent = this.capitalizeFirst(this.currentCategory);
        categoryIcon.className = this.getMainCategoryIcon(this.currentCategory);

        // Update current category display
        document.getElementById('current-category').textContent = this.capitalizeFirst(this.currentCategory);
    }

    getCategoryIcon(category) {
        const icons = {
            type: 'paw',
            status: 'crown',
            body: 'user',
            season: 'tree',
            accessories: 'glasses',
            aesthetic: 'palette',
            climate: 'cloud-sun',
            timeOfDay: 'clock',
            weather: 'cloud-rain',
            sky: 'cloud',
            genre: 'theater-masks',
            tone: 'heart',
            plot: 'book',
            characters: 'users',
            protagonist: 'user-tie',
            protagonistAge: 'birthday-cake',
            setting: 'map-marker'
        };
        return icons[category] || 'circle';
    }

    getMainCategoryIcon(category) {
        const icons = {
            character: 'fas fa-user-astronaut',
            landscape: 'fas fa-mountain',
            story: 'fas fa-book-open'
        };
        return icons[category] || 'fas fa-circle';
    }

    formatCategoryName(category) {
        return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    generatePrompt() {
        const options = this.getCategoryOptions()[this.currentCategory];
        let prompt = '';

        // Add loading state
        const generateBtn = document.getElementById('generate-prompt-btn');
        generateBtn.classList.add('btn-loading');

        setTimeout(() => {
            switch (this.currentCategory) {
                case 'character':
                    prompt = this.generateCharacterPrompt(options);
                    break;
                case 'landscape':
                    prompt = this.generateLandscapePrompt(options);
                    break;
                case 'story':
                    prompt = this.generateStoryPrompt(options);
                    break;
            }

            this.displayPrompt(prompt);
            generateBtn.classList.remove('btn-loading');
        }, 500);
    }

    generateCharacterPrompt(options) {
        const selected = this.getSelectedOptions('character');

        const type = selected.type?.length ? this.randomItem(selected.type) : this.randomItem(options.type);
        const status = selected.status?.length ? this.randomItem(selected.status) : this.randomItem(options.status);
        const body = selected.body?.length ? this.randomItem(selected.body) : this.randomItem(options.body);
        const season = selected.season?.length ? this.randomItem(selected.season) : this.randomItem(options.season);
        const accessories = selected.accessories?.length ? this.randomItem(selected.accessories) : this.randomItem(options.accessories);

        const templates = [
            `A ${type} ${status} with ${body.toLowerCase()} during ${season} season, carrying ${accessories.toLowerCase()}`,
            `${season}'s ${type} ${status} marked by ${body.toLowerCase()}, always seen with ${accessories.toLowerCase()}`,
            `The ${status} ${type} whose ${body.toLowerCase()} tells a story, wandering through ${season} with their ${accessories.toLowerCase()}`,
            `A ${type} of ${status} descent, bearing ${body.toLowerCase()}, embracing ${season} while holding ${accessories.toLowerCase()}`
        ];

        return this.randomItem(templates);
    }

    generateLandscapePrompt(options) {
        const selected = this.getSelectedOptions('landscape');

        const aesthetic = selected.aesthetic?.length ? this.randomItem(selected.aesthetic) : this.randomItem(options.aesthetic);
        const climate = selected.climate?.length ? this.randomItem(selected.climate) : this.randomItem(options.climate);
        const timeOfDay = selected.timeOfDay?.length ? this.randomItem(selected.timeOfDay) : this.randomItem(options.timeOfDay);
        const weather = selected.weather?.length ? this.randomItem(selected.weather) : this.randomItem(options.weather);
        const sky = selected.sky?.length ? this.randomItem(selected.sky) : this.randomItem(options.sky);

        const templates = [
            `A ${aesthetic} ${climate} landscape at ${timeOfDay.toLowerCase()} during ${weather.toLowerCase()} weather, under a sky filled with ${sky.toLowerCase()}`,
            `${timeOfDay} in a ${aesthetic} ${climate}, where ${weather.toLowerCase()} weather meets ${sky.toLowerCase()} above`,
            `The ${climate} transformed by ${aesthetic} aesthetic, captured at ${timeOfDay.toLowerCase()} with ${weather.toLowerCase()} conditions and ${sky.toLowerCase()} overhead`,
            `${aesthetic} inspired ${climate} during ${timeOfDay.toLowerCase()}, experiencing ${weather.toLowerCase()} beneath ${sky.toLowerCase()}`
        ];

        return this.randomItem(templates);
    }

    generateStoryPrompt(options) {
        const selected = this.getSelectedOptions('story');

        const genre = selected.genre?.length ? this.randomItem(selected.genre) : this.randomItem(options.genre);
        const tone = selected.tone?.length ? this.randomItem(selected.tone) : this.randomItem(options.tone);
        const plot = selected.plot?.length ? this.randomItem(selected.plot) : this.randomItem(options.plot);
        const characters = selected.characters?.length ? this.randomItem(selected.characters) : this.randomItem(options.characters);
        const protagonist = selected.protagonist?.length ? this.randomItem(selected.protagonist) : this.randomItem(options.protagonist);
        const protagonistAge = selected.protagonistAge?.length ? this.randomItem(selected.protagonistAge) : this.randomItem(options.protagonistAge);
        const setting = selected.setting?.length ? this.randomItem(selected.setting) : this.randomItem(options.setting);

        const templates = [
            `A ${tone} ${genre} story about ${plot.toLowerCase()} featuring ${characters} character${characters !== '1' ? 's' : ''}, centered on a ${protagonistAge} year old ${protagonist.toLowerCase()} in ${setting.toLowerCase()} setting`,
            `${genre} tale with ${tone.toLowerCase()} tones following ${plot.toLowerCase()} through the eyes of a ${protagonistAge} year old ${protagonist.toLowerCase()} in ${setting.toLowerCase()}, involving ${characters} main character${characters !== '1' ? 's' : ''}`,
            `In ${setting.toLowerCase()}, a ${protagonistAge} year old ${protagonist.toLowerCase()} faces ${plot.toLowerCase()} in this ${tone.toLowerCase()} ${genre} story with ${characters} central character${characters !== '1' ? 's' : ''}`,
            `A ${genre} narrative set in ${setting.toLowerCase()} where ${plot.toLowerCase()} unfolds for a ${protagonistAge} year old ${protagonist.toLowerCase()} and ${characters} other${characters !== '1' ? 's' : ' character'}, delivering ${tone.toLowerCase()} emotions`
        ];

        return this.randomItem(templates);
    }

    getSelectedOptions(category) {
        const selected = {};
        this.selectedOptions[category].forEach(key => {
            const [_, optionCategory, value] = key.split('-');
            if (!selected[optionCategory]) {
                selected[optionCategory] = [];
            }
            selected[optionCategory].push(value);
        });
        return selected;
    }

    randomizeAllOptions() {
        const options = this.getCategoryOptions()[this.currentCategory];
        this.selectedOptions[this.currentCategory].clear();

        // Select 1-2 random options from each category
        for (const [category, items] of Object.entries(options)) {
            const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
            const shuffled = [...items].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);

            selected.forEach(item => {
                this.selectedOptions[this.currentCategory].add(`${this.currentCategory}-${category}-${item}`);
            });
        }

        this.loadCategoryOptions();
    }

    displayPrompt(prompt) {
        const promptText = document.getElementById('prompt-text');
        const promptVisual = document.getElementById('prompt-visual');

        // Update prompt text with animation
        promptText.style.opacity = '0';
        setTimeout(() => {
            promptText.textContent = `"${prompt}"`;
            promptText.style.opacity = '1';
        }, 300);

        // Update visual inspiration
        this.updatePromptVisual(prompt);

        // Store current prompt for saving
        this.currentPrompt = prompt;

        // Update complexity (random for variety)
        const complexities = ['Simple', 'Detailed', 'Complex', 'Rich'];
        document.getElementById('current-complexity').textContent = this.randomItem(complexities);
    }

    updatePromptVisual(prompt) {
        const promptVisual = document.getElementById('prompt-visual');
        const words = prompt.split(' ').slice(0, 8);
        const tags = [...new Set(words)].slice(0, 4);

        promptVisual.innerHTML = `
            <div class="visual-content">
                <div class="visual-title">Visual Elements</div>
                <div class="visual-description">
                    Focus on these key aspects in your creation
                </div>
                <div class="visual-tags">
                    ${tags.map(tag => `<span class="visual-tag">${tag.replace(/[.,!?]/g, '')}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Saved Prompts functionality
    loadSavedPrompts() {
        const saved = localStorage.getItem('artisanHubSavedPrompts');
        return saved ? JSON.parse(saved) : [];
    }

    saveToLocalStorage() {
        localStorage.setItem('artisanHubSavedPrompts', JSON.stringify(this.savedPrompts));
    }

    saveCurrentPrompt() {
        if (!this.currentPrompt) {
            this.showNotification('Generate a prompt first!', 'error');
            return;
        }

        const prompt = {
            id: Date.now(),
            text: this.currentPrompt,
            category: this.currentCategory,
            options: Array.from(this.selectedOptions[this.currentCategory]),
            createdAt: new Date().toISOString()
        };

        this.savedPrompts.unshift(prompt);
        if (this.savedPrompts.length > 50) {
            this.savedPrompts = this.savedPrompts.slice(0, 50);
        }

        this.saveToLocalStorage();
        this.loadSavedPromptsPreview();
        this.showNotification('Prompt saved to your collection!', 'success');
    }

    loadSavedPromptsPreview() {
        const container = document.getElementById('saved-prompts-preview');
        const recentPrompts = this.savedPrompts.slice(0, 5); // Show last 5

        if (recentPrompts.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-lightbulb"></i>
                    <p>No prompts saved yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentPrompts.map(prompt => `
            <div class="saved-prompt-preview" onclick="promptGenerator.loadSavedPrompt(${prompt.id})">
                <div class="prompt-text">${prompt.text}</div>
                <div class="saved-prompt-meta">
                    <span>${this.capitalizeFirst(prompt.category)}</span>
                    <span>${new Date(prompt.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    loadSavedPrompt(promptId) {
        const prompt = this.savedPrompts.find(p => p.id === promptId);
        if (!prompt) return;

        this.currentCategory = prompt.category;
        this.selectedOptions[this.currentCategory] = new Set(prompt.options || []);

        document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
        document.querySelector(`.category-card[data-category="${prompt.category}"]`).classList.add('active');

        this.loadCategoryOptions();
        this.displayPrompt(prompt.text);
        this.showNotification('Prompt loaded!', 'success');
    }

    // Utility functions
    randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    copyPromptToClipboard() {
        if (!this.currentPrompt) {
            this.showNotification('No prompt to copy!', 'error');
            return;
        }

        this.copyToClipboard(this.currentPrompt);
        this.showNotification('Prompt copied to clipboard!', 'success');
    }

    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    showNotification(message, type = 'info') {
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

// Initialize the prompt generator when DOM is loaded
let promptGenerator;
document.addEventListener('DOMContentLoaded', () => {
    promptGenerator = new PromptGenerator();
});
