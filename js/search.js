// search.js - Complete Working Version with Artists & Artworks
class SearchEngine {
    constructor() {
        this.searchData = [];
        this.init();
    }

    async init() {
        await this.loadSearchData();
        await this.loadArtistsToSearch();   // ✅ Added - loads artists from Firestore
        await this.loadArtworksToSearch();  // ✅ Added - loads artworks from Firestore
        this.setupSearchListeners();
        console.log('Search engine initialized with artists and artworks!');
    }

    async loadSearchData() {
        // TUTORIALS - Static data
        this.searchData = [
            // Eye Rendering Tutorials
            {
                id: 'eye-basics',
                title: 'Eye Rendering Basics',
                type: 'tutorial',
                category: 'eyes',
                description: 'Learn fundamental eye rendering techniques for digital art',
                tags: ['eyes', 'rendering', 'basics', 'digital painting', 'anatomy'],
                url: '/pages/tutorials/eye-render-tutorial.html',
                difficulty: 'beginner'
            },
            {
                id: 'eye-advanced',
                title: 'Advanced Eye Rendering',
                type: 'tutorial',
                category: 'eyes',
                description: 'Master advanced eye rendering with realistic reflections and textures',
                tags: ['eyes', 'advanced', 'realistic', 'reflections', 'textures'],
                url: '/pages/tutorials/advanced-eye-rendering.html',
                difficulty: 'advanced'
            },
            // Nose Tutorials
            {
                id: 'nose-basics',
                title: 'Nose Anatomy & Rendering',
                type: 'tutorial',
                category: 'nose',
                description: 'Complete guide to nose anatomy and rendering techniques',
                tags: ['nose', 'anatomy', 'rendering', 'face', 'structure'],
                url: '/pages/tutorials/nose-rendering-tutorial.html',
                difficulty: 'beginner'
            },
            // Lip Tutorials
            {
                id: 'lips-basics',
                title: 'Lip Rendering Techniques',
                type: 'tutorial',
                category: 'lips',
                description: 'Learn to render realistic lips with proper texture and lighting',
                tags: ['lips', 'rendering', 'texture', 'lighting', 'mouth'],
                url: '/pages/tutorials/lip-rendering-tutorial.html',
                difficulty: 'intermediate'
            },
            // Skin Tutorials
            {
                id: 'skin-rendering',
                title: 'Skin Texture & Rendering',
                type: 'tutorial',
                category: 'skin',
                description: 'Master skin rendering with pores, subsurface scattering and textures',
                tags: ['skin', 'texture', 'rendering', 'pores', 'subsurface scattering'],
                url: '/pages/tutorials/skin-rendering-tutorial.html',
                difficulty: 'advanced'
            },
            // Facial Anatomy
            {
                id: 'facial-anatomy',
                title: 'Facial Anatomy Basics',
                type: 'tutorial',
                category: 'facial-features',
                description: 'Learn the fundamental structure of the human face',
                tags: ['anatomy', 'face', 'proportions', 'facial features'],
                url: '/pages/tutorials/facial-anatomy-basics.html',
                difficulty: 'beginner'
            },
            // Character Design
            {
                id: 'character-design',
                title: 'Character Design Fundamentals',
                type: 'tutorial',
                category: 'character',
                description: 'Learn to create compelling characters that tell a story',
                tags: ['character', 'design', 'sketching', 'concept art'],
                url: '/pages/tutorials/character-design.html',
                difficulty: 'intermediate'
            },
            // Digital Painting
            {
                id: 'digital-painting',
                title: 'Digital Painting Fundamentals',
                type: 'tutorial',
                category: 'digital-painting',
                description: 'Essential techniques for creating stunning digital artwork',
                tags: ['digital painting', 'brushes', 'layers', 'blending'],
                url: '/pages/tutorials/digital-painting.html',
                difficulty: 'intermediate'
            },

            // TOOLS
            {
                id: 'color-palette',
                title: 'Color Palette Generator',
                type: 'tool',
                category: 'color-tools',
                description: 'Generate beautiful color palettes for your artwork',
                tags: ['color', 'palette', 'generator', 'tools', 'design'],
                url: '/pages/tools/color-palette-generator.html'
            },
            {
                id: 'color-analyzer',
                title: 'Color Scheme Analyzer',
                type: 'tool',
                category: 'color-tools',
                description: 'Analyze and improve your color schemes for better harmony',
                tags: ['color', 'analyzer', 'scheme', 'harmony', 'tools'],
                url: '/pages/tools/color-scheme-analyzer.html'
            },
            {
                id: 'prompt-generator',
                title: 'Character Prompt Generator',
                type: 'tool',
                category: 'prompt-tools',
                description: 'Get inspired with random character creation prompts',
                tags: ['character', 'prompt', 'generator', 'inspiration', 'tools'],
                url: '/pages/tools/prompt-generator.html'
            },
            {
                id: 'software-quiz',
                title: 'Software Quiz',
                type: 'tool',
                category: 'quiz',
                description: 'Find your perfect digital art software',
                tags: ['quiz', 'software', 'recommendation', 'tools'],
                url: '/pages/tools/software-quiz.html'
            },

            // COMMUNITY
            {
                id: 'community-hub',
                title: 'Community Hub',
                type: 'community',
                category: 'hub',
                description: 'Connect with other artists in our community hub',
                tags: ['community', 'hub', 'social', 'networking', 'artists'],
                url: '/pages/community/hub.html'
            },
            {
                id: 'gallery',
                title: 'Community Gallery',
                type: 'community',
                category: 'gallery',
                description: 'Browse artwork from our community members',
                tags: ['gallery', 'community', 'artwork', 'portfolio', 'showcase'],
                url: '/pages/community/gallery.html'
            },
            {
                id: 'search-artists',
                title: 'Find Artists',
                type: 'community',
                category: 'search',
                description: 'Discover and connect with talented artists',
                tags: ['artists', 'search', 'discover', 'community'],
                url: '/pages/community/search-users.html'
            },

            // SOFTWARE
            {
                id: 'software-comparison',
                title: 'Digital Art Software Comparison',
                type: 'software',
                category: 'software-guides',
                description: 'Compare Photoshop, Procreate, Clip Studio Paint and more',
                tags: ['software', 'comparison', 'photoshop', 'procreate', 'clip studio'],
                url: '/pages/software/software-comparison.html'
            },

            // TRULY YOURS
            {
                id: 'truly-yours',
                title: 'Truly Yours Project',
                type: 'project',
                category: 'truly-yours',
                description: 'Discover the Truly Yours collaborative art project',
                tags: ['truly yours', 'project', 'collaborative', 'community', 'art'],
                url: '/pages/truly-yours/truly-yours-project.html'
            },

            // EQUIP
            {
                id: 'equip',
                title: 'Equip for Artists',
                type: 'resource',
                category: 'equip',
                description: 'Portfolio templates, CV templates, and career resources',
                tags: ['portfolio', 'cv', 'career', 'templates', 'resources'],
                url: '/pages/Equip/Equip.html'
            }
        ];
    }

