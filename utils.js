// @ts-check
/// <reference path="./types/extension.d.ts" />
/**
 * @fileoverview Utility functions for the Tab Manager browser extension
 * 
 * This file contains helper functions used throughout the extension for:
 * - Extracting and manipulating domain names from URLs
 * - HTML sanitization
 * - Tab grouping by domain
 * - Date formatting
 * 
 * These utilities help maintain consistent behavior across different parts
 * of the extension and reduce code duplication.
 * 
 * @version 1.0.0
 * @license MIT
 */

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
 * Escapes HTML special characters to prevent XSS attacks when rendering user input
 * Uses the DOM API to safely escape all HTML special characters by setting textContent
 * and reading innerHTML
 * 
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text safe for insertion into HTML
 * 
 * @example
 * // Returns "&lt;script&gt;alert('XSS')&lt;/script&gt;"
 * escapeHTML("<script>alert('XSS')</script>")
 * 
 * @example
 * // Returns empty string for null or undefined input
 * escapeHTML(null) // returns ""
 */
function escapeHTML(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Groups tabs by their domain names to organize them hierarchically
 * This function creates an object where each key is a domain name
 * and the value is an array of tabs from that domain
 * 
 * @param {Array<chrome.tabs.Tab>} tabs - Array of tab objects from the browser
 * @returns {Object<string, Array<chrome.tabs.Tab>>} Object with domain names as keys and arrays of tabs as values
 * 
 * @example
 * // If tabs contain tabs from example.com and google.com
 * const groups = groupTabsByDomain(tabs);
 * // groups = {
 * //   "example.com": [tab1, tab2],
 * //   "google.com": [tab3, tab4]
 * // }
 */
function groupTabsByDomain(tabs) {
  return tabs.reduce((groups, tab) => {
    // Use empty string fallback to handle cases where url might be undefined
    const domain = extractDomain(tab.url || '');
    
    // Initialize array for this domain if it doesn't exist yet
    if (!groups[domain]) {
      groups[domain] = [];
    }
    
    // Add the tab to its domain group
    groups[domain].push(tab);
    return groups;
  }, /** @type {Object<string, Array<chrome.tabs.Tab>>} */ ({}));
}

/**
 * Formats a date for display using the browser's locale settings
 * Accepts either a Date object or a timestamp number
 * 
 * @param {Date|number} date - Date object or timestamp in milliseconds since epoch
 * @returns {string} Formatted date string according to user's locale (e.g., "3/13/2025, 2:30:45 PM")
 * 
 * @example
 * // Returns date string like "3/13/2025, 2:30:45 PM" (in en-US locale)
 * formatDate(new Date())
 * 
 * @example 
 * // Also works with timestamps
 * formatDate(1710345045000) // timestamp for a specific date
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString();
}
