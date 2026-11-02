export interface ClassHour {
  id: number;
  slotNumber: number;
  startTime: string;
  endTime: string;
}

export interface ClassHourRequest {
  slotNumber: number;
  startTime: string;
  endTime: string;
}
