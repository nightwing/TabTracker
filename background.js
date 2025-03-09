// Background script for Tab Tracker extension
// This script runs in the background and keeps track of tabs

// Handle clicks on the browser action icon
chrome.action.onClicked.addListener(() => {
  // Open the tab manager in a new window
  chrome.windows.create({
    url: chrome.runtime.getURL('tab-manager.html'),
    type: 'popup',
    width: 450,
    height: 700
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
function notifyTabsUpdated() {
  // Send message to tab manager windows
  chrome.runtime.sendMessage({
    action: 'tabsUpdated'
  });
  
  // Update badge with tab count
  updateBadgeWithTabCount();
}

// Function to update the extension badge with the current tab count
function updateBadgeWithTabCount() {
  chrome.tabs.query({}, (tabs) => {
    const totalTabs = tabs.length;
    
    // Get current window to count tabs in current window
    chrome.windows.getCurrent((currentWindow) => {
      const tabsInCurrentWindow = tabs.filter(tab => tab.windowId === currentWindow.id).length;
      
      // Set the badge text to show current window tab count
      chrome.action.setBadgeText({ text: tabsInCurrentWindow.toString() });
      
      // Set badge background color
      chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
    });
  });
}

// Track tab events and handle YouTube queue persistence
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id);
});

// Handle tab removal and YouTube queue preservation
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
  
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
  if (!isYouTubeWatchUrl(tab.url)) return null;
  
  // Get queue parameters from URL
  const queueInfo = extractYouTubeQueueFromUrl(tab.url);
  if (!queueInfo) return null;
  
  try {
    // Execute content script to extract queue information from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // This function runs in the context of the YouTube page
        const videos = [];
        
        // Try to find playlist items
        const items = document.querySelectorAll('ytd-playlist-panel-video-renderer');
        if (items && items.length > 0) {
          items.forEach(item => {
            // Extract data from playlist panel items
            const titleEl = item.querySelector('#video-title');
            const linkEl = item.querySelector('a#wc-endpoint');
            
            if (titleEl && linkEl) {
              const title = titleEl.textContent.trim();
              const url = linkEl.href;
              
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
    console.error('Error executing script in YouTube tab:', error);
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
            
            chrome.storage.local.set({ youtubeQueues });
          });
        }
      });
    }
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabs') {
    chrome.tabs.query({}, (tabs) => {
      // Fetch YouTube queue data to include with tabs
      chrome.storage.local.get(['youtubeQueues'], (result) => {
        const youtubeQueues = result.youtubeQueues || {};
        
        // Attach queue information to tab data
        tabs.forEach(tab => {
          if (isYouTubeWatchUrl(tab.url)) {
            // First check if we have queue data for this specific tab
            if (youtubeQueues[`tab-${tab.id}`]) {
              tab.youtubeQueue = youtubeQueues[`tab-${tab.id}`].videos;
            }
            // Otherwise, check if we have saved queue data for this URL
            else {
              const queueInfo = extractYouTubeQueueFromUrl(tab.url);
              if (queueInfo && queueInfo.baseUrl && youtubeQueues[queueInfo.baseUrl]) {
                tab.youtubeQueue = youtubeQueues[queueInfo.baseUrl].videos;
                tab.hasRestoredQueue = true;
              }
            }
          }
        });
        
        sendResponse({ tabs });
      });
    });
    return true; // Required for async sendResponse
  }
  
  // Handle request to restore YouTube queue
  if (request.action === 'restoreYouTubeQueue') {
    const { tabId, url } = request;
    
    if (tabId && url) {
      chrome.tabs.update(tabId, { url }, () => {
        sendResponse({ success: true });
      });
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
