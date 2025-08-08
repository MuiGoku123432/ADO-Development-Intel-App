import { TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Table column configuration interface
 */
export interface TableColumn<T = any> {
  field: keyof T | string;               // Property path for data binding
  header: string;                        // Display header text
  sortable?: boolean;                   // Enable/disable sorting
  filterable?: boolean;                 // Enable/disable filtering
  width?: string;                       // Column width (e.g., '150px', '20%')
  minWidth?: string;                    // Minimum column width
  type?: ColumnType;                    // Data type for formatting
  template?: TemplateRef<any>;          // Custom cell template
  headerTemplate?: TemplateRef<any>;    // Custom header template
  sortField?: string;                   // Alternative sort field
  filterType?: FilterType;              // Filter input type
  filterOptions?: FilterOption[];       // Options for dropdown/multiselect filters
  align?: 'left' | 'center' | 'right'; // Text alignment
  frozen?: boolean;                     // Freeze column
  hidden?: boolean;                     // Hide column (for responsive)
  resizable?: boolean;                  // Allow column resizing
  reorderable?: boolean;                // Allow column reordering
  exportable?: boolean;                 // Include in export
  styleClass?: string;                  // Custom CSS class
}

/**
 * Column data types for built-in formatting
 */
export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  STATUS = 'status',
  PRIORITY = 'priority',
  USER = 'user',
  ACTIONS = 'actions',
  BADGE = 'badge',
  LINK = 'link',
  BOOLEAN = 'boolean',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage'
}

/**
 * Filter input types
 */
export enum FilterType {
  TEXT = 'text',
  DROPDOWN = 'dropdown',
  MULTISELECT = 'multiselect',
  DATE = 'date',
  DATERANGE = 'daterange',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SLIDER = 'slider'
}

/**
 * Filter option for dropdown/multiselect filters
 */
export interface FilterOption {
  label: string;
  value: any;
  icon?: string;
  color?: string;
}

/**
 * Table configuration interface
 */
export interface TableConfig<T = any> {
  columns: TableColumn<T>[];            // Column definitions
  data: T[];                            // Data source
  loading?: boolean;                    // Loading state
  paginator?: boolean;                  // Enable pagination
  rows?: number;                        // Rows per page
  rowsPerPageOptions?: number[];        // Page size options
  sortField?: string;                   // Default sort field
  sortOrder?: 1 | -1;                  // Default sort order (1 = ASC, -1 = DESC)
  multiSortMeta?: SortMeta[];           // Multiple column sorting
  globalFilter?: boolean;               // Enable global search
  globalFilterFields?: string[];        // Fields to include in global search
  selectionMode?: 'single' | 'multiple'; // Row selection
  selectedItems?: T[];                  // Selected rows
  actions?: TableAction<T>[];           // Action buttons/menu
  rowActions?: TableRowAction<T>[];     // Individual row actions
  bulkActions?: TableBulkAction<T>[];   // Bulk selection actions
  exportOptions?: ExportOption[];       // Export capabilities
  refreshable?: boolean;                // Show refresh button
  emptyMessage?: string;                // No data message
  responsiveLayout?: 'stack' | 'scroll'; // Mobile layout
  virtualScroll?: boolean;              // Virtual scrolling for large datasets
  lazy?: boolean;                       // Server-side operations
  totalRecords?: number;                // Total records for lazy loading
  filters?: { [key: string]: any };     // Applied filters
  contextMenu?: boolean;                // Enable right-click context menu
  expandableRows?: boolean;             // Allow row expansion
  groupBy?: string;                     // Group rows by field
  frozenColumns?: number;               // Number of frozen columns
  scrollable?: boolean;                 // Enable horizontal scrolling
  scrollHeight?: string;                // Table height for scrolling
  resizableColumns?: boolean;           // Allow column resizing
  reorderableColumns?: boolean;         // Allow column reordering
  autoLayout?: boolean;                 // Auto-size columns
}

/**
 * Sort metadata interface
 */
export interface SortMeta {
  field: string;
  order: 1 | -1;
}

/**
 * Table action for toolbar/header
 */
export interface TableAction<T = any> {
  label: string;
  icon: string;
  command: (selectedItems?: T[]) => void;
  visible?: boolean | ((selectedItems?: T[]) => boolean);
  disabled?: boolean | ((selectedItems?: T[]) => boolean);
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  tooltip?: string;
  requiresSelection?: boolean;          // Action requires selected items
  confirmMessage?: string;              // Show confirmation dialog
}

/**
 * Row-specific action
 */
