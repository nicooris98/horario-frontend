export interface Degree {
  id: number;
  name: string;
}

export interface DegreeRequest {
  name: string;
}

export interface DegreeStudyPlan {
  id: number;
  status: string;
  degree: Degree;
}

export const VIGENTE_STATUSES = ['VIGENTE', 'ACTIVO'];
