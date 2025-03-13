document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather icons
  feather.replace({ class: 'icon' });

  // DOM elements
  const searchInput = document.getElementById('search-input');
  const clearSearchButton = document.getElementById('clear-search');
  const tabList = document.getElementById('tab-list');
  const domainList = document.getElementById('domain-list');
  const domainListContainer = document.querySelector('.domain-list-container');
  const groupList = document.getElementById('group-list');
  const groupListContainer = document.querySelector('.group-list-container');
  const treeView = document.getElementById('tree-view');
  const treeViewContainer = document.querySelector('.tree-view-container');
  const noResults = document.getElementById('no-results');
  const totalTabsElement = document.getElementById('total-tabs');
  const currentWindowTabsElement = document.getElementById('current-window-tabs');
  const filterAllButton = document.getElementById('filter-all');
  const filterCurrentWindowButton = document.getElementById('filter-current-window');
  const sortButton = document.getElementById('sort-button');
  const groupButton = document.getElementById('group-button');
  const dropdownContent = document.querySelectorAll('.dropdown-content');
  
  // Modal elements
  const createGroupModal = document.getElementById('create-group-modal');
  const groupNameInput = document.getElementById('group-name');
  const groupColorSelect = document.getElementById('group-color');
  const selectableTabsContainer = document.getElementById('selectable-tabs');
  const createGroupBtn = document.getElementById('create-group-button');
  const cancelGroupBtn = document.getElementById('cancel-group-button');
  const closeModalBtn = document.querySelector('.close-modal-button');

  // State variables
  let allTabs = [];
  let filteredTabs = [];
  let currentFilter = 'all';
  let currentSort = 'recent';
  let currentGrouping = 'tree'; // Set tree view as default
  let customGroups = [];
  let expandedGroups = {}; // Store the expanded/collapsed state of groups
  let searchQuery = '';
  let currentWindowTabCount = 0;
  let currentWindowId = null;

  // Fetch all tabs
  const fetchTabs = async () => {
    try {
      // Request tabs from background script
      const response = await chrome.runtime.sendMessage({ action: 'getTabs' });
      allTabs = response.tabs || [];
      
      // Get tab relationships from storage to build parent-child hierarchy
      chrome.storage.local.get(['tabRelationships'], (result) => {
        const relationships = result.tabRelationships || {};
        
        // Assign parent-child relationships to tabs
        allTabs.forEach(tab => {
          // Check if this tab has a parent
          if (relationships[tab.id]) {
            tab.parentTabId = relationships[tab.id].parentTabId;
          }
          
          // Find all child tabs for this tab
          tab.childTabs = [];
          Object.keys(relationships).forEach(childTabId => {
            if (relationships[childTabId].parentTabId === tab.id) {
              // Find the child tab in allTabs
              const childTab = allTabs.find(t => t.id === parseInt(childTabId));
              if (childTab) {
                tab.childTabs.push(childTab);
              }
            }
          });
        });
        
        // Initialize filtered tabs
        filteredTabs = [...allTabs];
        
        // Apply current filter
        applyFilters();
        
        // Update UI
        updateStats();
        renderTabs();
      });
    } catch (error) {
      console.error('Error fetching tabs:', error);
      
      // Fallback to direct query if message fails
      try {
        allTabs = await chrome.tabs.query({});
        filteredTabs = [...allTabs];
        applyFilters();
        updateStats();
        renderTabs();
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    }
  };

  // Apply filters and sorting to tabs
  const applyFilters = () => {
    // Apply window filter
    if (currentFilter === 'current-window') {
      chrome.windows.getCurrent(currentWindow => {
        filteredTabs = allTabs.filter(tab => tab.windowId === currentWindow.id);
        applySearchAndSort();
      });
    } else {
      filteredTabs = [...allTabs];
      applySearchAndSort();
    }
  };

  // Apply search filter and sorting
  const applySearchAndSort = () => {
    // Apply search filter if there is a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTabs = filteredTabs.filter(tab => 
        tab.title.toLowerCase().includes(query) || 
        tab.url.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (currentSort) {
      case 'title':
        filteredTabs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'domain':
        filteredTabs.sort((a, b) => {
          const domainA = extractDomain(a.url);
          const domainB = extractDomain(b.url);
          return domainA.localeCompare(domainB);
        });
        break;
      case 'recent':
      default:
        // Sort by tab index + window id for a rough approximation of recent usage
        filteredTabs.sort((a, b) => {
          if (a.windowId === b.windowId) {
            return a.index - b.index;
          }
          return a.windowId - b.windowId;
        });
        break;
    }

    updateStats();
    renderTabs();
  };

  // Update statistics
  const updateStats = () => {
    // Set total tabs count
    totalTabsElement.textContent = allTabs.length;
    
    // Get the current window's tab count
    chrome.windows.getCurrent((currentWindow) => {
      currentWindowId = currentWindow.id;
      const windowTabs = allTabs.filter(tab => tab.windowId === currentWindowId);
      currentWindowTabCount = windowTabs.length;
      
      // Update current window tab count
      currentWindowTabsElement.textContent = currentWindowTabCount;
    });
  };

  // Render tabs in the UI
  const renderTabs = () => {
    tabList.innerHTML = '';
    
    if (filteredTabs.length === 0) {
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');

      // Hide all group containers initially
      domainListContainer.classList.remove('visible');
      groupListContainer.classList.remove('visible');
      treeViewContainer.classList.remove('visible');
      tabList.style.display = 'block';
      
      // Choose rendering mode based on current grouping
      if (currentGrouping === 'tree') {
        renderTreeView();
      } else if (currentGrouping === 'domain') {
        renderDomainGroups();
      } else if (currentGrouping === 'window') {
        renderWindowGroups();
      } else if (currentGrouping === 'custom' && customGroups.length > 0) {
        renderCustomGroups();
      } else if (currentSort === 'domain' && !searchQuery) {
        // Legacy behavior - group by domain when sorting by domain
        renderDomainGroups();
      } else {
        // No grouping, render individual tabs
        filteredTabs.forEach(tab => {
          const tabElement = createTabElement(tab);
          tabList.appendChild(tabElement);
        });
      }
    }
  };
  
  // Render tree view of tabs
  const renderTreeView = () => {
    treeView.innerHTML = '';
    treeViewContainer.classList.add('visible');
    tabList.style.display = 'none';
    
    // Group tabs by window
    const windowGroups = {};
    
    filteredTabs.forEach(tab => {
      if (!windowGroups[tab.windowId]) {
        windowGroups[tab.windowId] = [];
      }
      
      // Only add root tabs to the window groups initially
      // A root tab is one without a parent or whose parent is not in the same window
      const hasParentInSameWindow = tab.parentTabId && 
        filteredTabs.some(t => t.id === tab.parentTabId && t.windowId === tab.windowId);
      
      if (!hasParentInSameWindow) {
        windowGroups[tab.windowId].push(tab);
      }
    });
    
    // Create tree items for each window
    Object.keys(windowGroups).forEach(windowId => {
      const tabs = windowGroups[windowId];
      
      // Create window tree item
      const windowItem = document.createElement('div');
      windowItem.className = 'tree-item has-children';
      windowItem.dataset.windowId = windowId;
      
      // Create window header
      const windowHeader = document.createElement('div');
      windowHeader.className = 'tree-window';
      
      // Count all tabs in this window (including child tabs)
      const allWindowTabs = filteredTabs.filter(tab => tab.windowId.toString() === windowId.toString());
      
      // Add tooltip with window info
      const windowInfo = `Window ${windowId} - ${allWindowTabs.length} tab${allWindowTabs.length > 1 ? 's' : ''}`;
      windowHeader.title = windowInfo;
      
      windowHeader.innerHTML = `
        <div class="window-title">
          <span data-feather="layout" class="icon"></span>
          <span>Window ${windowId}</span>
          <span class="tree-item-count">${allWindowTabs.length}</span>
        </div>
      `;
      
      // Create content container for tabs
      const windowContent = document.createElement('div');
      windowContent.className = 'tree-content';
      
      // Group tabs in this window by domain
      const domainGroups = groupTabsByDomain(tabs);
      
      // Create tree items for each domain in this window
      Object.keys(domainGroups).sort().forEach(domain => {
        const domainTabs = domainGroups[domain];
        
        // Create domain tree item if there are multiple tabs in this domain
        if (domainTabs.length > 1) {
          const domainItem = document.createElement('div');
          domainItem.className = 'tree-item has-children';
          
          // Create domain header
          const domainHeader = document.createElement('div');
          domainHeader.className = 'tree-domain';
          
          // Create tooltip with site count
          const siteInfo = `${domain} - ${domainTabs.length} tab${domainTabs.length > 1 ? 's' : ''}`;
          domainHeader.title = siteInfo;
          
          domainHeader.innerHTML = `
            <div class="domain-name">
              <img class="domain-favicon" src="https://www.google.com/s2/favicons?domain=${domain}" alt="">
              <span>${domain}</span>
              <span class="tree-item-count">${domainTabs.length}</span>
            </div>
          `;
          
          // Create content container for domain tabs
          const domainContent = document.createElement('div');
          domainContent.className = 'tree-content';
          
          // Helper function to recursively render a tab and its children
          const renderTabWithChildren = (tab, container, availableTabs) => {
            const tabElement = createTabElement(tab);
            
            // Check if this is a YouTube tab with a queue
            const isYouTubeTab = domain.includes('youtube.com') && tab.url.includes('watch');
            const hasYouTubeQueue = tab.youtubeQueue && tab.youtubeQueue.length > 0;
            
            // Check if this tab has child tabs
            const childTabs = tab.childTabs && tab.childTabs.length > 0
              ? availableTabs.filter(t => tab.childTabs.includes(t.id))
              : [];
            
            const hasChildren = childTabs.length > 0 || hasYouTubeQueue;
            
            if (hasChildren) {
              // This tab has children or a YouTube queue - make it expandable
              const treeItem = document.createElement('div');
              treeItem.className = 'tree-item has-children';
              if (hasYouTubeQueue) {
                treeItem.classList.add('youtube-playlist-item');
              }
              
              // Add indicators to the tab element
              if (hasYouTubeQueue) {
                const playlistIndicator = document.createElement('div');
                playlistIndicator.className = 'playlist-indicator';
                playlistIndicator.innerHTML = `
                  <span class="playlist-count">${tab.youtubeQueue.length} videos</span>
                  <span data-feather="list" class="icon"></span>
                `;
                tabElement.querySelector('.tab-info').appendChild(playlistIndicator);
                
                // Update the tooltip to show it's a playlist
                tabElement.title = `${tab.title} - Playlist with ${tab.youtubeQueue.length} videos`;
              }
              
              treeItem.appendChild(tabElement);
              
              // Create content container for children
              const treeContent = document.createElement('div');
              treeContent.className = 'tree-content';
              if (hasYouTubeQueue) {
                treeContent.classList.add('playlist-content');
              }
              
              // Add YouTube queue items if applicable
              if (hasYouTubeQueue) {
                tab.youtubeQueue.forEach((video, index) => {
                  const videoItem = document.createElement('div');
                  videoItem.className = 'video-item tab-item';
                  
                  // Add tooltip with video title and URL
                  videoItem.title = `${video.title || 'Unknown video'} - ${video.url}`;
                  
                  videoItem.innerHTML = `
                    <div class="queue-item-index">${index + 1}</div>
                    <div class="tab-info" title="${video.url}">
                      <div class="tab-title" title="${video.title || 'Unknown video'}">${escapeHTML(video.title || 'Unknown video')}</div>
                      <div class="tab-url">${escapeHTML(video.url)}</div>
                    </div>
                    <div class="tab-actions">
                      <button class="tab-action-button play-video" title="Play video">
                        <span data-feather="play" class="icon"></span>
                      </button>
                    </div>
                  `;
                  
                  // Initialize feather icons
                  feather.replace({ class: 'icon', node: videoItem });
                  
                  // Add click listener to play video
                  videoItem.querySelector('.play-video').addEventListener('click', (e) => {
                    e.stopPropagation();
                    chrome.tabs.update(tab.id, { url: video.url });
                  });
                  
                  treeContent.appendChild(videoItem);
                });
              }
              
              // Add child tabs if any
              if (childTabs.length > 0) {
                // Create a child tabs section if there are child tabs
                childTabs.forEach(childTab => {
                  // Recursively render child tabs and their children
                  renderTabWithChildren(childTab, treeContent, availableTabs);
                });
              }
              
              // Add event listener to toggle expansion
              tabElement.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-actions')) {
                  treeItem.classList.toggle('expanded');
                  // Save expansion state
                  expandedGroups[`tab-${tab.id}`] = treeItem.classList.contains('expanded');
                  saveExpandedState();
                }
              });
              
              // Apply saved expansion state or default to expanded
              const shouldExpand = expandedGroups.allExpanded || 
                expandedGroups[`tab-${tab.id}`] !== false ||
                expandedGroups[`youtube-${tab.id}`] !== false;
                
              if (shouldExpand) {
                treeItem.classList.add('expanded');
              }
              
              treeItem.appendChild(treeContent);
              container.appendChild(treeItem);
            } else {
              // This tab has no children - add it directly
              container.appendChild(tabElement);
            }
          };
          
          // Add tabs to domain content
          domainTabs.forEach(tab => {
            // Skip tabs that have parents in the same domain - they'll be displayed as children
            const hasParentInSameDomain = tab.parentTabId && 
              domainTabs.some(t => t.id === tab.parentTabId);
              
            if (!hasParentInSameDomain) {
              // This is a root tab in this domain - render it with its children
              renderTabWithChildren(tab, domainContent, domainTabs);
            }
          });
          
          // Add event listener to toggle domain expansion
          domainHeader.addEventListener('click', () => {
            domainItem.classList.toggle('expanded');
            // Save expansion state
            expandedGroups[`domain-${domain}-${windowId}`] = domainItem.classList.contains('expanded');
            saveExpandedState();
          });
          
          // Apply saved expansion state or default to expanded
          if (expandedGroups.allExpanded || expandedGroups[`domain-${domain}-${windowId}`] !== false) {
            domainItem.classList.add('expanded');
          }
          
          domainItem.appendChild(domainHeader);
          domainItem.appendChild(domainContent);
          windowContent.appendChild(domainItem);
        } else {
          // If there's only one tab in this domain, add it directly
          domainTabs.forEach(tab => {
            const tabElement = createTabElement(tab);
            windowContent.appendChild(tabElement);
          });
        }
      });
      
      // Add event listener to toggle window expansion
      windowHeader.addEventListener('click', () => {
        windowItem.classList.toggle('expanded');
        // Save expansion state
        expandedGroups[`window-${windowId}`] = windowItem.classList.contains('expanded');
        saveExpandedState();
      });
      
      // Apply saved expansion state or default to expanded
      if (expandedGroups.allExpanded || expandedGroups[`window-${windowId}`] !== false) {
        windowItem.classList.add('expanded');
      }
      
      windowItem.appendChild(windowHeader);
      windowItem.appendChild(windowContent);
      treeView.appendChild(windowItem);
    });
    
    // Initialize feather icons for the tree view
    feather.replace({ class: 'icon', node: treeView });
  };

  // Render custom tab groups
  const renderCustomGroups = () => {
    groupList.innerHTML = '';
    groupListContainer.classList.add('visible');
    
    // Clone filtered tabs to avoid modifying the original array
    const remainingTabs = [...filteredTabs];
    
    // Render each custom group
    customGroups.forEach(group => {
      // Find tabs that belong to this group
      const groupTabs = remainingTabs.filter(tab => 
        group.tabIds.includes(tab.id)
      );
      
      // Skip empty groups
      if (groupTabs.length === 0) return;
      
      // Remove these tabs from remaining tabs
      groupTabs.forEach(tab => {
        const index = remainingTabs.findIndex(t => t.id === tab.id);
        if (index !== -1) {
          remainingTabs.splice(index, 1);
        }
      });
      
      // Create group element
      const groupElement = document.createElement('div');
      groupElement.className = `tab-group ${group.color}`;
      
      // Create group header
      const groupHeader = document.createElement('div');
      groupHeader.className = 'tab-group-header';
      
      // Add tooltip with group info
      const groupInfo = `${escapeHTML(group.name)} - ${groupTabs.length} tab${groupTabs.length > 1 ? 's' : ''}`;
      groupHeader.title = groupInfo;
      
      groupHeader.innerHTML = `
        <div class="tab-group-title">
          <span class="color-badge ${group.color}"></span>
          <span>${escapeHTML(group.name)}</span>
          <span class="tab-count">(${groupTabs.length})</span>
        </div>
        <div class="tab-group-actions">
          <button class="group-action-button edit-group" title="Edit group">
            <span data-feather="edit-2" class="icon"></span>
          </button>
          <button class="group-action-button delete-group" title="Delete group">
            <span data-feather="trash-2" class="icon"></span>
          </button>
        </div>
      `;
      
      // Create group content
      const groupContent = document.createElement('div');
      groupContent.className = 'tab-group-content';
      
      // Add tabs to group content
      groupTabs.forEach(tab => {
        const tabElement = createTabElement(tab);
        groupContent.appendChild(tabElement);
      });
      
      // Add event listeners
      groupHeader.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-group-actions')) {
          // Toggle group expansion
          groupContent.classList.toggle('expanded');
          // Save expansion state
          expandedGroups[`custom-${group.id}`] = groupContent.classList.contains('expanded');
          saveExpandedState();
        }
      });
      
      // Apply saved expansion state or default to expanded
      if (expandedGroups.allExpanded || expandedGroups[`custom-${group.id}`] !== false) {
        groupContent.classList.add('expanded');
      }
      
      // Add edit and delete button listeners
      const editButton = groupHeader.querySelector('.edit-group');
      if (editButton) {
        editButton.addEventListener('click', (e) => {
          e.stopPropagation();
          editGroup(group);
        });
      }
      
      const deleteButton = groupHeader.querySelector('.delete-group');
      if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteGroup(group);
        });
      }
      
      // Assemble the group
      groupElement.appendChild(groupHeader);
      groupElement.appendChild(groupContent);
      
      // Add to group list
      groupList.appendChild(groupElement);
    });
    
    // Add "Ungrouped" section for remaining tabs if any
    if (remainingTabs.length > 0) {
      const ungroupedElement = document.createElement('div');
      ungroupedElement.className = 'tab-group';
      
      const ungroupedHeader = document.createElement('div');
      ungroupedHeader.className = 'tab-group-header';
      
      // Add tooltip with ungrouped tabs info
      const ungroupedInfo = `Ungrouped Tabs - ${remainingTabs.length} tab${remainingTabs.length > 1 ? 's' : ''}`;
      ungroupedHeader.title = ungroupedInfo;
      
      ungroupedHeader.innerHTML = `
        <div class="tab-group-title">
          <span>Ungrouped Tabs</span>
          <span class="tab-count">(${remainingTabs.length})</span>
        </div>
      `;
      
      const ungroupedContent = document.createElement('div');
      ungroupedContent.className = 'tab-group-content';
      
      // Add tabs to ungrouped content
      remainingTabs.forEach(tab => {
        const tabElement = createTabElement(tab);
        ungroupedContent.appendChild(tabElement);
      });
      
      // Add event listener
      ungroupedHeader.addEventListener('click', () => {
        // Toggle group expansion
        ungroupedContent.classList.toggle('expanded');
        // Save expansion state
        expandedGroups['ungrouped'] = ungroupedContent.classList.contains('expanded');
        saveExpandedState();
      });
      
      // Apply saved expansion state or default to expanded
      if (expandedGroups.allExpanded || expandedGroups['ungrouped'] !== false) {
        ungroupedContent.classList.add('expanded');
      }
      
      // Assemble the ungrouped section
      ungroupedElement.appendChild(ungroupedHeader);
      ungroupedElement.appendChild(ungroupedContent);
      
      // Add to group list
      groupList.appendChild(ungroupedElement);
    }
    
    // Initialize feather icons for the group list
    feather.replace({ class: 'icon', node: groupList });
  };

  // Render window groups
  const renderWindowGroups = () => {
    groupList.innerHTML = '';
    groupListContainer.classList.add('visible');
    
    // Group tabs by window
    const windowGroups = {};
    
    filteredTabs.forEach(tab => {
      if (!windowGroups[tab.windowId]) {
        windowGroups[tab.windowId] = [];
      }
      windowGroups[tab.windowId].push(tab);
    });
    
    // Create elements for each window group
    Object.keys(windowGroups).forEach(windowId => {
      const tabs = windowGroups[windowId];
      const groupElement = document.createElement('div');
      groupElement.className = 'tab-group';
      
      // Create window group header
      const groupHeader = document.createElement('div');
      groupHeader.className = 'tab-group-header';
      
      // Add tooltip with window info
      const windowInfo = `Window ${windowId} - ${tabs.length} tab${tabs.length > 1 ? 's' : ''}`;
      groupHeader.title = windowInfo;
      
      groupHeader.innerHTML = `
        <div class="tab-group-title">
          <span>Window ${windowId}</span>
          <span class="tab-count">(${tabs.length})</span>
        </div>
      `;
      
      // Create window group content
      const groupContent = document.createElement('div');
      groupContent.className = 'tab-group-content';
      
      // Add tabs to group content
      tabs.forEach(tab => {
        const tabElement = createTabElement(tab);
        groupContent.appendChild(tabElement);
      });
      
      // Add event listener
      groupHeader.addEventListener('click', () => {
        // Toggle group expansion
        groupContent.classList.toggle('expanded');
        // Save expansion state
        expandedGroups[`window-group-${windowId}`] = groupContent.classList.contains('expanded');
        saveExpandedState();
      });
      
      // Apply saved expansion state or default to expanded
      if (expandedGroups.allExpanded || expandedGroups[`window-group-${windowId}`] !== false) {
        groupContent.classList.add('expanded');
      }
      
      // Assemble the group
      groupElement.appendChild(groupHeader);
      groupElement.appendChild(groupContent);
      
      // Add to group list
      groupList.appendChild(groupElement);
    });
  };

  // Render domain groups
  const renderDomainGroups = () => {
    domainList.innerHTML = '';
    domainListContainer.classList.add('visible');
    
    // Group tabs by domain
    const domainGroups = groupTabsByDomain(filteredTabs);
    
    // Create elements for each domain group
    Object.keys(domainGroups).sort().forEach(domain => {
      const tabs = domainGroups[domain];
      const domainGroup = document.createElement('div');
      domainGroup.className = 'domain-group';
      
      // Add tooltip with domain info
      const domainInfo = `${domain} - ${tabs.length} tab${tabs.length > 1 ? 's' : ''}`;
      domainGroup.title = domainInfo;
      
      // Use local favicon storage if available, otherwise default to domain
      domainGroup.innerHTML = `
        <div class="domain-name">
          <img class="domain-favicon" src="https://www.google.com/s2/favicons?domain=${domain}" alt="">
          <span>${domain}</span>
        </div>
        <span class="domain-count">${tabs.length}</span>
      `;
      
      domainGroup.addEventListener('click', () => {
        // When domain is clicked, filter tabs to show only tabs from this domain
        filteredTabs = tabs;
        domainListContainer.classList.remove('visible');
        renderTabs();
      });
      
      domainList.appendChild(domainGroup);
    });
    
    // Render all tabs
    filteredTabs.forEach(tab => {
      const tabElement = createTabElement(tab);
      tabList.appendChild(tabElement);
    });
  };

  // Create tab element
  const createTabElement = (tab) => {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab-item fade-in';
    
    // Mark tabs with child tabs
    if (tab.childTabs && tab.childTabs.length > 0) {
      tabElement.classList.add('has-children');
    }
    
    // Mark tabs that are children of other tabs
    if (tab.parentTabId) {
      tabElement.classList.add('child-tab');
      tabElement.dataset.parentTabId = tab.parentTabId;
    }
    
    // Store tab ID for reference
    tabElement.dataset.tabId = tab.id;
    
    // Add tooltip with the URL and parent-child relationship info
    let tooltipText = tab.url;
    if (tab.parentTabId) {
      tooltipText = `Child tab (opened from tab #${tab.parentTabId})\n${tab.url}`;
    }
    if (tab.childTabs && tab.childTabs.length > 0) {
      tooltipText = `Parent tab with ${tab.childTabs.length} child tab(s)\n${tab.url}`;
    }
    tabElement.title = tooltipText;
    
    const domain = extractDomain(tab.url);
    const faviconUrl = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}`;
    
    // Check if this is a YouTube tab with a video queue
    const isYouTubeTab = domain.includes('youtube.com') && tab.url.includes('watch');
    const hasYouTubeQueue = tab.youtubeQueue && tab.youtubeQueue.length > 0;
    
    // Create the tab element HTML with parent-child indicators
    let tabHTML = '';
    
    // Add parent indicator if this tab has children
    if (tab.childTabs && tab.childTabs.length > 0) {
      tabHTML += `
        <div class="parent-indicator">
          <span data-feather="corner-right-down" class="icon parent-icon"></span>
          <span class="child-count">${tab.childTabs.length}</span>
        </div>
      `;
    }
    
    // Add child indicator if this tab is a child
    if (tab.parentTabId) {
      tabHTML += `
        <div class="child-indicator">
          <span data-feather="corner-up-left" class="icon child-icon"></span>
        </div>
      `;
    }
    
    // Add main tab content
    tabHTML += `
      <img class="tab-favicon" src="${faviconUrl}" alt="">
      <div class="tab-info" title="${tab.url}">
        <div class="tab-title" title="${tab.title}">${escapeHTML(tab.title)}</div>
    `;
    
    // Add YouTube queue info if available
    if (hasYouTubeQueue) {
      tabHTML += `
        <div class="youtube-queue-info">
          <button class="youtube-queue-toggle">
            <span data-feather="list" class="icon"></span>
            <span class="playlist-count">${tab.youtubeQueue.length}</span>
            <span>videos in playlist</span>
            ${tab.hasRestoredQueue ? '<span class="queue-restored">(restored)</span>' : ''}
          </button>
        </div>
      `;
    }
    
    // Add child tabs count if this tab has children
    if (tab.childTabs && tab.childTabs.length > 0) {
      tabHTML += `
        <div class="child-tabs-info">
          <span class="child-tabs-count">${tab.childTabs.length} child tab${tab.childTabs.length > 1 ? 's' : ''}</span>
        </div>
      `;
    }
    
    // Close the tab-info div and add action buttons
    tabHTML += `
      </div>
      <div class="tab-actions">
        <button class="tab-action-button switch-tab" title="Switch to tab">
          <span data-feather="external-link" class="icon"></span>
        </button>
        <button class="tab-action-button close-tab" title="Close tab">
          <span data-feather="x" class="icon"></span>
        </button>
      </div>
    `;
    
    tabElement.innerHTML = tabHTML;
    
    // Initialize feather icons for this element
    feather.replace({ class: 'icon', node: tabElement });
    
    // Add event listeners
    tabElement.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-actions') && !e.target.closest('.youtube-queue-toggle')) {
        switchToTab(tab);
      }
    });
    
    tabElement.querySelector('.switch-tab')?.addEventListener('click', (e) => {
      e.stopPropagation();
      switchToTab(tab);
    });
    
    tabElement.querySelector('.close-tab')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab);
    });
    
    // Add YouTube queue toggle listener if this tab has a queue
    if (hasYouTubeQueue) {
      const queueToggle = tabElement.querySelector('.youtube-queue-toggle');
      if (queueToggle) {
        queueToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleYouTubeQueueDisplay(tab, tabElement);
        });
      }
    }
    
    return tabElement;
  };
  
  // Toggle YouTube queue display
  const toggleYouTubeQueueDisplay = (tab, tabElement) => {
    // Check if queue is already displayed
    let queueContainer = tabElement.querySelector('.youtube-queue-container');
    
    if (queueContainer) {
      // Queue is displayed, hide it
      queueContainer.remove();
    } else {
      // Queue is not displayed, show it
      queueContainer = document.createElement('div');
      queueContainer.className = 'youtube-queue-container';
      
      // Create queue header
      let queueHTML = `
        <div class="youtube-queue-header">
          <h3>Video Queue</h3>
      `;
      
      // Add restore button if queue is saved
      if (tab.hasRestoredQueue) {
        queueHTML += `
          <button class="restore-queue-button" title="Restore this queue in the tab">
            <span data-feather="refresh-cw" class="icon"></span> Restore Queue
          </button>
        `;
      }
      
      // Close the header div
      queueHTML += `
        </div>
        <div class="youtube-queue-list">
      `;
      
      // Create queue items
      if (tab.youtubeQueue && tab.youtubeQueue.length > 0) {
        tab.youtubeQueue.forEach((video, index) => {
          queueHTML += `
            <div class="youtube-queue-item" data-video-id="${video.videoId}" data-video-url="${video.url}">
              <div class="queue-item-index">${index + 1}</div>
              <div class="queue-item-info">
                <div class="queue-item-title">${escapeHTML(video.title || 'Unknown title')}</div>
              </div>
            </div>
          `;
        });
      } else {
        queueHTML += `<div class="empty-queue">No videos in queue</div>`;
      }
      
      // Close the queue list div
      queueHTML += `
        </div>
      `;
      
      queueContainer.innerHTML = queueHTML;
      
      // Initialize feather icons for the queue container
      feather.replace({ class: 'icon', node: queueContainer });
      
      // Add restore button listener if queue is saved
      if (tab.hasRestoredQueue) {
        const restoreButton = queueContainer.querySelector('.restore-queue-button');
        if (restoreButton) {
          restoreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            restoreYouTubeQueue(tab);
          });
        }
      }
      
      // Add queue item click listeners
      queueContainer.querySelectorAll('.youtube-queue-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const videoUrl = item.dataset.videoUrl;
          if (videoUrl) {
            chrome.tabs.update(tab.id, { url: videoUrl });
          }
        });
      });
      
      // Add queue container to tab element
      tabElement.querySelector('.tab-info').appendChild(queueContainer);
    }
  };
  
  // Restore YouTube queue
  const restoreYouTubeQueue = (tab) => {
    // Get the first video URL
    if (tab.youtubeQueue && tab.youtubeQueue.length > 0) {
      const firstVideo = tab.youtubeQueue[0];
      if (firstVideo.url) {
        chrome.runtime.sendMessage({
          action: 'restoreYouTubeQueue',
          tabId: tab.id,
          url: firstVideo.url
        }, (response) => {
          if (response && response.success) {
            // Queue restored successfully
            console.log('YouTube queue restored');
          }
        });
      }
    }
  };

  // Switch to tab
  const switchToTab = (tab) => {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
  };

  // Close tab
  const closeTab = (tab) => {
    chrome.tabs.remove(tab.id, () => {
      allTabs = allTabs.filter(t => t.id !== tab.id);
      filteredTabs = filteredTabs.filter(t => t.id !== tab.id);
      
      updateStats();
      renderTabs();
    });
  };

  // Event listeners for filters
  filterAllButton.addEventListener('click', () => {
    filterAllButton.classList.add('active');
    filterCurrentWindowButton.classList.remove('active');
    currentFilter = 'all';
    applyFilters();
  });

  filterCurrentWindowButton.addEventListener('click', () => {
    filterAllButton.classList.remove('active');
    filterCurrentWindowButton.classList.add('active');
    currentFilter = 'current-window';
    applyFilters();
  });

  // Event listener for sort dropdown
  sortButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = sortButton.closest('.dropdown');
    
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('active');
      }
    });
    
    // Toggle this dropdown
    dropdown.classList.toggle('active');
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  });

  // Event listeners for sort options
  dropdownContent[0].querySelectorAll('a').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentSort = e.target.dataset.sort;
      sortButton.closest('.dropdown').classList.remove('active');
      applyFilters();
    });
  });

  // Event listener for search input
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    
    // Show/hide clear button
    if (searchQuery) {
      clearSearchButton.classList.add('visible');
    } else {
      clearSearchButton.classList.remove('visible');
    }
    
    applyFilters();
  });

  // Event listener for clear search button
  clearSearchButton.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchButton.classList.remove('visible');
    applyFilters();
  });

  // Group functionality
  
  // Show modal with tabs for group creation
  const showCreateGroupModal = () => {
    // Clear previous input
    groupNameInput.value = '';
    groupColorSelect.value = 'blue';
    selectableTabsContainer.innerHTML = '';
    
    // Populate selectable tabs container
    filteredTabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = 'selectable-tab';
      
      const domain = extractDomain(tab.url);
      const faviconUrl = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}`;
      
      tabElement.innerHTML = `
        <input type="checkbox" data-tab-id="${tab.id}" id="tab-${tab.id}">
        <div class="selectable-tab-info">
          <img class="selectable-tab-favicon" src="${faviconUrl}" alt="">
          <div class="selectable-tab-title">${escapeHTML(tab.title)}</div>
        </div>
      `;
      
      selectableTabsContainer.appendChild(tabElement);
    });
    
    // Show modal
    createGroupModal.classList.remove('hidden');
    createGroupModal.classList.add('visible');
  };
  
  // Hide create group modal
  const hideCreateGroupModal = () => {
    createGroupModal.classList.remove('visible');
    createGroupModal.classList.add('hidden');
  };
  
  // Create new tab group
  const createNewGroup = () => {
    const name = groupNameInput.value.trim();
    const color = groupColorSelect.value;
    
    // Validate input
    if (!name) {
      alert('Please enter a group name');
      return;
    }
    
    // Get selected tab IDs
    const selectedTabs = Array.from(selectableTabsContainer.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => parseInt(checkbox.dataset.tabId));
    
    // Validate tab selection
    if (selectedTabs.length === 0) {
      alert('Please select at least one tab');
      return;
    }
    
    // Create new group
    const newGroup = {
      id: Date.now().toString(),
      name,
      color,
      tabIds: selectedTabs
    };
    
    // Add to custom groups
    customGroups.push(newGroup);
    
    // Save to storage
    saveCustomGroups();
    
    // Hide modal
    hideCreateGroupModal();
    
    // Update UI with custom grouping
    currentGrouping = 'custom';
    renderTabs();
  };
  
  // Edit existing tab group
  const editGroup = (group) => {
    // Clear previous input
    groupNameInput.value = group.name;
    groupColorSelect.value = group.color;
    selectableTabsContainer.innerHTML = '';
    
    // Populate selectable tabs container
    allTabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = 'selectable-tab';
      
      const domain = extractDomain(tab.url);
      const faviconUrl = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}`;
      
      // Check if this tab is in the group
      const isChecked = group.tabIds.includes(tab.id);
      
      tabElement.innerHTML = `
        <input type="checkbox" data-tab-id="${tab.id}" id="tab-${tab.id}" ${isChecked ? 'checked' : ''}>
        <div class="selectable-tab-info">
          <img class="selectable-tab-favicon" src="${faviconUrl}" alt="">
          <div class="selectable-tab-title">${escapeHTML(tab.title)}</div>
        </div>
      `;
      
      selectableTabsContainer.appendChild(tabElement);
    });
    
    // Change button text
    createGroupBtn.textContent = 'Update Group';
    
    // Save group ID for update
    createGroupBtn.dataset.groupId = group.id;
    
    // Show modal
    createGroupModal.classList.remove('hidden');
    createGroupModal.classList.add('visible');
  };
  
  // Update existing group
  const updateGroup = (groupId) => {
    const name = groupNameInput.value.trim();
    const color = groupColorSelect.value;
    
    // Validate input
    if (!name) {
      alert('Please enter a group name');
      return;
    }
    
    // Get selected tab IDs
    const selectedTabs = Array.from(selectableTabsContainer.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => parseInt(checkbox.dataset.tabId));
    
    // Validate tab selection
    if (selectedTabs.length === 0) {
      alert('Please select at least one tab');
      return;
    }
    
    // Find and update the group
    const groupIndex = customGroups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      customGroups[groupIndex] = {
        ...customGroups[groupIndex],
        name,
        color,
        tabIds: selectedTabs
      };
      
      // Save to storage
      saveCustomGroups();
      
      // Hide modal
      hideCreateGroupModal();
      
      // Reset create button
      createGroupBtn.textContent = 'Create Group';
      delete createGroupBtn.dataset.groupId;
      
      // Update UI
      renderTabs();
    }
  };
  
  // Delete a tab group
  const deleteGroup = (group) => {
    // Confirm deletion
    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      // Remove the group
      customGroups = customGroups.filter(g => g.id !== group.id);
      
      // Save to storage
      saveCustomGroups();
      
      // Update UI
      renderTabs();
    }
  };
  
  // Save custom groups to chrome.storage
  const saveCustomGroups = () => {
    chrome.storage.local.set({ customGroups }, () => {
      console.log('Custom groups saved');
    });
  };
  
  // Load custom groups from chrome.storage
  const loadCustomGroups = () => {
    chrome.storage.local.get('customGroups', (data) => {
      if (data.customGroups) {
        customGroups = data.customGroups;
        console.log('Custom groups loaded:', customGroups);
      }
    });
  };
  
  // Save expanded group state to chrome.storage
  const saveExpandedState = () => {
    chrome.storage.local.set({ expandedGroups }, () => {
      console.log('Expanded groups state saved');
    });
  };
  
  // Load expanded group state from chrome.storage
  const loadExpandedState = () => {
    chrome.storage.local.get('expandedGroups', (data) => {
      if (data.expandedGroups) {
        expandedGroups = data.expandedGroups;
        console.log('Expanded groups state loaded');
      } else {
        // Default to all groups expanded
        expandedGroups = { allExpanded: true };
      }
    });
  };

  // Event listener for group button
  groupButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = groupButton.closest('.dropdown');
    
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('active');
      }
    });
    
    // Toggle this dropdown
    dropdown.classList.toggle('active');
  });

  // Event listeners for group options
  const groupDropdownContent = document.querySelector('.dropdown-content[data-group]')
    || document.querySelectorAll('.dropdown-content')[1];

  if (groupDropdownContent) {
    groupDropdownContent.querySelectorAll('a').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const groupType = e.target.dataset.group;
        
        // Close the dropdown
        const groupDropdown = groupButton.closest('.dropdown');
        groupDropdown.classList.remove('active');
        
        if (groupType === 'create') {
          // Show the create group modal
          showCreateGroupModal();
        } else {
          // Set the current grouping
          currentGrouping = groupType;
          renderTabs();
        }
      });
    });
  }

  // Modal event listeners
  createGroupBtn.addEventListener('click', () => {
    if (createGroupBtn.dataset.groupId) {
      // Update existing group
      updateGroup(createGroupBtn.dataset.groupId);
    } else {
      // Create new group
      createNewGroup();
    }
  });

  cancelGroupBtn.addEventListener('click', hideCreateGroupModal);
  closeModalBtn.addEventListener('click', hideCreateGroupModal);

  // Close modal when clicking outside
  createGroupModal.addEventListener('click', (e) => {
    if (e.target === createGroupModal) {
      hideCreateGroupModal();
    }
  });

  // Listen for tab changes from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'tabsUpdated') {
      fetchTabs();
    }
    // Return true to indicate we will respond asynchronously
    return true;
  });

  // Initial load
  loadCustomGroups();
  loadExpandedState();
  fetchTabs();
});