// My Uploads Page
class MyUploads {
  constructor() {
    this.artworks = [];
    this.filteredArtworks = [];
    this.currentUser = null;
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.init();
  }

  async init() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        document.getElementById("authCheck").style.display = "block";
        document.getElementById("contentArea").style.display = "none";
        return;
      }

      this.currentUser = user;
      document.getElementById("authCheck").style.display = "none";
      document.getElementById("contentArea").style.display = "block";

      await this.loadArtworks();
      this.setupEventListeners();
    });
  }

  async loadArtworks() {
    const loadingState = document.getElementById("loadingState");
    const artworksGrid = document.getElementById("artworksGrid");

    loadingState.style.display = "block";
    artworksGrid.innerHTML = "";

    try {
      const snapshot = await firebase
        .firestore()
        .collection("artworks")
        .where("artistId", "==", this.currentUser.uid)
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .get();

      this.artworks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.applyFilters();
      this.updateStats();
      this.renderArtworks();
    } catch (error) {
      console.error("Error loading artworks:", error);
      artworksGrid.innerHTML = `
                <div class="empty-state glass-panel">
                    <span class="empty-icon">◈</span>
                    <h3>Error loading artworks</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
    } finally {
      loadingState.style.display = "none";
    }
  }

  applyFilters() {
    let filtered = [...this.artworks];

    // Category filter
    const categoryFilter = document.getElementById("categoryFilter").value;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((art) => art.category === categoryFilter);
    }

    // Search filter
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(
        (art) =>
          art.title?.toLowerCase().includes(searchTerm) ||
          art.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );
    }

    // Sorting
    const sortBy = document.getElementById("sortBy").value;
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => a.createdAt?.toDate?.() - b.createdAt?.toDate?.(),
        );
        break;
      case "mostLikes":
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "mostCheers":
        filtered.sort((a, b) => (b.cheers || 0) - (a.cheers || 0));
        break;
    }

    this.filteredArtworks = filtered;
    this.currentPage = 1;
    this.renderPagination();
  }

  renderArtworks() {
    const artworksGrid = document.getElementById("artworksGrid");
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageArtworks = this.filteredArtworks.slice(start, end);

    if (pageArtworks.length === 0) {
      artworksGrid.innerHTML = `
                <div class="empty-state glass-panel">
                    <span class="empty-icon">◈</span>
                    <h3>No artworks found</h3>
                    <p>${this.artworks.length === 0 ? "You haven't uploaded any artworks yet." : "No artworks match your filters."}</p>
                    <button id="emptyUploadBtn" class="btn btn-primary btn-glow">
                        <span class="btn-icon">✧</span> UPLOAD FIRST ARTWORK
                    </button>
                </div>
            `;
      const emptyBtn = document.getElementById("emptyUploadBtn");
      if (emptyBtn) {
        emptyBtn.addEventListener("click", () => this.redirectToUpload());
      }
      return;
    }

    artworksGrid.innerHTML = pageArtworks
      .map((art) => this.createArtworkCard(art))
      .join("");

    // Attach event listeners
    document.querySelectorAll(".edit-artwork").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        window.location.href = `pages/community/edit-artwork.html?id=${id}`;
      });
    });

    document.querySelectorAll(".delete-artwork").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteArtwork(id);
      });
    });

    document.querySelectorAll(".artwork-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".action-btn")) {
          const id = card.dataset.id;
          window.location.href = `pages/community/artwork-detail.html?id=${id}`;
        }
      });
    });
  }

  createArtworkCard(art) {
    const date = art.createdAt?.toDate
      ? art.createdAt.toDate()
      : new Date(art.createdAt);
    const formattedDate = date.toLocaleDateString();

    return `
            <div class="artwork-card glass-panel" data-id="${art.id}">
                <img src="${art.imageUrl}" alt="${this.escapeHtml(art.title)}" class="artwork-image" loading="lazy">
                <div class="artwork-info">
                    <div class="artwork-title">${this.escapeHtml(art.title)}</div>
                    <div class="artwork-meta">
                        <span>${formattedDate}</span>
                        <div class="artwork-stats">
                            <span class="likes"><i class="fas fa-heart"></i> ${art.likes || 0}</span>
                            <span class="cheers"><i class="fas fa-glass-cheers"></i> ${art.cheers || 0}</span>
                        </div>
                    </div>
                    <div class="artwork-actions">
                        <button class="action-btn edit-btn edit-artwork" data-id="${art.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn delete-artwork" data-id="${art.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  renderPagination() {
    const totalPages = Math.ceil(
      this.filteredArtworks.length / this.itemsPerPage,
    );
    const pagination = document.getElementById("pagination");

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        `<button class="page-btn ${i === this.currentPage ? "active" : ""}" data-page="${i}">${i}</button>`,
      );
    }

    pagination.innerHTML = pages.join("");

    document.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.renderArtworks();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  updateStats() {
    const totalArtworks = this.artworks.length;
    const totalLikes = this.artworks.reduce(
      (sum, art) => sum + (art.likes || 0),
      0,
    );
    const totalCheers = this.artworks.reduce(
      (sum, art) => sum + (art.cheers || 0),
      0,
    );

    document.getElementById("totalArtworks").textContent = totalArtworks;
    document.getElementById("totalLikes").textContent = totalLikes;
    document.getElementById("totalCheers").textContent = totalCheers;
  }

  async deleteArtwork(artworkId) {
    const confirmed = confirm(
      "Are you sure you want to delete this artwork? This action cannot be undone.",
    );
    if (!confirmed) return;

    const artwork = this.artworks.find((a) => a.id === artworkId);

    try {
      // Delete from Storage
      if (artwork.imageUrl) {
        try {
          const storageRef = firebase.storage().refFromURL(artwork.imageUrl);
          await storageRef.delete();
        } catch (err) {
          console.warn("Could not delete from storage:", err);
        }
      }

      // Delete likes
      const likesSnapshot = await firebase
        .firestore()
        .collection("likes")
        .where("artworkId", "==", artworkId)
        .get();
      const likeDeletes = likesSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(likeDeletes);

      // Delete cheers
      const cheersSnapshot = await firebase
        .firestore()
        .collection("cheers")
        .where("artworkId", "==", artworkId)
        .get();
      const cheerDeletes = cheersSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(cheerDeletes);

      // Delete artwork
      await firebase.firestore().collection("artworks").doc(artworkId).delete();

      // Refresh the list
      await this.loadArtworks();
      this.showToast("Artwork deleted successfully!");
    } catch (error) {
      console.error("Error deleting artwork:", error);
      this.showToast("Error deleting artwork: " + error.message, "error");
    }
  }

  setupEventListeners() {
    document.getElementById("categoryFilter").addEventListener("change", () => {
      this.applyFilters();
      this.renderArtworks();
    });

    document.getElementById("sortBy").addEventListener("change", () => {
      this.applyFilters();
      this.renderArtworks();
    });

    document.getElementById("searchInput").addEventListener("input", () => {
      this.applyFilters();
      this.renderArtworks();
    });

    document
      .getElementById("uploadNewBtn")
      .addEventListener("click", () => this.redirectToUpload());
  }

  redirectToUpload() {
    window.location.href = "pages/community/upload.html";
  }

  showToast(message, type = "success") {
    let toast = document.getElementById("toastNotification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toastNotification";
      toast.className = "toast-notification";
      toast.innerHTML =
        '<i class="fas fa-check-circle"></i><span id="toastMessage"></span>';
      document.body.appendChild(toast);
    }
    const toastMessage = document.getElementById("toastMessage");
    toastMessage.textContent = message;

    if (type === "error") {
      toast.style.borderColor = "rgba(255,0,64,0.3)";
      toast.querySelector("i").style.color = "#ff0040";
    } else {
      toast.style.borderColor = "var(--border-color)";
      toast.querySelector("i").style.color = "var(--neon-green)";
    }

    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MyUploads();
});
