/**
 * Software Comparison Page JavaScript
 * Handles interactive features like button clicks, notifications, and dynamic content
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Software comparison page loaded');

  // Get all "Learn More" buttons
  const compareButtons = document.querySelectorAll('.btn-compare');

  // Software details database with official features page links
  const softwareDetails = {
    'Photoshop': {
      name: 'Adobe Photoshop',
      description: 'Industry-standard for raster graphics editing, digital painting, and photo manipulation.',
      features: ['Advanced brush engine', '3D editing', 'AI-powered tools', 'Cloud storage', 'Neural filters'],
      bestFor: 'Professional illustrators, photographers, and designers',
      featuresPage: 'https://www.adobe.com/products/photoshop/features.html',
      trialLink: 'https://www.adobe.com/products/photoshop/free-trial-download.html'
    },
    'Procreate': {
      name: 'Procreate',
      description: 'Powerful iPad illustration app with an intuitive interface and stunning performance.',
      features: ['Apple Pencil integration', 'Over 200 brushes', '4K canvas support', 'Animation assist', 'ColorDrop'],
      bestFor: 'Digital artists on iPad, illustrators, and sketchers',
      featuresPage: 'https://procreate.com/features',
      trialLink: 'https://procreate.com/handbook'
    },
    'ClipStudio': {
      name: 'Clip Studio Paint',
      description: 'The go-to software for manga, comics, and concept art with specialized tools.',
      features: ['Vector layers', '3D models support', 'Frame border tools', 'Inking stability', 'Screen tone tools'],
      bestFor: 'Manga artists, comic creators, and illustrators',
      featuresPage: 'https://www.clipstudio.net/en/features/',
      trialLink: 'https://www.clipstudio.net/en/trial/'
    },
    'Krita': {
      name: 'Krita',
      description: 'Free and open-source digital painting software loved by concept artists.',
      features: ['Brush stabilizers', 'Wrap-around mode', 'Pop-up palette', 'Animation timeline', 'Resource manager'],
      bestFor: 'Budget-conscious artists, illustrators, and open-source enthusiasts',
      featuresPage: 'https://krita.org/en/features/highlights/',
      trialLink: 'https://krita.org/en/download/'
    },
    'Affinity': {
      name: 'Affinity Photo',
      description: 'Professional photo editing software with one-time purchase model.',
      features: ['Live filters', 'Panorama stitching', 'Focus stacking', 'RAW editing', 'HDR merge'],
      bestFor: 'Photographers and designers seeking Adobe alternative',
      featuresPage: 'https://affinity.serif.com/en-us/photo/features/',
      trialLink: 'https://affinity.serif.com/en-us/photo/trial/'
    }
  };

  // Add click handlers to each button
  compareButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const softwareKey = this.getAttribute('data-soft');

      if (softwareKey && softwareDetails[softwareKey]) {
        showSoftwareModal(softwareDetails[softwareKey]);
      } else {
        // Fallback for any missing data
        showGenericNotification();
      }
    });
  });

  /**
   * Display a modal with detailed software information
   */
  function showSoftwareModal(software) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'software-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 24px;
      max-width: 520px;
      width: 90%;
      padding: 2rem;
      position: relative;
      animation: slideUp 0.3s ease;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
    `;

    modalContent.innerHTML = `
      <button class="modal-close" style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.8rem;
        cursor: pointer;
        color: #999;
        transition: all 0.2s;
        line-height: 1;
      " onmouseover="this.style.color='#fe67ea'" onmouseout="this.style.color='#999'">&times;</button>

      <h2 style="
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #1f2937, #fe67ea);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      ">${software.name}</h2>

      <p style="color: #4b5563; line-height: 1.6; margin: 1rem 0;">
        ${software.description}
      </p>

      <div style="margin: 1.5rem 0;">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">🎯 Best For:</h3>
        <p style="color: #6b7280;">${software.bestFor}</p>
      </div>

      <div style="margin: 1.5rem 0;">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">✨ Key Features:</h3>
        <ul style="list-style: none; padding: 0;">
          ${software.features.map(f => `<li style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #10b981;">✓</span> ${f}</li>`).join('')}
        </ul>
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
        <a href="${software.featuresPage}" target="_blank" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: #fe67ea;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          flex: 1;
          transition: all 0.2s;
          border: 2px solid #fe67ea;
        " onmouseover="this.style.backgroundColor='#fe67ea'; this.style.color='white'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#fe67ea'">
          <i class="fas fa-list"></i> View All Features
        </a>

        <a href="${software.trialLink}" target="_blank" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fe67ea;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          flex: 1;
          transition: all 0.2s;
          border: 2px solid #fe67ea;
        " onmouseover="this.style.backgroundColor='#e237ce'; this.style.borderColor='#e237ce'" onmouseout="this.style.backgroundColor='#fe67ea'; this.style.borderColor='#fe67ea'">
          <i class="fas fa-download"></i> Free Trial / Download
        </a>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal on click outside or close button
    const closeBtn = modalContent.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Add keydown listener for Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * Fallback notification for demo purposes
   */
  function showGenericNotification() {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.textContent = '✨ More details coming soon! Check back for updates.';
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      z-index: 10001;
      animation: slideUp 0.3s ease;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Add animation keyframes dynamically
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styleSheet);

  // Table row hover effect enhancement
  const tableRows = document.querySelectorAll('.comparison-table tbody tr');
  tableRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
      this.style.transition = 'background 0.2s';
      this.style.backgroundColor = 'rgba(254, 103, 234, 0.04)';
    });
    row.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '';
    });
  });

  // Add smooth scroll for any anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
