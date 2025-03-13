// @ts-check
/// <reference path="./types/extension.d.ts" />
/**
 * @fileoverview Background script for Tab Manager browser extension
 * 
 * This script runs in the background and handles:
 * - Tab tracking (creation, removal, updates)
 * - Parent-child tab relationship tracking
 * - YouTube queue detection and preservation
 * - Tab history recording
 * - Browser badge updates
 * - Tab manager window creation
 * - Inter-component message passing
 * 
 * It maintains persistence using chrome.storage.local to retain tab relationships
 * and YouTube queue information across browser sessions.
 * 
 * @version 1.0.0
 * @license MIT
 */

// Background script for Tab Tracker extension
// This script runs in the background and keeps track of tabs

// Handle clicks on the browser action icon
chrome.action.onClicked.addListener(() => {
  // Check if tab manager window is already open
  chrome.windows.getAll({ populate: true }, (windows) => {
    let tabManagerFound = false;
    const tabManagerUrl = chrome.runtime.getURL('tab-manager.html');
    
    // Look for an existing tab manager window
    for (const window of windows) {
      for (const tab of window.tabs || []) {
        if (tab.url === tabManagerUrl) {
          // Found an existing tab manager window, focus it
          tabManagerFound = true;
          if (window.id) {
            chrome.windows.update(window.id, { focused: true });
          }
          if (tab.id) {
            chrome.tabs.update(tab.id, { active: true });
          }
          break;
        }
      }
      if (tabManagerFound) break;
    }
    
    // If no existing tab manager window, create a new one
    if (!tabManagerFound) {
      // Get screen information to set window height to 100% of available height
      chrome.system.display.getInfo((displays) => {
        // Use the primary display's height
        const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
        const availableHeight = primaryDisplay ? primaryDisplay.workArea.height : 900;
        
        chrome.windows.create({
          url: tabManagerUrl,
          type: 'popup',
          width: 450,
          height: availableHeight
        });
      });
    }
  });
});

// Track tab events and notify any open tab manager windows
chrome.tabs.onCreated.addListener((tab) => {
  notifyTabsUpdated();
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  notifyTabsUpdated();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    notifyTabsUpdated();
  }
});

/**
 * Notifies all tab manager windows that tabs have been updated
 * 
 * This function broadcasts a message to all tab manager windows
 * and updates the badge count in the browser toolbar.
 * It handles the "Receiving end does not exist" error that occurs when
 * no tab manager windows are open to receive the message.
 */
function notifyTabsUpdated() {
  try {
    // Send message to tab manager windows, catching the error if no receivers exist
    chrome.runtime.sendMessage({
      action: 'tabsUpdated'
    }).catch(error => {
      // It's normal for this error to occur when no tab manager windows are open
      // "Receiving end does not exist" is expected and can be safely ignored
      console.debug('No listeners for tabsUpdated message, this is normal:', error.message);
    });
  } catch (error) {
    // Additional catch for legacy Chrome versions
    console.debug('Error sending message, this is normal if no tab manager is open');
  }
  
  // Update badge with tab count
  updateBadgeWithTabCount();
}

/**
 * Updates the extension badge with the total tab count
 * 
 * This function displays a count of all open tabs in the browser
 * as a badge on the extension icon. It helps users keep track of
 * how many tabs they have open at a glance.
 * 
 * The badge uses a blue background with white text for optimal visibility.
 */
function updateBadgeWithTabCount() {
  chrome.tabs.query({}, (tabs) => {
    const totalTabs = tabs.length;
    
    // Set the badge text to show total tab count across all windows
    chrome.action.setBadgeText({ text: totalTabs.toString() });
    
    // Set badge text color to white for better visibility and contrast
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
    
    // Set badge background color
    chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
  });
}

// Track tab events and handle YouTube queue persistence
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id);
  
  // When a new tab is created, we need to track its parent relationship
  // The openerTabId property tells us which tab opened this new tab
  if (tab.openerTabId) {
    // Store this parent-child relationship
    chrome.storage.local.get(['tabRelationships'], (result) => {
      let relationships = result.tabRelationships || {};
      
      // Create an entry for this child tab
      if (tab.id) {
        relationships[tab.id] = {
          parentTabId: tab.openerTabId,
          createdAt: Date.now()
        };
      
        chrome.storage.local.set({ tabRelationships: relationships });
      
        // Notify that tabs have updated with new relationship data
        notifyTabsUpdated();
      }
    });
  }
});

