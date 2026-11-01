export interface Shift {
  id: number;
  name: string;
  status: string;
}

export interface ShiftRequest {
  name?: string;
  status?: string;
}

export const SHIFT_ACTIVE = 'ACTIVO';
export const SHIFT_INACTIVE = 'INACTIVO';
