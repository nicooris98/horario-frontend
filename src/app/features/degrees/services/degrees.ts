import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Degree, DegreeRequest, DegreeStudyPlan } from '../interfaces/degree';

@Injectable({ providedIn: 'root' })
export class Degrees {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<Degree[]>('degrees');
  }

  create(data: DegreeRequest) {
    return this.api.post<Degree>('degrees', data);
  }

  update(id: number, data: DegreeRequest) {
    return this.api.patch<Degree>(`degrees/${id}`, data);
  }

  getStudyPlans() {
    return this.api.get<DegreeStudyPlan[]>('study-plans');
  }
}
