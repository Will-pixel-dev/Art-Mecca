/**
 * SEO & Meta Tags Manager
 * Handles dynamic meta tags for all pages
 */

class SEO {
  constructor() {
    this.defaults = {
      title: "Art Mecca - Digital Art Community",
      description:
        "Join thousands of artists sharing tutorials, tools, and artwork. Learn digital painting, character design, and more.",
      image: "/images/og-default.jpg",
      url: window.location.href,
      siteName: "Art Mecca",
      twitterHandle: "@ArtisanHub",
      type: "website",
    };
  }

  /**
   * Set SEO tags for the current page
   * @param {Object} options - SEO options
   * @param {string} options.title - Page title
   * @param {string} options.description - Page description
   * @param {string} options.image - Image URL for social sharing
   * @param {string} options.url - Page URL (optional)
   * @param {string} options.type - og:type (website, article, etc.)
   * @param {string} options.keywords - Meta keywords (optional)
   */
  setPageTags(options) {
    const { title, description, image, url, type, keywords, twitterHandle } = {
      ...this.defaults,
      ...options,
    };

    // Set document title
    document.title = title;

    // Helper to create/update meta tags
    const setMetaTag = (name, content, property = false) => {
      if (!content) return;

      let selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);

      if (!tag) {
        tag = document.createElement("meta");
        if (property) {
          tag.setAttribute("property", name);
        } else {
          tag.setAttribute("name", name);
        }
        document.head.appendChild(tag);
      }

      tag.setAttribute("content", content);
    };

    // Standard Meta Tags
    setMetaTag("description", description);
    if (keywords) setMetaTag("keywords", keywords);

    // Open Graph Tags (Facebook, LinkedIn, etc.)
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", image || this.defaults.image, true);
    setMetaTag("og:url", url || window.location.href, true);
    setMetaTag("og:type", type || "website", true);
    setMetaTag("og:site_name", this.defaults.siteName, true);
    setMetaTag("og:locale", "en_US", true);

    // Twitter Card Tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", image || this.defaults.image);
    setMetaTag("twitter:site", twitterHandle || this.defaults.twitterHandle);

    // Additional SEO
    setMetaTag("robots", "index, follow");
    setMetaTag("viewport", "width=device-width, initial-scale=1.0");

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url || window.location.href);
  }

  /**
   * Set page tags with automatic detection from page content
   * @param {Object} options - Same as setPageTags
   */
  autoSetTags(options = {}) {
    // If title not provided, try to get from h1
    if (!options.title) {
      const h1 = document.querySelector("h1");
      if (h1) {
        options.title = h1.textContent + " | Art Mecca";
      }
    }

    // If description not provided, try to get from first paragraph
    if (!options.description) {
      const p = document.querySelector("p");
      if (p && p.textContent.length > 50) {
        options.description = p.textContent.substring(0, 160);
      }
    }

    // If image not provided, try to find hero image
    if (!options.image) {
      const heroImage = document.querySelector(
        ".hero-image img, .tutorial-image img, .profile-cover img",
      );
      if (heroImage && heroImage.src) {
        options.image = heroImage.src;
      }
    }

    this.setPageTags(options);
  }

  /**
   * Generate schema.org structured data
   * @param {Object} data - Structured data
   */
  setStructuredData(data) {
    // Remove any existing structured data
    const existing = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Set WebSite structured data
   */
  setWebSiteStructuredData() {
    this.setStructuredData({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Art Mecca",
      url: window.location.origin,
      description:
        "Digital art community with tutorials, tools, and resources for artists.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            window.location.origin +
            "/pages/community/gallery.html?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    });
  }

  /**
   * Set Organization structured data
   */
  setOrganizationStructuredData() {
    this.setStructuredData({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Art Mecca",
      url: window.location.origin,
      logo: window.location.origin + "/images/logo.png",
      sameAs: [
        "https://www.youtube.com/@Trulyyours26",
        "https://www.instagram.com/_trulyyours26",
        "https://x.com/TrulyYoursMira",
        "https://www.tiktok.com/@truly_yours26",
        "https://za.pinterest.com/TrulyYours26/",
      ],
    });
  }

  /**
   * Set Article structured data (for blog posts, tutorials, etc.)
   */
  setArticleStructuredData(articleData) {
    const defaultArticle = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: document.title,
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") || "",
      author: {
        "@type": "Person",
        name: "Art Mecca Team",
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": window.location.href,
      },
    };

    this.setStructuredData({ ...defaultArticle, ...articleData });
  }

  /**
   * Set Breadcrumb structured data
   */
  setBreadcrumbStructuredData(items) {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    this.setStructuredData(breadcrumbData);
  }
}

// Create global instance
window.seo = new SEO();

// Auto-set tags on page load
document.addEventListener("DOMContentLoaded", () => {
  // Auto-set basic tags
  window.seo.autoSetTags();

  // Set structured data for website
  window.seo.setWebSiteStructuredData();
  window.seo.setOrganizationStructuredData();
});

// Re-run when dynamic content changes
document.addEventListener("contentLoaded", () => {
  window.seo.autoSetTags();
});