export interface TableRowAction<T = any> {
  label: string;
  icon: string;
  command: (item: T) => void;
  visible?: boolean | ((item: T) => boolean);
  disabled?: boolean | ((item: T) => boolean);
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  tooltip?: string;
  confirmMessage?: string;              // Show confirmation dialog
}

/**
 * Bulk action for multiple selected items
 */
export interface TableBulkAction<T = any> {
  label: string;
  icon: string;
  command: (items: T[]) => void;
  visible?: boolean | ((items: T[]) => boolean);
  disabled?: boolean | ((items: T[]) => boolean);
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  tooltip?: string;
  confirmMessage?: string;              // Show confirmation dialog
  minSelection?: number;                // Minimum items required
  maxSelection?: number;                // Maximum items allowed
}

/**
 * Export options
 */
export interface ExportOption {
  label: string;
  icon: string;
  format: ExportFormat;
  filename?: string;
  command?: (data: any[], columns: TableColumn[]) => void;
}

/**
 * Export formats
 */
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json'
}

/**
 * Table events interface
 */
export interface TableEvents<T = any> {
  onRowSelect?: (event: { data: T; index: number }) => void;
  onRowUnselect?: (event: { data: T; index: number }) => void;
  onSelectAll?: (event: { data: T[] }) => void;
  onUnselectAll?: () => void;
  onRowExpand?: (event: { data: T }) => void;
  onRowCollapse?: (event: { data: T }) => void;
  onSort?: (event: SortEvent) => void;
  onFilter?: (event: FilterEvent) => void;
  onPage?: (event: PageEvent) => void;
  onColResize?: (event: { element: HTMLElement; delta: number }) => void;
  onColReorder?: (event: { dragIndex: number; dropIndex: number }) => void;
  onRowReorder?: (event: { dragIndex: number; dropIndex: number }) => void;
  onContextMenuSelect?: (event: { originalEvent: Event; data: T }) => void;
  onHeaderCheckboxToggle?: (event: { checked: boolean }) => void;
  onEditInit?: (event: { data: T; field: string }) => void;
  onEditComplete?: (event: { data: T; field: string; newValue: any }) => void;
  onEditCancel?: (event: { data: T; field: string }) => void;
}

/**
 * Sort event interface
 */
export interface SortEvent {
  field: string;
  order: 1 | -1;
  multiSortMeta?: SortMeta[];
}

/**
 * Filter event interface
 */
export interface FilterEvent {
  filters: { [key: string]: any };
  filteredValue: any[];
  globalFilter?: string;
}

/**
 * Page event interface
 */
export interface PageEvent {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}

/**
 * Table state for persistence
 */
export interface TableState {
  first?: number;                       // First row index
  rows?: number;                        // Rows per page
  sortField?: string;                   // Sort field
  sortOrder?: 1 | -1;                  // Sort order
  multiSortMeta?: SortMeta[];           // Multiple sorts
  filters?: { [key: string]: any };     // Applied filters
  globalFilter?: string;                // Global filter value
  selection?: any[];                    // Selected items
  expandedRows?: any[];                 // Expanded rows
  columnOrder?: string[];               // Column order
  columnWidths?: { [key: string]: string }; // Column widths
  hiddenColumns?: string[];             // Hidden columns
}

/**
 * Lazy loading event interface
 */
export interface LazyLoadEvent {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: 1 | -1;
  multiSortMeta?: SortMeta[];
  filters?: { [key: string]: any };
  globalFilter?: string;
}

/**
 * Table data source interface for lazy loading
 */
export interface TableDataSource<T = any> {
  loadData(event: LazyLoadEvent): Observable<{ data: T[]; totalRecords: number }>;
  deleteItem?(item: T): Observable<boolean>;
  updateItem?(item: T, changes: Partial<T>): Observable<T>;
  createItem?(item: Partial<T>): Observable<T>;
}

/**
 * Column visibility configuration
 */
export interface ColumnVisibility {
  field: string;
  header: string;
  visible: boolean;
  locked?: boolean;                     // Cannot be hidden
}

/**
 * Table density options
 */
export enum TableDensity {
  COMFORTABLE = 'comfortable',
  COMPACT = 'compact',
  CONDENSED = 'condensed'
}

/**
 * Built-in status configurations
 */
export interface StatusConfig {
  value: any;
  label: string;
  severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  icon?: string;
}

/**
 * Built-in priority configurations
 */
export interface PriorityConfig {
  value: any;
  label: string;
  severity: 'success' | 'info' | 'warning' | 'danger';
  icon?: string;
  order: number;                        // For sorting
}