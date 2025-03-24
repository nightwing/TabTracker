/**
 * Main JavaScript file for the Writer's Portfolio website
 * Handles common functionality across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load featured books on the home page
    if (document.getElementById('featured-books')) {
        loadFeaturedBooks();
    }
    
    // Load latest blog posts on the home page
    if (document.getElementById('latest-blog-posts')) {
        loadLatestBlogPosts();
    }
    
    // Load author bio teaser on the home page
    if (document.getElementById('author-bio-teaser')) {
        loadAuthorBioTeaser();
    }
    
    // Handle newsletter form submission
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    // Initialize theme toggle functionality
    initThemeToggle();
});

/**
 * Load and display featured books on the homepage
 */
function loadFeaturedBooks() {
    fetch('data/books.json')
        .then(response => response.json())
        .then(data => {
            // Get featured books (either marked as featured or the latest 3)
            const featuredBooks = data.filter(book => book.featured) || data.slice(0, 3);
            
            const featuredBooksHTML = featuredBooks.map(book => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="book-cover mb-3">
                                <i class="fas fa-book fa-5x text-secondary"></i>
                            </div>
                            <h5 class="card-title">${book.title}</h5>
                            <p class="card-text">${book.summary.substring(0, 100)}...</p>
                            <p class="text-muted">
                                <small>Published: ${book.publishDate}</small><br>
                                <small>Category: ${book.category}</small>
                            </p>
                            <a href="book-detail.html?id=${book.id}" class="btn btn-outline-secondary">Read More</a>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('featured-books').innerHTML = featuredBooksHTML;
        })
        .catch(error => {
            console.error('Error loading featured books:', error);
            document.getElementById('featured-books').innerHTML = 
                '<div class="col-12 text-center"><p class="text-danger">Error loading featured books. Please try again later.</p></div>';
        });
}

/**
 * Load and display latest blog posts on the homepage
 */
function loadLatestBlogPosts() {
    fetch('data/blog-posts.json')
        .then(response => response.json())
        .then(data => {
            // Sort by date (newest first) and get latest 3
            const latestPosts = data
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);
            
            const latestPostsHTML = latestPosts.map(post => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${post.title}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${formatDate(post.date)}</h6>
                            <p class="card-text">${post.excerpt}</p>
                            <a href="blog-post.html?id=${post.id}" class="btn btn-outline-secondary">Read More</a>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('latest-blog-posts').innerHTML = latestPostsHTML;
        })
        .catch(error => {
            console.error('Error loading latest blog posts:', error);
            document.getElementById('latest-blog-posts').innerHTML = 
                '<div class="col-12 text-center"><p class="text-danger">Error loading latest blog posts. Please try again later.</p></div>';
        });
}

/**
 * Load and display author bio teaser on the homepage
 */
function loadAuthorBioTeaser() {
    fetch('data/author.json')
        .then(response => response.json())
        .then(data => {
            document.getElementById('author-bio-teaser').innerHTML = data.shortBio;
        })
        .catch(error => {
            console.error('Error loading author bio:', error);
            document.getElementById('author-bio-teaser').innerHTML = 
                'Error loading author information. Please try again later.';
        });
}

/**
 * Handle newsletter form submission
 * This is client-side only for GitHub Pages
 * @param {Event} e - The submit event
 */
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    
    // Simple email validation
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // In a real app, this would be sent to a server
    // For GitHub Pages, we'll just show a success message
    alert('Thank you for subscribing to our newsletter!');
    e.target.reset();
}

/**
 * Format a date string into a more readable format
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Validate an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Add smooth scrolling to all links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70, // Account for fixed navbar
                behavior: 'smooth'
            });
        }
    });
});

/**
 * Add fade-in animation to elements when they enter the viewport
 * This is applied to all elements with the 'fade-in' class
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add the 'fade-in' class to various elements
    const elementsToAnimate = document.querySelectorAll('.card, .book-cover, .hero-section h1, .hero-section p');
    
    elementsToAnimate.forEach(element => {
        element.classList.add('fade-in');
    });
});

/**
 * Initialize theme toggle functionality
 * This handles switching between light and dark mode
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    const lightModeIcon = document.getElementById('light-mode-icon');
    
    if (!themeToggle) return;
    
    // Check for saved theme preference or use default
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    // Update icons based on current theme
    updateThemeIcons(savedTheme);
    
    // Add click event to toggle button
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        setTheme(newTheme);
        updateThemeIcons(newTheme);
        
        // Save user preference
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * Set the theme for the website
 * @param {string} theme - The theme to set ('light' or 'dark')
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    
    // Update button colors based on theme
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        if (theme === 'light') {
            searchButton.classList.replace('btn-outline-light', 'btn-outline-dark');
        } else {
            searchButton.classList.replace('btn-outline-dark', 'btn-outline-light');
        }
    }
    
    // Update newsletter button if it exists
    const newsletterButton = document.querySelector('#newsletter-form button');
    if (newsletterButton) {
        if (theme === 'light') {
            newsletterButton.classList.replace('btn-outline-light', 'btn-outline-dark');
        } else {
            newsletterButton.classList.replace('btn-outline-dark', 'btn-outline-light');
        }
    }
}

/**
 * Update theme toggle icons based on current theme
 * @param {string} theme - Current theme ('light' or 'dark')
 */
function updateThemeIcons(theme) {
    const darkModeIcon = document.getElementById('dark-mode-icon');
    const lightModeIcon = document.getElementById('light-mode-icon');
    
    if (theme === 'light') {
        darkModeIcon.classList.add('d-none');
        lightModeIcon.classList.remove('d-none');
    } else {
        darkModeIcon.classList.remove('d-none');
        lightModeIcon.classList.add('d-none');
    }
}
