/**
 * Simple client-side router for the Writer's Portfolio website
 * Handles smooth page transitions and navigation
 */

// Store page cache to avoid re-fetching content
const pageCache = {};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize page transitions
    enableTransitions();
});

/**
 * Enable smooth transitions between pages
 * This is a simple implementation for GitHub Pages
 */
function enableTransitions() {
    // We'll use CSS transitions for smooth effects
    document.body.classList.add('page-transitions-ready');
    
    // For Single Page Applications, we would handle link clicks here
    // But for GitHub Pages, we'll use the default browser navigation
    // and just add some transition effects
    
    // Add transition class when leaving page
    window.addEventListener('beforeunload', function() {
        document.body.classList.add('page-transition-out');
    });
    
    // Add entrance animation when page loads
    document.body.classList.add('page-transition-in');
    setTimeout(function() {
        document.body.classList.remove('page-transition-in');
    }, 300);
}

/**
 * Parse URL parameters for simple routing
 * @returns {Object} - The parsed URL parameters
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Get current page name from URL
 * @returns {string} - The current page name
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop() || 'index.html';
    return pageName.split('.')[0]; // Remove .html extension
}

/**
 * Update browser title based on current page
 * @param {string} title - The title to set
 */
function updatePageTitle(title) {
    const baseTitle = "Writer's Portfolio";
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
}

/**
 * Animate page content on load
 * Adds a subtle fade-in effect to main content
 */
function animatePageContent() {
    const mainContent = document.querySelector('main') || document.querySelector('.container');
    if (mainContent) {
        mainContent.style.opacity = '0';
        setTimeout(() => {
            mainContent.style.transition = 'opacity 0.3s ease-in-out';
            mainContent.style.opacity = '1';
        }, 50);
    }
}

// Run animation on initial page load
document.addEventListener('DOMContentLoaded', animatePageContent);
