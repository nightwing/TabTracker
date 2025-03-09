// Background script for Tab Tracker extension
// This script runs in the background and keeps track of tabs

// Track tab events for future features
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tabId);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabs') {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({ tabs });
    });
    return true; // Required for async sendResponse
  }
});

// Optional: Store tab history in local storage
// This can be used for extended functionality later
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab.url.startsWith('http')) {
      return;
    }
    
    const timestamp = Date.now();
    const tabData = {
      id: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      title: tab.title,
      timestamp
    };
    
    chrome.storage.local.get(['tabHistory'], (result) => {
      let tabHistory = result.tabHistory || [];
      
      // Keep only the latest 100 entries to avoid storage limits
      tabHistory.unshift(tabData);
      if (tabHistory.length > 100) {
        tabHistory = tabHistory.slice(0, 100);
      }
      
      chrome.storage.local.set({ tabHistory });
    });
  });
});
