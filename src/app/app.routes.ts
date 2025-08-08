import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mainframe/mainframe.component').then(m => m.MainframeComponent),
    children: [
      {
        path: '',
        redirectTo: '/user/my-tasks',
        pathMatch: 'full'
      },
      // User Tab Routes
      {
        path: 'user',
        loadComponent: () => import('./mainframe/user-tab/user-tab.component').then(m => m.UserTabComponent),
        children: [
          {
            path: 'my-tasks',
            loadComponent: () => import('./mainframe/user-tab/my-tasks/my-tasks.component').then(m => m.MyTasksComponent)
          },
          {
            path: 'my-history',
            loadComponent: () => import('./mainframe/user-tab/my-history/my-history.component').then(m => m.MyHistoryComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./mainframe/user-tab/notifications/notifications.component').then(m => m.NotificationsComponent)
          },
          {
            path: '',
            redirectTo: 'my-tasks',
            pathMatch: 'full'
          }
        ]
      },
      // ADO Tab Routes
      {
        path: 'ado',
        loadComponent: () => import('./mainframe/ado-tab/ado-tab.component').then(m => m.AdoTabComponent),
        children: [
          {
            path: 'work-items',
            loadComponent: () => import('./mainframe/ado-tab/work-items/work-items.component').then(m => m.WorkItemsComponent)
          },
          {
            path: 'boards',
            loadComponent: () => import('./mainframe/ado-tab/boards/boards.component').then(m => m.BoardsComponent)
          },
          {
            path: 'queries',
            loadComponent: () => import('./mainframe/ado-tab/queries/queries.component').then(m => m.QueriesComponent)
          },
          {
            path: '',
            redirectTo: 'work-items',
            pathMatch: 'full'
          }
        ]
      },
      // Repos Tab Routes
      {
        path: 'repos',
        loadComponent: () => import('./mainframe/repos-tab/repos-tab.component').then(m => m.ReposTabComponent),
        children: [
          {
            path: 'repositories',
            loadComponent: () => import('./mainframe/repos-tab/repositories/repositories.component').then(m => m.RepositoriesComponent)
          },
          {
            path: 'pull-requests',
            loadComponent: () => import('./mainframe/repos-tab/pull-requests/pull-requests.component').then(m => m.PullRequestsComponent)
          },
          {
            path: 'commits-branches',
            loadComponent: () => import('./mainframe/repos-tab/commits-branches/commits-branches.component').then(m => m.CommitsBranchesComponent)
          },
          {
            path: '',
            redirectTo: 'repositories',
            pathMatch: 'full'
          }
        ]
      },
      // Pipelines Tab Routes
      {
        path: 'pipelines',
        loadComponent: () => import('./mainframe/pipelines-tab/pipelines-tab.component').then(m => m.PipelinesTabComponent),
        children: [
          {
            path: 'builds',
            loadComponent: () => import('./mainframe/pipelines-tab/builds/builds.component').then(m => m.BuildsComponent)
          },
          {
            path: 'releases',
            loadComponent: () => import('./mainframe/pipelines-tab/releases/releases.component').then(m => m.ReleasesComponent)
          },
          {
            path: 'analytics',
            loadComponent: () => import('./mainframe/pipelines-tab/analytics/analytics.component').then(m => m.AnalyticsComponent)
          },
          {
            path: '',
            redirectTo: 'builds',
            pathMatch: 'full'
          }
        ]
      }
    ]
  }
];
