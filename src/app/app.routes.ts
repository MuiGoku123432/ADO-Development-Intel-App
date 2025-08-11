import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mainframe/mainframe.component').then(m => m.MainframeComponent)
  }
];
