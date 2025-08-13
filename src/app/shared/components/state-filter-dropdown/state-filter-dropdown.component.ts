import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { WorkItemLite } from '../../../services/tauri/tauri-ado.service';

interface StateOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-state-filter-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule
  ],
  templateUrl: './state-filter-dropdown.component.html',
  styleUrl: './state-filter-dropdown.component.scss'
})
export class StateFilterDropdownComponent implements OnInit, OnChanges, DoCheck {
  @Input() workItems: WorkItemLite[] = [];
  @Output() stateFilterChanged = new EventEmitter<string | null>();

  selectedState: string | null = null;
  stateOptions: StateOption[] = [];
  private previousSelectedState: string | null = null;

  ngOnInit() {
    console.log('🚀 StateFilterDropdown: Initializing with', this.workItems.length, 'work items');
    this.updateStateOptions();
    
    // Emit initial state (null = All States)
    console.log('📤 StateFilterDropdown: Emitting initial state: null (All States)');
    this.stateFilterChanged.emit(null);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['workItems']) {
      console.log('🔄 StateFilterDropdown: Work items changed, updating options');
      this.updateStateOptions();
    }
  }

  ngDoCheck() {
    // Detect changes to selectedState from ngModel
    if (this.selectedState !== this.previousSelectedState) {
      console.log('🎯 StateFilterDropdown: Selected state changed to:', this.selectedState);
      this.stateFilterChanged.emit(this.selectedState);
      this.previousSelectedState = this.selectedState;
    }
  }

  private updateStateOptions() {
    // Extract unique states from work items
    const uniqueStates = [...new Set(
      this.workItems
        .map(item => item.state)
        .filter(Boolean) // Remove null/undefined states
    )].sort(); // Sort alphabetically

    // Create dropdown options
    this.stateOptions = [
      { label: 'All States', value: null },
      ...uniqueStates.map(state => ({ 
        label: state!, 
        value: state!
      }))
    ];

    console.log('📋 StateFilterDropdown: Available states:', uniqueStates);
    console.log('🎛️ StateFilterDropdown: Dropdown options:', this.stateOptions);
  }
}