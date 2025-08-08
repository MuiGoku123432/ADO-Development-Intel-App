import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';

// Import custom sub-tab component
import { SubTabComponent, SubTab } from '../../shared/components/sub-tab/sub-tab.component';

@Component({
  selector: 'app-user-tab',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    SubTabComponent
  ],
  templateUrl: './user-tab.component.html',
  styleUrl: './user-tab.component.scss'
})
export class UserTabComponent {
  subTabs: SubTab[] = [
    {
      id: 'my-tasks',
      label: 'My Tasks',
      icon: 'pi-check-square',
      routePath: '/user/my-tasks'
    },
    {
      id: 'my-history',
      label: 'My History',
      icon: 'pi-history',
      routePath: '/user/my-history'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'pi-bell',
      routePath: '/user/notifications'
    }
  ];
}