// Handle tab removal and YouTube queue preservation
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
  
  // Clean up tab relationships when a tab is closed
  chrome.storage.local.get(['tabRelationships'], (result) => {
    let relationships = result.tabRelationships || {};
    
    // Remove the relationship entry for this tab
    if (relationships[tabId]) {
      delete relationships[tabId];
      chrome.storage.local.set({ tabRelationships: relationships });
    }
  });
  
  // When a tab is removed, save its YouTube queue if it exists
  chrome.storage.local.get(['youtubeQueues'], (result) => {
    let youtubeQueues = result.youtubeQueues || {};
    
    // We store the queue indexed by tab URL instead of tabId to persist across sessions
    if (youtubeQueues[`tab-${tabId}`]) {
      const queueData = youtubeQueues[`tab-${tabId}`];
      
      // Save queue under the base URL to be able to restore it later
      if (queueData.baseUrl) {
        youtubeQueues[queueData.baseUrl] = {
          videos: queueData.videos,
          timestamp: Date.now()
        };
      }
      
      // Remove the tab-specific entry
      delete youtubeQueues[`tab-${tabId}`];
      chrome.storage.local.set({ youtubeQueues: youtubeQueues });
    }
  });
});

// Check if a URL is a YouTube watch page
function isYouTubeWatchUrl(url) {
  return url && (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/')
  );
}

// Extract video ID from YouTube URL
function extractYouTubeVideoId(url) {
  if (!url) return null;
  
  let videoId = null;
  
  // Handle youtu.be format
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([^?&#]+)/);
    if (match && match[1]) {
      videoId = match[1];
    }
  } 
  // Handle youtube.com format
  else if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    videoId = urlObj.searchParams.get('v');
  }
  
  return videoId;
}

