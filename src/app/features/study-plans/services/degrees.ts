import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Degree } from '../interfaces/degree';

export type DegreeState = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class Degrees {
  private readonly api = inject(Api);

  readonly degrees = signal<Degree[]>([]);
  readonly state = signal<DegreeState>('idle');
  readonly errorMessage = signal<string | null>(null);

  getAll(forceRefresh = false): Observable<Degree[]> {
    if (!forceRefresh && this.state() === 'success') {
      return of(this.degrees());
    }

    this.state.set('loading');
    this.errorMessage.set(null);

    return this.api.get<Degree[]>('degrees').pipe(
      map((degrees) => degrees ?? []),
      tap((degrees) => {
        this.degrees.set(degrees);
        this.state.set('success');
      }),
      catchError((error) => {
        this.state.set('error');
        this.errorMessage.set('No se pudieron consultar las carreras registradas.');
        return throwError(() => error);
      }),
    );
  }
}
