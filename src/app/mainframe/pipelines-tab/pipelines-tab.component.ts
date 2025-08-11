import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-pipelines-tab',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TabViewModule
  ],
  templateUrl: './pipelines-tab.component.html',
  styleUrl: './pipelines-tab.component.scss'
})
export class PipelinesTabComponent implements OnInit, OnDestroy {
  activeTabIndex = 0;
  private destroy$ = new Subject<void>();
  
  private tabRoutes = ['/pipelines/builds', '/pipelines/releases', '/pipelines/analytics'];

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateActiveTabFromRoute();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateActiveTabFromRoute();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(event: any) {
    const newIndex = event.index;
    if (newIndex !== this.activeTabIndex && this.tabRoutes[newIndex]) {
      this.router.navigate([this.tabRoutes[newIndex]]);
    }
  }

  private updateActiveTabFromRoute() {
    const currentUrl = this.router.url;
    const tabIndex = this.tabRoutes.findIndex(route => currentUrl.startsWith(route));
    if (tabIndex !== -1) {
      this.activeTabIndex = tabIndex;
    }
  }
}