import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-hide-completed-checkbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CheckboxModule
  ],
  templateUrl: './hide-completed-checkbox.component.html',
  styleUrl: './hide-completed-checkbox.component.scss'
})
export class HideCompletedCheckboxComponent implements OnInit, OnChanges, DoCheck {
  @Input() defaultChecked: boolean = true;
  @Output() hideCompletedChanged = new EventEmitter<boolean>();

  isHideCompleted: boolean = true;

  ngOnInit() {
    console.log('🚀 HideCompletedCheckbox: Initializing with defaultChecked =', this.defaultChecked);
    
    // Set initial value based on input
    this.isHideCompleted = this.defaultChecked;
    
    // Emit initial state
    console.log('📤 HideCompletedCheckbox: Emitting initial state:', this.isHideCompleted);
    this.hideCompletedChanged.emit(this.isHideCompleted);
  }

  ngOnChanges(changes: SimpleChanges) {
    // Handle changes to defaultChecked input
    if (changes['defaultChecked']) {
      console.log('🔄 HideCompletedCheckbox: defaultChecked changed to:', changes['defaultChecked'].currentValue);
      this.isHideCompleted = changes['defaultChecked'].currentValue;
    }

    // Handle changes to isHideCompleted (from ngModel)
    if (changes['isHideCompleted'] && !changes['isHideCompleted'].firstChange) {
      const newValue = changes['isHideCompleted'].currentValue;
      console.log('👁️ HideCompletedCheckbox: isHideCompleted changed to:', newValue);
      this.hideCompletedChanged.emit(newValue);
    }
  }

  // This will be called when ngModel changes the property
  ngDoCheck() {
    // We need to detect changes to isHideCompleted since ngOnChanges won't catch
    // changes to component properties that are modified by ngModel
    const currentValue = this.isHideCompleted;
    if (currentValue !== this.previousValue) {
      console.log('👁️ HideCompletedCheckbox: Value changed via ngModel to:', currentValue);
      this.hideCompletedChanged.emit(currentValue);
      this.previousValue = currentValue;
    }
  }

  private previousValue: boolean = true;
}