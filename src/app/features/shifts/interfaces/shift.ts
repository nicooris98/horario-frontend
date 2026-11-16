export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
}

export const SHIFT_ACTIVE = 'ACTIVO';
export const SHIFT_INACTIVE = 'INACTIVO';
