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
          chrome.windows.update(window.id, { focused: true });
          chrome.tabs.update(tab.id, { active: true });
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

// Function to notify all tab manager windows that tabs have been updated
function notifyTabsUpdated(): void {
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

// Function to update the extension badge with the total tab count
function updateBadgeWithTabCount(): void {
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
      relationships[tab.id] = {
        parentTabId: tab.openerTabId,
        createdAt: Date.now()
      };
      
      chrome.storage.local.set({ tabRelationships: relationships });
      
      // Notify that tabs have updated with new relationship data
      notifyTabsUpdated();
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
      chrome.storage.local.set({ youtubeQueues });
    }
  });
});

// Check if a URL is a YouTube watch page
function isYouTubeWatchUrl(url: string): boolean {
  return url && (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/')
  );
}

// Extract video ID from YouTube URL
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  let videoId: string | null = null;
  
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

interface YouTubeQueueInfo {
  mainVideoId: string;
  playlistId: string;
  currentIndex: string | null;
  baseUrl: string;
}

// Extract list of video IDs from a YouTube playlist URL
function extractYouTubeQueueFromUrl(url: string): YouTubeQueueInfo | null {
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

interface YouTubeQueueData {
  tabId: number;
  url: string;
  baseUrl: string;
  mainVideoId: string;
  playlistId: string;
  videos: YouTubeVideo[];
}

// Extract video queue information from YouTube tabs
async function extractYouTubeQueueInfo(tab: chrome.tabs.Tab): Promise<YouTubeQueueData | null> {
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
        const videos: Array<{videoId: string, title: string, url: string}> = [];
        
        try {
          // Try to find playlist items
          const items = document.querySelectorAll('ytd-playlist-panel-video-renderer');
          if (items && items.length > 0) {
            items.forEach(item => {
              // Extract data from playlist panel items
              const titleEl = item.querySelector('#video-title');
              const linkEl = item.querySelector('a#wc-endpoint');
              
              if (titleEl && linkEl) {
                const title = titleEl.textContent?.trim() || '';
                const url = (linkEl as HTMLAnchorElement).href;
                
                // Extract video ID from URL
                let videoId: string | null = null;
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
        tabId: tab.id as number,
        url: tab.url,
        baseUrl: queueInfo.baseUrl,
        mainVideoId: queueInfo.mainVideoId,
        playlistId: queueInfo.playlistId,
        videos: videos
      };
    }
  } catch (error: any) {
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
    if (tab.url && isYouTubeWatchUrl(tab.url)) {
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
            
            chrome.storage.local.set({ youtubeQueues });
          });
        }
      }).catch(error => {
        // This can happen if the tab was closed or navigated away before the script completed
        console.debug('Error extracting YouTube queue info, tab may have changed:', error.message);
      });
    }
  }
});

interface GetTabsResponse {
  tabs: chrome.tabs.Tab[];
  error?: string;
}

interface RestoreQueueResponse {
  success: boolean;
  error?: string;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse: (response: GetTabsResponse | RestoreQueueResponse) => void) => {
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
                      (tab as TabWithRelationship).youtubeQueue = youtubeQueues[`tab-${tab.id}`].videos;
                    }
                    // Otherwise, check if we have saved queue data for this URL
                    else {
                      const queueInfo = extractYouTubeQueueFromUrl(tab.url);
                      if (queueInfo && queueInfo.baseUrl && youtubeQueues[queueInfo.baseUrl]) {
                        (tab as TabWithRelationship).youtubeQueue = youtubeQueues[queueInfo.baseUrl].videos;
                        (tab as TabWithRelationship).hasRestoredQueue = true;
                      }
                    }
                  }
                } catch (tabError) {
                  console.debug('Error processing tab data:', tabError);
                }
              });
              
              sendResponse({ tabs });
            } catch (storageError) {
              console.debug('Error processing storage data:', storageError);
              sendResponse({ tabs: tabs || [] });
            }
          });
        } catch (queryError) {
          console.debug('Error querying tabs:', queryError);
          sendResponse({ tabs: [] });
        }
      });
    } catch (globalError) {
      console.debug('Critical error in getTabs handler:', globalError);
      sendResponse({ tabs: [], error: String(globalError) });
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
      } catch (error: any) {
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
  
  return false;
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
        
        chrome.storage.local.set({ tabHistory });
      });
    } catch (error) {
      console.debug('Error storing tab history:', error);
    }
  });
});