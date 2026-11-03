// Contratos de /subjects, /study-plans y /regimes (backend NestJS).

export const SUBJECT_STATUS = {
  ACTIVE: 'ACTIVO',
  INACTIVE: 'INACTIVO',
} as const;

export type SubjectStatus = (typeof SUBJECT_STATUS)[keyof typeof SUBJECT_STATUS];

export interface StudyPlanDegree {
  id?: number;
  name?: string;
  durationYears?: number | null;
}

export interface StudyPlan {
  id: number;
  name: string;
  validityYear: number;
  startDate: string;
  endDate: string | null;
  status: string;
  durationYears?: number | null;
  degree?: StudyPlanDegree | null;
  career?: StudyPlanDegree | null;
}

export interface Regime {
  id: number;
  name: string;
}

export interface Subject {
  id: number;
  name: string;
  year: number;
  weeklyHours: number;
  allowsMultipleTeachers: boolean;
  maxTeachers: number | null;
  status: SubjectStatus;
  studyPlan: StudyPlan;
  regime: Regime;
}

export interface CreateSubjectRequest {
  name: string;
  studyPlanId: number;
  regimeId: number;
  year: number;
  weeklyHours: number;
  allowsMultipleTeachers: boolean;
  maxTeachers: number | null;
}

export type UpdateSubjectRequest = Partial<CreateSubjectRequest>;

export interface UpdateSubjectStatusRequest {
  status: SubjectStatus;
}
