import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listen } from '@tauri-apps/api/event';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { SkeletonModule } from 'primeng/skeleton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

// Services - Simple Tauri ADO Service
import { TauriAdoService, WorkItemLite, TransitionResponse, FieldsRequiredEvent, TransitionPreview } from '../../../services/tauri/tauri-ado.service';
import { DisplayHelpersService } from '../../../shared/utils/display-helpers.service';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { HideCompletedCheckboxComponent } from '../../../shared/components/hide-completed-checkbox/hide-completed-checkbox.component';
import { StateFilterDropdownComponent } from '../../../shared/components/state-filter-dropdown/state-filter-dropdown.component';
import { ProjectFilterDropdownComponent } from '../../../shared/components/project-filter-dropdown/project-filter-dropdown.component';
import { TransitionFieldsDialogComponent } from './transition-fields-dialog/transition-fields-dialog.component';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    PanelModule,
    SkeletonModule,
    ToolbarModule,
    TooltipModule,
    ToastModule,
    DialogModule,
    DynamicDialogModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    InputGroupModule,
    InputGroupAddonModule,
    MessageModule,
    SearchBarComponent,
    HideCompletedCheckboxComponent,
    StateFilterDropdownComponent,
    ProjectFilterDropdownComponent
  ],
  providers: [MessageService, DialogService],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss'
})
export class MyTasksComponent implements OnInit, OnDestroy {
  private readonly tauriAdoService = inject(TauriAdoService);
  private readonly displayHelpers = inject(DisplayHelpersService);
  private readonly messageService = inject(MessageService);
  private readonly dialogService = inject(DialogService);

  // Simple component state
  workItems = signal<WorkItemLite[]>([]);
  loading = signal<boolean>(false);
  
  // Search and filter state
  searchTerm = signal<string>('');
  hideCompleted = signal<boolean>(true);
  selectedState = signal<string | null>(null);
  selectedProject = signal<string | null>(null);
  
  // Dynamic transition state
  private eventListeners: Array<() => void> = [];
  private previewCache = new Map<number, TransitionPreview>();

  // Computed filtered work items
  filteredWorkItems = computed(() => {
    const items = this.workItems();
    const search = this.searchTerm().toLowerCase().trim();
    const hideCompletedTasks = this.hideCompleted();
    const stateFilter = this.selectedState();
    const projectFilter = this.selectedProject();
    
    console.log('🔄 MyTasks: Filtering items - stateFilter:', stateFilter, 'projectFilter:', projectFilter, 'hideCompleted:', hideCompletedTasks, 'search:', search);
    
    let filtered = items;
    
    // Apply search filter (by ID or title)
    if (search) {
      filtered = filtered.filter(item => {
        const idMatch = item.id.toString().includes(search);
        const titleMatch = item.title?.toLowerCase().includes(search) || false;
        return idMatch || titleMatch;
      });
      console.log('🔍 MyTasks: After search filter:', filtered.length, 'items');
    }
    
    // Apply project filter
    if (projectFilter) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(item => item.project_name === projectFilter);
      console.log('📂 MyTasks: Project filter applied - before:', beforeCount, 'after:', filtered.length, 'project:', projectFilter);
    }
    
    // Apply state filter (takes precedence over hide completed)
    if (stateFilter) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(item => item.state === stateFilter);
      console.log('🎯 MyTasks: State filter applied - before:', beforeCount, 'after:', filtered.length, 'state:', stateFilter);
    } else if (hideCompletedTasks) {
      // Only apply hide completed if no specific state is selected
      const completedStates = ['closed', 'resolved', 'done', 'completed', 'inactive', 'removed'];
      const beforeCount = filtered.length;
      filtered = filtered.filter(item => {
        const state = item.state?.toLowerCase() || '';
        const isCompleted = completedStates.includes(state);
        return !isCompleted;
      });
      console.log('👁️ MyTasks: Hide completed filter - before:', beforeCount, 'after:', filtered.length);
      
      // Debug: Show which items were filtered out
      const filteredOut = items.filter(item => {
        const state = item.state?.toLowerCase() || '';
        return completedStates.includes(state);
      });
      console.log('🚫 MyTasks: Filtered out items with states:', filteredOut.map(item => `${item.id}: ${item.state}`));
    }
    
