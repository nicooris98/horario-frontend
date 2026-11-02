export interface Teacher {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  fileNumber?: number | null;
  status?: string;
  currentAssignments?: TeacherAssignment[];
}

export interface CreateTeacherDto {
  dni: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  fileNumber?: number | null;
  status?: string;
}

export interface PositionType {
  id: number;
  name: string;
  description?: string | null;
  allowsSubstitute?: boolean;
  status?: string;
}

export interface CourseSection {
  id: number;
  courseYear: number;
  section: string;
  status?: string;
}

export interface Subject {
  id: number;
  name: string;
  year: number;
  weeklyHours: number;
  allowsMultipleTeachers?: boolean;
  maxTeachers?: number | null;
  status?: string;
}

export interface CourseSectionSubject {
  id: number;
  status?: string;
  courseSection?: CourseSection;
  subject?: Subject;
}

// El backend responde con las relaciones anidadas, no con IDs sueltos.
export interface TeacherAssignment {
  id: number;
  weeklyHours: number;
  startDate: string;
  endDate: string | null;
  teacher: Teacher;
  positionType: PositionType;
  courseSectionSubject: CourseSectionSubject;
  replacedAssignment: TeacherAssignment | null;
}

// El body de POST/PATCH es al revés: ahí sí van los IDs.
export interface CreateTeacherAssignmentDto {
  teacherId: number;
  positionTypeId: number;
  courseSectionSubjectId?: number;
  replacedAssignmentId?: number | null;
  weeklyHours?: number;
  startDate: string;
  endDate?: string | null;
}

// Estado del formulario: mezcla de IDs (para el body) y datos planos.
export interface TeacherAssignmentForm {
  id: number;
  teacherId: number | null;
  positionTypeId: number | null;
  courseSectionSubjectId: number | null;
  replacedAssignmentId: number | null;
  weeklyHours: number | null;
  startDate: string | null;
  endDate: string | null;
}

// Opción simple para los p-select.
export interface SelectOption {
  id: number;
  label: string;
}
