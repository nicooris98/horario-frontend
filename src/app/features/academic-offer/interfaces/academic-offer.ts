import { AcademicCycle } from '../../academic-calendar/interfaces/academic-calendar';
import { Shift } from '../../shifts/interfaces/shift';

export interface OfferStudyPlan {
  id: number;
  name: string;
  durationYears: number;
  degree?: { name: string };
}

export interface Offer {
  id: number;
  studyPlan: OfferStudyPlan;
  academicCycle: AcademicCycle;
  shift: Shift;
}

export interface OfferRequest {
  studyPlanId: number;
  academicCycleId: number;
  shiftId: number;
}

export interface CourseSection {
  id: number;
  courseYear: number;
  section: string;
  status: string;
  studyPlanAcademicCycle: Offer;
}

export interface CourseSectionRequest {
  studyPlanAcademicCycleId: number;
  courseYear: number;
  section: string;
}

export const SECTION_ACTIVE = 'ACTIVO';
export const SECTION_INACTIVE = 'INACTIVO';