// Extract list of video IDs from a YouTube playlist URL
function extractYouTubeQueueFromUrl(url) {
  if (!url || !isYouTubeWatchUrl(url)) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Extract main video ID
    const videoId = urlObj.searchParams.get('v');
    if (!videoId) return null;
    
    // Get queue/playlist information
    const list = urlObj.searchParams.get('list');
    const index = urlObj.searchParams.get('index');
    
    // We need to check for the list parameter to determine if it's a playlist/queue
    if (!list) return null;
    
    // Create a base URL for restoration purposes (without the index)
    const baseUrl = `https://www.youtube.com/watch?v=${videoId}&list=${list}`;
    
    return {
      mainVideoId: videoId,
      playlistId: list,
      currentIndex: index,
      baseUrl: baseUrl
    };
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

// Extract video queue information from YouTube tabs
async function extractYouTubeQueueInfo(tab) {
  if (!tab || !tab.url || !isYouTubeWatchUrl(tab.url)) return null;
  
  // Get queue parameters from URL
  const queueInfo = extractYouTubeQueueFromUrl(tab.url);
  if (!queueInfo) return null;
  
  try {
    // Verify that tab still exists and is accessible before executing script
    // This avoids "Error: No tab with id X" errors
    const tabs = await chrome.tabs.query({});
    const tabExists = tabs.some(t => t.id === tab.id);
    if (!tabExists) {
      console.debug(`Tab ${tab.id} no longer exists, skipping queue extraction`);
      return null;
    }
    
    // Execute content script to extract queue information from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // This function runs in the context of the YouTube page
        const videos = [];
        
        try {
          // Try to find playlist items
          const items = document.querySelectorAll('ytd-playlist-panel-video-renderer');
          if (items && items.length > 0) {
            items.forEach(item => {
              // Extract data from playlist panel items
              const titleEl = item.querySelector('#video-title');
              const linkEl = item.querySelector('a#wc-endpoint');
              
              if (titleEl && linkEl && titleEl.textContent) {
                const title = titleEl.textContent.trim();
                const url = linkEl instanceof HTMLAnchorElement ? linkEl.href : '';
                
                // Extract video ID from URL
                let videoId = null;
                const match = url.match(/[?&]v=([^&]+)/);
                if (match && match[1]) {
                  videoId = match[1];
                }
                
                if (videoId) {
                  videos.push({
                    videoId,
                    title,
                    url
                  });
                }
              }
            });
          }
        } catch (innerError) {
          console.warn('Error while extracting video elements from page:', innerError);
        }
        
        return videos;
      }
    });
    
    // Process results
    if (results && results[0] && results[0].result) {
      const videos = results[0].result;
      return {
        tabId: tab.id,
        url: tab.url,
        baseUrl: queueInfo.baseUrl,
        mainVideoId: queueInfo.mainVideoId,
        playlistId: queueInfo.playlistId,
        videos: videos
      };
    }
  } catch (error) {
    // Common errors:
    // - "Cannot access contents of url "chrome://..." - restricted URL
    // - "No tab with id X" - tab was closed
    // - "Receiving end does not exist" - tab was navigated away
    console.debug('Could not extract YouTube queue info:', error.message);
  }
  
  return null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tabId);
    
    // Check if this is a YouTube tab with a queue
    if (isYouTubeWatchUrl(tab.url)) {
      // Try to extract queue information
      extractYouTubeQueueInfo(tab).then(queueData => {
        if (queueData && queueData.videos && queueData.videos.length > 0) {
          // Save queue information to storage
          chrome.storage.local.get(['youtubeQueues'], (result) => {
            let youtubeQueues = result.youtubeQueues || {};
            
            // Store by tab ID for the active session
            youtubeQueues[`tab-${tabId}`] = queueData;
            
            // Also store by base URL for restoration between sessions
            youtubeQueues[queueData.baseUrl] = {
              videos: queueData.videos,
              timestamp: Date.now()
            };
            
            chrome.storage.local.set({ youtubeQueues: youtubeQueues });
          });
        }
      }).catch(error => {
        // This can happen if the tab was closed or navigated away before the script completed
        console.debug('Error extracting YouTube queue info, tab may have changed:', error.message);
      });
    }
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabs') {
    try {
      chrome.tabs.query({}, (tabs) => {
        try {
          // Fetch YouTube queue data to include with tabs
          chrome.storage.local.get(['youtubeQueues'], (result) => {
            try {
              const youtubeQueues = result.youtubeQueues || {};
              
              // Attach queue information to tab data
              tabs.forEach(tab => {
                try {
                  if (tab && tab.url && isYouTubeWatchUrl(tab.url)) {
                    // First check if we have queue data for this specific tab
                    if (youtubeQueues[`tab-${tab.id}`]) {
                      // @ts-ignore - We're extending the Tab object with our custom properties
                      tab.youtubeQueue = youtubeQueues[`tab-${tab.id}`].videos;
                    }
                    // Otherwise, check if we have saved queue data for this URL
                    else {
                      const queueInfo = extractYouTubeQueueFromUrl(tab.url);
                      if (queueInfo && queueInfo.baseUrl && youtubeQueues[queueInfo.baseUrl]) {
                        // @ts-ignore - We're extending the Tab object with our custom properties
                        tab.youtubeQueue = youtubeQueues[queueInfo.baseUrl].videos;
                        // @ts-ignore - We're extending the Tab object with our custom properties
                        tab.hasRestoredQueue = true;
                      }
                    }
                  }
                } catch (tabError) {
                  console.debug('Error processing tab data:', tabError.message);
                }
              });
              
              sendResponse({ tabs });
            } catch (storageError) {
              console.debug('Error processing storage data:', storageError.message);
              sendResponse({ tabs: tabs || [] });
            }
          });
        } catch (queryError) {
          console.debug('Error querying tabs:', queryError.message);
          sendResponse({ tabs: [] });
        }
      });
    } catch (globalError) {
      console.debug('Critical error in getTabs handler:', globalError.message);
      sendResponse({ tabs: [], error: globalError.message });
    }
    return true; // Required for async sendResponse
  }
  
  // Handle request to restore YouTube queue
  if (request.action === 'restoreYouTubeQueue') {
    const { tabId, url } = request;
    
    if (tabId && url) {
      try {
        chrome.tabs.update(tabId, { url }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({ 
              success: false, 
              error: chrome.runtime.lastError.message 
            });
            return;
          }
          sendResponse({ success: true });
        });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to update tab' 
        });
      }
    } else {
      sendResponse({ success: false, error: 'Invalid parameters' });
    }
    return true;
  }
});

// Optional: Store tab history in local storage
// This can be used for extended functionality later
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  chrome.tabs.get(tabId, (tab) => {
    // Handle case where tab doesn't exist or there was an error
    if (chrome.runtime.lastError) {
      console.debug('Cannot access tab, it may have been closed:', chrome.runtime.lastError.message);
      return;
    }
    
    // Skip non-http tabs and invalid URLs
    if (!tab || !tab.url || !tab.url.startsWith('http')) {
      return;
    }
    
    try {
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
        
        chrome.storage.local.set({ tabHistory: tabHistory });
      });
    } catch (error) {
      console.debug('Error storing tab history:', error.message);
    }
  });
});

