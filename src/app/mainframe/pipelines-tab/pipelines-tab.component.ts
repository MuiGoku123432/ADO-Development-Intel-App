import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SubTabComponent, SubTab } from '../../shared/components/sub-tab/sub-tab.component';

@Component({
  selector: 'app-pipelines-tab',
  standalone: true,
  imports: [
    CommonModule,
    SubTabComponent,
    RouterOutlet
  ],
  templateUrl: './pipelines-tab.component.html',
  styleUrl: './pipelines-tab.component.scss'
})
export class PipelinesTabComponent {
  subTabs: SubTab[] = [
    { id: 'builds', label: 'Builds', icon: 'pi pi-cog', routePath: '/pipelines/builds' },
    { id: 'releases', label: 'Releases', icon: 'pi pi-send', routePath: '/pipelines/releases' },
    { id: 'analytics', label: 'Analytics', icon: 'pi pi-chart-bar', routePath: '/pipelines/analytics' }
  ];

}