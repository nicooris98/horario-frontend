import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import {
  AcademicCycle,
  AcademicCycleRequest,
  Semester,
  SemesterRequest,
} from '../interfaces/academic-calendar';

@Injectable({ providedIn: 'root' })
export class Calendar {
  private readonly api = inject(Api);

  getCycles() {
    return this.api.get<AcademicCycle[]>('academic-cycles');
  }

  createCycle(data: AcademicCycleRequest) {
    return this.api.post<AcademicCycle>('academic-cycles', data);
  }

  updateCycle(id: number, data: AcademicCycleRequest) {
    return this.api.patch<AcademicCycle>(`academic-cycles/${id}`, data);
  }

  changeCycleStatus(id: number, status: string) {
    return this.api.patch<AcademicCycle>(`academic-cycles/${id}/status`, { status });
  }

  getSemesters() {
    return this.api.get<Semester[]>('semesters');
  }

  createSemester(data: SemesterRequest) {
    return this.api.post<Semester>('semesters', data);
  }

  updateSemester(id: number, data: SemesterRequest) {
    return this.api.patch<Semester>(`semesters/${id}`, data);
  }

  deleteSemester(id: number) {
    return this.api.delete<Semester>(`semesters/${id}`);
  }
}
