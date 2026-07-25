/**
 * gallery.js - Community Gallery
 * COMPLETE FIXED VERSION - All methods properly defined
 */

class CommunityGallery {
    constructor() {
        this.currentCategory = 'all';
        this.currentPage = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.artworks = [];
        this.lastDoc = null;
        this.artworksPerPage = 12;
        this.currentUser = null;
        this.verifiedOnly = false;
        this.searchQuery = '';
        this.db = null;
        this.initialized = false;
        this.likesSet = new Set();

        // DOM refs
        this.grid = document.getElementById('galleryGrid');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        this.searchInput = document.getElementById('searchInput');
        this.searchClearBtn = document.getElementById('searchClearBtn');

        this.init();
    }

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        await this.waitForFirebase();

        try {
            this.db = firebase.firestore();
        } catch (e) {
            console.error('Firebase init error:', e);
            this.showToast('Failed to initialize Firebase', 'error');
            return;
        }

        this.setupEventListeners();
        this.setupSearch();
        this.setupThemeControls();
        this.setupSidebar();

        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            await this.updateSidebarUser();
            if (!this.artworks.length) {
                await this.loadArtworks();
            }
        });

        if (firebase.auth().currentUser) {
            this.currentUser = firebase.auth().currentUser;
            await this.updateSidebarUser();
            await this.loadArtworks();
        } else {
            await this.loadArtworks();
        }

        console.log('🔮 Gallery initialized');
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                resolve();
            } else {
                const check = setInterval(() => {
                    if (typeof firebase !== 'undefined' && firebase.firestore) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(check);
                    resolve();
                }, 10000);
            }
        });
    }

    // ============================================================
    // CREATE PLACEHOLDER - FIXED (was missing)
    // ============================================================

    createPlaceholder(title) {
        const cleanTitle = encodeURIComponent((title || 'Artwork').substring(0, 20));
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%2312101f'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238A19E1;stop-opacity:0.3'/%3E%3Cstop offset='100%25' style='stop-color:%2358ebfe;stop-opacity:0.1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23g)'/%3E%3Ctext x='200' y='140' font-family='Inter' font-size='48' fill='%238A19E1' text-anchor='middle'%3E🎨%3C/text%3E%3Ctext x='200' y='180' font-family='Inter' font-size='16' fill='%236a6280' text-anchor='middle'%3E${cleanTitle}%3C/text%3E%3Ctext x='200' y='200' font-family='Inter' font-size='12' fill='%234a4258' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;
    }

    // ============================================================
    // LOAD ARTWORKS
    // ============================================================

    async loadArtworks(reset = true) {
        if (this.isLoading) return;
        this.isLoading = true;
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('show');
        }

        try {
            let isAdult = false;
            let isAdmin = false;

            if (this.currentUser) {
                try {
                    const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        isAdult = userData.isAdult || false;
                        isAdmin = userData.role === 'admin' || userData.isAdmin === true;
                    }
                } catch (e) {
                    console.warn('Error checking user status:', e);
                }
            }

            // BUILD QUERY
            let query;

            if (this.currentCategory !== 'all') {
                console.log('📂 Filtering by category:', this.currentCategory);
                query = this.db.collection('artworks')
                    .where('category', '==', this.currentCategory)
                    .where('status', '==', 'published')
                    .orderBy('createdAt', 'desc')
                    .limit(this.artworksPerPage);

                if (!reset && this.lastDoc) {
                    query = query.startAfter(this.lastDoc);
                }
            } else {
                query = this.db.collection('artworks')
                    .where('status', '==', 'published')
                    .orderBy('createdAt', 'desc')
                    .limit(this.artworksPerPage);

                if (!reset && this.lastDoc) {
                    query = query.startAfter(this.lastDoc);
                }
            }

            console.log('🔍 Executing query...');
            const snapshot = await query.get();
            console.log('📦 Query returned', snapshot.size, 'documents');

            if (reset) {
                this.artworks = [];
            }

            const newArtworks = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const isNSFW = data.isNSFW === true || data.nsfwReported === true;

                if (!isAdult && !isAdmin && isNSFW) {
                    continue;
                }

                const artwork = {
                    id: doc.id,
                    ...data,
                    title: data.title || 'Untitled',
                    artistName: data.artistName || 'Anonymous',
                    artistId: data.artistId || data.userId || data.uid || '',
                    likes: data.likes || 0,
                    cheers: data.cheers || 0,
                    views: data.views || 0,
                    category: data.category || 'original',
                    tags: data.tags || [],
                    imageUrl: data.imageUrl || data.imageURL || data.fileUrl || data.downloadURL || '',
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    artistVerified: false
                };

                // Use placeholder if no image
                if (!artwork.imageUrl || artwork.imageUrl === '') {
                    artwork.imageUrl = this.createPlaceholder(artwork.title);
                }

                artwork.artistVerified = await this.checkVerification(artwork.artistId);
                newArtworks.push(artwork);
            }

            this.artworks = reset ? newArtworks : [...this.artworks, ...newArtworks];
            this.hasMore = newArtworks.length === this.artworksPerPage;
            this.lastDoc = snapshot.docs[snapshot.docs.length - 1];

            console.log('📊 Total artworks loaded:', this.artworks.length);
            console.log('📊 Has more:', this.hasMore);

            const display = this.getFilteredArtworks();

            if (display.length === 0 && this.artworks.length === 0) {
                this.renderEmptyState('No artworks found');
            } else if (display.length === 0 && this.artworks.length > 0) {
                this.renderEmptyState('No artworks match your filters');
            } else {
                if (reset) {
                    this.renderGallery(display);
                } else {
                    this.appendGallery(display);
                }
            }

            if (this.loadMoreContainer) {
                this.loadMoreContainer.style.display = this.hasMore && display.length > 0 ? 'block' : 'none';
            }

            await this.updateLikesCount();

        } catch (error) {
            console.error('Error loading artworks:', error);
            console.error('Error details:', error.message);
            console.error('Current category:', this.currentCategory);

            if (error.message && error.message.includes('index')) {
                this.showToast('⚠️ Firestore index required. Check console for link.', 'error');
                this.renderEmptyState('⚠️ Firestore index required. Check console for link.');
            } else {
                this.showToast('Failed to load artworks: ' + error.message, 'error');
                this.renderEmptyState('Error loading artworks: ' + error.message);
            }
        } finally {
            this.isLoading = false;
            if (this.loadingSpinner) {
                this.loadingSpinner.classList.remove('show');
            }
        }
    }

    async checkVerification(artistId) {
        if (!artistId) return false;
        try {
            const doc = await this.db.collection('users').doc(artistId).get();
            if (doc.exists) {
                const data = doc.data();
                return data.isVerified === true || data.role === 'verified' || data.role === 'admin';
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    getFilteredArtworks() {
        let filtered = [...this.artworks];

        if (this.verifiedOnly) {
            filtered = filtered.filter(a => a.artistVerified === true);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                (a.title || '').toLowerCase().includes(query) ||
                (a.artistName || '').toLowerCase().includes(query) ||
                (a.tags || []).some(t => t.toLowerCase().includes(query))
            );
        }

        return filtered;
    }

    // ============================================================
    // RENDER GALLERY
    // ============================================================

    renderGallery(artworks) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (artworks.length === 0) {
            this.renderEmptyState('No artworks found');
            return;
        }

        const fragment = document.createDocumentFragment();
        artworks.forEach(art => {
            const card = this.createCard(art);
            fragment.appendChild(card);
        });

        this.grid.appendChild(fragment);
        this.attachCardEvents();

        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = this.hasMore ? 'block' : 'none';
        }
    }

    appendGallery(artworks) {
        if (!this.grid || artworks.length === 0) return;

        const fragment = document.createDocumentFragment();
        artworks.forEach(art => {
            const card = this.createCard(art);
            fragment.appendChild(card);
        });

        this.grid.appendChild(fragment);
        this.attachCardEvents();

        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = this.hasMore ? 'block' : 'none';
        }
    }

    // ============================================================
    // CREATE CARD - FIXED with proper error handling
    // ============================================================

    createCard(art) {
        try {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.dataset.id = art.id || 'unknown';

            const categoryIcons = {
                daily: '⚡', weekly: '📅', monthly: '🌟',
                yearly: '🏆', original: '🎨', trending: '🔥',
                new: '🆕', 'digital-painting': '🖌️',
                'character-design': '👤', landscape: '🏔️',
                portrait: '👨‍🎨', fantasy: '🐉',
                illustration: '✏️', 'concept-art': '💡',
                animation: '🎬', '3d-art': '🧊'
            };

            const category = art.category || 'original';
            const icon = categoryIcons[category] || '✦';
            const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            const artistName = art.artistName || 'Anonymous';
            const avatar = artistName.charAt(0).toUpperCase() || '?';
            const isLiked = this.currentUser && this.likesSet.has(art.id);

            const verifiedBadge = art.artistVerified ?
                `<span class="verification-badge"><i class="fas fa-shield-alt"></i> Verified</span>` :
                '';

            const tagsHtml = (art.tags || [])
                .slice(0, 3)
                .map(t => `<span class="tag">#${this.escapeHtml(t)}</span>`)
                .join('');

            const editButton = this.currentUser?.uid === art.artistId ?
                `<button class="card-action-btn edit-btn" data-id="${art.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>` :
                '';

            const imageUrl = art.imageUrl || this.createPlaceholder(art.title);
            const isHudMode = document.body.classList.contains('hud-mode');

            card.innerHTML = `
                <div class="card-inner">
                    <span class="category-badge">${icon} ${this.escapeHtml(categoryName)}</span>
                    ${verifiedBadge}

                    <img src="${imageUrl}" alt="${this.escapeHtml(art.title)}"
                         class="card-image" loading="lazy"
                         onerror="this.src='${this.createPlaceholder(art.title)}'">

                    <div class="card-actions">
                        <button class="card-action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${art.id}">
                            <i class="fas fa-heart"></i>
                            <span class="count">${art.likes || 0}</span>
                        </button>
                        <button class="card-action-btn cheer-btn" data-id="${art.id}">
                            <i class="fas fa-glass-cheers"></i>
                            <span class="count">${art.cheers || 0}</span>
                        </button>
                        ${editButton}
                    </div>

                    <div class="card-overlay">
                        <div class="card-hover-info">
                            <div class="card-title">${this.escapeHtml(art.title)}</div>
                            <div class="card-artist" data-artist-id="${art.artistId}">
                                <span class="card-artist-avatar">${avatar}</span>
                                <span>${this.escapeHtml(artistName)}</span>
                            </div>
                            <div class="card-tags">${tagsHtml}</div>
                        </div>
                    </div>

                    ${isHudMode ? `
                        <div class="hud-card-corners">
                            <span class="hud-tl">◤</span>
                            <span class="hud-tr">◥</span>
                            <span class="hud-bl">◣</span>
                            <span class="hud-br">◢</span>
                            <span class="hud-id">${(art.id || 'unknown').slice(0, 6)}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            return card;
        } catch (error) {
            console.error('Error creating card for:', art.title, error);
            // Return a fallback card
            const fallback = document.createElement('div');
            fallback.className = 'gallery-card';
            fallback.innerHTML = `
                <div class="card-inner" style="padding:20px;text-align:center;">
                    <p style="color:var(--text-muted);">Error loading artwork</p>
                </div>
            `;
            return fallback;
        }
    }

    renderEmptyState(message) {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <div class="empty-gallery" style="grid-column:1/-1;padding:60px 24px;text-align:center;">
                <i class="fas fa-palette" style="font-size:3.5rem;color:var(--text-muted);display:block;margin-bottom:16px;"></i>
                <h3 style="color:var(--text-secondary);font-family:var(--font-display);font-size:1.1rem;">${this.escapeHtml(message)}</h3>
                <p style="color:var(--text-muted);font-size:0.85rem;margin-top:8px;">Check back later for new uploads</p>
                ${this.currentUser ? `
                    <button class="top-upload-btn" style="margin-top:1.5rem;padding:0.8rem 2rem;">
                        <i class="fas fa-upload"></i> Upload Artwork
                    </button>
                ` : `
                    <a href="/pages/auth/login.html" class="top-upload-btn" style="display:inline-block;margin-top:1.5rem;padding:0.8rem 2rem;text-decoration:none;">
                        <i class="fas fa-sign-in-alt"></i> Sign In to Upload
                    </a>
                `}
            </div>
        `;

        const uploadBtn = this.grid.querySelector('.top-upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                if (!this.currentUser) {
                    window.location.href = '/pages/auth/login.html';
                    return;
                }
                window.location.href = '/pages/community/upload.html';
            });
        }

        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = 'none';
        }
    }

    // ============================================================
    // EVENT ATTACHMENT
    // ============================================================

    attachCardEvents() {
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await this.handleLike(id, btn);
            });
        });

        document.querySelectorAll('.cheer-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await this.handleCheer(id, btn);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                window.location.href = `/pages/community/edit-artwork.html?id=${id}`;
            });
        });

        document.querySelectorAll('.gallery-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-action-btn') || e.target.closest('.card-artist')) {
                    return;
                }
                const id = card.dataset.id;
                if (id) {
                    window.location.href = `/pages/community/artwork-detail.html?id=${id}`;
                }
            });
        });

        document.querySelectorAll('.card-artist').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const artistId = el.dataset.artistId;
                if (artistId) {
                    window.location.href = `/pages/community/profiles.html?user=${artistId}`;
                }
            });
        });
    }

    // ============================================================
    // LIKE / CHEER
    // ============================================================

    async handleLike(artworkId, btn) {
        if (!this.currentUser) {
            this.showToast('Please login to like', 'error');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            const ref = this.db.collection('artworks').doc(artworkId);
            const likeRef = this.db.collection('likes').doc(`${artworkId}_${this.currentUser.uid}`);
            const likeDoc = await likeRef.get();

            const isLiked = likeDoc.exists;

            if (isLiked) {
                await likeRef.delete();
                await ref.update({ likes: firebase.firestore.FieldValue.increment(-1) });
                btn.classList.remove('liked');
                this.likesSet.delete(artworkId);
            } else {
                await likeRef.set({
                    artworkId,
                    userId: this.currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await ref.update({ likes: firebase.firestore.FieldValue.increment(1) });
                btn.classList.add('liked');
                this.likesSet.add(artworkId);
            }

            const count = btn.querySelector('.count');
            if (count) {
                const current = parseInt(count.textContent) || 0;
                count.textContent = isLiked ? current - 1 : current + 1;
            }

            await this.updateLikesCount();

        } catch (error) {
            console.error('Like error:', error);
            this.showToast('Error processing like', 'error');
        }
    }

    async handleCheer(artworkId, btn) {
        if (!this.currentUser) {
            this.showToast('Please login to cheer', 'error');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            const ref = this.db.collection('artworks').doc(artworkId);
            const cheerRef = this.db.collection('cheers').doc(`${artworkId}_${this.currentUser.uid}`);
            const cheerDoc = await cheerRef.get();

            const isCheered = cheerDoc.exists;

            if (isCheered) {
                await cheerRef.delete();
                await ref.update({ cheers: firebase.firestore.FieldValue.increment(-1) });
            } else {
                await cheerRef.set({
                    artworkId,
                    userId: this.currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await ref.update({ cheers: firebase.firestore.FieldValue.increment(1) });
            }

            const count = btn.querySelector('.count');
            if (count) {
                const current = parseInt(count.textContent) || 0;
                count.textContent = isCheered ? current - 1 : current + 1;
            }

        } catch (error) {
            console.error('Cheer error:', error);
            this.showToast('Error processing cheer', 'error');
        }
    }

    // ============================================================
    // LIKES COUNT
    // ============================================================

    async updateLikesCount() {
        const likesCountEl = document.getElementById('likesCount');
        if (!likesCountEl) return;

        if (!this.currentUser) {
            likesCountEl.textContent = '0';
            likesCountEl.style.display = 'none';
            return;
        }

        try {
            const snapshot = await this.db.collection('likes')
                .where('userId', '==', this.currentUser.uid)
                .get();

            const count = snapshot.size;
            likesCountEl.textContent = count;
            likesCountEl.style.display = count > 0 ? 'inline-block' : 'none';
            this.likesSet = new Set(snapshot.docs.map(d => d.data().artworkId));

        } catch (error) {
            console.error('Error loading likes count:', error);
        }
    }

    // ============================================================
    // SEARCH
    // ============================================================

    setupSearch() {
        if (!this.searchInput) return;

        let timeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.searchQuery = e.target.value.trim();
                if (this.searchClearBtn) {
                    this.searchClearBtn.style.display = this.searchQuery ? 'block' : 'none';
                }
                const filtered = this.getFilteredArtworks();
                this.renderGallery(filtered);
            }, 300);
        });

        if (this.searchClearBtn) {
            this.searchClearBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.searchClearBtn.style.display = 'none';
                const filtered = this.getFilteredArtworks();
                this.renderGallery(filtered);
            });
        }
    }

    // ============================================================
    // SIDEBAR
    // ============================================================

    setupSidebar() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });

            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
            }
        }

        // Messages link
const messagesLink = document.createElement('a');
messagesLink.href = '/pages/community/messages.html';
messagesLink.className = 'sidebar-link';
messagesLink.innerHTML = `
  <i class="fas fa-envelope"></i>
  <span>Messages</span>
  <span class="badge" id="messagesBadge" style="display:none;">0</span>
`;
sidebarNav.appendChild(messagesLink);

        const mobileToggle = document.getElementById('mobileSidebarToggle');
        const overlay = document.getElementById('sidebarOverlay');

        if (mobileToggle && sidebar && overlay) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth().signOut();
                    window.location.href = '/index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }

        const uploadsLink = document.getElementById('sidebarUploads');
        if (uploadsLink) {
            uploadsLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.currentUser) {
                    window.location.href = '/pages/auth/login.html';
                    return;
                }
                window.location.href = '/pages/community/my-uploads.html';
            });
        }

        const notifLink = document.getElementById('sidebarNotifications');
        if (notifLink) {
            notifLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.currentUser) {
                    window.location.href = '/pages/auth/login.html';
                    return;
                }
                window.location.href = '/pages/community/notifications.html';
            });
        }
    }

    async updateSidebarUser() {
        const user = this.currentUser || firebase.auth().currentUser;
        const avatar = document.getElementById('sidebarUserAvatar');
        const name = document.getElementById('sidebarUserName');
        const email = document.getElementById('sidebarUserEmail');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginLink = document.getElementById('sidebarLoginLink');

        if (user) {
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            if (name) name.textContent = displayName;
            if (email) email.textContent = user.email || '';

            try {
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    const profilePic = data.profilePicture || data.photoURL || data.avatarUrl;

                    if (profilePic && avatar) {
                        avatar.innerHTML = `<img src="${profilePic}" alt="${displayName}">`;
                        avatar.style.background = 'transparent';
                    } else if (avatar) {
                        avatar.innerHTML = displayName.charAt(0).toUpperCase();
                        avatar.style.background = 'linear-gradient(135deg, var(--neon-purple), var(--neon-cyan))';
                    }

                    if (data.role === 'admin' || data.isAdmin === true) {
                        avatar.style.border = '2px solid #ffc72e';
                        avatar.style.boxShadow = '0 0 30px rgba(255, 199, 46, 0.3)';
                    }
                }
            } catch (e) {
                console.warn('Error loading profile:', e);
                if (avatar) {
                    avatar.innerHTML = displayName.charAt(0).toUpperCase();
                }
            }

            if (avatar) {
                avatar.style.cursor = 'pointer';
                avatar.onclick = () => {
                    window.location.href = `/pages/community/profiles.html?user=${user.uid}`;
                };
            }

            if (logoutBtn) logoutBtn.style.display = 'flex';
            if (loginLink) loginLink.style.display = 'none';

        } else {
            if (name) name.textContent = 'Guest User';
            if (email) email.textContent = '';
            if (avatar) {
                avatar.innerHTML = '<i class="fas fa-user"></i>';
                avatar.style.background = 'linear-gradient(135deg, var(--neon-purple), var(--neon-cyan))';
                avatar.style.cursor = 'default';
                avatar.onclick = null;
            }
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginLink) loginLink.style.display = 'inline-block';
        }
    }

    // ============================================================
    // THEME CONTROLS
    // ============================================================

    setupThemeControls() {
        const warmBtn = document.getElementById('themeWarm');
        const coolBtn = document.getElementById('themeCool');
        const darkBtn = document.getElementById('themeDark');
        const lightBtn = document.getElementById('themeLight');

        if (warmBtn) {
            warmBtn.addEventListener('click', () => {
                this.setTheme('warm');
                warmBtn.classList.add('active');
                coolBtn?.classList.remove('active');
            });
        }

        if (coolBtn) {
            coolBtn.addEventListener('click', () => {
                this.setTheme('cool');
                coolBtn.classList.add('active');
                warmBtn?.classList.remove('active');
            });
        }

        if (darkBtn) {
            darkBtn.addEventListener('click', () => {
                document.body.classList.remove('light-mode');
                darkBtn.classList.add('active');
                lightBtn?.classList.remove('active');
                this.setTheme('dark');
            });
        }

        if (lightBtn) {
            lightBtn.addEventListener('click', () => {
                document.body.classList.add('light-mode');
                lightBtn.classList.add('active');
                darkBtn?.classList.remove('active');
                this.setTheme('light');
            });
        }

        const hudBtn = document.getElementById('hudToggle');
        if (hudBtn) {
            hudBtn.addEventListener('click', () => {
                document.body.classList.toggle('hud-mode');
                hudBtn.classList.toggle('active');
                const filtered = this.getFilteredArtworks();
                this.renderGallery(filtered);
                this.showToast(document.body.classList.contains('hud-mode') ? '🔮 HUD Mode ON' : 'HUD Mode OFF');
            });
        }

        const scanBtn = document.getElementById('scanlineToggle');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                const overlay = document.querySelector('.scanline-overlay');
                if (overlay) {
                    overlay.classList.toggle('active');
                    scanBtn.classList.toggle('active');
                }
            });
        }

        const gridBtn = document.getElementById('gridToggle');
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                document.body.classList.toggle('grid-mode');
                gridBtn.classList.toggle('active');
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') hudBtn?.click();
            if (e.key === 's' || e.key === 'S') scanBtn?.click();
            if (e.key === 'g' || e.key === 'G') gridBtn?.click();
        });
    }

    setTheme(theme) {
        const bg = document.querySelector('.gradient-bg');
        if (bg) {
            bg.className = 'gradient-bg';
            if (theme === 'cool') bg.classList.add('cool');
        }

        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }

        localStorage.setItem('theme', theme);
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    setupEventListeners() {
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMore());
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, { rootMargin: '200px' });

        const sentinel = document.createElement('div');
        sentinel.style.cssText = 'height:20px;width:100%;visibility:hidden;';
        const container = document.querySelector('.gallery-container');
        if (container) {
            container.appendChild(sentinel);
            observer.observe(sentinel);
        }

        const uploadBtn = document.getElementById('topUploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                if (!this.currentUser) {
                    this.showToast('Please login to upload', 'error');
                    window.location.href = '/pages/auth/login.html';
                    return;
                }
                window.location.href = '/pages/community/upload.html';
            });
        }

        const prompts = [
            'At the Top of the World', 'Breathe', 'Fallen', 'A Thousand Words',
            'Echoes of Silence', 'Uncharted Waters', 'Forgotten Memories',
            'Urban Jungle', 'Mythical Realms', 'Neon Dreams', 'Silent Echo',
            'Golden Hour', 'Midnight Sun', 'Celestial Dreams', 'Cyberpunk Cityscape',
            'Holographic Garden', 'Neon Rebellion', 'Digital Afterlife',
            'Glitch Reality', 'Quantum Dreams', 'Data Stream', 'Cyber Shaman',
            'Void Walker', 'Star Shepherd', 'Chrono Drift'
        ];

        const updatePrompt = () => {
            const p = prompts[Math.floor(Math.random() * prompts.length)];
            const promptText = document.getElementById('randomPromptText');
            const miniText = document.getElementById('miniPromptText');
            if (promptText) promptText.textContent = `"${p}"`;
            if (miniText) miniText.textContent = `"${p}"`;
        };

        const genBtn = document.getElementById('generateRandomPrompt');
        const miniBtn = document.getElementById('miniPromptBtn');

        if (genBtn) genBtn.addEventListener('click', updatePrompt);
        if (miniBtn) miniBtn.addEventListener('click', updatePrompt);
        updatePrompt();
    }

    loadMore() {
        if (this.isLoading || !this.hasMore) return;
        this.currentPage++;
        this.loadArtworks(false);
    }

    // ============================================================
    // UTILITY
    // ============================================================

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toastNotification');
        const msg = document.getElementById('toastMessage');
        if (!toast || !msg) return;

        msg.textContent = message;
        toast.className = 'toast-notification';
        if (type === 'error') toast.classList.add('error');
        toast.classList.add('show');

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new CommunityGallery();
});
