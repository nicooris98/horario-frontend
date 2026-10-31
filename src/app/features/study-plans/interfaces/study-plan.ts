export type StudyPlanStatus = 'VIGENTE' | 'NO_VIGENTE' | 'ARCHIVADO';
export interface StudyPlan {
  id: number;
  name: string;
  validityYear: number;
  startDate: string;        
  endDate: string | null;   
  status: string;           
  durationYears: number;   
  degree: {
    id: number;
    name: string;
  
  };
}

export interface CreateStudyPlanRequest {
  name: string;
  degreeId: number;         
  durationYears: number;
  validityYear: number;
  startDate: string;
  endDate?: string | null;
  status?: string;
  replaceCurrentVigente?: boolean;
}
