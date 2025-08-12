import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { ListboxModule } from 'primeng/listbox';
import { TooltipModule } from 'primeng/tooltip';

// Import simplified components
import { MyTasksComponent } from './user-tab/my-tasks/my-tasks.component';

@Component({
  selector: 'app-mainframe',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TabViewModule,
    CardModule,
    PanelModule,
    DividerModule,
    FieldsetModule,
    ListboxModule,
    TooltipModule,
    MyTasksComponent
  ],
  templateUrl: './mainframe.component.html',
  styleUrl: './mainframe.component.scss'
})
export class MainframeComponent {
  chatbotVisible = false;
  
  plannedFeatures = [
    { label: '"List my open tasks"' },
    { label: '"Show repos with pending PRs"' },
    { label: '"What builds failed today?"' },
    { label: '"Create new work item"' }
  ];

  constructor() {
    console.log('🚀 Simplified MainframeComponent initialized');
  }

  showChatbot() {
    this.chatbotVisible = true;
  }

  hideChatbot() {
    this.chatbotVisible = false;
  }
}