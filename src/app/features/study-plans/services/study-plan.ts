import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CreateStudyPlanRequest, StudyPlan } from '../interfaces/study-plan';

@Injectable({ providedIn: 'root' })
export class StudyPlans {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<StudyPlan[]>('study-plans');
  }

  getById(id: number) {
    return this.api.get<StudyPlan>(`study-plans/${id}`);
  }

  create(data: CreateStudyPlanRequest) {
    return this.api.post<StudyPlan>('study-plans', data);
  }

  update(id: number, data: Partial<CreateStudyPlanRequest>) {
    return this.api.patch<StudyPlan>(`study-plans/${id}`, data);
  }

  delete(id: number) {
    return this.api.delete<StudyPlan>(`study-plans/${id}`);
  }
}