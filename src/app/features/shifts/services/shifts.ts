import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Shift, ShiftRequest } from '../interfaces/shift';

@Injectable({ providedIn: 'root' })
export class Shifts {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<Shift[]>('shifts');
  }

  create(data: ShiftRequest) {
    return this.api.post<Shift>('shifts', data);
  }

  update(id: number, data: ShiftRequest) {
    return this.api.patch<Shift>(`shifts/${id}`, data);
  }
}
