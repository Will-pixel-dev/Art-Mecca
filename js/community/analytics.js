// Analytics Dashboard - Track artwork performance
class AnalyticsDashboard {
    constructor() {
        this.currentUser = null;
        this.artworks = [];
        this.currentPeriod = 'week';
        this.charts = {};
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                document.getElementById('authRequired').style.display = 'block';
                document.getElementById('analyticsContent').style.display = 'none';
                return;
            }

            this.currentUser = user;
            document.getElementById('authRequired').style.display = 'none';
            document.getElementById('analyticsContent').style.display = 'block';

            await this.loadArtworks();
            this.renderStats();
            this.renderTopArtworks();
            this.renderCharts();
            this.setupEventListeners();
        });
    }

    async loadArtworks() {
        try {
            const snapshot = await firebase.firestore()
                .collection('artworks')
                .where('artistId', '==', this.currentUser.uid)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .get();

            this.artworks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
            }));

            console.log(`Loaded ${this.artworks.length} artworks for analytics`);
        } catch (error) {
            console.error('Error loading artworks:', error);
        }
    }

    filterArtworksByPeriod() {
        const now = new Date();
        let startDate;

        switch (this.currentPeriod) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                return this.artworks;
        }

        return this.artworks.filter(art => art.createdAt >= startDate);
    }

    renderStats() {
        const filteredArtworks = this.filterArtworksByPeriod();

        const totalArtworks = filteredArtworks.length;
        const totalLikes = filteredArtworks.reduce((sum, art) => sum + (art.likes || 0), 0);
        const totalCheers = filteredArtworks.reduce((sum, art) => sum + (art.cheers || 0), 0);
        const avgEngagement = totalArtworks > 0 ? Math.round((totalLikes + totalCheers) / totalArtworks) : 0;

        document.getElementById('totalArtworks').textContent = totalArtworks;
        document.getElementById('totalLikes').textContent = totalLikes;
        document.getElementById('totalCheers').textContent = totalCheers;
        document.getElementById('avgEngagement').textContent = avgEngagement;
        document.getElementById('totalEngagement').textContent = totalLikes + totalCheers;
    }

    renderTopArtworks() {
        const container = document.getElementById('topArtworksList');

        if (this.artworks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                    <i class="fas fa-palette"></i>
                    <p>No artworks yet. Upload your first artwork to see analytics!</p>
                </div>
            `;
            return;
        }

        const sortedArtworks = [...this.artworks]
            .sort((a, b) => ((b.likes || 0) + (b.cheers || 0)) - ((a.likes || 0) + (a.cheers || 0)))
            .slice(0, 5);

        container.innerHTML = sortedArtworks.map((art, index) => `
            <div class="top-artwork-item" onclick="window.location.href='/pages/community/artwork-detail.html?id=${art.id}'">
                <div class="artwork-rank">#${index + 1}</div>
                <img src="${art.imageUrl}" alt="${art.title}" class="artwork-img">
                <div class="artwork-info">
                    <div class="artwork-title">${this.escapeHtml(art.title)}</div>
                    <div class="artwork-stats">
                        <span><i class="fas fa-heart" style="color: #fe67ea;"></i> ${art.likes || 0}</span>
                        <span><i class="fas fa-glass-cheers" style="color: #f59e0b;"></i> ${art.cheers || 0}</span>
                    </div>
                </div>
                <div class="artwork-score">${(art.likes || 0) + (art.cheers || 0)} pts</div>
            </div>
        `).join('');
    }

    renderCharts() {
        this.renderEngagementChart();
        this.renderBreakdownChart();
    }

    getTimeSeriesData() {
        const filteredArtworks = this.filterArtworksByPeriod();
        const sortedArtworks = [...filteredArtworks].sort((a, b) => a.createdAt - b.createdAt);

        const dates = [];
        const likesData = [];
        const cheersData = [];

        // Group by date
        const dateMap = new Map();

        sortedArtworks.forEach(art => {
            const dateKey = art.createdAt.toLocaleDateString();
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, { likes: 0, cheers: 0 });
            }
            const entry = dateMap.get(dateKey);
            entry.likes += art.likes || 0;
            entry.cheers += art.cheers || 0;
        });

        for (const [date, data] of dateMap) {
            dates.push(date);
            likesData.push(data.likes);
            cheersData.push(data.cheers);
        }

        return { dates, likesData, cheersData };
    }

    renderEngagementChart() {
        const { dates, likesData, cheersData } = this.getTimeSeriesData();
        const ctx = document.getElementById('engagementChart').getContext('2d');

        if (this.charts.engagement) {
            this.charts.engagement.destroy();
        }

        this.charts.engagement = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Likes',
                        data: likesData,
                        borderColor: '#fe67ea',
                        backgroundColor: 'rgba(254, 103, 234, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: '#fe67ea',
                        pointBorderColor: 'white',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Cheers',
                        data: cheersData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: 'white',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, boxWidth: 8 }
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: 'white',
                        bodyColor: '#c4b8ff',
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0eef2' },
                        ticks: { stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 45 }
                    }
                }
            }
        });
    }

    renderBreakdownChart() {
        const totalLikes = this.artworks.reduce((sum, art) => sum + (art.likes || 0), 0);
        const totalCheers = this.artworks.reduce((sum, art) => sum + (art.cheers || 0), 0);

        const ctx = document.getElementById('breakdownChart').getContext('2d');

        if (this.charts.breakdown) {
            this.charts.breakdown.destroy();
        }

        this.charts.breakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Likes', 'Cheers'],
                datasets: [{
                    data: [totalLikes, totalCheers],
                    backgroundColor: ['#fe67ea', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, boxWidth: 8, padding: 15 }
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: 'white',
                        bodyColor: '#c4b8ff',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    setupEventListeners() {
        const periodBtns = document.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                periodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.renderStats();
                this.renderTopArtworks();
                this.renderCharts();
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
    new AnalyticsDashboard();
});
