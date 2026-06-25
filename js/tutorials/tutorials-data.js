// Central tutorial database with navigation relationships
class TutorialData {
    constructor() {
        this.tutorials = new Map();
        this.categories = new Map();
        this.init();
    }

    init() {
        this.loadTutorials();
        this.buildCategories();
    }

    loadTutorials() {
        // FACIAL FEATURES TUTORIALS
        this.tutorials.set('facial-anatomy-basics', {
            id: 'facial-anatomy-basics',
            title: 'Facial Anatomy Basics',
            description: 'Understand the fundamental structure of the human face',
            category: 'facial-features',
            difficulty: 'beginner',
            duration: 15,
            image: '../../images/tutorials/facial-anatomy.jpg',
            file: '../../pages/tutorials/facial-features/facial-anatomy-basics.html',
            nextTutorial: 'nose-rendering-tutorial',
            prevTutorial: null,
            relatedTutorials: ['nose-rendering-tutorial', 'eye-render-tutorial'],
            author: 'Dr. Kenji Tanaka',
            date: '2023-02-15',
            tags: ['facial', 'anatomy', 'basics', 'structure', 'foundation']
        });

        this.tutorials.set('nose-rendering-tutorial', {
            id: 'nose-rendering-tutorial',
            title: 'Nose Anatomy & Rendering',
            description: 'Complete guide to nose anatomy and rendering techniques',
            category: 'facial-features',
            difficulty: 'beginner',
            duration: 20,
            image: '../../images/tutorials/nose-hero.jpg',
            file: '../../pages/tutorials/facial-features/nose-rendering-tutorial.html',
            nextTutorial: 'eye-render-tutorial',
            prevTutorial: 'facial-anatomy-basics',
            relatedTutorials: ['eye-render-tutorial', 'lip-rendering-tutorial', 'facial-anatomy-basics'],
            author: 'Maria Rodriguez',
            date: '2023-03-22',
            tags: ['nose', 'anatomy', 'rendering', 'face', 'structure']
        });

        this.tutorials.set('eye-render-tutorial', {
            id: 'eye-render-tutorial',
            title: 'How I Render Eyes: A Step-by-Step Guide',
            description: 'Learn my process for creating realistic, expressive eyes in digital painting',
            category: 'facial-features',
            difficulty: 'intermediate',
            duration: 25,
            image: '../../images/tutorials/eyes-hero.jpg',
            file: '../../pages/tutorials/facial-features/eye-render-tutorial.html',
            nextTutorial: 'lip-rendering-tutorial',
            prevTutorial: 'nose-rendering-tutorial',
            relatedTutorials: ['nose-rendering-tutorial', 'lip-rendering-tutorial', 'skin-rendering-tutorial'],
            author: 'Alex Chen',
            date: '2023-04-10',
            tags: ['eyes', 'rendering', 'digital painting', 'facial features', 'anatomy']
        });

        this.tutorials.set('lip-rendering-tutorial', {
            id: 'lip-rendering-tutorial',
            title: 'Lip Rendering Techniques',
            description: 'Learn to render realistic lips with proper texture and lighting',
            category: 'facial-features',
            difficulty: 'intermediate',
            duration: 18,
            image: '../../images/tutorials/lips-hero.jpg',
            file: '../../pages/tutorials/facial-features/lip-rendering-tutorial.html',
            nextTutorial: 'skin-rendering-tutorial',
            prevTutorial: 'eye-render-tutorial',
            relatedTutorials: ['eye-render-tutorial', 'nose-rendering-tutorial', 'skin-rendering-tutorial'],
            author: 'Sarah Johnson',
            date: '2023-06-08',
            tags: ['lips', 'rendering', 'texture', 'lighting', 'mouth']
        });

        this.tutorials.set('skin-rendering-tutorial', {
            id: 'skin-rendering-tutorial',
            title: 'Skin Texture & Rendering',
            description: 'Master skin rendering with pores, subsurface scattering and textures',
            category: 'facial-features',
            difficulty: 'advanced',
            duration: 40,
            image: '../../images/tutorials/skin-hero.jpg',
            file: '../../pages/tutorials/facial-features/skin-rendering-tutorial.html',
            nextTutorial: 'facial-expressions',
            prevTutorial: 'lip-rendering-tutorial',
            relatedTutorials: ['eye-render-tutorial', 'lip-rendering-tutorial', 'facial-expressions'],
            author: 'Dr. Kenji Tanaka',
            date: '2023-07-12',
            tags: ['skin', 'texture', 'rendering', 'pores', 'subsurface scattering']
        });

        this.tutorials.set('facial-expressions', {
            id: 'facial-expressions',
            title: 'Mastering Facial Expressions',
            description: 'Learn to create realistic and emotional facial expressions',
            category: 'facial-features',
            difficulty: 'intermediate',
            duration: 35,
            image: '../../images/tutorials/facial-expressions.jpg',
            file: '../../pages/tutorials/facial-features/facial-expressions.html',
            nextTutorial: 'character-design',
            prevTutorial: 'skin-rendering-tutorial',
            relatedTutorials: ['skin-rendering-tutorial', 'character-design'],
            author: 'Alex Chen',
            date: '2023-09-20',
            tags: ['facial', 'expressions', 'emotion', 'realistic']
        });

        // Add the rest of your tutorials here (character design, digital painting, etc.)
        // ... (keep all your other tutorial definitions)

        // Example for character design tutorial
        this.tutorials.set('character-design', {
            id: 'character-design',
            title: 'Character Design Fundamentals',
            description: 'Learn the basics of creating compelling and unique character designs',
            category: 'character-design',
            difficulty: 'beginner',
            duration: 25,
            image: '../../images/tutorials/character-design.jpg',
            file: '../../pages/tutorials/character-design/character-design.html',
            nextTutorial: 'creature-design',
            prevTutorial: 'facial-expressions',
            relatedTutorials: ['facial-expressions', 'shape-language', 'silhouette-design'],
            author: 'Maria Rodriguez',
            date: '2023-10-15',
            tags: ['character', 'design', 'fundamentals', 'creativity']
        });
    }

