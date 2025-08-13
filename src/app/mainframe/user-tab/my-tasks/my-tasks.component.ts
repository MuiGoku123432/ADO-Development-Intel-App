import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { SkeletonModule } from 'primeng/skeleton';
import { ToolbarModule } from 'primeng/toolbar';

// Services - Simple Tauri ADO Service
import { TauriAdoService, WorkItemLite } from '../../../services/tauri/tauri-ado.service';
import { DisplayHelpersService } from '../../../shared/utils/display-helpers.service';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { HideCompletedCheckboxComponent } from '../../../shared/components/hide-completed-checkbox/hide-completed-checkbox.component';
import { StateFilterDropdownComponent } from '../../../shared/components/state-filter-dropdown/state-filter-dropdown.component';
import { ProjectFilterDropdownComponent } from '../../../shared/components/project-filter-dropdown/project-filter-dropdown.component';

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
    SearchBarComponent,
    HideCompletedCheckboxComponent,
    StateFilterDropdownComponent,
    ProjectFilterDropdownComponent
  ],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss'
})
export class MyTasksComponent implements OnInit {
  private readonly tauriAdoService = inject(TauriAdoService);
  private readonly displayHelpers = inject(DisplayHelpersService);

  // Simple component state
  workItems = signal<WorkItemLite[]>([]);
  loading = signal<boolean>(false);
  
  // Search and filter state
  searchTerm = signal<string>('');
  hideCompleted = signal<boolean>(true);
  selectedState = signal<string | null>(null);
  selectedProject = signal<string | null>(null);

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
  }

  loadMyTasks(): void {
    console.log('📥 Loading my tasks using simple Tauri ADO service...');
    this.loading.set(true);
    
    this.tauriAdoService.getMyWorkItems().subscribe({
      next: (workItems: WorkItemLite[]) => {
        console.log('✅ Work items loaded:', workItems?.length || 0, 'items');
        this.workItems.set(workItems);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('❌ Failed to load work items:', error);
        this.loading.set(false);
      }
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
}