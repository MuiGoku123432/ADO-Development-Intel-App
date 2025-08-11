import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { SkeletonModule } from 'primeng/skeleton';

// Services - Simple Tauri ADO Service
import { TauriAdoService, WorkItemLite } from '../../../services/tauri/tauri-ado.service';

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
    SkeletonModule
  ],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss'
})
export class MyTasksComponent implements OnInit {
  private readonly tauriAdoService = inject(TauriAdoService);

  // Simple component state
  workItems = signal<WorkItemLite[]>([]);
  loading = signal<boolean>(false);

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

  // Utility methods for display
  getPriorityLabel(priority?: number): string {
    switch (priority) {
      case 1: return 'High';
      case 2: return 'Medium';
      case 3: return 'Low';
      case 4: return 'Critical';
      default: return 'None';
    }
  }

  getPrioritySeverity(priority?: number): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (priority) {
      case 1: case 4: return 'danger';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'secondary';
    }
  }

  getStateSeverity(state?: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch (state?.toLowerCase()) {
      case 'done': case 'closed': return 'success';
      case 'active': case 'in progress': return 'warning';
      case 'new': return 'info';
      default: return 'secondary';
    }
  }
}