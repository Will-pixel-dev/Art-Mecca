// Search Users Page
class SearchUsers {
    constructor() {
        this.allUsers = [];
        this.filteredUsers = [];
        this.currentUser = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.shadowingStatus = new Map();
        this.init();
    }

    async init() {
        // Get current user
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            await this.loadUsers();
            this.setupEventListeners();
        });
    }

    async loadUsers() {
        const usersGrid = document.getElementById('usersGrid');
        const resultsCount = document.getElementById('resultsCount');

        try {
            // Get all users from Firestore
            const snapshot = await firebase.firestore().collection('users').get();

            this.allUsers = [];

            for (const doc of snapshot.docs) {
                const userData = doc.data();
                const userId = doc.id;

                // Skip current user
                if (this.currentUser && userId === this.currentUser.uid) continue;

                // Get user stats (artwork count, total likes, etc.)
                const artworksSnapshot = await firebase.firestore()
                    .collection('artworks')
                    .where('artistId', '==', userId)
                    .where('status', '==', 'published')
                    .get();

                const artworks = artworksSnapshot.docs.length;

                // Get shadow count (followers)
                const shadowsSnapshot = await firebase.firestore()
                    .collection('shadows')
                    .where('targetId', '==', userId)
                    .get();
                const shadowCount = shadowsSnapshot.size;

                // Check if current user is shadowing this user
                let isShadowing = false;
                if (this.currentUser) {
                    const shadowCheck = await firebase.firestore()
                        .collection('shadows')
                        .where('shadowerId', '==', this.currentUser.uid)
                        .where('targetId', '==', userId)
                        .get();
                    isShadowing = !shadowCheck.empty;
                    this.shadowingStatus.set(userId, isShadowing);
                }

                this.allUsers.push({
                    id: userId,
                    fullname: userData.fullname || 'Artist',
                    username: userData.username || 'artist',
                    bio: userData.bio || '',
                    avatarUrl: userData.avatarUrl,
                    artworks: artworks,
                    shadows: shadowCount,
                    isShadowing: isShadowing,
                    createdAt: userData.createdAt
                });
            }

            // Apply initial filter
            this.applyFilters();

        } catch (error) {
            console.error('Error loading users:', error);
            usersGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Artists</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
        }
    }

    applyFilters() {
        let filtered = [...this.allUsers];

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.fullname.toLowerCase().includes(query) ||
                user.username.toLowerCase().includes(query) ||
                (user.bio && user.bio.toLowerCase().includes(query))
            );
        }

        // Apply category filter
        switch (this.currentFilter) {
            case 'popular':
                filtered.sort((a, b) => b.shadows - a.shadows);
                break;
            case 'active':
                filtered.sort((a, b) => b.artworks - a.artworks);
                break;
            case 'new':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                // 'all' - alphabetical by name
                filtered.sort((a, b) => a.fullname.localeCompare(b.fullname));
                break;
        }

        this.filteredUsers = filtered;
        this.renderUsers();
    }

   renderUsers() {
    const usersGrid = document.getElementById('usersGrid');
    const resultsCount = document.getElementById('resultsCount');

    resultsCount.textContent = `${this.filteredUsers.length} artist${this.filteredUsers.length !== 1 ? 's' : ''} found`;

    if (this.filteredUsers.length === 0) {
        usersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No Artists Found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }

    usersGrid.innerHTML = this.filteredUsers.map(user => this.createUserCard(user)).join('');

    // Attach event listeners to shadow buttons
    document.querySelectorAll('.shadow-user-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const userId = btn.dataset.userId;
            await this.toggleShadow(userId, btn);
        });
    });

    // Attach click events to user cards - FIXED
    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on shadow button
            if (!e.target.closest('.shadow-user-btn')) {
                const userId = card.dataset.userId;
                if (userId) {
                    window.location.href = `/pages/community/profiles.html?user=${userId}`;
                }
            }
        });
    });
}
createUserCard(user) {
    const avatarBg = user.avatarUrl ? `url(${user.avatarUrl})` : `linear-gradient(135deg, #fe67ea, #63dbee)`;
    const avatarText = user.avatarUrl ? '' : user.fullname.charAt(0).toUpperCase();
    const bio = user.bio && user.bio.length > 80 ? user.bio.substring(0, 80) + '...' : user.bio || 'No bio yet.';
    const shadowBtnText = user.isShadowing ? 'Shadowing' : 'Shadow';
    const shadowBtnClass = user.isShadowing ? 'active' : '';

    return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-card-content">
                <div class="user-info-right">
                    <div class="user-name">${this.escapeHtml(user.fullname)}</div>
                    <div class="user-username">@${user.username}</div>
                    <div class="user-bio">${this.escapeHtml(bio)}</div>
                    <div class="user-stats">
                        <div class="user-stat">
                            <span class="user-stat-value">${user.artworks}</span>
                            <span class="user-stat-label">Artworks</span>
                        </div>
                        <div class="user-stat">
                            <span class="user-stat-value">${user.shadows}</span>
                            <span class="user-stat-label">Shadows</span>
                        </div>
                    </div>
                    <button class="shadow-btn-small ${shadowBtnClass}" data-user-id="${user.id}">
                        <i class="fas fa-eye"></i> ${shadowBtnText}
                    </button>
                </div>
                <div class="user-avatar-right" style="background: ${avatarBg}; background-size: cover; background-position: center;">
                    ${avatarText}
                </div>
            </div>
        </div>
    `;
}
    async toggleShadow(userId, btnElement) {
        if (!this.currentUser) {
            alert('Please login to shadow artists');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        const isCurrentlyShadowing = this.shadowingStatus.get(userId) || false;

        try {
            const shadowsRef = firebase.firestore().collection('shadows');

            if (isCurrentlyShadowing) {
                // Unshadow
                const existing = await shadowsRef
                    .where('shadowerId', '==', this.currentUser.uid)
                    .where('targetId', '==', userId)
                    .get();

                if (!existing.empty) {
                    await existing.docs[0].ref.delete();
                }

                this.shadowingStatus.set(userId, false);
                btnElement.classList.remove('active');
                btnElement.innerHTML = '<i class="fas fa-eye"></i> Shadow';

                // Update shadow count in UI
                const card = btnElement.closest('.user-card');
                const shadowStat = card.querySelector('.user-stat:last-child .user-stat-value');
                if (shadowStat) {
                    const currentCount = parseInt(shadowStat.textContent);
                    shadowStat.textContent = currentCount - 1;
                }

            } else {
                // Add shadow
                const user = this.allUsers.find(u => u.id === userId);
                const shadowerName = this.currentUser.displayName || this.currentUser.email.split('@')[0];

                await shadowsRef.add({
                    shadowerId: this.currentUser.uid,
                    shadowerName: shadowerName,
                    targetId: userId,
                    targetName: user.fullname,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                this.shadowingStatus.set(userId, true);
                btnElement.classList.add('active');
                btnElement.innerHTML = '<i class="fas fa-eye"></i> Shadowing';

                // Update shadow count in UI
                const card = btnElement.closest('.user-card');
                const shadowStat = card.querySelector('.user-stat:last-child .user-stat-value');
                if (shadowStat) {
                    const currentCount = parseInt(shadowStat.textContent);
                    shadowStat.textContent = currentCount + 1;
                }

                // Send notification
                if (typeof authManager !== 'undefined') {
                    await authManager.createNotification(userId, 'shadow', {
                        userId: this.currentUser.uid,
                        userName: shadowerName
                    });
                }
            }

        } catch (error) {
            console.error('Error toggling shadow:', error);
            alert('Error processing request');
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('userSearchInput');
        const searchBtn = document.getElementById('searchUsersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.applyFilters();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchQuery = searchInput.value;
                this.applyFilters();
            });
        }

        // Filter chips
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.dataset.filter;
                this.applyFilters();
            });
        });

        // Enter key search
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchQuery = searchInput.value;
                    this.applyFilters();
                }
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SearchUsers();
});