// ---------- Inactive Windows Management ----------

/**
 * Stores information about a window that is being deactivated
 * This includes all tabs, their URLs, titles, and relationships
 * 
 * @param {number} windowId - The ID of the window being deactivated
 * @returns {Promise<boolean>} - Promise resolving to true if successful
 */
async function deactivateWindow(windowId) {
  try {
    console.log('Deactivating window:', windowId);
    
    // Get all tabs in the window
    const tabs = await chrome.tabs.query({ windowId });
    
    if (!tabs || tabs.length === 0) {
      console.warn('No tabs found in window to deactivate');
      return false;
    }
    
    // Get tab relationships to preserve parent-child connections
    const { tabRelationships } = await chrome.storage.local.get(['tabRelationships']);
    const relationships = tabRelationships || {};
    
    // Create window data object
    const windowData = {
      id: windowId,
      deactivatedAt: Date.now(),
      name: `Window ${windowId}`, // Default name, can be customized by user
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        pinned: tab.pinned,
        index: tab.index,
        groupId: tab.groupId,
        originalId: tab.id,
        // Get parent relationship if it exists
        parentTabId: relationships[tab.id] ? relationships[tab.id].parentTabId : undefined
      }))
    };
    
    // Store window data in inactive windows list
    const { inactiveWindows } = await chrome.storage.local.get(['inactiveWindows']);
    const allInactiveWindows = inactiveWindows || [];
    
    // Add to the beginning of the list (most recent first)
    allInactiveWindows.unshift(windowData);
    
    // Save updated inactive windows list
    await chrome.storage.local.set({ inactiveWindows: allInactiveWindows });
    
    // Close the window now that we've stored its data
    await chrome.windows.remove(windowId);
    
    console.log('Window deactivated successfully:', windowId);
    return true;
  } catch (error) {
    console.error('Error deactivating window:', error);
    return false;
  }
}

/**
 * Reactivates a previously deactivated window
 * Creates a new browser window with all the tabs from the saved window
 * 
 * @param {number} inactiveWindowIndex - The index of the inactive window in the array
 * @returns {Promise<boolean>} - Promise resolving to true if successful
 */
async function reactivateWindow(inactiveWindowIndex) {
  try {
    console.log('Reactivating window at index:', inactiveWindowIndex);
    
    // Get inactive window data
    const { inactiveWindows } = await chrome.storage.local.get(['inactiveWindows']);
    
    if (!inactiveWindows || !inactiveWindows[inactiveWindowIndex]) {
      console.warn('Inactive window not found at index:', inactiveWindowIndex);
      return false;
    }
    
    const windowData = inactiveWindows[inactiveWindowIndex];
    
    // Create a new window with the first tab
    const firstTab = windowData.tabs[0] || { url: 'about:blank' };
    const newWindow = await chrome.windows.create({
      url: firstTab.url,
      focused: true
    });
    
    if (!newWindow || !newWindow.id) {
      console.error('Failed to create new window');
      return false;
    }
    
    // Find the tab that was created with the window
    const initialTabs = await chrome.tabs.query({ windowId: newWindow.id });
    const initialTabId = initialTabs[0]?.id;
    
    // Create mapping of original to new tab IDs for preserving relationships
    const tabIdMapping = {};
    
    // Add rest of the tabs
    if (windowData.tabs.length > 1) {
      for (let i = 1; i < windowData.tabs.length; i++) {
        const tabData = windowData.tabs[i];
        const newTab = await chrome.tabs.create({
          windowId: newWindow.id,
          url: tabData.url,
          pinned: tabData.pinned,
          index: tabData.index,
          active: false
        });
        
        // Store mapping of original ID to new ID
        if (tabData.originalId && newTab.id) {
          tabIdMapping[tabData.originalId] = newTab.id;
        }
      }
    }
    
    // If we created tabs for all entries except the first one,
    // update the first tab too
    if (initialTabId && firstTab.originalId) {
      // Pin the tab if it was pinned
      if (firstTab.pinned) {
        await chrome.tabs.update(initialTabId, { pinned: true });
      }
      
      // Store mapping for the first tab
      tabIdMapping[firstTab.originalId] = initialTabId;
    }
    
    // Restore parent-child relationships
    await restoreTabRelationships(windowData.tabs, tabIdMapping);
    
    // Remove the reactivated window from the inactive list
    inactiveWindows.splice(inactiveWindowIndex, 1);
    await chrome.storage.local.set({ inactiveWindows: inactiveWindows });
    
    console.log('Window reactivated successfully with ID:', newWindow.id);
    return true;
  } catch (error) {
    console.error('Error reactivating window:', error);
    return false;
  }
}

