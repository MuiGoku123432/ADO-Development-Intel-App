import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  ViewChild,
  TemplateRef,
  ContentChild,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

// Shared Components
import { LoadingSpinnerComponent, SkeletonItem } from '../loading-spinner/loading-spinner.component';

import { 
  TableConfig, 
  TableColumn, 
  TableEvents, 
  TableState,
  SortEvent,
  FilterEvent,
  PageEvent,
  LazyLoadEvent,
  ColumnType,
  FilterType,
  TableAction,
  TableRowAction,
  TableBulkAction,
  ColumnVisibility,
  StatusConfig,
  PriorityConfig
} from '../../models/table.interface';

@Component({
  selector: 'app-shared-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    SliderModule,
    CheckboxModule,
    MenuModule,
    TooltipModule,
    ProgressSpinnerModule,
    SkeletonModule,
    ConfirmDialogModule,
    DialogModule,
    TagModule,
    AvatarModule,
    BadgeModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './shared-data-table.component.html',
  styleUrl: './shared-data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedDataTableComponent<T = any> implements OnInit, OnDestroy {
  @ViewChild('dataTable') dataTable!: Table;
  
  // Configuration Input
  @Input({ required: true }) config!: TableConfig<T>;
  @Input() events?: TableEvents<T>;
  @Input() stateKey?: string;                    // For state persistence
  @Input() customTemplates?: { [key: string]: TemplateRef<any> };

  // Content Projection
  @ContentChild('rowExpansionTemplate') rowExpansionTemplate?: TemplateRef<any>;
  @ContentChild('emptyTemplate') emptyTemplate?: TemplateRef<any>;
  @ContentChild('loadingTemplate') loadingTemplate?: TemplateRef<any>;

  // Event Outputs
  @Output() stateChange = new EventEmitter<TableState>();
  @Output() lazyLoad = new EventEmitter<LazyLoadEvent>();
  @Output() refresh = new EventEmitter<void>();
  @Output() configChange = new EventEmitter<TableConfig<T>>();

  // Component State
  loading = signal<boolean>(false);
  globalFilterValue = signal<string>('');
  selectedItems = signal<T[]>([]);
  expandedRows = signal<{ [key: string]: boolean }>({});
  columnVisibility = signal<ColumnVisibility[]>([]);
  
  // Column Management Dialog
  showColumnDialog = signal<boolean>(false);
  
  // Filter Values
  columnFilters = signal<{ [key: string]: any }>({});
  
  // Computed Properties
  visibleColumns = computed(() => 
    this.config?.columns?.filter(col => !col.hidden) || []
  );
  
  hasActions = computed(() => 
    (this.config?.actions?.length ?? 0) > 0 || 
    (this.config?.rowActions?.length ?? 0) > 0 || 
    (this.config?.bulkActions?.length ?? 0) > 0
  );

  hasSelection = computed(() => 
    this.config?.selectionMode === 'multiple'
  );

  // Built-in Status Configurations
  readonly defaultStatusConfigs: StatusConfig[] = [
    { value: 'Active', label: 'Active', severity: 'info', icon: 'pi pi-circle' },
    { value: 'New', label: 'New', severity: 'success', icon: 'pi pi-plus-circle' },
    { value: 'Resolved', label: 'Resolved', severity: 'warning', icon: 'pi pi-check-circle' },
    { value: 'Closed', label: 'Closed', severity: 'secondary', icon: 'pi pi-times-circle' },
    { value: 'In Progress', label: 'In Progress', severity: 'info', icon: 'pi pi-spin pi-spinner' },
    { value: 'Done', label: 'Done', severity: 'success', icon: 'pi pi-check' },
    { value: 'Blocked', label: 'Blocked', severity: 'danger', icon: 'pi pi-ban' }
  ];

  readonly defaultPriorityConfigs: PriorityConfig[] = [
    { value: 1, label: 'High', severity: 'danger', icon: 'pi pi-arrow-up', order: 1 },
    { value: 2, label: 'Medium', severity: 'warning', icon: 'pi pi-minus', order: 2 },
    { value: 3, label: 'Low', severity: 'info', icon: 'pi pi-arrow-down', order: 3 },
    { value: 4, label: 'Critical', severity: 'danger', icon: 'pi pi-exclamation-triangle', order: 0 }
  ];

  constructor() {
    // Sync loading state from config
    effect(() => {
      this.loading.set(this.config?.loading || false);
    });

    // Sync selected items from config
    effect(() => {
      if (this.config?.selectedItems) {
        this.selectedItems.set(this.config.selectedItems);
      }
    });

    // Initialize column visibility
    effect(() => {
      if (this.config?.columns) {
        const visibility = this.config.columns.map(col => ({
          field: col.field as string,
          header: col.header,
          visible: !col.hidden,
          locked: col.type === ColumnType.ACTIONS
        }));
        this.columnVisibility.set(visibility);
      }
    });
  }

  ngOnInit(): void {
    this.initializeTable();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initializeTable(): void {
    // Load persisted state if stateKey is provided
    if (this.stateKey) {
      this.loadTableState();
    }

    // Set initial global filter
    if (this.config.globalFilter) {
      this.globalFilterValue.set('');
    }
  }

  private loadTableState(): void {
    try {
      const savedState = localStorage.getItem(`table-state-${this.stateKey}`);
      if (savedState) {
        const state: TableState = JSON.parse(savedState);
        // Apply saved state to table
        this.applyTableState(state);
      }
    } catch (error) {
      console.warn('Failed to load table state:', error);
    }
  }

  private saveTableState(): void {
    if (!this.stateKey) return;

    try {
      const state: TableState = {
        first: this.dataTable?.first || 0,
        rows: this.dataTable?.rows || this.config.rows || 10,
        sortField: this.dataTable?.sortField || undefined,
        sortOrder: (this.dataTable?.sortOrder as 1 | -1) || undefined,
        filters: this.dataTable?.filters || {},
        globalFilter: this.globalFilterValue(),
        selection: this.selectedItems(),
        columnOrder: this.visibleColumns().map(col => col.field as string),
        hiddenColumns: this.config.columns?.filter(col => col.hidden)
                          .map(col => col.field as string) || []
      };

      localStorage.setItem(`table-state-${this.stateKey}`, JSON.stringify(state));
      this.stateChange.emit(state);
    } catch (error) {
      console.warn('Failed to save table state:', error);
    }
  }

  private applyTableState(state: TableState): void {
    if (state.globalFilter) {
      this.globalFilterValue.set(state.globalFilter);
    }
    if (state.selection) {
      this.selectedItems.set(state.selection);
    }
    if (state.hiddenColumns) {
      state.hiddenColumns.forEach(field => {
        const column = this.config.columns?.find(col => col.field === field);
        if (column) {
          column.hidden = true;
        }
      });
    }
  }

  // Event Handlers
  onSort(event: SortEvent): void {
    this.events?.onSort?.(event);
    this.saveTableState();
  }

  onFilter(event: any): void {
    this.events?.onFilter?.(event);
    this.saveTableState();
  }

  onPage(event: any): void {
    this.events?.onPage?.(event);
    this.saveTableState();
  }

  onRowSelect(event: any): void {
    if (event.data) {
      this.events?.onRowSelect?.({ data: event.data, index: event.index });
    }
    this.updateSelectedItems();
  }

  onRowUnselect(event: any): void {
    if (event.data) {
      this.events?.onRowUnselect?.({ data: event.data, index: event.index });
    }
    this.updateSelectedItems();
  }

  onSelectAll(event: { data: T[] }): void {
    this.events?.onSelectAll?.(event);
    this.updateSelectedItems();
  }

  onUnselectAll(): void {
    this.events?.onUnselectAll?.();
    this.updateSelectedItems();
  }

  onSelectAllChange(event: any): void {
    if (event.checked) {
      this.onSelectAll({ data: this.config.data });
    } else {
      this.onUnselectAll();
    }
  }

  private updateSelectedItems(): void {
    // Update selected items signal and emit config change
    const newConfig = { ...this.config };
    newConfig.selectedItems = this.dataTable?.selection || [];
    this.selectedItems.set(newConfig.selectedItems || []);
    this.configChange.emit(newConfig);
    this.saveTableState();
  }

  onLazyLoad(event: any): void {
    this.lazyLoad.emit(event);
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    this.dataTable?.filterGlobal(value, 'contains');
  }

  // Action Handlers
  executeAction(action: TableAction<T>): void {
    const selectedItems = this.selectedItems();
    
    if (action.requiresSelection && selectedItems.length === 0) {
      return;
    }

    if (action.confirmMessage) {
      // TODO: Implement confirmation dialog
      console.log('Confirmation needed:', action.confirmMessage);
    }

    action.command(selectedItems);
  }

  executeRowAction(action: TableRowAction<T>, item: T): void {
    if (action.confirmMessage) {
      // TODO: Implement confirmation dialog
      console.log('Confirmation needed:', action.confirmMessage);
    }

    action.command(item);
  }

  executeBulkAction(action: TableBulkAction<T>): void {
    const selectedItems = this.selectedItems();
    
    if (action.minSelection && selectedItems.length < action.minSelection) {
      return;
    }
    
    if (action.maxSelection && selectedItems.length > action.maxSelection) {
      return;
    }

    if (action.confirmMessage) {
      // TODO: Implement confirmation dialog
      console.log('Confirmation needed:', action.confirmMessage);
    }

    action.command(selectedItems);
  }

  // Utility Methods
  getFieldValue(item: T, field: string | number | symbol): any {
    const fieldStr = String(field);
    return fieldStr.split('.').reduce((obj: any, key: string) => obj?.[key], item);
  }

  formatCellValue(item: T, column: TableColumn<T>): any {
    const value = this.getFieldValue(item, column.field as string);
    
    switch (column.type) {
      case ColumnType.DATE:
        return value ? new Date(value).toLocaleDateString() : '';
      case ColumnType.DATETIME:
        return value ? new Date(value).toLocaleString() : '';
      case ColumnType.NUMBER:
        return typeof value === 'number' ? value.toLocaleString() : value;
      case ColumnType.CURRENCY:
        return typeof value === 'number' ? 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : value;
      case ColumnType.PERCENTAGE:
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value;
      case ColumnType.BOOLEAN:
        return value ? 'Yes' : 'No';
      default:
        return value;
    }
  }

  getStatusConfig(value: any): StatusConfig {
    return this.defaultStatusConfigs.find(config => config.value === value) || 
           { value, label: String(value), severity: 'secondary' as const };
  }

  getPriorityConfig(value: any): PriorityConfig {
    return this.defaultPriorityConfigs.find(config => config.value === value) || 
           { value, label: String(value), severity: 'info' as const, order: 999 };
  }

  getUserDisplayName(user: any): string {
    if (!user) return '';
    return user.displayName || user.name || user.uniqueName || String(user);
  }

  isActionDisabled(action: TableRowAction<T>, item: T): boolean {
    if (!action.disabled) return false;
    return typeof action.disabled === 'function' ? action.disabled(item) : action.disabled;
  }

  getFieldAsString(field: string | number | symbol): string {
    return String(field);
  }

  getUserAvatar(user: any): string {
    if (!user) return '';
    return user.imageUrl || user.avatarUrl || '';
  }

  // Column Management
  toggleColumn(field: string): void {
    const column = this.config.columns?.find(col => col.field === field);
    if (column && !column.frozen) {
      column.hidden = !column.hidden;
      this.saveTableState();
    }
  }

  resetColumns(): void {
    this.config.columns?.forEach(col => {
      if (!col.frozen) {
        col.hidden = false;
      }
    });
    this.saveTableState();
  }

  showColumnManager(): void {
    this.showColumnDialog.set(true);
  }

  hideColumnManager(): void {
    this.showColumnDialog.set(false);
  }

  // Export Methods
  exportCSV(): void {
    this.dataTable?.exportCSV();
  }

  exportExcel(): void {
    // TODO: Implement Excel export
    console.log('Excel export not implemented yet');
  }

  exportPDF(): void {
    // TODO: Implement PDF export
    console.log('PDF export not implemented yet');
  }

  // Accessibility
  getAriaLabel(column: TableColumn<T>): string {
    let label = column.header;
    if (column.sortable) {
      label += ', sortable';
    }
    if (column.filterable) {
      label += ', filterable';
    }
    return label;
  }

  /**
   * Generate skeleton items for table loading state
   */
  getTableSkeletons(): SkeletonItem[] {
    const columnCount = this.visibleColumns().length || 6;
    const rowCount = this.config.rows || 5;
    
    return LoadingSpinnerComponent.createTableSkeletons(rowCount, columnCount);
  }
}