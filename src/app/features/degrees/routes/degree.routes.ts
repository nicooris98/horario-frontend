import { Routes } from '@angular/router';

export const degreeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/degree-list/degree-list').then((m) => m.DegreeListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('../pages/degree-form/degree-form').then((m) => m.DegreeFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/degree-detail/degree-detail').then((m) => m.DegreeDetailComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('../pages/degree-form/degree-form').then((m) => m.DegreeFormComponent),
  },
];
