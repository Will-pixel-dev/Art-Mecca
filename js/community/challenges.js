// Challenges System
class ChallengesSystem {
    constructor() {
        this.currentUser = null;
        this.challenges = [];
        this.userChallenges = new Set(); // Track which challenges user joined
        this.currentType = 'all';
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            await this.loadChallenges();
            await this.loadUserChallenges();
            this.renderChallenges();
            this.setupEventListeners();
        });
    }

    async loadChallenges() {
        // Static challenge data (in production, this would come from Firestore)
        this.challenges = [
            {
                id: 'daily-1',
                type: 'daily',
                title: 'Morning Sketch',
                description: 'Create a quick morning sketch to start your day. Anything that represents morning energy!',
                prompt: 'Draw something that represents morning - sunrise, coffee, waking up, etc.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                prize: '100 Community Points',
                participants: 47,
                submissions: 32,
                icon: '🌅'
            },
            {
                id: 'daily-2',
                type: 'daily',
                title: 'Color of the Day: Pink',
                description: 'Create an artwork where pink is the dominant color.',
                prompt: 'Use pink as your main color scheme.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                prize: '100 Community Points',
                participants: 38,
                submissions: 25,
                icon: '💗'
            },
            {
                id: 'weekly-1',
                type: 'weekly',
                title: 'Urban Jungle',
                description: 'Blend city architecture with natural elements. Think vines on skyscrapers or tree roots breaking through pavement.',
                prompt: 'Create a scene where nature meets city life.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                prize: 'Featured Artist Spot + 500 Points',
                participants: 156,
                submissions: 89,
                icon: '🏙️🌿'
            },
            {
                id: 'weekly-2',
                type: 'weekly',
                title: 'Fantasy Character',
                description: 'Design an original fantasy character with a unique backstory.',
                prompt: 'Create a character that could live in a magical world.',
                startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
                prize: '500 Points + Digital Art Brush Set',
                participants: 112,
                submissions: 67,
                icon: '🧙'
            },
            {
                id: 'monthly-1',
                type: 'monthly',
                title: 'Mythical Realms',
                description: 'Take a classic mythical creature and give it a fresh, unexpected twist.',
                prompt: 'Reimagine a mythical creature in a modern or unexpected setting.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                prize: '$100 Gift Card + Premium Membership + Featured Exhibition',
                participants: 423,
                submissions: 245,
                icon: '🐉'
            },
            {
                id: 'yearly-1',
                type: 'yearly',
                title: 'Metamorphosis',
                description: 'Document transformation through 12 themed chapters - one for each month.',
                prompt: 'Create a series showing personal or artistic growth over time.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                prize: '$5,000 + Solo Exhibition + Mentorship Program',
                participants: 1289,
                submissions: 567,
                icon: '🦋'
            }
        ];
    }

    async loadUserChallenges() {
        if (!this.currentUser) return;

        try {
            const snapshot = await firebase.firestore()
                .collection('userChallenges')
                .where('userId', '==', this.currentUser.uid)
                .get();

            snapshot.forEach(doc => {
                this.userChallenges.add(doc.data().challengeId);
            });
        } catch (error) {
            console.error('Error loading user challenges:', error);
        }
    }

    async joinChallenge(challengeId) {
        if (!this.currentUser) {
            alert('Please login to join challenges');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            await firebase.firestore().collection('userChallenges').add({
                userId: this.currentUser.uid,
                challengeId: challengeId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });

            this.userChallenges.add(challengeId);

            // Update participant count in UI
            const challenge = this.challenges.find(c => c.id === challengeId);
            if (challenge) {
                challenge.participants++;
                this.renderChallenges();
            }

            alert('Successfully joined the challenge! Start creating! 🎨');
        } catch (error) {
            console.error('Error joining challenge:', error);
            alert('Error joining challenge. Please try again.');
        }
    }

    renderChallenges() {
        const grid = document.getElementById('challengesGrid');

        let filteredChallenges = this.challenges;

        if (this.currentType === 'my') {
            filteredChallenges = this.challenges.filter(c => this.userChallenges.has(c.id));
        } else if (this.currentType !== 'all') {
            filteredChallenges = this.challenges.filter(c => c.type === this.currentType);
        }

        if (filteredChallenges.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-trophy"></i>
                    <h3>No challenges found</h3>
                    <p>${this.currentType === 'my' ? "You haven't joined any challenges yet." : "No challenges available in this category."}</p>
                    ${this.currentType === 'my' ? '<a href="/pages/community/challenges.html" style="display: inline-block; margin-top: 1rem; background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; padding: 0.6rem 1.5rem; border-radius: 50px; text-decoration: none;">Browse Challenges</a>' : ''}
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredChallenges.map(challenge => this.createChallengeCard(challenge)).join('');

        // Attach join button listeners
        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const challengeId = btn.dataset.id;
                if (!btn.classList.contains('active')) {
                    this.joinChallenge(challengeId);
                }
            });
        });
    }

    createChallengeCard(challenge) {
        const isJoined = this.userChallenges.has(challenge.id);
        const timeLeft = this.getTimeLeft(challenge.endDate);
        const typeClass = `type-${challenge.type}`;
        const typeName = challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1);

        return `
            <div class="challenge-card">
                <div class="challenge-header">
                    <div class="challenge-icon">${challenge.icon}</div>
                    <span class="challenge-type ${typeClass}">${typeName}</span>
                </div>
                <div class="challenge-content">
                    <h3 class="challenge-title">${this.escapeHtml(challenge.title)}</h3>
                    <p class="challenge-description">${this.escapeHtml(challenge.description)}</p>

                    <div class="challenge-stats">
                        <div class="stat">
                            <span class="stat-value">${challenge.participants}</span>
                            <span class="stat-label">Participants</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${challenge.submissions}</span>
                            <span class="stat-label">Submissions</span>
                        </div>
                    </div>

                    <div class="time-left">
                        <i class="far fa-hourglass"></i> Time left: <span>${timeLeft}</span>
                    </div>

                    <div class="prize-badge">
                        <i class="fas fa-gift"></i>
                        <span>${challenge.prize}</span>
                    </div>

                    <button class="join-btn ${isJoined ? 'active' : ''}" data-id="${challenge.id}" ${isJoined ? 'disabled' : ''}>
                        ${isJoined ? '✓ Joined' : 'Join Challenge'}
                    </button>
                </div>
            </div>
        `;
    }

    getTimeLeft(endDate) {
        const now = new Date();
        const diff = endDate - now;

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (86400000)) / (1000 * 60 * 60));

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return 'Less than an hour';
    }

    setupEventListeners() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentType = btn.dataset.type;
                this.renderChallenges();
            });
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChallengesSystem();
});
