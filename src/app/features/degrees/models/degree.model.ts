export type DegreeStatus = 'ACTIVO' | 'INACTIVO';

export interface StudyPlan {
  id: number;
  name: string;
  active: boolean;
}

export interface Degree {
  id: number;
  name: string;
  durationYears: number;
  status: DegreeStatus;
  studyPlans?: StudyPlan[];
  updatedBy?: string;
  updatedAt?: string;
}

export interface DegreeRequest {
  name: string;
}