/**
 * Restores parent-child relationships between tabs in a reactivated window
 * 
 * @param {Array<Object>} originalTabs - Array of original tab data with relationship info
 * @param {Object<number, number>} tabIdMapping - Mapping of original tab IDs to new IDs
 * @returns {Promise<void>}
 */
async function restoreTabRelationships(originalTabs, tabIdMapping) {
  try {
    // Get current relationships
    const { tabRelationships } = await chrome.storage.local.get(['tabRelationships']);
    const relationships = tabRelationships || {};
    
    // Create new relationships based on the original ones
    for (const tab of originalTabs) {
      if (tab.parentTabId && tab.originalId) {
        const newTabId = tabIdMapping[tab.originalId];
        const newParentId = tabIdMapping[tab.parentTabId];
        
        // Only create relationship if both tabs exist in the new window
        if (newTabId && newParentId) {
          relationships[newTabId] = {
            parentTabId: newParentId,
            createdAt: Date.now()
          };
        }
      }
    }
    
    // Save updated relationships
    await chrome.storage.local.set({ tabRelationships: relationships });
  } catch (error) {
    console.error('Error restoring tab relationships:', error);
  }
}

/**
 * Exports all inactive window data to a JSON string
 * 
 * @returns {Promise<string>} - JSON string containing all inactive window data
 */
async function exportInactiveWindows() {
  try {
    const { inactiveWindows } = await chrome.storage.local.get(['inactiveWindows']);
    
    if (!inactiveWindows) {
      return JSON.stringify({ inactiveWindows: [] });
    }
    
    return JSON.stringify({ 
      inactiveWindows,
      exportedAt: Date.now(),
      version: '1.0'
    }, null, 2); // Pretty print with 2-space indentation
  } catch (error) {
    console.error('Error exporting inactive windows:', error);
    throw error;
  }
}

/**
 * Imports inactive window data from a JSON string
 * 
 * @param {string} jsonData - JSON string containing inactive window data
 * @returns {Promise<{success: boolean, message: string, count: number}>} - Result of the import
 */
async function importInactiveWindows(jsonData) {
  try {
    if (!jsonData) {
      return { success: false, message: 'No data provided', count: 0 };
    }
    
    // Parse the JSON data
    const data = JSON.parse(jsonData);
    
    if (!data.inactiveWindows || !Array.isArray(data.inactiveWindows)) {
      return { success: false, message: 'Invalid data format', count: 0 };
    }
    
    // Get current inactive windows
    const { inactiveWindows } = await chrome.storage.local.get(['inactiveWindows']);
    const currentWindows = inactiveWindows || [];
    
    // Add imported windows to the list
    const updatedWindows = [...currentWindows, ...data.inactiveWindows];
    
    // Save the updated list
    await chrome.storage.local.set({ inactiveWindows: updatedWindows });
    
    return { 
      success: true, 
      message: `Successfully imported ${data.inactiveWindows.length} inactive windows`,
      count: data.inactiveWindows.length
    };
  } catch (error) {
    console.error('Error importing inactive windows:', error);
    return { 
      success: false, 
      message: `Error importing data: ${error.message}`,
      count: 0
    };
  }
}

// Listen for messages related to inactive window management
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'deactivateWindow') {
    deactivateWindow(request.windowId)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || 'Failed to deactivate window' 
      }));
    return true; // Required for async sendResponse
  }
  
  if (request.action === 'reactivateWindow') {
    reactivateWindow(request.windowIndex)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || 'Failed to reactivate window' 
      }));
    return true;
  }
  
  if (request.action === 'getInactiveWindows') {
    chrome.storage.local.get(['inactiveWindows'], (result) => {
      sendResponse({ 
        inactiveWindows: result.inactiveWindows || [] 
      });
    });
    return true;
  }
  
  if (request.action === 'exportInactiveWindows') {
    exportInactiveWindows()
      .then(jsonData => sendResponse({ success: true, data: jsonData }))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || 'Failed to export inactive windows' 
      }));
    return true;
  }
  
  if (request.action === 'importInactiveWindows') {
    importInactiveWindows(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        message: error.message || 'Failed to import inactive windows',
        count: 0
      }));
    return true;
  }
});
