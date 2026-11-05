import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission-guard';

export const degreeRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permission: 'degrees.read' },
    loadComponent: () =>
      import('../pages/degree-list/degree-list').then((m) => m.DegreeListComponent),
  },
  {
    path: 'nuevo',
    canActivate: [permissionGuard],
    data: { permission: 'degrees.create' },
    loadComponent: () =>
      import('../pages/degree-form/degree-form').then((m) => m.DegreeFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permission: 'degrees.read' },
    loadComponent: () =>
      import('../pages/degree-detail/degree-detail').then((m) => m.DegreeDetailComponent),
  },
  {
    path: ':id/editar',
    canActivate: [permissionGuard],
    data: { permission: 'degrees.update' },
    loadComponent: () =>
      import('../pages/degree-form/degree-form').then((m) => m.DegreeFormComponent),
  },
];