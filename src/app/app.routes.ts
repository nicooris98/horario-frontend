import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { permissionGuard } from './core/guards/permission-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((c) => c.Login),
  },
  {
    path: 'verify-code',
    loadComponent: () =>
      import('./features/auth/pages/verify-code/verify-code').then((c) => c.VerifyCode),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {

        path: 'administracion/usuarios/nuevo',
        canActivate: [permissionGuard],
        data: { permission: 'users.read' },
        loadComponent: () =>
          import('./features/users/pages/create-user/create-user').then(
            (m) => m.CreateUser,
          ),
      },
      {

        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'administracion/usuarios/nuevo',
        canActivate: [permissionGuard],
        data: { permission: 'users.read' },
        loadComponent: () =>
          import('./features/users/pages/create-user/create-user').then((m) => m.CreateUser),
      },
      {
        path: 'administracion/usuarios',
        canActivate: [permissionGuard],
        data: { permission: 'users.read' },
        loadComponent: () =>
          import('./features/users/pages/user-management/user-management').then(
            (m) => m.UserManagement,
          ),
      },
      {
        path: 'administracion/carreras',
        canActivate: [permissionGuard],
        data: { permission: 'degrees.read' },
        loadChildren: () =>
          import('./features/degrees/routes/degree.routes').then((m) => m.degreeRoutes),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
