import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { ClassHour, ClassHourRequest } from '../interfaces/class-hour';

@Injectable({ providedIn: 'root' })
export class ClassHours {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<ClassHour[]>('class-hours');
  }

  create(data: ClassHourRequest) {
    return this.api.post<ClassHour>('class-hours', data);
  }

  update(id: number, data: ClassHourRequest) {
    return this.api.patch<ClassHour>(`class-hours/${id}`, data);
  }
}
