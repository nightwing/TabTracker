// @ts-check
/** @typedef {chrome.tabs.Tab & {
  parentTabId?: number;
  childTabs?: number[];
  lastAccessed?: number;
  youtubeQueue?: Array<{title: string, url: string, videoId: string}>;
  hasRestoredQueue?: boolean;
}} TabWithRelationship */

/**
 * Extracts the domain from a URL, handling special cases for browser internal URLs
 * 
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain name without 'www.' prefix or the original URL if parsing fails
 * 
 * @example
 * // Returns "example.com"
 * extractDomain("https://www.example.com/page?param=value")
 * 
 * @example
 * // Returns "subdomain.example.org"
 * extractDomain("https://subdomain.example.org/path")
 * 
 * @example
 * // Returns "chrome://extensions"
 * extractDomain("chrome://extensions")
 */
function extractDomain(url) {
  try {
    // Handle edge cases like chrome:// URLs
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return url;
    }
    
    const domain = new URL(url).hostname;
    return domain.startsWith('www.') ? domain.substring(4) : domain;
  } catch (e) {
    console.error('Error extracting domain:', e);
    return url; // Return original URL if parsing fails
  }
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Groups tabs by domain
 * @param {Array<chrome.tabs.Tab>} tabs - Array of tab objects
 * @returns {Object<string, Array<chrome.tabs.Tab>>} Object with domain names as keys and arrays of tabs as values
 */
function groupTabsByDomain(tabs) {
  return tabs.reduce((groups, tab) => {
    const domain = extractDomain(tab.url || '');
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(tab);
    return groups;
  }, /** @type {Object<string, Array<chrome.tabs.Tab>>} */ ({}));
}

/**
 * Format a date for display
 * @param {Date|number} date - Date object or timestamp
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString();
}
