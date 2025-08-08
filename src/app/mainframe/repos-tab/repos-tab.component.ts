import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SubTabComponent, SubTab } from '../../shared/components/sub-tab/sub-tab.component';

@Component({
  selector: 'app-repos-tab',
  standalone: true,
  imports: [
    CommonModule,
    SubTabComponent,
    RouterOutlet
  ],
  templateUrl: './repos-tab.component.html',
  styleUrl: './repos-tab.component.scss'
})
export class ReposTabComponent {
  subTabs: SubTab[] = [
    { id: 'repositories', label: 'Repositories', icon: 'pi pi-folder', routePath: '/repos/repositories' },
    { id: 'pull-requests', label: 'Pull Requests', icon: 'pi pi-git-merge', routePath: '/repos/pull-requests' },
    { id: 'commits-branches', label: 'Commits & Branches', icon: 'pi pi-sitemap', routePath: '/repos/commits-branches' }
  ];

}