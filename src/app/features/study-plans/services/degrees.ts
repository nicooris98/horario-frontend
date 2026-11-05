import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Degree } from '../interfaces/degree';

@Injectable({ providedIn: 'root' })
export class Degrees {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<Degree[]>('degrees');
  }
}