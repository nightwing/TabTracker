document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather icons
  feather.replace();

  // DOM elements
  const searchInput = document.getElementById('search-input');
  const clearSearchButton = document.getElementById('clear-search');
  const tabList = document.getElementById('tab-list');
  const domainList = document.getElementById('domain-list');
  const domainListContainer = document.querySelector('.domain-list-container');
  const noResults = document.getElementById('no-results');
  const totalTabsElement = document.getElementById('total-tabs');
  const totalDomainsElement = document.getElementById('total-domains');
  const filterAllButton = document.getElementById('filter-all');
  const filterCurrentWindowButton = document.getElementById('filter-current-window');
  const sortButton = document.getElementById('sort-button');
  const dropdownContent = document.querySelector('.dropdown-content');

  // State variables
  let allTabs = [];
  let filteredTabs = [];
  let currentFilter = 'all';
  let currentSort = 'recent';
  let searchQuery = '';

  // Fetch all tabs
  const fetchTabs = async () => {
    try {
      allTabs = await chrome.tabs.query({});
      
      // Initialize filtered tabs
      filteredTabs = [...allTabs];
      
      // Apply current filter
      applyFilters();
      
      // Update UI
      updateStats();
      renderTabs();
    } catch (error) {
      console.error('Error fetching tabs:', error);
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
    totalTabsElement.textContent = allTabs.length;
    
    // Calculate unique domains
    const domains = new Set(allTabs.map(tab => extractDomain(tab.url)));
    totalDomainsElement.textContent = domains.size;
  };

  // Render tabs in the UI
  const renderTabs = () => {
    tabList.innerHTML = '';
    
    if (filteredTabs.length === 0) {
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
      
      // Group tabs by domain if sorting by domain
      if (currentSort === 'domain' && !searchQuery) {
        renderDomainGroups();
      } else {
        domainListContainer.classList.remove('visible');
        
        // Render individual tabs
        filteredTabs.forEach(tab => {
          const tabElement = createTabElement(tab);
          tabList.appendChild(tabElement);
        });
      }
    }
  };

  // Render domain groups
  const renderDomainGroups = () => {
    domainList.innerHTML = '';
    domainListContainer.classList.add('visible');
    
    // Group tabs by domain
    const domainGroups = {};
    filteredTabs.forEach(tab => {
      const domain = extractDomain(tab.url);
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      domainGroups[domain].push(tab);
    });
    
    // Create elements for each domain group
    Object.keys(domainGroups).sort().forEach(domain => {
      const tabs = domainGroups[domain];
      const domainGroup = document.createElement('div');
      domainGroup.className = 'domain-group';
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
    
    const domain = extractDomain(tab.url);
    const faviconUrl = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}`;
    
    tabElement.innerHTML = `
      <img class="tab-favicon" src="${faviconUrl}" alt="">
      <div class="tab-info">
        <div class="tab-title">${escapeHTML(tab.title)}</div>
        <div class="tab-url">${escapeHTML(tab.url)}</div>
      </div>
      <div class="tab-actions">
        <button class="tab-action-button switch-tab" title="Switch to tab">
          <i data-feather="external-link"></i>
        </button>
        <button class="tab-action-button close-tab" title="Close tab">
          <i data-feather="x"></i>
        </button>
      </div>
    `;
    
    // Replace Feather icons in the newly created element
    feather.replace(tabElement.querySelectorAll('[data-feather]'));
    
    // Add event listeners
    tabElement.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-actions')) {
        switchToTab(tab);
      }
    });
    
    tabElement.querySelector('.switch-tab').addEventListener('click', (e) => {
      e.stopPropagation();
      switchToTab(tab);
    });
    
    tabElement.querySelector('.close-tab').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab);
    });
    
    return tabElement;
  };

  // Switch to tab
  const switchToTab = (tab) => {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
    window.close(); // Close popup after switching
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
  sortButton.addEventListener('click', () => {
    document.querySelector('.dropdown').classList.toggle('active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.matches('#sort-button') && !e.target.closest('#sort-button')) {
      document.querySelector('.dropdown').classList.remove('active');
    }
  });

  // Event listeners for sort options
  dropdownContent.querySelectorAll('a').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentSort = e.target.dataset.sort;
      document.querySelector('.dropdown').classList.remove('active');
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

  // Listen for tab changes
  chrome.tabs.onCreated.addListener(fetchTabs);
  chrome.tabs.onRemoved.addListener(fetchTabs);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      fetchTabs();
    }
  });

  // Initial load
  fetchTabs();
});
