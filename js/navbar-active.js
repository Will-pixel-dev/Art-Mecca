/**
 * Navbar Active Link Detection & Color-Coded Shadows
 * (Non-blocking - preserves notification functionality)
 */

document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const mainHeader = document.getElementById('main-header');

  const sectionMap = [
    { pattern: '/pages/tutorials/', section: 'tutorials', keywords: ['tutorial', 'character-design', 'color-lighting', 'digital-painting', 'facial-anatomy', 'software-guides', 'workflow'] },
    { pattern: '/pages/software/', section: 'software', keywords: ['software-comparison', 'software-quiz'] },
    { pattern: '/pages/tools/', section: 'tools', keywords: ['tools', 'color-palette-generator', 'color-scheme-analyzer', 'prompt-generator'] },
    { pattern: '/pages/community/', section: 'community', keywords: ['community', 'hub', 'gallery', 'search-users', 'activity-feed', 'challenges', 'analytics'] },
    { pattern: '/pages/Equip/', section: 'equip', keywords: ['equip', 'earn', 'blog', 'portfolio', 'cv'] },
    { pattern: '/pages/truly-yours/', section: 'truly-yours', keywords: ['truly-yours'] },
    { pattern: '/index.html', section: 'home', keywords: ['index'] },
    { pattern: '/', section: 'home', keywords: [] },
    { pattern: '#about', section: 'about', keywords: ['about'] }
  ];

  let activeSection = 'home';

  for (const map of sectionMap) {
    if (currentPath.includes(map.pattern) ||
        (map.keywords && map.keywords.some(keyword => currentPath.toLowerCase().includes(keyword)))) {
      activeSection = map.section;
      break;
    }
  }

  if (currentPath === '/' || currentPath === '/index.html') {
    activeSection = 'home';
  }

  if (mainHeader) {
    const sectionClasses = ['tutorials-active', 'software-active', 'tools-active', 'community-active', 'equip-active', 'home-active'];
    sectionClasses.forEach(cls => mainHeader.classList.remove(cls));
    mainHeader.classList.add(`${activeSection}-active`);
  }

  const allNavLinks = document.querySelectorAll('.nav-link');
  let activeLinkFound = false;

  allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');

    if (href && href !== '#') {
      const isExactMatch = (href === currentPath) ||
                          (currentPath.endsWith(href) && href !== '/') ||
                          (href !== '/' && currentPath.includes(href) && href.length > 3);
      const isHomeMatch = (activeSection === 'home' && (href === '/index.html' || href === '/'));

      if (isExactMatch || isHomeMatch) {
        link.classList.add('active');
        activeLinkFound = true;

        const parentDropdown = link.closest('.nav-dropdown');
        if (parentDropdown) {
          document.querySelectorAll('.nav-dropdown').forEach(dd => dd.classList.remove('active-section'));
          parentDropdown.classList.add('active-section');
        }
      }
    }
  });

  if (!activeLinkFound) {
    const sectionLink = document.querySelector(`.nav-link[data-section="${activeSection}"]`);
    if (sectionLink) {
      sectionLink.classList.add('active');
      const parentDropdown = sectionLink.closest('.nav-dropdown');
      if (parentDropdown) {
        document.querySelectorAll('.nav-dropdown').forEach(dd => dd.classList.remove('active-section'));
        parentDropdown.classList.add('active-section');
      }
    }
  }

  const trulyLink = document.querySelector('.truly-yours-link');
  if (trulyLink && activeSection === 'truly-yours') {
    trulyLink.classList.add('active');
  }

  // Dispatch event that navbar is ready (for notification system)
  window.dispatchEvent(new CustomEvent('navbarReady'));
});

window.addEventListener('popstate', function() {
  const event = new Event('DOMContentLoaded');
  document.dispatchEvent(event);
});
