import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { Subject, takeUntil, debounceTime, switchMap } from 'rxjs';

// Shared Components
import { SharedDataTableComponent } from '../../../shared/components/data-table/shared-data-table.component';

// Models and Interfaces
import { 
  TableConfig, 
  TableColumn, 
  TableAction, 
  TableRowAction,
  TableBulkAction,
  ColumnType,
  FilterType
} from '../../../shared/models/table.interface';
import { WorkItem } from '../../../services/models/ado/work-item.interface';

// Services
import { WORK_ITEMS_SERVICE, IWorkItemsService } from '../../../services/providers/api.providers';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    SharedDataTableComponent
  ],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss'
})
export class MyTasksComponent implements OnInit, OnDestroy {
  private readonly workItemsService: IWorkItemsService = inject(WORK_ITEMS_SERVICE);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    console.log('📋 MyTasksComponent initialized');
    console.log('🔧 WorkItemsService injected:', !!this.workItemsService);
  }

  // Component State
  workItems = signal<WorkItem[]>([]);
  loading = signal<boolean>(false);
  selectedItems = signal<WorkItem[]>([]);
  showCreateTaskDialog = signal<boolean>(false);

  // Computed Summary Statistics
  activeTasks = computed(() => 
    this.workItems().filter(item => item.fields['System.State'] !== 'Done').length
  );
  
  highPriorityTasks = computed(() => 
    this.workItems().filter(item => item.fields['Microsoft.VSTS.Common.Priority'] === 1).length
  );
  
  thisWeekTasks = computed(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.workItems().filter(item => 
      new Date(item.fields['System.ChangedDate']) >= oneWeekAgo
    ).length;
  });

  // Table Configuration
  tableConfig = signal<TableConfig<WorkItem>>({
    columns: this.getWorkItemColumns(),
    data: [],
    loading: false,
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [10, 25, 50],
    sortField: 'fields.System.ChangedDate',
    sortOrder: -1,
    globalFilter: true,
    globalFilterFields: ['fields.System.Title', 'fields.System.Description', 'fields.System.AssignedTo.displayName'],
    selectionMode: 'multiple',
    selectedItems: [],
    actions: this.getTableActions(),
    rowActions: this.getRowActions(),
    bulkActions: this.getBulkActions(),
    refreshable: true,
    emptyMessage: 'No tasks found',
    responsiveLayout: 'scroll',
    resizableColumns: true
  });

  ngOnInit(): void {
    console.log('🔄 MyTasksComponent ngOnInit - starting data load');
    this.loadMyTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getWorkItemColumns(): TableColumn<WorkItem>[] {
    return [
      {
        field: 'fields.System.Id',
        header: 'ID',
        width: '80px',
        type: ColumnType.NUMBER,
        sortable: true,
        frozen: true,
        align: 'center'
      },
      {
        field: 'fields.System.Title',
        header: 'Title',
        sortable: true,
        filterable: true,
        filterType: FilterType.TEXT,
        width: '300px',
        minWidth: '200px'
      },
      {
        field: 'fields.System.WorkItemType',
        header: 'Type',
        width: '120px',
        type: ColumnType.BADGE,
        sortable: true,
        filterable: true,
        filterType: FilterType.DROPDOWN,
        filterOptions: [
          { label: 'Task', value: 'Task', icon: 'pi pi-check-square' },
          { label: 'Bug', value: 'Bug', icon: 'pi pi-bug' },
          { label: 'User Story', value: 'User Story', icon: 'pi pi-user' },
          { label: 'Feature', value: 'Feature', icon: 'pi pi-star' },
          { label: 'Epic', value: 'Epic', icon: 'pi pi-bookmark' }
        ]
      },
      {
        field: 'fields.System.State',
        header: 'State',
        width: '130px',
        type: ColumnType.STATUS,
        sortable: true,
        filterable: true,
        filterType: FilterType.MULTISELECT,
        filterOptions: [
          { label: 'New', value: 'New', color: 'success' },
          { label: 'Active', value: 'Active', color: 'info' },
          { label: 'In Progress', value: 'In Progress', color: 'warning' },
          { label: 'Resolved', value: 'Resolved', color: 'warning' },
          { label: 'Done', value: 'Done', color: 'success' },
          { label: 'Closed', value: 'Closed', color: 'secondary' }
        ]
      },
      {
        field: 'fields.Microsoft.VSTS.Common.Priority',
        header: 'Priority',
        width: '120px',
        type: ColumnType.PRIORITY,
        sortable: true,
        filterable: true,
        filterType: FilterType.DROPDOWN,
        filterOptions: [
          { label: 'Critical', value: 4, color: 'danger' },
          { label: 'High', value: 1, color: 'danger' },
          { label: 'Medium', value: 2, color: 'warning' },
          { label: 'Low', value: 3, color: 'info' }
        ],
        align: 'center'
      },
      {
        field: 'fields.System.AssignedTo',
        header: 'Assigned To',
        width: '180px',
        type: ColumnType.USER,
        sortable: true,
        filterable: true,
        filterType: FilterType.TEXT
      },
      {
        field: 'fields.Microsoft.VSTS.Scheduling.StoryPoints',
        header: 'Story Points',
        width: '110px',
        type: ColumnType.NUMBER,
        sortable: true,
        align: 'center'
      },
      {
        field: 'fields.System.CreatedDate',
        header: 'Created',
        width: '130px',
        type: ColumnType.DATE,
        sortable: true,
        filterable: true,
        filterType: FilterType.DATE
      },
      {
        field: 'fields.System.ChangedDate',
        header: 'Updated',
        width: '130px',
        type: ColumnType.DATE,
        sortable: true,
        filterable: true,
        filterType: FilterType.DATE
      },
      {
        field: 'actions',
        header: 'Actions',
        width: '140px',
        type: ColumnType.ACTIONS,
        frozen: true
      }
    ];
  }

  private getTableActions(): TableAction<WorkItem>[] {
    return [
      {
        label: 'Create Task',
        icon: 'pi pi-plus',
        severity: 'primary',
        command: () => this.openCreateTaskDialog(),
        tooltip: 'Create new task'
      },
      {
        label: 'Refresh',
        icon: 'pi pi-refresh',
        severity: 'secondary',
        command: () => this.loadMyTasks(),
        tooltip: 'Refresh task list'
      }
    ];
  }

  private getRowActions(): TableRowAction<WorkItem>[] {
    return [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        severity: 'info',
        command: (item) => this.editTask(item),
        tooltip: 'Edit task'
      },
      {
        label: 'Complete',
        icon: 'pi pi-check',
        severity: 'success',
        command: (item) => this.completeTask(item),
        visible: (item) => item.fields['System.State'] !== 'Done',
        tooltip: 'Mark as complete'
      },
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        severity: 'secondary',
        command: (item) => this.viewTaskDetails(item),
        tooltip: 'View full details'
      }
    ];
  }

  private getBulkActions(): TableBulkAction<WorkItem>[] {
    return [
      {
        label: 'Mark Complete',
        icon: 'pi pi-check-circle',
        severity: 'success',
        command: (items) => this.bulkCompleteTask(items),
        tooltip: 'Mark selected tasks as complete'
      },
      {
        label: 'Change Priority',
        icon: 'pi pi-flag',
        severity: 'warning',
        command: (items) => this.bulkChangePriority(items),
        tooltip: 'Change priority for selected tasks'
      },
      {
        label: 'Assign To Me',
        icon: 'pi pi-user',
        severity: 'info',
        command: (items) => this.bulkAssignToMe(items),
        tooltip: 'Assign selected tasks to me'
      }
    ];
  }

  private loadMyTasks(): void {
    console.log('📥 Loading my tasks...');
    this.loading.set(true);
    
    this.workItemsService.getMyWorkItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workItems: WorkItem[]) => {
          console.log('✅ Work items loaded successfully:', workItems?.length || 0, 'items');
          this.workItems.set(workItems);
          this.updateTableConfig({ data: workItems, loading: false });
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('❌ Failed to load work items:', error);
          this.loading.set(false);
          this.updateTableConfig({ loading: false });
        }
      });
  }

  private updateTableConfig(updates: Partial<TableConfig<WorkItem>>): void {
    this.tableConfig.update(config => ({ ...config, ...updates }));
  }

  // Action Handlers
  openCreateTaskDialog(): void {
    this.showCreateTaskDialog.set(true);
  }

  closeCreateTaskDialog(): void {
    this.showCreateTaskDialog.set(false);
  }

  editTask(item: WorkItem): void {
    console.log('Edit task:', item);
    // TODO: Implement edit functionality
  }

  completeTask(item: WorkItem): void {
    console.log('Complete task:', item);
    // TODO: Implement complete functionality
  }

  viewTaskDetails(item: WorkItem): void {
    console.log('View task details:', item);
    // TODO: Implement detail view
  }

  bulkCompleteTask(items: WorkItem[]): void {
    console.log('Bulk complete tasks:', items);
    // TODO: Implement bulk complete
  }

  bulkChangePriority(items: WorkItem[]): void {
    console.log('Bulk change priority:', items);
    // TODO: Implement bulk priority change
  }

  bulkAssignToMe(items: WorkItem[]): void {
    console.log('Bulk assign to me:', items);
    // TODO: Implement bulk assign
  }

  // Event Handlers
  onTableRefresh(): void {
    this.loadMyTasks();
  }

  onTableConfigChange(config: TableConfig<WorkItem>): void {
    this.tableConfig.set(config);
    this.selectedItems.set(config.selectedItems || []);
  }
}