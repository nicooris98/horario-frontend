import { MenuItem } from 'primeng/api';
import { SUBJECT_STATUS, Subject } from './interfaces/subject';

export const SUBJECTS_ROUTE = '/administracion/materias';

export function isActive(subject: Pick<Subject, 'status'>): boolean {
  return subject.status === SUBJECT_STATUS.ACTIVE;
}

export function statusLabel(subject: Pick<Subject, 'status'>): string {
  return isActive(subject) ? 'Activo' : 'Inactivo';
}

export function statusSeverity(subject: Pick<Subject, 'status'>): 'success' | 'danger' {
  return isActive(subject) ? 'success' : 'danger';
}

// Misma regla que usa el backend al asignar docentes: si la materia no admite
// varios docentes el tope es 1; si los admite y no tiene máximo, no hay tope.
export function maxTeachersLabel(subject: Subject): string {
  if (!subject.allowsMultipleTeachers) return '1';
  return subject.maxTeachers === null ? 'Sin límite' : String(subject.maxTeachers);
}

export function subjectsBreadcrumb(...tail: MenuItem[]): MenuItem[] {
  return [{ label: 'Administración' }, { label: 'Materias', routerLink: SUBJECTS_ROUTE }, ...tail];
}

export const BREADCRUMB_HOME: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };

// El breadcrumb va sobre el fondo de la página, sin caja propia.
export const BREADCRUMB_THEME = {
  root: { background: 'transparent', padding: '0' },
};
