export type DegreeStatus = 'ACTIVE' | 'INACTIVE';

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
  durationYears: number;
  status?: DegreeStatus;
  updatedBy?: string;
  updatedAt?: string;
  changedFields?: string[];
}
