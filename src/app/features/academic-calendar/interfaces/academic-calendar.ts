export interface AcademicCycle {
  id: number;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface AcademicCycleRequest {
  year: number;
  startDate: string;
  endDate: string;
}

export interface Semester {
  id: number;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
}

export interface SemesterRequest {
  name: string;
  number: number;
  startDate: string;
  endDate: string;
}

export const CYCLE_ACTIVE = 'ACTIVO';
export const CYCLE_INACTIVE = 'INACTIVO';
