/**
 * Search functionality for the Writer's Portfolio website
 * Handles searching through books, blog posts, and other content
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get search form elements
    const searchForm = document.querySelector('form.d-flex');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // Search results modal
    const searchResultsModal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
    const searchResultsContainer = document.getElementById('search-results');
    
    // Add event listener to search form
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm.length < 2) {
                alert('Please enter at least 2 characters to search.');
                return;
            }
            
            performSearch(searchTerm);
        });
    }
    
    /**
     * Perform search across all content types
     * @param {string} searchTerm - The term to search for
     */
    function performSearch(searchTerm) {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        
        // Show loading indicator in the search results
        searchResultsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Searching...</span>
                </div>
                <p class="mt-2">Searching for "${searchTerm}"...</p>
            </div>
        `;
        
        // Show the modal while we fetch results
        searchResultsModal.show();
        
        // Get data from all sources
        Promise.all([
            fetch('data/books.json').then(response => response.json()),
            fetch('data/blog-posts.json').then(response => response.json()),
            fetch('data/author.json').then(response => response.json())
        ])
        .then(([books, blogPosts, author]) => {
            // Search in books
            const bookResults = books.filter(book => 
                book.title.toLowerCase().includes(normalizedSearchTerm) || 
                book.summary.toLowerCase().includes(normalizedSearchTerm) || 
                (book.description && book.description.toLowerCase().includes(normalizedSearchTerm)) ||
                book.category.toLowerCase().includes(normalizedSearchTerm)
            );
            
            // Search in blog posts
            const blogResults = blogPosts.filter(post => 
                post.title.toLowerCase().includes(normalizedSearchTerm) || 
                post.excerpt.toLowerCase().includes(normalizedSearchTerm) || 
                (post.content && post.content.toLowerCase().includes(normalizedSearchTerm)) ||
                post.category.toLowerCase().includes(normalizedSearchTerm)
            );
            
            // Search in author info (less relevant, but might be useful)
            const authorResults = [];
            if (author.name.toLowerCase().includes(normalizedSearchTerm) || 
                author.shortBio.toLowerCase().includes(normalizedSearchTerm) ||
                author.fullBio.toLowerCase().includes(normalizedSearchTerm)) {
                authorResults.push(author);
            }
            
            // Display results
            displaySearchResults(bookResults, blogResults, authorResults, searchTerm);
        })
        .catch(error => {
            console.error('Error performing search:', error);
            searchResultsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    An error occurred while searching. Please try again later.
                </div>
            `;
        });
    }
    
    /**
     * Display search results in the modal
     * @param {Array} bookResults - The matching books
     * @param {Array} blogResults - The matching blog posts
     * @param {Array} authorResults - The matching author info
     * @param {string} searchTerm - The original search term
     */
    function displaySearchResults(bookResults, blogResults, authorResults, searchTerm) {
        const totalResults = bookResults.length + blogResults.length + authorResults.length;
        
        if (totalResults === 0) {
            searchResultsContainer.innerHTML = `
                <div class="text-center">
                    <p>No results found for "${searchTerm}".</p>
                    <p>Try using different keywords or check your spelling.</p>
                </div>
            `;
            return;
        }
        
        let resultsHTML = `
            <h4 class="mb-4">Found ${totalResults} result${totalResults === 1 ? '' : 's'} for "${searchTerm}"</h4>
        `;
        
        // Add book results
        if (bookResults.length > 0) {
            resultsHTML += `
                <h5 class="mt-4 mb-3">Books (${bookResults.length})</h5>
                <div class="list-group mb-4">
            `;
            
            bookResults.forEach(book => {
                resultsHTML += `
                    <a href="book-detail.html?id=${book.id}" class="list-group-item list-group-item-action">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">${highlightSearchTerm(book.title, searchTerm)}</h5>
                            <small>${book.publishDate}</small>
                        </div>
                        <p class="mb-1">${highlightSearchTerm(book.summary.substring(0, 150)}..., searchTerm)</p>
                        <small class="text-muted">Category: ${book.category}</small>
                    </a>
                `;
            });
            
            resultsHTML += `</div>`;
        }
        
        // Add blog post results
        if (blogResults.length > 0) {
            resultsHTML += `
                <h5 class="mt-4 mb-3">Blog Posts (${blogResults.length})</h5>
                <div class="list-group mb-4">
            `;
            
            blogResults.forEach(post => {
                resultsHTML += `
                    <a href="blog-post.html?id=${post.id}" class="list-group-item list-group-item-action">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">${highlightSearchTerm(post.title, searchTerm)}</h5>
                            <small>${formatDate(post.date)}</small>
                        </div>
                        <p class="mb-1">${highlightSearchTerm(post.excerpt, searchTerm)}</p>
                        <small class="text-muted">Category: ${post.category}</small>
                    </a>
                `;
            });
            
            resultsHTML += `</div>`;
        }
        
        // Add author results
        if (authorResults.length > 0) {
            resultsHTML += `
                <h5 class="mt-4 mb-3">About Author</h5>
                <div class="list-group mb-4">
                    <a href="about.html" class="list-group-item list-group-item-action">
                        <h5 class="mb-1">${authorResults[0].name}</h5>
                        <p class="mb-1">${highlightSearchTerm(authorResults[0].shortBio, searchTerm)}</p>
                        <small class="text-muted">View full author profile</small>
                    </a>
                </div>
            `;
        }
        
        searchResultsContainer.innerHTML = resultsHTML;
    }
    
    /**
     * Highlight the search term in the provided text
     * @param {string} text - The text to search in
     * @param {string} term - The term to highlight
     * @returns {string} - HTML with highlighted search term
     */
    function highlightSearchTerm(text, term) {
        if (!term || !text) return text;
        
        const normalizedTerm = term.toLowerCase();
        const normalizedText = text.toString().toLowerCase();
        
        if (!normalizedText.includes(normalizedTerm)) return text;
        
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * Escape special characters in a string for use in a regular expression
     * @param {string} string - The string to escape
     * @returns {string} - The escaped string
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
});
