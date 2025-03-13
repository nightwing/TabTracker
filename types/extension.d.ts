/**
 * Type definitions for the tab manager browser extension
 */

declare namespace TabManager {
  /**
   * Represents a YouTube video in a queue
   */
  export interface YouTubeVideo {
    title: string;
    url: string;
    videoId: string;
    timestamp?: number; // Optional timestamp in seconds
  }

  /**
   * Extended Tab interface with custom properties
   */
  export interface TabWithRelationship extends chrome.tabs.Tab {
    parentTabId?: number;               // ID of the parent tab from which this tab was opened
    childTabs?: number[];               // IDs of tabs opened from this tab
    lastAccessed?: number;              // Timestamp when the tab was last accessed
    youtubeQueue?: YouTubeVideo[];      // YouTube video queue if this is a YouTube tab
    hasRestoredQueue?: boolean;         // Whether the queue was restored from saved state
  }

  /**
   * Custom Tab Group
   */
  export interface CustomTabGroup {
    id: string;                         // Unique identifier for the group
    name: string;                       // Display name
    color: string;                      // Color theme (e.g., 'blue', 'red', etc.)
    tabIds: number[];                   // IDs of tabs in this group
    createdAt: number;                  // Creation timestamp
    updatedAt: number;                  // Last update timestamp
  }

  /**
   * Tab Group State
   */
  export interface TabGroupState {
    groups: CustomTabGroup[];
  }

  /**
   * Expanded State for Tree View
   */
  export interface ExpandedState {
    [key: string]: boolean;             // Maps element IDs to expanded state
  }

  /**
   * Filter State
   */
  export interface FilterState {
    searchTerm: string;                 // Current search term
    currentWindowOnly: boolean;         // Whether to show only tabs in current window
    sortBy: 'title' | 'domain' | 'recent'; // Sort method
    groupBy: 'domain' | 'window' | 'custom'; // Grouping method
  }

  /**
   * Tab Relationship Data
   */
  export interface TabRelationships {
    [tabId: string]: {
      parentTabId?: number;
      childTabs?: number[];
    };
  }

  /**
   * Extension Settings
   */
  export interface ExtensionSettings {
    treeViewEnabled: boolean;           // Whether to use tree view for tab relationships
    autoGroupTabs: boolean;             // Whether to automatically group tabs by domain
    saveTabHistory: boolean;            // Whether to save tab history
    maxHistoryItems: number;            // Maximum number of history items to save
    preserveYouTubeQueues: boolean;     // Whether to preserve YouTube video queues
    darkMode: boolean;                  // Whether to use dark mode
    compactView: boolean;               // Whether to use compact view
    defaultGroupBy: 'domain' | 'window' | 'custom'; // Default grouping method
    defaultSortBy: 'title' | 'domain' | 'recent';   // Default sort method
  }

  /**
   * Message Types for communication between components
   */
  export type MessageType = 
    | 'GET_TABS'
    | 'TABS_UPDATED'
    | 'SWITCH_TO_TAB'
    | 'CLOSE_TAB'
    | 'CREATE_GROUP'
    | 'UPDATE_GROUP'
    | 'DELETE_GROUP'
    | 'ADD_TABS_TO_GROUP'
    | 'REMOVE_TABS_FROM_GROUP'
    | 'UPDATE_SETTINGS'
    | 'GET_SETTINGS'
    | 'SAVE_FILTER_STATE'
    | 'GET_YOUTUBE_QUEUE';

  /**
   * Message interface for extension messaging
   */
  export interface ExtensionMessage {
    type: MessageType;
    payload?: any;
  }

  /**
   * Message Response interface
   */
  export interface MessageResponse {
    success: boolean;
    data?: any;
    error?: string;
  }
}