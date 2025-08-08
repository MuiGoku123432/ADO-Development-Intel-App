import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SubTabComponent, SubTab } from '../../shared/components/sub-tab/sub-tab.component';

@Component({
  selector: 'app-ado-tab',
  standalone: true,
  imports: [
    CommonModule,
    SubTabComponent,
    RouterOutlet
  ],
  templateUrl: './ado-tab.component.html',
  styleUrl: './ado-tab.component.scss'
})
export class AdoTabComponent {
  subTabs: SubTab[] = [
    { id: 'work-items', label: 'Work Items', icon: 'pi pi-list', routePath: '/ado/work-items' },
    { id: 'boards', label: 'Boards', icon: 'pi pi-th-large', routePath: '/ado/boards' },
    { id: 'queries', label: 'Queries', icon: 'pi pi-search', routePath: '/ado/queries' }
  ];
}