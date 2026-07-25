// ============================================================
// HOME HERO — 3 Layer System
// ============================================================

class HomeHero {
    constructor() {
        this.init();
    }

    async init() {
        if (typeof firebase === 'undefined' || typeof db === 'undefined') {
            console.warn('Firebase not ready, retrying...');
            setTimeout(() => this.init(), 1000);
            return;
        }

        // Load hero background if admin
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const doc = await db.collection('users').doc(user.uid).get();
                    if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'moderator')) {
                        this.setupLayerControls();
                    }
                } catch (e) { /* ignore */ }
            }
        });

        this.loadHeroData();
    }

    async loadHeroData() {
        try {
            const doc = await db.collection('siteSettings').doc('hero').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.heroBackground) this.setLayer1Content(data.heroBackground);
                if (data.heroOverlay) this.setLayer2Content(data.heroOverlay);
            }
        } catch (error) {
            console.error('Error loading hero data:', error);
        }
    }

    setLayer1Content(url) {
        const container = document.getElementById('layer1Content');
        if (!container) return;

        if (!url) {
            container.innerHTML = `
                <img src="assets/images/imported/backgroundi/Illustration2.png" alt="Background" class="hero-bg-image" onload="this.classList.add('loaded')" onerror="this.style.display='none'"/>
                <div class="hero-bg-fallback"></div>
            `;
            return;
        }

        const isVideo = url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes('video');
        container.innerHTML = '';

        if (isVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            container.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Background';
            img.className = 'hero-bg-image';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            img.onload = () => img.classList.add('loaded');
            container.appendChild(img);
            const fallback = document.createElement('div');
            fallback.className = 'hero-bg-fallback';
            container.appendChild(fallback);
        }
    }

    setLayer2Content(url) {
        const container = document.getElementById('layer2Content');
        if (!container) return;

        container.innerHTML = '';
        if (!url) {
            container.innerHTML = `
                <div class="neon-orb"></div>
                <div class="grid-overlay"></div>
                <span class="graffiti-tag tag-top-left">✧ FRESH</span>
                <span class="graffiti-tag tag-bottom-right">★ NEON</span>
                <div class="scan-line-hero"></div>
            `;
            return;
        }

        const isVideo = url.match(/\.(mp4|webm|mov|gif)$/i) || url.includes('video');
        if (isVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            container.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Overlay';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
            container.appendChild(img);
        }
    }

    setupLayerControls() {
        // Controls for admin to change background/overlay
        const existing = document.querySelector('.layer-controls-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'layer-controls-container';
        container.innerHTML = `
            <button class="layer-toggle-btn" title="Toggle Layer Controls">
                <i class="fas fa-layer-group"></i>
            </button>
            <div class="layer-controls-wrapper" style="display:none;">
                <div class="layer-control-item" data-layer="layer1">
                    <span class="layer-label">🎨 Background</span>
                    <button class="layer-upload-btn"><i class="fas fa-upload"></i></button>
                    <input type="file" accept="image/*,video/*" style="display:none">
                    <button class="layer-remove-btn" style="display:none"><i class="fas fa-times"></i></button>
                </div>
                <div class="layer-control-item" data-layer="layer2">
                    <span class="layer-label">🖼️ Overlay</span>
                    <button class="layer-upload-btn"><i class="fas fa-upload"></i></button>
                    <input type="file" accept="image/*,video/*" style="display:none">
                    <button class="layer-remove-btn" style="display:none"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Toggle visibility
        const toggleBtn = container.querySelector('.layer-toggle-btn');
        const wrapper = container.querySelector('.layer-controls-wrapper');
        let visible = false;
        toggleBtn.addEventListener('click', () => {
            visible = !visible;
            wrapper.style.display = visible ? 'flex' : 'none';
            toggleBtn.style.background = visible ? 'rgba(254, 103, 234, 0.3)' : 'rgba(0, 0, 0, 0.6)';
        });

        // Upload handlers
        container.querySelectorAll('.layer-control-item').forEach(item => {
            const layer = item.dataset.layer;
            const uploadBtn = item.querySelector('.layer-upload-btn');
            const fileInput = item.querySelector('input[type="file"]');
            const removeBtn = item.querySelector('.layer-remove-btn');

            uploadBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.uploadLayerFile(file, layer);
                }
                fileInput.value = '';
            });

            removeBtn.addEventListener('click', () => this.removeLayerFile(layer));
        });
    }

    async uploadLayerFile(file, layer) {
        const label = layer === 'layer1' ? 'Background' : 'Overlay';
        this.showToast(`Uploading ${label}...`, 'info');

        try {
            const storageRef = firebase.storage().ref();
            const filePath = `hero/home/${layer}/${Date.now()}_${file.name}`;
            const snapshot = await storageRef.child(filePath).put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            const updateData = {};
            if (layer === 'layer1') {
                updateData.heroBackground = downloadURL;
                this.setLayer1Content(downloadURL);
            } else {
                updateData.heroOverlay = downloadURL;
                this.setLayer2Content(downloadURL);
            }

            await db.collection('siteSettings').doc('hero').set(updateData, { merge: true });

            // Show remove button
            const item = document.querySelector(`.layer-control-item[data-layer="${layer}"]`);
            if (item) {
                item.querySelector('.layer-remove-btn').style.display = 'flex';
            }

            this.showToast(`✅ ${label} updated successfully!`);
        } catch (error) {
            console.error('Error uploading:', error);
            this.showToast(`Error uploading ${label}: ${error.message}`, 'error');
        }
    }

    async removeLayerFile(layer) {
        if (!confirm(`Remove ${layer === 'layer1' ? 'background' : 'overlay'}?`)) return;

        try {
            const updateData = {};
            if (layer === 'layer1') {
                updateData.heroBackground = '';
                this.setLayer1Content('');
            } else {
                updateData.heroOverlay = '';
                this.setLayer2Content('');
            }

            await db.collection('siteSettings').doc('hero').set(updateData, { merge: true });

            const item = document.querySelector(`.layer-control-item[data-layer="${layer}"]`);
            if (item) {
                item.querySelector('.layer-remove-btn').style.display = 'none';
            }

            this.showToast(`✅ ${layer === 'layer1' ? 'Background' : 'Overlay'} removed`);
        } catch (error) {
            console.error('Error removing layer:', error);
            this.showToast('Error removing file', 'error');
        }
    }

    showToast(message, type = 'success') {
        let toast = document.getElementById('customToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'customToast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.homeHero = new HomeHero();
    }, 500);
});
