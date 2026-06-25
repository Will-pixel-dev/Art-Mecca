/**
 * Advanced Lazy Loading with Intersection Observer
 * Loads images only when they enter the viewport
 */

class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }

    // Create observer
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          this.observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before image enters viewport
      threshold: 0.01
    });

    // Start observing all images with data-src
    this.observeImages();
  }

  observeImages() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.observer.observe(img);
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // Create a new image to preload
    const preloadImg = new Image();
    preloadImg.onload = () => {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    };
    preloadImg.onerror = () => {
      // If image fails to load, show placeholder
      img.src = '/images/placeholder.jpg';
      img.removeAttribute('data-src');
    };
    preloadImg.src = src;
  }

  // Re-observe new images added to DOM
  refresh() {
    this.observeImages();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.lazyLoader = new LazyLoader();
});

// Re-run when new content is loaded dynamically
document.addEventListener('newContentLoaded', () => {
  if (window.lazyLoader) {
    window.lazyLoader.refresh();
  }
});
