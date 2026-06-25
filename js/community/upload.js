/**
 * Upload Page - Handles artwork uploads with NSFW support
 */

class UploadManager {
    constructor() {
        this.selectedFile = null;
        this.tags = [];
        this.isNSFW = false;
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    async init() {
        // Wait for auth
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;

            if (!user) {
                sessionStorage.setItem('redirectAfterLogin', '/pages/community/upload.html');
                window.location.href = '/pages/auth/login.html';
                return;
            }

            await this.loadUserData();
            this.setupEventListeners();
            this.setupDragAndDrop();
            this.setupNSFWToggle();
            this.updateUserPreview();
        });
    }

    async loadUserData() {
        try {
            const doc = await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .get();

            if (doc.exists) {
                this.userData = doc.data();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // File selection
        document.getElementById('browse-btn')?.addEventListener('click', () => {
            document.getElementById('artwork-file').click();
        });

        document.getElementById('artwork-file')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Form submission
        document.getElementById('upload-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Cancel button
        document.getElementById('cancel-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
                window.location.href = '/pages/community/hub.html';
            }
        });

        // Remove preview
        document.getElementById('remove-preview')?.addEventListener('click', () => {
            this.removePreview();
        });

        // Challenge submission toggle
        document.getElementById('submit-to-challenge')?.addEventListener('change', (e) => {
            document.getElementById('challenge-select').style.display =
                e.target.checked ? 'block' : 'none';
        });

        // Tags input
        this.setupTagsInput();

        // Real-time preview updates
        this.setupRealTimePreview();
    }

    // Setup NSFW toggle
    setupNSFWToggle() {
        const nsfwToggle = document.getElementById('is-nsfw');
        const nsfwCategoryGroup = document.getElementById('nsfw-category-group');
        const nsfwContainer = document.querySelector('.nsfw-toggle-container');

        if (!nsfwToggle || !nsfwContainer) return;

        // Check if user is 18+
        const isAdult = this.userData?.isAdult || false;

        if (!isAdult) {
            // User is not verified - show lock message
            nsfwContainer.innerHTML = `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem; text-align: center;">
                    <p style="color: #dc2626; font-weight: 500; margin: 0;">
                        <i class="fas fa-lock"></i> You must verify you are 18+ to upload mature content.
                    </p>
                    <button onclick="window.location.href='/pages/community/profiles.html?user=${this.currentUser.uid}'"
                            style="margin-top: 0.5rem; padding: 0.5rem 1.5rem; background: linear-gradient(135deg, #fe67ea, #63dbee);
                                   color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
                        Verify Age in Profile
                    </button>
                </div>
            `;
            return;
        }

        // User is adult - show NSFW toggle
        nsfwToggle.addEventListener('change', (e) => {
            this.isNSFW = e.target.checked;
            if (nsfwCategoryGroup) {
                nsfwCategoryGroup.style.display = e.target.checked ? 'block' : 'none';
            }
            this.updatePreview();
        });
    }

    // Setup drag and drop
    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    // Handle file selection
    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select an image file (PNG, JPG, WebP)', 'error');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showMessage('File size must be less than 10MB', 'error');
            return;
        }

        this.selectedFile = file;

        // Show preview
        this.showFilePreview(file);

        // Update community preview
        this.updateArtworkPreview(file);
    }

    // Show file preview in upload area
    showFilePreview(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            document.getElementById('preview-img').src = e.target.result;
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-size').textContent = this.formatFileSize(file.size);

            document.getElementById('upload-preview').style.display = 'block';
            document.getElementById('upload-area').style.display = 'none';
        };

        reader.readAsDataURL(file);
    }

    // Remove preview and reset file input
    removePreview() {
        this.selectedFile = null;
        document.getElementById('artwork-file').value = '';
        document.getElementById('upload-preview').style.display = 'none';
        document.getElementById('upload-area').style.display = 'block';

        // Reset community preview artwork
        document.getElementById('artwork-preview').style.display = 'none';
        document.getElementById('artwork-preview-placeholder').style.display = 'flex';
    }

    // Setup tags input functionality
    setupTagsInput() {
        const tagsInput = document.getElementById('tags-input');
        if (!tagsInput) return;

        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                if (tag) {
                    this.addTag(tag);
                    tagsInput.value = '';
                }
            }
        });

        // Tag suggestions
        document.querySelectorAll('.tag-suggestion').forEach(button => {
            button.addEventListener('click', () => {
                this.addTag(button.dataset.tag);
            });
        });
    }

    // Add a tag
    addTag(tagText) {
        if (!tagText) return;
        if (this.tags.length >= 10) {
            this.showMessage('Maximum 10 tags allowed', 'error');
            return;
        }
        if (this.tags.includes(tagText)) {
            this.showMessage('Tag already added', 'error');
            return;
        }

        this.tags.push(tagText);
        this.updateTagsDisplay();
        this.updatePreviewTags();
    }

    // Remove a tag
    removeTag(tagIndex) {
        this.tags.splice(tagIndex, 1);
        this.updateTagsDisplay();
        this.updatePreviewTags();
    }

    // Update tags display
    updateTagsDisplay() {
        const tagsDisplay = document.getElementById('tags-display');
        if (!tagsDisplay) return;

        tagsDisplay.innerHTML = '';

        this.tags.forEach((tag, index) => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <button type="button" class="tag-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            tagsDisplay.appendChild(tagElement);
        });

        tagsDisplay.querySelectorAll('.tag-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.tag-remove').dataset.index);
                this.removeTag(index);
            });
        });
    }

    // Setup real-time preview updates
    setupRealTimePreview() {
        const titleInput = document.getElementById('artwork-title');
        const descriptionInput = document.getElementById('artwork-description');

        titleInput?.addEventListener('input', () => {
            document.getElementById('preview-title').textContent =
                titleInput.value || 'Artwork Title';
        });

        descriptionInput?.addEventListener('input', () => {
            document.getElementById('preview-description').textContent =
                descriptionInput.value || 'Artwork description will appear here...';
        });
    }

    // Update preview tags
    updatePreviewTags() {
        const previewTags = document.getElementById('preview-tags');
        if (!previewTags) return;

        previewTags.innerHTML = '';
        this.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            previewTags.appendChild(tagElement);
        });
    }

    // Update artwork preview in community preview
    updateArtworkPreview(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const previewImg = document.getElementById('artwork-preview');
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            document.getElementById('artwork-preview-placeholder').style.display = 'none';
        };

        reader.readAsDataURL(file);
    }

    // Update user preview
    updateUserPreview() {
        if (this.currentUser) {
            const username = this.currentUser.displayName ||
                            this.currentUser.email?.split('@')[0] || 'User';
            const avatar = username.charAt(0).toUpperCase();

            document.getElementById('preview-username').textContent = username;
            document.getElementById('preview-avatar').textContent = avatar;
        }
    }

    // Update preview with NSFW badge
    updatePreview() {
        this.updateUserPreview();
        this.updatePreviewTags();
        this.updateNSFWPreview();
    }

    // Add NSFW badge to community preview
    updateNSFWPreview() {
        const previewContent = document.querySelector('.preview-content');
        const existingBadge = document.querySelector('.nsfw-preview-badge');

        if (existingBadge) existingBadge.remove();

        if (this.isNSFW) {
            const badge = document.createElement('div');
            badge.className = 'nsfw-preview-badge';
            badge.style.cssText = `
                display: inline-block;
                background: #ef4444;
                color: white;
                padding: 2px 10px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 8px;
            `;
            badge.textContent = '🔞 Mature Content';

            const titleElement = document.getElementById('preview-title');
            if (titleElement && previewContent) {
                previewContent.insertBefore(badge, titleElement);
            }
        }
    }

    // Handle form submission
    async handleSubmit() {
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;

        try {
            // Validate form
            if (!this.selectedFile) {
                throw new Error('Please select an artwork file');
            }

            const title = document.getElementById('artwork-title').value.trim();
            if (!title) {
                throw new Error('Please enter a title for your artwork');
            }

            // Get NSFW data
            const isNSFW = document.getElementById('is-nsfw')?.checked || false;
            const nsfwCategory = document.getElementById('nsfw-category')?.value || 'mature';

            // If NSFW is checked, validate category
            if (isNSFW && !nsfwCategory) {
                throw new Error('Please select an NSFW category');
            }

            // Get form data
            const artworkData = {
                file: this.selectedFile,
                title: title,
                description: document.getElementById('artwork-description').value.trim(),
                category: document.getElementById('artwork-category').value || 'other',
                software: document.getElementById('artwork-software').value || '',
                tags: this.tags,
                challenge: document.getElementById('submit-to-challenge')?.checked ?
                         document.getElementById('selected-challenge')?.value : null,
                isNSFW: isNSFW,
                nsfwCategory: isNSFW ? nsfwCategory : null
            };

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            submitBtn.classList.add('uploading');

            // Upload artwork
            const result = await this.uploadArtwork(artworkData);

            // Success
            this.showMessage('Artwork uploaded successfully! 🎉', 'success');

            // Redirect after delay
            setTimeout(() => {
                window.location.href = `/pages/community/gallery.html?uploaded=${result.artworkId}`;
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove('uploading');
        }
    }

    // Upload artwork to Firebase
    async uploadArtwork(artworkData) {
        if (!this.currentUser) {
            throw new Error('Please login to upload artwork');
        }

        try {
            // Compress image
            const compressedFile = await this.compressImage(artworkData.file);

            // Upload to Firebase Storage
            const storageRef = firebase.storage().ref();
            const filePath = `artworks/${this.currentUser.uid}/${Date.now()}_${artworkData.file.name}`;
            const uploadTask = storageRef.child(filePath).put(compressedFile);

            const snapshot = await uploadTask;
            const downloadURL = await snapshot.ref.getDownloadURL();

            // Prepare artwork data for Firestore
            const artwork = {
                title: artworkData.title,
                description: artworkData.description || '',
                imageUrl: downloadURL,
                category: artworkData.category || 'other',
                software: artworkData.software || '',
                tags: artworkData.tags || [],
                artistId: this.currentUser.uid,
                artistName: this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'Artist',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: 0,
                cheers: 0,
                comments: [],
                status: 'published',
                isNSFW: artworkData.isNSFW || false,
                nsfwCategory: artworkData.nsfwCategory || null,
                nsfwReported: false,
                nsfwWarnings: 0
            };

            // Add challenge data if submitted
            if (artworkData.challenge) {
                artwork.challenge = artworkData.challenge;
                artwork.challengeSubmitted = firebase.firestore.FieldValue.serverTimestamp();
            }

            // Save to Firestore
            const docRef = await firebase.firestore()
                .collection('artworks')
                .add(artwork);

            return {
                success: true,
                artworkId: docRef.id,
                artwork: artwork
            };

        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(error.message || 'Failed to upload artwork');
        }
    }

    // Compress image before upload
    compressImage(file, maxWidth = 1200, quality = 0.85) {
        if (file.size < 500 * 1024) {
            return Promise.resolve(file);
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        const ratio = maxWidth / width;
                        width = maxWidth;
                        height = height * ratio;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Image compression failed'));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show toast message
    showMessage(message, type) {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'toast-notification show';
            if (type === 'error') {
                toast.style.borderLeft = '4px solid #ef4444';
            } else {
                toast.style.borderLeft = '4px solid #10b981';
            }

            setTimeout(() => {
                toast.classList.remove('show');
            }, 5000);
        } else {
            alert(message);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.uploadManager = new UploadManager();
});
