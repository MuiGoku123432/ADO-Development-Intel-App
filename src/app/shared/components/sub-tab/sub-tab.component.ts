import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface SubTab {
  id: string;
  label: string;
  icon: string;
  routePath: string;
}

@Component({
  selector: 'app-sub-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sub-tab.component.html',
  styleUrls: ['./sub-tab.component.scss']
})
export class SubTabComponent implements OnInit, OnDestroy {
  @Input() tabs: SubTab[] = [];
  
  private destroy$ = new Subject<void>();
  activeTabIndex: number = 0;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // Set initial active tab based on current route
    this.updateActiveTabFromRoute();
    
    // Listen to route changes to update active tab
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

  selectTab(index: number) {
    if (index !== this.activeTabIndex && this.tabs[index]) {
      this.router.navigate([this.tabs[index].routePath]);
    }
  }

  isActive(index: number): boolean {
    return index === this.activeTabIndex;
  }

  private updateActiveTabFromRoute() {
    const currentUrl = this.router.url;
    const tabIndex = this.tabs.findIndex(tab => currentUrl.includes(tab.routePath));
    if (tabIndex !== -1) {
      this.activeTabIndex = tabIndex;
    }
  }
}