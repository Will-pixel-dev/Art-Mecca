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
    this.artworkId = urlParams.get("id");

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
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const editForm = document.getElementById("editForm");

    try {
      const doc = await firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId)
        .get();

      if (!doc.exists) {
        this.showError();
        return;
      }

      this.artwork = { id: doc.id, ...doc.data() };

      // Check if user owns this artwork
      if (!this.currentUser || this.currentUser.uid !== this.artwork.artistId) {
        this.showToast(
          "You do not have permission to edit this artwork",
          "error",
        );
        setTimeout(() => {
          window.location.href = "pages/community/gallery.html";
        }, 2000);
        return;
      }

      this.renderForm();
      loadingState.style.display = "none";
      editForm.style.display = "block";
    } catch (error) {
      console.error("Error loading artwork:", error);
      this.showError();
    }
  }

  renderForm() {
    // Set form values
    document.getElementById("artTitle").value = this.artwork.title || "";
    document.getElementById("artCategory").value =
      this.artwork.category || "original";
    document.getElementById("artDescription").value =
      this.artwork.description || "";
    document.getElementById("artTags").value = (this.artwork.tags || []).join(
      ", ",
    );

    // Set character count
    const desc = document.getElementById("artDescription");
    document.getElementById("descCount").textContent = desc.value.length;

    // Show preview image
    const previewImg = document.getElementById("previewImg");
    previewImg.src = this.artwork.imageUrl;
    previewImg.alt = this.artwork.title || "Artwork";

    // Setup event listeners
    document
      .getElementById("saveBtn")
      .addEventListener("click", () => this.saveChanges());
    document
      .getElementById("deleteBtn")
      .addEventListener("click", () => this.deleteArtwork());

    // Character count on description
    desc.addEventListener("input", () => {
      const count = desc.value.length;
      document.getElementById("descCount").textContent = count;
      if (count > 500) {
        desc.value = desc.value.substring(0, 500);
        document.getElementById("descCount").textContent = 500;
      }
    });
  }

  async saveChanges() {
    const title = document.getElementById("artTitle").value.trim();
    const category = document.getElementById("artCategory").value;
    const description = document.getElementById("artDescription").value.trim();
    const tagsInput = document.getElementById("artTags").value;

    if (!title) {
      this.showToast("Please enter a title", "error");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const saveBtn = document.getElementById("saveBtn");
    const originalText = saveBtn.innerHTML;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      await firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId)
        .update({
          title: title,
          category: category,
          description: description,
          tags: tags,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      this.showToast("✅ Artwork updated successfully!");
      setTimeout(() => {
        window.location.href = `pages/community/artwork-detail.html?id=${this.artworkId}`;
      }, 1500);
    } catch (error) {
      console.error("Error saving artwork:", error);
      this.showToast("Error saving artwork: " + error.message, "error");
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  async deleteArtwork() {
    const confirmed = confirm(
      "⚠️ Are you sure you want to delete this artwork? This action cannot be undone.",
    );

    if (!confirmed) return;

    const deleteBtn = document.getElementById("deleteBtn");
    const originalText = deleteBtn.innerHTML;

    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
      // Delete from Storage if image exists
      if (this.artwork.imageUrl) {
        try {
          const storageRef = firebase
            .storage()
            .refFromURL(this.artwork.imageUrl);
          await storageRef.delete();
        } catch (storageError) {
          console.warn("Could not delete from storage:", storageError);
        }
      }

      // Delete likes
      const likesSnapshot = await firebase
        .firestore()
        .collection("likes")
        .where("artworkId", "==", this.artworkId)
        .get();
      const likeDeletes = likesSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(likeDeletes);

      // Delete cheers
      const cheersSnapshot = await firebase
        .firestore()
        .collection("cheers")
        .where("artworkId", "==", this.artworkId)
        .get();
      const cheerDeletes = cheersSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(cheerDeletes);

      // Delete the artwork
      await firebase
        .firestore()
        .collection("artworks")
        .doc(this.artworkId)
        .delete();

      this.showToast("✅ Artwork deleted successfully!");
      setTimeout(() => {
        window.location.href = "pages/community/gallery.html";
      }, 1500);
    } catch (error) {
      console.error("Error deleting artwork:", error);
      this.showToast("Error deleting artwork: " + error.message, "error");
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalText;
    }
  }

  showError() {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "block";
  }

  showToast(message, type = "success") {
    let toast = document.getElementById("customToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "customToast";
      toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: var(--bg-card);
                backdrop-filter: blur(20px);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 12px 24px;
                box-shadow: var(--shadow-card), var(--glow-green);
                color: var(--text-primary);
                font-family: var(--font-condensed);
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                opacity: 0;
                pointer-events: none;
                max-width: 90%;
            `;
      document.body.appendChild(toast);
    }

    const icon = toast.querySelector("i") || document.createElement("i");
    if (!toast.querySelector("i")) {
      icon.style.cssText = "font-size: 1.2rem;";
      toast.prepend(icon);
    }

    const span = toast.querySelector("span") || document.createElement("span");
    if (!toast.querySelector("span")) {
      toast.appendChild(span);
    }

    if (type === "error") {
      icon.className = "fas fa-exclamation-circle";
      icon.style.color = "#ef4444";
      toast.style.borderColor = "rgba(239,68,68,0.2)";
    } else {
      icon.className = "fas fa-check-circle";
      icon.style.color = "#10b981";
      toast.style.borderColor = "var(--border-color)";
    }

    span.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new EditArtwork();
});
