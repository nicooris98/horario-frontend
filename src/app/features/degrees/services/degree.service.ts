import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { Degree, DegreeRequest, DegreeStatus } from '../models/degree.model';

@Injectable({
  providedIn: 'root',
})
export class DegreeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_CONFIG.baseUrl}/degrees`;

  readonly degrees = signal<Degree[]>([]);
  readonly selectedDegree = signal<Degree | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  getDegrees(): Observable<Degree[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<unknown[]>(this.apiUrl).pipe(
      map((response) => this.normalizeList(response)),
      tap((degrees) => this.degrees.set(degrees)),
      finalize(() => this.loading.set(false)),
      catchError(() => {
        this.error.set('No se pudo cargar la lista de carreras.');
        this.degrees.set([]);
        return of([]);
      }),
    );
  }

  getDegreeById(id: number): Observable<Degree> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.normalizeDegree(response)),
      tap((degree) => this.selectedDegree.set(degree)),
      finalize(() => this.loading.set(false)),
      catchError(() => {
        this.error.set('No se pudo cargar la carrera seleccionada.');
        this.selectedDegree.set(null);
        return of(this.emptyDegree());
      }),
    );
  }

  createDegree(request: DegreeRequest): Observable<Degree> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<unknown>(this.apiUrl, request).pipe(
      map((response) => this.normalizeDegree(response)),
      tap((degree) => {
        this.degrees.update((items) => [degree, ...items]);
        this.selectedDegree.set(degree);
      }),
      finalize(() => this.loading.set(false)),
      catchError(() => {
        this.error.set('No se pudo registrar la carrera.');
        return of(this.emptyDegree());
      }),
    );
  }

  updateDegree(id: number, request: DegreeRequest): Observable<Degree> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.patch<unknown>(`${this.apiUrl}/${id}`, request).pipe(
      map((response) => this.normalizeDegree(response)),
      tap((degree) => {
        this.degrees.update((items) => items.map((item) => (item.id === id ? degree : item)));
        this.selectedDegree.set(degree);
      }),
      finalize(() => this.loading.set(false)),
      catchError(() => {
        this.error.set('No se pudo actualizar la carrera.');
        return of(this.emptyDegree());
      }),
    );
  }

  inactivateDegree(id: number): Observable<Degree> {
    return this.updateDegree(id, {
      name: '',
      durationYears: 0,
      status: 'INACTIVE',
      updatedAt: new Date().toISOString(),
      updatedBy: 'administrativo',
    });
  }

  private normalizeList(response: unknown[]): Degree[] {
    return response.map((item) => this.normalizeDegree(item));
  }

  private normalizeDegree(raw: unknown): Degree {
    const degree = (raw ?? {}) as Partial<Degree> & {
      duration_anios?: number;
      durationYears?: number;
    };

    const durationYears = Number(degree.durationYears ?? degree.duration_anios ?? 0);

    return {
      id: Number(degree.id ?? 0),
      name: String(degree.name ?? '').trim(),
      durationYears: Number.isFinite(durationYears) ? durationYears : 0,
      status: degree.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      studyPlans: Array.isArray(degree.studyPlans) ? degree.studyPlans : [],
      updatedBy: degree.updatedBy ?? 'administrativo',
      updatedAt: degree.updatedAt ?? new Date().toISOString(),
    };
  }

  private emptyDegree(): Degree {
    return {
      id: 0,
      name: '',
      durationYears: 0,
      status: 'ACTIVE',
      studyPlans: [],
      updatedBy: 'administrativo',
      updatedAt: new Date().toISOString(),
    };
  }
}
