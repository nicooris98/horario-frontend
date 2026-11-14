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
      {
        path: 'configuracion/regimenes',
        loadComponent: () =>
          import('./features/regimes/pages/regime-management/regime-management').then(
            (m) => m.RegimeManagement,
          ),
      },
      {
        path: 'configuracion/calendario-academico',
        loadComponent: () =>
          import('./features/academic-calendar/pages/academic-calendar/academic-calendar').then(
            (m) => m.AcademicCalendar,
          ),
      },
      {
        path: 'academico/oferta-academica',
        loadComponent: () =>
          import('./features/academic-offer/pages/academic-offer/academic-offer').then(
            (m) => m.AcademicOffer,
          ),
      },
      {
        path: 'administracion/materias',
        canActivate: [permissionGuard],
        data: { permission: 'subjects.read' },
        loadComponent: () =>
          import('./features/subjects/pages/subject-management/subject-management').then(
            (m) => m.SubjectManagement,
          ),
      },
      {
        path: 'administracion/materias/nueva',
        canActivate: [permissionGuard],
        data: { permission: 'subjects.create' },
        loadComponent: () =>
          import('./features/subjects/pages/subject-form/subject-form').then(
            (m) => m.SubjectFormPage,
          ),
      },
      {
        path: 'administracion/materias/:id',
        canActivate: [permissionGuard],
        data: { permission: 'subjects.read' },
        loadComponent: () =>
          import('./features/subjects/pages/subject-detail/subject-detail').then(
            (m) => m.SubjectDetail,
          ),
      },
      {
        path: 'administracion/materias/:id/editar',
        canActivate: [permissionGuard],
        data: { permission: 'subjects.update' },
        loadComponent: () =>
          import('./features/subjects/pages/subject-form/subject-form').then(
            (m) => m.SubjectFormPage,
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
            {
        path: 'academico/planes-estudio/nuevo',
        canActivate: [permissionGuard],
        data: { permission: 'study-plans.create' },
        loadComponent: () =>
          import('./features/study-plans/pages/create-study-plan/create-study-plan').then(
            (m) => m.CreateStudyPlan,
          ),
      },
      {
        path: 'academico/planes-estudio/:id/editar',
        canActivate: [permissionGuard],
        data: { permission: 'study-plans.update' },
        loadComponent: () =>
          import('./features/study-plans/pages/edit-study-plan/edit-study-plan').then(
            (m) => m.EditStudyPlan,
          ),
      },
      {
        path: 'academico/planes-estudio',
        canActivate: [permissionGuard],
        data: { permission: 'study-plans.read' },
        loadComponent: () =>
          import('./features/study-plans/pages/study-plan-management/study-plan-management').then(
            (m) => m.StudyPlanManagement,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