    buildCategories() {
        // Build category relationships
        this.categories.set('facial-features', {
            name: 'Facial Features',
            tutorials: [
                'facial-anatomy-basics',
                'nose-rendering-tutorial',
                'eye-render-tutorial',
                'lip-rendering-tutorial',
                'skin-rendering-tutorial',
                'facial-expressions'
            ],
            description: 'Master the art of rendering realistic facial features',
            icon: 'fas fa-eye',
            color: '#f705d7'
        });

        // Add the rest of your categories here
        // ... (keep all your other category definitions)
    }

    // Get tutorial by ID
    getTutorial(id) {
        return this.tutorials.get(id);
    }

    // Get next tutorial in sequence
    getNextTutorial(currentTutorialId) {
        const current = this.tutorials.get(currentTutorialId);
        if (!current || !current.nextTutorial) return null;
        return this.tutorials.get(current.nextTutorial);
    }

    // Get previous tutorial in sequence
    getPrevTutorial(currentTutorialId) {
        const current = this.tutorials.get(currentTutorialId);
        if (!current || !current.prevTutorial) return null;
        return this.tutorials.get(current.prevTutorial);
    }

    // Get related tutorials
    getRelatedTutorials(currentTutorialId, limit = 3) {
        const current = this.tutorials.get(currentTutorialId);
        if (!current) return [];

        return current.relatedTutorials
            .map(id => this.tutorials.get(id))
            .filter(tutorial => tutorial !== undefined)
            .slice(0, limit);
    }

    // Get tutorials by category
    getTutorialsByCategory(categoryId) {
        const category = this.categories.get(categoryId);
        if (!category) return [];

        return category.tutorials
            .map(id => this.tutorials.get(id))
            .filter(tutorial => tutorial !== undefined);
    }

    // Get all tutorials for the landing page
    getAllTutorials() {
        return Array.from(this.tutorials.values());
    }

    // Get featured tutorials
    getFeaturedTutorials(limit = 6) {
        const featuredIds = [
            'eye-render-tutorial',
            'character-design',
            'digital-painting',
            'skin-rendering-tutorial',
            'lighting-masterclass',
            'software-comparison'
        ];

        return featuredIds
            .map(id => this.tutorials.get(id))
            .filter(tutorial => tutorial !== undefined)
            .slice(0, limit);
    }

    // Search tutorials
    searchTutorials(query) {
        const searchTerms = query.toLowerCase().split(' ');
        return this.getAllTutorials().filter(tutorial => {
            const searchableText = `
                ${tutorial.title}
                ${tutorial.description}
                ${tutorial.tags.join(' ')}
                ${tutorial.category}
                ${tutorial.author}
            `.toLowerCase();

            return searchTerms.some(term => searchableText.includes(term));
        });
    }

    // Get tutorials by difficulty
    getTutorialsByDifficulty(difficulty) {
        return this.getAllTutorials().filter(tutorial =>
            tutorial.difficulty === difficulty
        );
    }

    // Get tutorials by duration range
    getTutorialsByDuration(min, max) {
        return this.getAllTutorials().filter(tutorial =>
            tutorial.duration >= min && tutorial.duration <= max
        );
    }
}

// Create global instance
window.tutorialData = new TutorialData();
