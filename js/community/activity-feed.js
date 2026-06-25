// Activity Feed - See what artists you shadow are creating
class ActivityFeed {
    constructor() {
        this.currentUser = null;
        this.shadowingList = [];
        this.activities = [];
        this.currentTab = 'all';
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                document.getElementById('authRequired').style.display = 'block';
                document.getElementById('feedContent').style.display = 'none';
                return;
            }

            this.currentUser = user;
            document.getElementById('authRequired').style.display = 'none';
            document.getElementById('feedContent').style.display = 'block';

            await this.loadShadowingList();
            await this.loadActivities();
            this.setupEventListeners();
        });
    }

    async loadShadowingList() {
        try {
            const snapshot = await firebase.firestore()
                .collection('shadows')
                .where('shadowerId', '==', this.currentUser.uid)
                .get();

            this.shadowingList = snapshot.docs.map(doc => ({
                id: doc.data().targetId,
                name: doc.data().targetName
            }));

            console.log(`Shadowing ${this.shadowingList.length} artists`);
        } catch (error) {
            console.error('Error loading shadowing list:', error);
        }
    }

    async loadActivities() {
        const feedList = document.getElementById('feedList');
        feedList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading your feed...</p></div>';

        if (this.shadowingList.length === 0) {
            feedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-eye-slash"></i>
                    <h3>No artists shadowed yet</h3>
                    <p>Start shadowing artists to see their latest creations in your feed!</p>
                    <a href="/pages/community/search-users.html" style="display: inline-block; margin-top: 1rem; background: linear-gradient(135deg, #fe67ea, #63dbee); color: white; padding: 0.6rem 1.5rem; border-radius: 50px; text-decoration: none;">Find Artists to Shadow</a>
                </div>
            `;
            return;
        }

        try {
            const artistIds = this.shadowingList.map(artist => artist.id);

            // Get artworks from shadowed artists
            const artworksSnapshot = await firebase.firestore()
                .collection('artworks')
                .where('artistId', 'in', artistIds)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(30)
                .get();

            this.activities = [];

            for (const doc of artworksSnapshot.docs) {
                const artwork = { id: doc.id, ...doc.data() };
                const artist = this.shadowingList.find(a => a.id === artwork.artistId);

                this.activities.push({
                    id: doc.id,
                    type: 'artwork',
                    artistId: artwork.artistId,
                    artistName: artist?.name || artwork.artistName,
                    title: artwork.title,
                    description: artwork.description,
                    imageUrl: artwork.imageUrl,
                    tags: artwork.tags,
                    timestamp: artwork.createdAt,
                    likes: artwork.likes,
                    cheers: artwork.cheers
                });
            }

            this.renderFeed();

        } catch (error) {
            console.error('Error loading activities:', error);
            feedList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading feed</h3><p>Please refresh the page and try again.</p></div>';
        }
    }

    renderFeed() {
        const feedList = document.getElementById('feedList');

        let filteredActivities = this.activities;
        if (this.currentTab === 'artworks') {
            filteredActivities = this.activities;
        }

        if (filteredActivities.length === 0) {
            feedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No recent activity</h3>
                    <p>Artists you shadow haven't posted anything recently. Check back later!</p>
                </div>
            `;
            return;
        }

        feedList.innerHTML = filteredActivities.map(activity => this.createFeedItem(activity)).join('');

        // Add click handlers for image previews
        document.querySelectorAll('.feed-image-preview').forEach(preview => {
            preview.addEventListener('click', (e) => {
                e.stopPropagation();
                const artworkId = preview.dataset.id;
                window.location.href = `/pages/community/artwork-detail.html?id=${artworkId}`;
            });
        });
    }

    createFeedItem(activity) {
        const timeAgo = this.formatTimeAgo(activity.timestamp);
        const avatarLetter = activity.artistName?.charAt(0).toUpperCase() || 'A';
        const avatarBg = `linear-gradient(135deg, #fe67ea, #63dbee)`;

        return `
            <div class="feed-item" data-id="${activity.id}">
                <div class="feed-avatar" style="background: ${avatarBg}">
                    ${avatarLetter}
                </div>
                <div class="feed-content">
                    <div class="feed-header">
                        <div class="feed-user">
                            <i class="fas fa-user"></i> ${this.escapeHtml(activity.artistName)}
                        </div>
                        <div class="feed-time">
                            <i class="far fa-clock"></i> ${timeAgo}
                        </div>
                    </div>
                    <div class="feed-action">
                        <strong>📢 New Artwork</strong>
                    </div>
                    <div class="feed-title">
                        "${this.escapeHtml(activity.title)}"
                    </div>
                    ${activity.description ? `<div class="feed-description">${this.escapeHtml(activity.description.substring(0, 100))}${activity.description.length > 100 ? '...' : ''}</div>` : ''}
                    ${activity.imageUrl ? `
                        <div class="feed-image-preview" data-id="${activity.id}">
                            <img src="${activity.imageUrl}" alt="${activity.title}" loading="lazy">
                        </div>
                    ` : ''}
                    ${activity.tags && activity.tags.length > 0 ? `
                        <div class="feed-tags">
                            ${activity.tags.slice(0, 3).map(tag => `<span class="feed-tag">#${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="feed-stats" style="display: flex; gap: 1rem; margin-top: 0.8rem; font-size: 0.7rem; color: #9ca3af;">
                        <span><i class="fas fa-heart" style="color: #fe67ea;"></i> ${activity.likes || 0}</span>
                        <span><i class="fas fa-glass-cheers" style="color: #f59e0b;"></i> ${activity.cheers || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.tab;
                this.renderFeed();
            });
        });
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Recently';

        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        const months = Math.floor(days / 30);
        return `${months} month${months === 1 ? '' : 's'} ago`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ActivityFeed();
});