    console.log('✅ MyTasks: Final filtered count:', filtered.length);
    return filtered;
  });

  constructor() {
    console.log('📋 Radically simplified MyTasksComponent initialized');
  }

  ngOnInit(): void {
    this.loadMyTasks();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    this.eventListeners.forEach(unlisten => unlisten());
  }

  private async setupEventListeners(): Promise<void> {
    console.log('🎧 MyTasks: Setting up Tauri event listeners');
    
    // Listen for transition completion events
    const transitionCompleteUnlisten = await listen('workitem:transition_complete', (event: any) => {
      console.log('✅ MyTasks: Transition completed:', event.payload);
      const { workItemId, targetState } = event.payload;
      
      this.messageService.add({
        severity: 'success',
        summary: 'State Changed',
        detail: `Work item ${workItemId} successfully moved to ${targetState}`,
        life: 5000
      });
      
      // Reload data to ensure complete sync
      this.loadMyTasks();
      
      console.log(`🔄 MyTasks: Updated work item ${workItemId} state to: ${targetState}`);
    });

    // Listen for fields required events (when additional fields are needed)
    const fieldsRequiredUnlisten = await listen('workitem:fields_required', (event: any) => {
      console.log('📝 MyTasks: Fields required for transition:', event.payload);
      const fieldsEvent = event.payload as FieldsRequiredEvent;
      
      // TODO: Open a dialog to collect the required fields
      // For now, just show an alert with the required fields
      this.handleFieldsRequired(fieldsEvent);
    });

    this.eventListeners.push(transitionCompleteUnlisten, fieldsRequiredUnlisten);
    console.log('✅ MyTasks: Event listeners setup complete');
  }

  private handleFieldsRequired(event: FieldsRequiredEvent): void {
    console.log('📋 MyTasks: Handling fields required:', event);
    
    // Open the dynamic dialog for field collection
    const dialogRef = this.dialogService.open(TransitionFieldsDialogComponent, {
      data: event,
      header: 'Complete Work Item Transition',
      width: '600px',
      modal: true,
      closable: true,
      dismissableMask: false,
      styleClass: 'transition-fields-dialog-container'
    });
    
    // Handle dialog result
    dialogRef.onClose.subscribe((fieldValues: Record<string, any> | null) => {
      if (fieldValues) {
        console.log('✅ MyTasks: User provided field values:', fieldValues);
        
        // Complete the transition with user-provided values
        this.tauriAdoService.finishTransition(event.correlation_id, fieldValues).subscribe({
          next: (result) => {
            console.log('✅ MyTasks: Transition completed with user values:', result);
            
            this.messageService.add({
              severity: 'success',
              summary: 'Transition Completed',
              detail: `Work item ${event.work_item_id} updated successfully`,
              life: 5000
            });
            
            // Refresh work items to show updated state
            this.loadMyTasks();
          },
          error: (error) => {
            console.error('❌ MyTasks: Failed to complete transition:', error);
            
            this.messageService.add({
              severity: 'error',
              summary: 'Transition Failed',
              detail: `Failed to complete transition for work item ${event.work_item_id}: ${error.message || error}`,
              life: 8000
            });
          }
        });
      } else {
        console.log('❌ MyTasks: User cancelled transition in dialog');
        
        this.messageService.add({
          severity: 'warn',
          summary: 'Transition Cancelled',
          detail: `Transition for work item ${event.work_item_id} was cancelled`,
          life: 3000
        });
      }
    });
  }

  loadMyTasks(): void {
    console.log('📥 Loading my tasks using simple Tauri ADO service...');
    this.loading.set(true);
    
    this.tauriAdoService.getMyWorkItems().subscribe({
      next: (workItems: WorkItemLite[]) => {
        console.log('✅ Work items loaded:', workItems?.length || 0, 'items');
        this.workItems.set(workItems);
        this.loading.set(false);
        
        // Show success toast when data loads
        this.messageService.add({
          severity: 'success',
          summary: 'Data Refreshed',
          detail: `Loaded ${workItems.length} work items`,
          life: 2000
        });
        
        // Load transition previews for dynamic icons/tooltips
        this.loadTransitionPreviews(workItems);
      },
      error: (error: any) => {
        console.error('❌ Failed to load work items:', error);
        this.loading.set(false);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to Load Data',
          detail: `Unable to load work items: ${error.message || error}`,
          life: 8000
        });
      }
    });
  }

  private loadTransitionPreviews(workItems: WorkItemLite[]): void {
    console.log('🔄 MyTasks: Loading transition previews for', workItems.length, 'work items');
    
    // Clear existing cache
    this.previewCache.clear();
    
    // Load previews for each work item (in parallel)
    workItems.forEach(item => {
      this.tauriAdoService.previewTransition(item.id).subscribe({
        next: (preview: TransitionPreview) => {
          this.previewCache.set(item.id, preview);
          console.log(`✅ MyTasks: Preview loaded for ${item.id}: ${preview.current_state} -> ${preview.target_state || 'none'}`);
        },
        error: (error: any) => {
          console.error(`❌ MyTasks: Failed to load preview for ${item.id}:`, error);
          // Set a "no transition available" preview
          this.previewCache.set(item.id, {
            work_item_id: item.id,
            current_state: item.state || 'Unknown',
            target_state: undefined,
            available: false
          });
          
          // Only show error toast if there are many failures (to avoid spam)
          // This is a background operation so we don't want to overwhelm users
          console.warn(`Preview loading failed for work item ${item.id}, transitions may not be available`);
        }
      });
    });
  }

  // Utility methods for display - now using shared service
  getPriorityLabel(priority?: number): string {
    return this.displayHelpers.getPriorityLabel(priority);
  }

  getPrioritySeverity(priority?: number): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return this.displayHelpers.getPrioritySeverity(priority);
  }

  getStateSeverity(state?: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return this.displayHelpers.getStateSeverity(state);
  }

  getProjectSeverity(project?: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    if (!project) return 'contrast';
    
    // Create consistent color mapping for projects using hash
    const colors: ('success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast')[] = [
      'success', 'info', 'warning', 'secondary', 'danger', 'contrast'
    ];
    
    // Simple hash function to consistently assign colors to projects
    let hash = 0;
    for (let i = 0; i < project.length; i++) {
      hash = ((hash << 5) - hash) + project.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  // Dynamic state transition logic using ADO API data
  getTransitionIcon(workItem: WorkItemLite): string {
    const preview = this.previewCache.get(workItem.id);
    
    if (!preview || !preview.available || !preview.target_state) {
      return 'pi pi-ban'; // No transition available
    }
    
    // Use target state to determine appropriate icon
    const targetState = preview.target_state.toLowerCase();
    
    switch (true) {
      case targetState.includes('active') || targetState.includes('progress'):
        return 'pi pi-play'; // Start work
      case targetState.includes('resolved') || targetState.includes('completed') || targetState.includes('done'):
        return 'pi pi-check'; // Mark complete/resolved
      case targetState.includes('closed') || targetState.includes('inactive'):
        return 'pi pi-lock'; // Close item
      default:
        return 'pi pi-arrow-right'; // Generic next step
    }
  }

  getTransitionTooltip(workItem: WorkItemLite): string {
    const preview = this.previewCache.get(workItem.id);
    
    if (!preview || !preview.available || !preview.target_state) {
      return 'No transition available';
    }
    
    return `Move to ${preview.target_state}`;
  }

  isTransitionAvailable(workItem: WorkItemLite): boolean {
    const preview = this.previewCache.get(workItem.id);
    return preview?.available || false;
  }

  // Search and filter event handlers
  onSearchChanged(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
    console.log('🔍 MyTasks: Search term changed:', searchTerm);
    console.log('📊 MyTasks: Current filtered items count:', this.filteredWorkItems().length);
  }

  onHideCompletedChanged(hideCompleted: boolean): void {
    this.hideCompleted.set(hideCompleted);
    console.log('👁️ MyTasks: Hide completed changed:', hideCompleted);
    console.log('📈 MyTasks: Total work items:', this.workItems().length);
    console.log('📉 MyTasks: Filtered items count:', this.filteredWorkItems().length);
    
    // Debug: Show what states are present in the data
    const states = this.workItems().map(item => item.state).filter(Boolean);
    const uniqueStates = [...new Set(states)];
    console.log('🏷️ MyTasks: Available work item states:', uniqueStates);
  }

  onStateFilterChanged(selectedState: string | null): void {
    this.selectedState.set(selectedState);
    console.log('🎯 MyTasks: State filter changed:', selectedState);
    console.log('📈 MyTasks: Total work items:', this.workItems().length);
    console.log('📉 MyTasks: Filtered items count:', this.filteredWorkItems().length);
    
    if (selectedState) {
      console.log('🔍 MyTasks: Filtering by specific state:', selectedState);
    } else {
      console.log('🔄 MyTasks: Showing all states (subject to other filters)');
    }
  }

  onProjectFilterChanged(selectedProject: string | null): void {
    this.selectedProject.set(selectedProject);
    console.log('📂 MyTasks: Project filter changed:', selectedProject);
    console.log('📈 MyTasks: Total work items:', this.workItems().length);
    console.log('📉 MyTasks: Filtered items count:', this.filteredWorkItems().length);
    
    if (selectedProject) {
      console.log('🔍 MyTasks: Filtering by specific project:', selectedProject);
    } else {
      console.log('🔄 MyTasks: Showing all projects (subject to other filters)');
    }
    
    // Debug: Show what projects are present in the data
    const projects = this.workItems().map(item => item.project_name).filter(Boolean);
    const uniqueProjects = [...new Set(projects)];
    console.log('🏷️ MyTasks: Available work item projects:', uniqueProjects);
  }

  // Action handlers
  onEditWorkItem(item: WorkItemLite): void {
    console.log('✏️ MyTasks: Edit work item:', item.id);
    // TODO: Open edit dialog/form
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Work Item',
      detail: `Edit functionality for work item ${item.id} coming soon`,
      life: 3000
    });
  }

  onAttachFiles(item: WorkItemLite): void {
    console.log('📎 MyTasks: Attach files to work item:', item.id);
    // TODO: Open file attachment dialog
    this.messageService.add({
      severity: 'info',
      summary: 'Attach Files',
      detail: `File attachment for work item ${item.id} coming soon`,
      life: 3000
    });
  }

  onStateTransition(item: WorkItemLite): void {
    console.log(`🔄 MyTasks: Starting dynamic state transition for work item ${item.id} (current: ${item.state})`);
    
    // Show processing toast
    this.messageService.add({
      severity: 'info',
      summary: 'Processing Transition',
      detail: `Transitioning work item ${item.id}...`,
      life: 2000
    });
    
    // Use the new dynamic transition API
    this.tauriAdoService.beginTransition(item.id).subscribe({
      next: (response: TransitionResponse) => {
        console.log('✅ MyTasks: Transition response received:', response);
        
        if (response.status === 'completed') {
          // Transition completed immediately
          console.log(`🎯 MyTasks: Immediate transition completed to: ${response.target_state}`);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Transition Successful',
            detail: `Work item ${item.id} moved to ${response.target_state}`,
            life: 5000
          });
          
          // Reload data to ensure UI is in sync
          this.loadMyTasks();
          
        } else if (response.status === 'pending') {
          // Additional fields required - will be handled by event listener
          console.log(`⏳ MyTasks: Transition pending - waiting for fields required event`);
          
          this.messageService.add({
            severity: 'info',
            summary: 'Additional Fields Required',
            detail: `Work item ${item.id} transition requires additional information`,
            life: 4000
          });
        }
      },
      error: (error) => {
        console.error('❌ MyTasks: Failed to start transition:', error);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Transition Failed',
          detail: `Failed to transition work item ${item.id}: ${error.message || error}`,
          life: 8000
        });
      }
    });
  }
}