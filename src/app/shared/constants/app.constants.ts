/**
 * Application-wide constants and configuration
 * 
 * This file centralizes all static configuration data used across components
 * to avoid duplication and ensure consistency.
 */

export const APP_CONSTANTS = {
  // Application metadata
  APP_NAME: 'ADO Development Intel',
  APP_VERSION: '1.0.0',
  
  // Dialog configurations
  DIALOG_SIZES: {
    SMALL: { width: '30vw', height: '40vh' },
    MEDIUM: { width: '50vw', height: '60vh' },
    LARGE: { width: '70vw', height: '80vh' },
    RESPONSIVE: {
      MOBILE: { width: '95vw', height: '70vh' },
      TABLET: { width: '80vw', height: '60vh' },
      DESKTOP: { width: '60vw', height: '60vh' }
    }
  },

  // Breakpoints for responsive design (matches PrimeFlex)
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  },

  // Table configurations
  TABLE_DEFAULTS: {
    ROWS_PER_PAGE: 10,
    ROWS_PER_PAGE_OPTIONS: [5, 10, 20, 50],
    CURRENT_PAGE_REPORT_TEMPLATE: 'Showing {first} to {last} of {totalRecords} entries'
  },

  // Loading states
  LOADING_DELAYS: {
    MINIMUM_DISPLAY: 500, // Minimum time to show loading state
    SKELETON_ITEMS: 5,    // Default number of skeleton items
    TIMEOUT: 30000        // Request timeout in ms
  },

  // ADO-specific constants
  ADO: {
    PRIORITY_LABELS: {
      1: 'Critical',
      2: 'High', 
      3: 'Medium',
      4: 'Low'
    },
    WORK_ITEM_STATES: {
      NEW: 'New',
      ACTIVE: 'Active',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
      REMOVED: 'Removed'
    },
    WORK_ITEM_TYPES: {
      BUG: 'Bug',
      TASK: 'Task',
      USER_STORY: 'User Story',
      FEATURE: 'Feature',
      EPIC: 'Epic'
    }
  }
} as const;

/**
 * Chatbot planned features - moved from MainframeComponent
 */
export const CHATBOT_FEATURES = [
  { label: '"List my open tasks"', category: 'workitems' },
  { label: '"Show repos with pending PRs"', category: 'repos' },
  { label: '"What builds failed today?"', category: 'pipelines' },
  { label: '"Create new work item"', category: 'workitems' },
  { label: '"Show team velocity"', category: 'analytics' },
  { label: '"List recent commits"', category: 'repos' },
  { label: '"Check pipeline status"', category: 'pipelines' },
  { label: '"Update work item state"', category: 'workitems' }
];

/**
 * Icon mappings for consistent iconography
 */
export const ICONS = {
  // Navigation
  USER: 'pi pi-user',
  WORK_ITEMS: 'pi pi-sitemap',
  REPOSITORIES: 'pi pi-code',
  PIPELINES: 'pi pi-sync',
  
  // Actions
  REFRESH: 'pi pi-refresh',
  SEARCH: 'pi pi-search',
  FILTER: 'pi pi-filter',
  EDIT: 'pi pi-pencil',
  DELETE: 'pi pi-trash',
  SAVE: 'pi pi-save',
  CANCEL: 'pi pi-times',
  
  // States
  SUCCESS: 'pi pi-check',
  WARNING: 'pi pi-exclamation-triangle',
  ERROR: 'pi pi-times-circle',
  INFO: 'pi pi-info-circle',
  
  // Communication
  CHAT: 'pi pi-comments',
  NOTIFICATIONS: 'pi pi-bell',
  EMAIL: 'pi pi-envelope',
  
  // Data
  EXPORT: 'pi pi-download',
  IMPORT: 'pi pi-upload',
  PRINT: 'pi pi-print',
  
  // Navigation
  BACK: 'pi pi-arrow-left',
  FORWARD: 'pi pi-arrow-right',
  UP: 'pi pi-arrow-up',
  DOWN: 'pi pi-arrow-down'
} as const;

/**
 * Theme configurations
 */
export const THEME_CONFIG = {
  DEFAULT_THEME: 'lara-light-purple',
  AVAILABLE_THEMES: [
    'lara-light-purple',
    'lara-dark-purple',
    'lara-light-blue',
    'lara-dark-blue'
  ],
  CUSTOM_PROPERTIES: {
    BORDER_RADIUS: '10px',
    CONTENT_PADDING: '1rem'
  }
} as const;

/**
 * Type definitions for better TypeScript support
 */
export type DialogSize = keyof typeof APP_CONSTANTS.DIALOG_SIZES;
export type IconKey = keyof typeof ICONS;
export type ThemeName = typeof THEME_CONFIG.AVAILABLE_THEMES[number];

export interface ChatbotFeature {
  label: string;
  category: 'workitems' | 'repos' | 'pipelines' | 'analytics';
}