import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((c) => c.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
