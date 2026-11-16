import { Routes } from '@angular/router';
import { TeachersPage } from './pages/teachers-page/teachers-page';
import { TeacherDetail } from './pages/teacher-detail/teacher-detail';
import { TeacherForm } from './pages/teacher-form/teacher-form';

export const teachersRoutes: Routes = [
  { path: 'nuevo', component: TeacherForm },
  { path: ':id/editar', component: TeacherForm },
  { path: ':id', component: TeacherDetail },
  { path: '', component: TeachersPage },
];
