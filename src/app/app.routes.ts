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

    path: 'activate-account',
    loadComponent: () =>
      import('./features/auth/pages/activate-account/activate-account').then(
        (c) => c.ActivateAccount,
      ),
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
        path: 'administracion/roles',
        canActivate: [permissionGuard],
        data: { permission: 'roles.read' },
        loadComponent: () =>
          import('./features/roles/pages/role-management/role-management').then(
            (m) => m.RoleManagement,
          ),
      },
      {
        path: 'administracion/usuarios/:id',
        canActivate: [permissionGuard],
        data: { permission: 'users.read' },
        loadComponent: () =>
          import('./features/users/pages/user-detail/user-detail').then(
            (m) => m.UserDetail,
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
        path: 'academico/carreras',
        loadComponent: () =>
          import('./features/degrees/pages/degree-management/degree-management').then(
            (m) => m.DegreeManagement,
          ),
      },
      {
        path: 'configuracion/turnos',
        loadComponent: () =>
          import('./features/shifts/pages/shift-management/shift-management').then(
            (m) => m.ShiftManagement,
          ),
      },
      {
        path: 'configuracion/estructura-horaria',
        loadComponent: () =>
          import('./features/class-hours/pages/class-hour-management/class-hour-management').then(
            (m) => m.ClassHourManagement,
          ),
      },
      // Materias: el backend todavía no define permisos "subjects.*",
      // así que alcanza con estar logueado (authGuard del layout).
      {
        path: 'administracion/materias',
        loadComponent: () =>
          import('./features/subjects/pages/subject-management/subject-management').then(
            (m) => m.SubjectManagement,
          ),
      },
      {
        path: 'administracion/materias/nueva',
        loadComponent: () =>
          import('./features/subjects/pages/subject-form/subject-form').then(
            (m) => m.SubjectFormPage,
          ),
      },
      {
        path: 'administracion/materias/:id',
        loadComponent: () =>
          import('./features/subjects/pages/subject-detail/subject-detail').then(
            (m) => m.SubjectDetail,
          ),
      },
      {
        path: 'administracion/materias/:id/editar',
        loadComponent: () =>
          import('./features/subjects/pages/subject-form/subject-form').then(
            (m) => m.SubjectFormPage,
          ),
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