    // ARTISTS (from Firestore - dynamically loaded)
    async loadArtistsToSearch() {
        try {
            // Wait for auth to be ready
            const snapshot = await firebase.firestore().collection('users').get();

            snapshot.forEach(doc => {
                const userData = doc.data();
                this.searchData.push({
                    id: doc.id,
                    title: userData.fullname || 'Artist',
                    type: 'artist',
                    category: 'artist',
                    description: userData.bio || 'Check out this artist\'s portfolio',
                    tags: ['artist', 'profile', userData.username, userData.fullname],
                    url: `/pages/community/profiles.html?user=${doc.id}`,
                    avatar: userData.avatarUrl
                });
            });
            console.log(`Loaded ${snapshot.size} artists to search`);
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    }

    // ARTWORKS (from Firestore - dynamically loaded)
    async loadArtworksToSearch() {
        try {
            const snapshot = await firebase.firestore()
                .collection('artworks')
                .where('status', '==', 'published')
                .limit(50)
                .get();

            snapshot.forEach(doc => {
                const artwork = doc.data();
                this.searchData.push({
                    id: doc.id,
                    title: artwork.title,
                    type: 'artwork',
                    category: 'artwork',
                    description: artwork.description || 'View this artwork',
                    tags: artwork.tags || [],
                    url: `/pages/community/artwork-detail.html?id=${doc.id}`,
                    imageUrl: artwork.imageUrl
                });
            });
            console.log(`Loaded ${snapshot.size} artworks to search`);
        } catch (error) {
            console.error('Error loading artworks:', error);
        }
    }

    setupSearchListeners() {
        const searchInput = document.getElementById('search-input');
        const searchClose = document.getElementById('search-close');
        const searchOverlay = document.getElementById('search-overlay');

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        if (searchClose && searchOverlay) {
            searchClose.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
                this.showPlaceholder();
            });
        }

        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    searchOverlay.classList.remove('active');
                    this.showPlaceholder();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
                searchOverlay.classList.remove('active');
                this.showPlaceholder();
            }
        });
    }

    performSearch(query) {
        if (!query.trim()) {
            this.showPlaceholder();
            return;
        }

        const results = this.searchContent(query);
        this.displayResults(results, query);
    }

    searchContent(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        if (searchTerms.length === 0) return [];

        return this.searchData.filter(item => {
            const searchableText = `
                ${item.title} ${item.description} ${item.tags.join(' ')}
                ${item.type} ${item.category} ${item.difficulty || ''}
            `.toLowerCase();

            return searchTerms.some(term => searchableText.includes(term));
        }).sort((a, b) => {
            const scoreA = this.calculateScore(a, searchTerms);
            const scoreB = this.calculateScore(b, searchTerms);
            return scoreB - scoreA;
        });
    }

    calculateScore(item, searchTerms) {
        let score = 0;
        const title = item.title.toLowerCase();
        const description = item.description.toLowerCase();
        const tags = item.tags.join(' ').toLowerCase();

        searchTerms.forEach(term => {
            if (title === term) score += 20;
            else if (title.includes(term)) score += 10;
            if (tags.includes(term)) score += 5;
            if (description.includes(term)) score += 3;
            if (item.type?.toLowerCase().includes(term)) score += 2;
            if (item.category?.toLowerCase().includes(term)) score += 2;
            if (item.difficulty && item.difficulty.toLowerCase().includes(term)) score += 3;
        });
        return score;
    }

    displayResults(results, query) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = this.getNoResultsHTML(query);
            return;
        }

        searchResults.innerHTML = this.getResultsHTML(results, query);
    }

    getResultsHTML(results, query) {
        const groupedResults = this.groupResultsByType(results);
        return `
            <div class="search-results-header">
                <h3>Search Results for "${query}"</h3>
                <span class="results-count">${results.length} results found</span>
            </div>
            ${this.getGroupedResultsHTML(groupedResults)}
        `;
    }

    groupResultsByType(results) {
        const groups = {
            tutorial: { title: '📚 Tutorials', items: [] },
            tool: { title: '🛠️ Tools', items: [] },
            community: { title: '👥 Community', items: [] },
            software: { title: '💻 Software', items: [] },
            project: { title: '🎨 Projects', items: [] },
            resource: { title: '📄 Resources', items: [] },
            artist: { title: '👤 Artists', items: [] },
            artwork: { title: '🖼️ Artworks', items: [] }
        };

        results.forEach(item => {
            if (groups[item.type]) {
                groups[item.type].items.push(item);
            }
        });

        return Object.entries(groups)
            .filter(([_, group]) => group.items.length > 0)
            .reduce((acc, [key, group]) => {
                acc[key] = group;
                return acc;
            }, {});
    }

    getGroupedResultsHTML(groupedResults) {
        return Object.entries(groupedResults).map(([type, group]) => `
            <div class="results-group" data-type="${type}">
                <h4 class="group-title">${group.title}</h4>
                <div class="group-results">
                    ${group.items.map(item => this.getResultItemHTML(item)).join('')}
                </div>
            </div>
        `).join('');
    }

    getResultItemHTML(item) {
        const difficultyBadge = item.difficulty ?
            `<span class="difficulty-badge ${item.difficulty}">${item.difficulty}</span>` : '';

        return `
            <div class="search-result-item" data-type="${item.type}">
                <div class="result-content">
                    <div class="result-type-badge">${this.getTypeIcon(item.type)}</div>
                    <div class="result-details">
                        <div class="result-header">
                            <h4 class="result-title">
                                <a href="${item.url}" onclick="closeSearch()">${this.escapeHtml(item.title)}</a>
                            </h4>
                            ${difficultyBadge}
                        </div>
                        <p class="result-description">${this.escapeHtml(item.description)}</p>
                        <div class="result-meta">
                            <span class="result-category">${this.formatCategory(item.category)}</span>
                            <div class="result-tags">
                                ${item.tags.slice(0, 3).map(tag => `<span class="result-tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            'tutorial': '📚',
            'tool': '🛠️',
            'software': '💻',
            'community': '👥',
            'project': '🎨',
            'resource': '📄',
            'artist': '👤',
            'artwork': '🖼️'
        };
        return icons[type] || '📄';
    }

    formatCategory(category) {
        if (!category) return 'General';
        return category.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getNoResultsHTML(query) {
        return `
            <div class="search-no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No results found for "${query}"</h3>
                <p>Try adjusting your search terms or browse our categories:</p>
                <div class="search-suggestions">
                    <a href="/pages/tutorials/tutorials.html" class="suggestion-link" onclick="closeSearch()">Tutorials</a>
                    <a href="/pages/tools/tools.html" class="suggestion-link" onclick="closeSearch()">Tools</a>
                    <a href="/pages/community/gallery.html" class="suggestion-link" onclick="closeSearch()">Gallery</a>
                    <a href="/pages/community/search-users.html" class="suggestion-link" onclick="closeSearch()">Find Artists</a>
                </div>
            </div>
        `;
    }

    showPlaceholder() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <p>Type to search for tutorials, tools, artists, or artworks</p>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

function closeSearch() {
    const searchOverlay = document.getElementById('search-overlay');
    if (searchOverlay) {
        searchOverlay.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SearchEngine();
});
