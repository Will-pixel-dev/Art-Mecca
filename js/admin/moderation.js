/**
 * Moderation Dashboard
 * Handles reports, NSFW review, and user management
 */

class ModerationDashboard {
    constructor() {
        this.currentUser = null;
        this.isModerator = false;
        this.init();
    }

    async init() {
        // Check authentication
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;

            if (!user) {
                window.location.href = '/pages/auth/login.html';
                return;
            }

            // Check if user is moderator or admin
            await this.checkModeratorStatus(user.uid);

            if (!this.isModerator) {
                alert('Access denied. Moderators only.');
                window.location.href = '/index.html';
                return;
            }

            // Load data
            await this.loadStats();
            await this.loadReports();
            await this.loadNSFWContent();
            await this.loadUsers();
            await this.loadWarnings();

            // Setup tabs
            this.setupTabs();
        });
    }
    // Add to ModerationDashboard class

async resetUserPassword(userId) {
    // Get user's email
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const email = userDoc.data()?.email;

        if (!email) {
            this.showToast('User has no email', 'error');
            return;
        }

        if (!confirm(`Send password reset email to ${email}?`)) return;

        await firebase.auth().sendPasswordResetEmail(email);
        this.showToast(`✅ Password reset email sent to ${email}`);

    } catch (error) {
        console.error('Error resetting password:', error);
        this.showToast('Error sending reset email', 'error');
    }
}

    async checkModeratorStatus(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                this.isModerator = data.role === 'admin' || data.role === 'moderator' || data.isModerator === true;
            }
        } catch (error) {
            console.error('Error checking moderator status:', error);
        }
    }

    async loadStats() {
        try {
            // Pending reports
            const reportsSnapshot = await db.collection('reports')
                .where('status', '==', 'pending')
                .get();
            document.getElementById('pendingReports').textContent = reportsSnapshot.size;

            // Pending NSFW reviews
            const nsfwSnapshot = await db.collection('artworks')
                .where('isNSFW', '==', true)
                .where('nsfwVerified', '==', false)
                .where('status', '==', 'published')
                .get();
            document.getElementById('pendingNSFW').textContent = nsfwSnapshot.size;

            // Approved this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const approvedSnapshot = await db.collection('artworks')
                .where('nsfwVerified', '==', true)
                .where('nsfwModeratedAt', '>=', startOfMonth)
                .get();
            document.getElementById('approvedCount').textContent = approvedSnapshot.size;

            // Total users
            const usersSnapshot = await db.collection('users').get();
            document.getElementById('totalUsers').textContent = usersSnapshot.size;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadReports() {
        const container = document.getElementById('reportsList');
        const countEl = document.getElementById('reportsCount');

        try {
            const snapshot = await db.collection('reports')
                .where('status', '==', 'pending')
                .orderBy('reportedAt', 'desc')
                .get();

            countEl.textContent = snapshot.size;

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="color: #10b981;"></i>
                        <p>All clear! No pending reports.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            for (const doc of snapshot.docs) {
                const report = { id: doc.id, ...doc.data() };

                // Get artwork title
                let artworkTitle = 'Unknown Artwork';
                try {
                    const artDoc = await db.collection('artworks').doc(report.artworkId).get();
                    if (artDoc.exists) {
                        artworkTitle = artDoc.data().title || 'Untitled';
                    }
                } catch (e) {}

                const reportedAt = report.reportedAt?.toDate?.() || new Date();
                const timeAgo = this.formatTimeAgo(reportedAt);

                html += `
                    <div class="report-item" data-report-id="${report.id}">
                        <div class="report-header">
                            <span class="report-reason">🔞 ${report.reason}</span>
                            <span class="report-time">${timeAgo}</span>
                        </div>
                        <div class="report-details">
                            <p><strong>Reported by:</strong> ${report.userName || 'Anonymous'}</p>
                            <p><strong>Artwork:</strong> ${this.escapeHtml(artworkTitle)}</p>
                            <p><strong>Artwork ID:</strong> ${report.artworkId}</p>
                        </div>
                        <div class="report-actions">
                            <button onclick="moderation.approveReport('${report.id}')" class="btn-approve">
                                <i class="fas fa-check"></i> Approve (Take Down)
                            </button>
                            <button onclick="moderation.dismissReport('${report.id}')" class="btn-dismiss">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                            <button onclick="moderation.viewArtwork('${report.artworkId}')" class="btn-view">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button onclick="moderation.warnUser('${report.userId}')" class="btn-warn">
                                <i class="fas fa-exclamation-triangle"></i> Warn User
                            </button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading reports:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <p>Error loading reports. Please refresh.</p>
                </div>
            `;
        }
    }

    async loadNSFWContent() {
        const container = document.getElementById('nsfwList');
        const countEl = document.getElementById('nsfwCount');

        try {
            const snapshot = await db.collection('artworks')
                .where('isNSFW', '==', true)
                .where('nsfwVerified', '==', false)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .get();

            countEl.textContent = snapshot.size;

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="color: #10b981;"></i>
                        <p>No NSFW content pending review.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            for (const doc of snapshot.docs) {
                const artwork = { id: doc.id, ...doc.data() };
                const createdAt = artwork.createdAt?.toDate?.() || new Date();
                const timeAgo = this.formatTimeAgo(createdAt);

                const categoryLabels = {
                    nudity: '🔞 Artistic Nudity',
                    violence: '⚔️ Gore & Violence',
                    mature: '🌙 Mature Themes'
                };
                const category = categoryLabels[artwork.nsfwCategory] || '🔞 NSFW';

                html += `
                    <div class="nsfw-item" data-artwork-id="${artwork.id}">
                        <div class="nsfw-header">
                            <span class="report-reason">${category}</span>
                            <span class="nsfw-time">${timeAgo}</span>
                        </div>
                        <div class="nsfw-details">
                            <p><strong>Title:</strong> ${this.escapeHtml(artwork.title)}</p>
                            <p><strong>Artist:</strong> ${this.escapeHtml(artwork.artistName || 'Unknown')}</p>
                            <p><strong>Description:</strong> ${artwork.description ? this.escapeHtml(artwork.description.substring(0, 100)) : 'No description'}</p>
                        </div>
                        <div class="nsfw-actions">
                            <button onclick="moderation.approveNSFW('${artwork.id}')" class="btn-approve">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button onclick="moderation.rejectNSFW('${artwork.id}')" class="btn-dismiss">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button onclick="moderation.viewArtwork('${artwork.id}')" class="btn-view">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button onclick="moderation.flagNSFW('${artwork.id}')" class="btn-warn">
                                <i class="fas fa-flag"></i> Flag
                            </button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading NSFW content:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <p>Error loading NSFW content. Please refresh.</p>
                </div>
            `;
        }
    }

    async loadUsers() {
        const container = document.getElementById('usersList');
        const countEl = document.getElementById('usersCount');

        try {
            const snapshot = await db.collection('users')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            countEl.textContent = snapshot.size;

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No users found.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            for (const doc of snapshot.docs) {
                const user = { id: doc.id, ...doc.data() };
                const displayName = user.fullname || user.username || 'Unknown User';
                const email = user.email || 'No email';
                const role = user.role || 'user';
                const avatar = displayName.charAt(0).toUpperCase();
                const isVerified = user.isAdult && user.ageVerified;

                const roleClass = role === 'admin' ? 'admin' : role === 'moderator' ? 'moderator' : 'user';
                const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

                html += `
                    <div class="user-item">
                        <div class="user-info">
                            <div class="user-avatar">${avatar}</div>
                            <div>
                                <div class="user-name">${this.escapeHtml(displayName)} ${isVerified ? '✅' : ''}</div>
                                <div class="user-email">${this.escapeHtml(email)}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <span class="user-role ${roleClass}">${roleLabel}</span>
                            ${role === 'user' ? `
                                <button onclick="moderation.makeModerator('${user.id}')" class="btn-view" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                    <i class="fas fa-user-shield"></i> Make Moderator
                                </button>
                            ` : ''}
                            ${role !== 'admin' ? `
                                <button onclick="moderation.warnUser('${user.id}')" class="btn-warn" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                    <i class="fas fa-exclamation-triangle"></i> Warn
                                </button>
                            ` : ''}
                            ${role !== 'admin' ? `
                                <button onclick="moderation.banUser('${user.id}')" class="btn-ban" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                    <i class="fas fa-ban"></i> Ban
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading users:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <p>Error loading users. Please refresh.</p>
                </div>
            `;
        }
    }

    async loadWarnings() {
        const container = document.getElementById('warningsList');
        const countEl = document.getElementById('warningsCount');

        try {
            // Get users with warnings
            const snapshot = await db.collection('users')
                .where('nsfwWarnings', '>', 0)
                .get();

            countEl.textContent = snapshot.size;

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="color: #10b981;"></i>
                        <p>No warnings issued.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            for (const doc of snapshot.docs) {
                const user = { id: doc.id, ...doc.data() };
                const displayName = user.fullname || user.username || 'Unknown User';
                const warnings = user.nsfwWarnings || 0;
                const lastWarning = user.nsfwLastWarning?.toDate?.() || new Date();
                const timeAgo = this.formatTimeAgo(lastWarning);

                html += `
                    <div class="warning-item">
                        <div class="report-header">
                            <span class="warning-user">${this.escapeHtml(displayName)}</span>
                            <span class="warning-time">${timeAgo}</span>
                        </div>
                        <div class="report-details">
                            <p><strong>Warnings:</strong> ${warnings} of 3</p>
                            <p><strong>User ID:</strong> ${user.id}</p>
                            ${warnings >= 3 ? '<p style="color: #ef4444;"><strong>⚠️ Auto-ban threshold reached!</strong></p>' : ''}
                        </div>
                        <div class="report-actions">
                            ${warnings < 3 ? `
                                <button onclick="moderation.warnUser('${user.id}')" class="btn-warn">
                                    <i class="fas fa-exclamation-triangle"></i> Add Warning
                                </button>
                            ` : ''}
                            <button onclick="moderation.clearWarnings('${user.id}')" class="btn-approve">
                                <i class="fas fa-check"></i> Clear Warnings
                            </button>
                            <button onclick="moderation.banUser('${user.id}')" class="btn-ban">
                                <i class="fas fa-ban"></i> Ban User
                            </button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading warnings:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <p>Error loading warnings. Please refresh.</p>
                </div>
            `;
        }
    }

    // ========== MODERATOR ACTIONS ==========

    async approveReport(reportId) {
        if (!confirm('Approve this report? The artwork will be taken down.')) return;

        try {
            const reportRef = db.collection('reports').doc(reportId);
            const report = await reportRef.get();
            const data = report.data();

            // Update report status
            await reportRef.update({
                status: 'approved',
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy: this.currentUser.uid
            });

            // Take down artwork
            await db.collection('artworks').doc(data.artworkId).update({
                status: 'removed',
                removedReason: 'Reported content violation',
                removedAt: firebase.firestore.FieldValue.serverTimestamp(),
                removedBy: this.currentUser.uid
            });

            this.showToast('✅ Report approved and artwork removed');
            this.loadReports();
            this.loadStats();

        } catch (error) {
            console.error('Error approving report:', error);
            this.showToast('Error approving report', 'error');
        }
    }

    async dismissReport(reportId) {
        if (!confirm('Dismiss this report?')) return;

        try {
            await db.collection('reports').doc(reportId).update({
                status: 'dismissed',
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy: this.currentUser.uid
            });

            this.showToast('Report dismissed');
            this.loadReports();
            this.loadStats();

        } catch (error) {
            console.error('Error dismissing report:', error);
            this.showToast('Error dismissing report', 'error');
        }
    }

    async approveNSFW(artworkId) {
        if (!confirm('Approve this NSFW content?')) return;

        try {
            await db.collection('artworks').doc(artworkId).update({
                nsfwVerified: true,
                nsfwStatus: 'approved',
                nsfwModeratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                nsfwModeratorId: this.currentUser.uid
            });

            // Notify artist
            const artwork = await db.collection('artworks').doc(artworkId).get();
            const data = artwork.data();
            if (data.artistId) {
                await authManager.createNotification(data.artistId, 'nsfw_approved', {
                    message: `✅ Your artwork "${data.title}" has been approved for the NSFW gallery.`,
                    artworkId: artworkId
                });
            }

            this.showToast('✅ NSFW content approved');
            this.loadNSFWContent();
            this.loadStats();

        } catch (error) {
            console.error('Error approving NSFW:', error);
            this.showToast('Error approving NSFW', 'error');
        }
    }

    async rejectNSFW(artworkId) {
        const reason = prompt('Reason for rejection:');
        if (reason === null) return;

        try {
            await db.collection('artworks').doc(artworkId).update({
                status: 'rejected',
                nsfwStatus: 'rejected',
                nsfwRejectReason: reason,
                nsfwModeratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                nsfwModeratorId: this.currentUser.uid
            });

            // Notify artist
            const artwork = await db.collection('artworks').doc(artworkId).get();
            const data = artwork.data();
            if (data.artistId) {
                await authManager.createNotification(data.artistId, 'nsfw_rejected', {
                    message: `❌ Your artwork "${data.title}" was rejected from the NSFW gallery. Reason: ${reason}`,
                    artworkId: artworkId
                });
            }

            this.showToast('NSFW content rejected');
            this.loadNSFWContent();
            this.loadStats();

        } catch (error) {
            console.error('Error rejecting NSFW:', error);
            this.showToast('Error rejecting NSFW', 'error');
        }
    }

    async flagNSFW(artworkId) {
        if (!confirm('Flag this NSFW content for review?')) return;

        try {
            await db.collection('artworks').doc(artworkId).update({
                nsfwReported: true,
                nsfwWarnings: firebase.firestore.FieldValue.increment(1),
                nsfwStatus: 'flagged',
                nsfwModeratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                nsfwModeratorId: this.currentUser.uid
            });

            // Notify artist
            const artwork = await db.collection('artworks').doc(artworkId).get();
            const data = artwork.data();
            if (data.artistId) {
                await authManager.createNotification(data.artistId, 'nsfw_flagged', {
                    message: `⚠️ Your artwork "${data.title}" has been flagged for review.`,
                    artworkId: artworkId
                });
            }

            this.showToast('⚠️ NSFW content flagged');
            this.loadNSFWContent();
            this.loadStats();

        } catch (error) {
            console.error('Error flagging NSFW:', error);
            this.showToast('Error flagging NSFW', 'error');
        }
    }

    async warnUser(userId) {
        const reason = prompt('Reason for warning:');
        if (reason === null) return;

        try {
            const userRef = db.collection('users').doc(userId);
            const user = await userRef.get();
            const data = user.data();
            const currentWarnings = data.nsfwWarnings || 0;
            const newWarnings = currentWarnings + 1;

            await userRef.update({
                nsfwWarnings: newWarnings,
                nsfwLastWarning: firebase.firestore.FieldValue.serverTimestamp(),
                nsfwLastWarningReason: reason
            });

            // Notify user
            await authManager.createNotification(userId, 'nsfw_warning', {
                message: `⚠️ You have received a warning (${newWarnings}/3): ${reason}`,
                warnings: newWarnings
            });

            // Auto-ban if 3 warnings
            if (newWarnings >= 3) {
                await userRef.update({
                    status: 'banned',
                    bannedReason: 'Exceeded NSFW warning limit',
                    bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    bannedBy: this.currentUser.uid
                });

                await authManager.createNotification(userId, 'nsfw_banned', {
                    message: '🚫 You have been banned for exceeding the NSFW warning limit.',
                });

                this.showToast('🚫 User banned (3 warnings reached)');
            } else {
                this.showToast(`⚠️ Warning issued (${newWarnings}/3)`);
            }

            this.loadWarnings();
            this.loadUsers();

        } catch (error) {
            console.error('Error warning user:', error);
            this.showToast('Error warning user', 'error');
        }
    }

    async clearWarnings(userId) {
        if (!confirm('Clear all warnings for this user?')) return;

        try {
            await db.collection('users').doc(userId).update({
                nsfwWarnings: 0,
                nsfwLastWarning: null,
                nsfwLastWarningReason: null
            });

            this.showToast('✅ Warnings cleared');
            this.loadWarnings();
            this.loadUsers();

        } catch (error) {
            console.error('Error clearing warnings:', error);
            this.showToast('Error clearing warnings', 'error');
        }
    }

    async makeModerator(userId) {
        if (!confirm('Make this user a moderator?')) return;

        try {
            await db.collection('users').doc(userId).update({
                role: 'moderator',
                isModerator: true
            });

            this.showToast('✅ User is now a moderator');
            this.loadUsers();

        } catch (error) {
            console.error('Error making moderator:', error);
            this.showToast('Error making moderator', 'error');
        }
    }

    async banUser(userId) {
        const reason = prompt('Reason for banning:');
        if (reason === null) return;

        if (!confirm(`Ban this user? Reason: ${reason}`)) return;

        try {
            await db.collection('users').doc(userId).update({
                status: 'banned',
                bannedReason: reason,
                bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                bannedBy: this.currentUser.uid
            });

            await authManager.createNotification(userId, 'nsfw_banned', {
                message: `🚫 You have been banned from Art Mecca. Reason: ${reason}`
            });

            this.showToast('🚫 User banned');
            this.loadUsers();
            this.loadWarnings();

        } catch (error) {
            console.error('Error banning user:', error);
            this.showToast('Error banning user', 'error');
        }
    }

    viewArtwork(artworkId) {
        window.open(`/pages/community/artwork-detail.html?id=${artworkId}`, '_blank');
    }

    // ========== UTILITY ==========

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Hide all tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Show selected tab content
                const tabId = tab.dataset.tab;
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });
    }

    formatTimeAgo(date) {
        if (!date) return 'Recently';
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        return date.toLocaleDateString();
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'toast-notification show';

            const icon = toast.querySelector('i');
            if (icon) {
                icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
                icon.style.color = type === 'success' ? '#10b981' : '#ef4444';
            }

            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        } else {
            alert(message);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize moderation
let moderation;

document.addEventListener('DOMContentLoaded', () => {
    moderation = new ModerationDashboard();
});
