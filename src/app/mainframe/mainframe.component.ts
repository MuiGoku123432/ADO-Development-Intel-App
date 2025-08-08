import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

// Import custom tab component
import { MainTabComponent, MainTab } from '../shared/components/main-tab/main-tab.component';

@Component({
  selector: 'app-mainframe',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    MainTabComponent
  ],
  templateUrl: './mainframe.component.html',
  styleUrl: './mainframe.component.scss'
})
export class MainframeComponent {
  chatbotVisible = false;

  constructor() {
    console.log('🚀 MainframeComponent initialized');
    console.log('📱 Main tabs configured:', this.mainTabs);
  }

  mainTabs: MainTab[] = [
    {
      id: 'user',
      label: 'User',
      icon: 'pi-user',
      routePath: '/user'
    },
    {
      id: 'ado',
      label: 'ADO',
      icon: 'pi-sitemap',
      routePath: '/ado'
    },
    {
      id: 'repos',
      label: 'Repos',
      icon: 'pi-code',
      routePath: '/repos'
    },
    {
      id: 'pipelines',
      label: 'Pipelines',
      icon: 'pi-sync',
      routePath: '/pipelines'
    }
  ];

  showChatbot() {
    this.chatbotVisible = true;
  }

  hideChatbot() {
    this.chatbotVisible = false;
  }
}