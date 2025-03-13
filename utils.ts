/**
 * Extracts the domain from a URL
 * @param url - The URL to extract domain from
 * @returns The domain name
 */
export function extractDomain(url: string): string {
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
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHTML(text: string): string {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Groups tabs by domain
 * @param tabs - Array of tab objects
 * @returns Object with domain names as keys and arrays of tabs as values
 */
export function groupTabsByDomain(tabs: chrome.tabs.Tab[]): Record<string, chrome.tabs.Tab[]> {
  return tabs.reduce((groups: Record<string, chrome.tabs.Tab[]>, tab) => {
    if (tab.url) {
      const domain = extractDomain(tab.url);
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(tab);
    }
    return groups;
  }, {});
}

/**
 * Format a date for display
 * @param date - Date object or timestamp
 * @returns Formatted date string
 */
export function formatDate(date: Date | number): string {
  const d = new Date(date);
  return d.toLocaleString();
}