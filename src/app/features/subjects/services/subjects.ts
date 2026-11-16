import { Injectable, inject, signal } from '@angular/core';
import { Api } from '../../../core/services/api';
import {
  CreateSubjectRequest,
  Regime,
  StudyPlan,
  Subject,
  SubjectStatus,
  UpdateSubjectRequest,
  UpdateSubjectStatusRequest,
} from '../interfaces/subject';

export interface SubjectToastMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class Subjects {
  private readonly api = inject(Api);

  readonly pendingToast = signal<SubjectToastMessage | null>(null);

  setPendingToast(toast: SubjectToastMessage | null): void {
    this.pendingToast.set(toast);
  }

  consumePendingToast(): SubjectToastMessage | null {
    const toast = this.pendingToast();
    if (toast) {
      this.pendingToast.set(null);
    }
    return toast;
  }

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

  updateStatus(id: number, status: SubjectStatus) {
    const body: UpdateSubjectStatusRequest = { status };
    return this.api.patch<Subject>(`subjects/${id}/status`, body);
  }

  // Catálogos que usa el formulario y los filtros.
  getStudyPlans() {
    return this.api.get<StudyPlan[]>('study-plans');
  }

  getRegimes() {
    return this.api.get<Regime[]>('regimes');
  }
}