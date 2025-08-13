import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { WorkItemLite } from '../../../services/tauri/tauri-ado.service';

interface ProjectOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-project-filter-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule
  ],
  templateUrl: './project-filter-dropdown.component.html',
  styleUrl: './project-filter-dropdown.component.scss'
})
export class ProjectFilterDropdownComponent implements OnInit, OnChanges, DoCheck {
  @Input() workItems: WorkItemLite[] = [];
  @Output() projectFilterChanged = new EventEmitter<string | null>();

  selectedProject: string | null = null;
  projectOptions: ProjectOption[] = [];
  private previousSelectedProject: string | null = null;

  ngOnInit() {
    console.log('🚀 ProjectFilterDropdown: Initializing with', this.workItems.length, 'work items');
    this.updateProjectOptions();
    
    // Emit initial state (null = All Projects)
    console.log('📤 ProjectFilterDropdown: Emitting initial state: null (All Projects)');
    this.projectFilterChanged.emit(null);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['workItems']) {
      console.log('🔄 ProjectFilterDropdown: Work items changed, updating options');
      this.updateProjectOptions();
    }
  }

  ngDoCheck() {
    // Detect changes to selectedProject from ngModel
    if (this.selectedProject !== this.previousSelectedProject) {
      console.log('🎯 ProjectFilterDropdown: Selected project changed to:', this.selectedProject);
      this.projectFilterChanged.emit(this.selectedProject);
      this.previousSelectedProject = this.selectedProject;
    }
  }

  private updateProjectOptions() {
    // Extract unique projects from work items
    const uniqueProjects = [...new Set(
      this.workItems
        .map(item => item.project_name)
        .filter(Boolean) // Remove null/undefined projects
    )].sort(); // Sort alphabetically

    // Create dropdown options
    this.projectOptions = [
      { label: 'All Projects', value: null },
      ...uniqueProjects.map(project => ({ 
        label: project!, 
        value: project!
      }))
    ];

    console.log('📋 ProjectFilterDropdown: Available projects:', uniqueProjects);
    console.log('🎛️ ProjectFilterDropdown: Dropdown options:', this.projectOptions);
  }
}