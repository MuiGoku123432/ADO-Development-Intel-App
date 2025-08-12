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
import { ToolbarModule } from 'primeng/toolbar';

// Import simplified components
import { MyTasksComponent } from './user-tab/my-tasks/my-tasks.component';
import { CHATBOT_FEATURES, APP_CONSTANTS } from '../shared/constants/app.constants';

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
    ToolbarModule,
    MyTasksComponent
  ],
  templateUrl: './mainframe.component.html',
  styleUrl: './mainframe.component.scss'
})
export class MainframeComponent {
  chatbotVisible = false;
  
  // Use centralized constants
  plannedFeatures = CHATBOT_FEATURES;

  constructor() {
    console.log('🚀 Simplified MainframeComponent initialized');
  }

  // Responsive dialog dimensions using constants
  get dialogWidth(): string {
    if (typeof window !== 'undefined') {
      const { MOBILE, TABLET } = APP_CONSTANTS.BREAKPOINTS;
      const { RESPONSIVE } = APP_CONSTANTS.DIALOG_SIZES;
      
      if (window.innerWidth < MOBILE) return RESPONSIVE.MOBILE.width;
      if (window.innerWidth < TABLET) return RESPONSIVE.TABLET.width;
      return RESPONSIVE.DESKTOP.width;
    }
    return APP_CONSTANTS.DIALOG_SIZES.RESPONSIVE.DESKTOP.width;
  }

  get dialogHeight(): string {
    if (typeof window !== 'undefined') {
      const { MOBILE } = APP_CONSTANTS.BREAKPOINTS;
      const { RESPONSIVE } = APP_CONSTANTS.DIALOG_SIZES;
      
      if (window.innerWidth < MOBILE) return RESPONSIVE.MOBILE.height;
      return RESPONSIVE.DESKTOP.height;
    }
    return APP_CONSTANTS.DIALOG_SIZES.RESPONSIVE.DESKTOP.height;
  }

  showChatbot() {
    this.chatbotVisible = true;
  }

  hideChatbot() {
    this.chatbotVisible = false;
  }
}