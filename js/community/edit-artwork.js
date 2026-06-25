// Edit Artwork Page
class EditArtwork {
    constructor() {
        this.artworkId = null;
        this.artwork = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Get artwork ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.artworkId = urlParams.get('id');

        if (!this.artworkId) {
            this.showError();
            return;
        }

        // Listen for auth state
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            await this.loadArtwork();
        });
    }

    async loadArtwork() {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const editForm = document.getElementById('editForm');

        try {
            const doc = await firebase.firestore().collection('artworks').doc(this.artworkId).get();

            if (!doc.exists) {
                this.showError();
                return;
            }

            this.artwork = { id: doc.id, ...doc.data() };

            // Check if user owns this artwork
            if (!this.currentUser || this.currentUser.uid !== this.artwork.artistId) {
                alert('You do not have permission to edit this artwork');
                window.location.href = '/pages/community/gallery.html';
                return;
            }

            this.renderForm();
            loadingState.style.display = 'none';
            editForm.style.display = 'block';

        } catch (error) {
            console.error('Error loading artwork:', error);
            this.showError();
        }
    }

    renderForm() {
        // Set form values
        document.getElementById('artTitle').value = this.artwork.title || '';
        document.getElementById('artCategory').value = this.artwork.category || 'original';
        document.getElementById('artDescription').value = this.artwork.description || '';
        document.getElementById('artTags').value = (this.artwork.tags || []).join(', ');

        // Show preview image
        const previewContainer = document.getElementById('previewImage');
        previewContainer.innerHTML = `<img src="${this.artwork.imageUrl}" alt="${this.artwork.title}">`;

        // Setup event listeners
        document.getElementById('saveBtn').addEventListener('click', () => this.saveChanges());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteArtwork());
    }

    async saveChanges() {
        const title = document.getElementById('artTitle').value.trim();
        const category = document.getElementById('artCategory').value;
        const description = document.getElementById('artDescription').value.trim();
        const tagsInput = document.getElementById('artTags').value;

        if (!title) {
            alert('Please enter a title');
            return;
        }

        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.innerHTML;

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            await firebase.firestore().collection('artworks').doc(this.artworkId).update({
                title: title,
                category: category,
                description: description,
                tags: tags,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Artwork updated successfully!');
            window.location.href = `/pages/community/artwork-detail.html?id=${this.artworkId}`;

        } catch (error) {
            console.error('Error saving artwork:', error);
            alert('Error saving artwork: ' + error.message);
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    async deleteArtwork() {
        const confirmed = confirm('Are you sure you want to delete this artwork? This action cannot be undone.');

        if (!confirmed) return;

        const deleteBtn = document.getElementById('deleteBtn');
        const originalText = deleteBtn.innerHTML;

        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        try {
            // Delete from Storage if image exists
            if (this.artwork.imageUrl) {
                try {
                    const storageRef = firebase.storage().refFromURL(this.artwork.imageUrl);
                    await storageRef.delete();
                } catch (storageError) {
                    console.warn('Could not delete from storage:', storageError);
                }
            }

            // Delete likes
            const likesSnapshot = await firebase.firestore()
                .collection('likes')
                .where('artworkId', '==', this.artworkId)
                .get();
            const likeDeletes = likesSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(likeDeletes);

            // Delete cheers
            const cheersSnapshot = await firebase.firestore()
                .collection('cheers')
                .where('artworkId', '==', this.artworkId)
                .get();
            const cheerDeletes = cheersSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(cheerDeletes);

            // Delete the artwork
            await firebase.firestore().collection('artworks').doc(this.artworkId).delete();

            alert('Artwork deleted successfully!');
            window.location.href = '/pages/community/gallery.html';

        } catch (error) {
            console.error('Error deleting artwork:', error);
            alert('Error deleting artwork: ' + error.message);
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalText;
        }
    }

    showError() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new EditArtwork();
});
