import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import {
  CreateSubjectRequest,
  Regime,
  StudyPlan,
  Subject,
  UpdateSubjectRequest,
} from '../interfaces/subject';

@Injectable({ providedIn: 'root' })
export class Subjects {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<Subject[]>('subjects');
  }

  getById(id: number) {
    return this.api.get<Subject>(`subjects/${id}`);
  }

  create(data: CreateSubjectRequest) {
    return this.api.post<Subject>('subjects', data);
  }

  update(id: number, data: UpdateSubjectRequest) {
    return this.api.patch<Subject>(`subjects/${id}`, data);
  }

  // Catálogos que usa el formulario y los filtros.
  getStudyPlans() {
    return this.api.get<StudyPlan[]>('study-plans');
  }

  getRegimes() {
    return this.api.get<Regime[]>('regimes');
  }
}
