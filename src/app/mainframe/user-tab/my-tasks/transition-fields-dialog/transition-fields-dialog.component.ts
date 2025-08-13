import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';

import { FieldsRequiredEvent, UiFieldPrompt } from '../../../../services/tauri/tauri-ado.service';

@Component({
  selector: 'app-transition-fields-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    InputGroupModule,
    InputGroupAddonModule,
    MessageModule
  ],
  templateUrl: './transition-fields-dialog.component.html',
  styleUrl: './transition-fields-dialog.component.scss'
})
export class TransitionFieldsDialogComponent implements OnInit {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dialogConfig = inject(DynamicDialogConfig);
  private readonly formBuilder = inject(FormBuilder);

  fieldsForm!: FormGroup;
  fieldsRequiredEvent!: FieldsRequiredEvent;
  
  constructor() {
    console.log('🔄 TransitionFieldsDialog: Component initialized');
  }

  ngOnInit(): void {
    this.fieldsRequiredEvent = this.dialogConfig.data;
    console.log('📝 TransitionFieldsDialog: Received event data:', this.fieldsRequiredEvent);
    
    this.buildForm();
  }

  private buildForm(): void {
    const formControls: { [key: string]: FormControl } = {};
    
    this.fieldsRequiredEvent.prompts.forEach((prompt: UiFieldPrompt) => {
      const validators = prompt.required ? [Validators.required] : [];
      
      // Set default values based on field type
      let defaultValue = prompt.default_value;
      if (!defaultValue) {
        switch (prompt.kind) {
          case 'number':
            defaultValue = null;
            break;
          case 'string':
            defaultValue = '';
            break;
          case 'picklist':
            defaultValue = prompt.allowed_values?.[0] || '';
            break;
          case 'identity':
            defaultValue = null; // Will use current user
            break;
          case 'datetime':
            defaultValue = null;
            break;
          default:
            defaultValue = '';
        }
      }
      
      formControls[prompt.ref_name] = new FormControl(defaultValue, validators);
      console.log(`📋 TransitionFieldsDialog: Added form control for ${prompt.ref_name} (${prompt.kind})`);
    });
    
    this.fieldsForm = this.formBuilder.group(formControls);
    console.log('✅ TransitionFieldsDialog: Form built with', Object.keys(formControls).length, 'controls');
  }

  getFieldType(prompt: UiFieldPrompt): string {
    return prompt.kind;
  }

  getDropdownOptions(prompt: UiFieldPrompt): { label: string; value: string }[] {
    if (!prompt.allowed_values) return [];
    
    return prompt.allowed_values.map((value: string) => ({
      label: value,
      value: value
    }));
  }

  isFieldRequired(prompt: UiFieldPrompt): boolean {
    return prompt.required;
  }

  getFieldError(prompt: UiFieldPrompt): string | null {
    const control = this.fieldsForm.get(prompt.ref_name);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${prompt.label} is required`;
      }
    }
    return null;
  }

  onCancel(): void {
    console.log('❌ TransitionFieldsDialog: User cancelled');
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.fieldsForm.valid) {
      const fieldValues = this.fieldsForm.value;
      console.log('✅ TransitionFieldsDialog: Form submitted with values:', fieldValues);
      
      // Convert form values to the format expected by the API
      const apiValues: Record<string, any> = {};
      
      this.fieldsRequiredEvent.prompts.forEach((prompt: UiFieldPrompt) => {
        const formValue = fieldValues[prompt.ref_name];
        
        // Handle different field types and conversions
        switch (prompt.kind) {
          case 'number':
            apiValues[prompt.ref_name] = formValue ? Number(formValue) : null;
            break;
          case 'datetime':
            apiValues[prompt.ref_name] = formValue ? formValue.toISOString() : null;
            break;
          case 'identity':
            apiValues[prompt.ref_name] = formValue || null; // Let API handle default user
            break;
          default:
            apiValues[prompt.ref_name] = formValue || '';
        }
      });
      
      console.log('📤 TransitionFieldsDialog: Sending API values:', apiValues);
      this.dialogRef.close(apiValues);
    } else {
      console.warn('⚠️ TransitionFieldsDialog: Form is invalid');
      
      // Mark all fields as touched to show validation errors
      Object.keys(this.fieldsForm.controls).forEach(key => {
        this.fieldsForm.get(key)?.markAsTouched();
      });
    }
  }
}