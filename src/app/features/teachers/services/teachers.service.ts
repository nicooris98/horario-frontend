import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { CreateTeacherDto, Teacher } from '../../../core/models/module2.models';

@Injectable({
  providedIn: 'root'
})
export class TeachersService {
  private api = inject(ApiService);

  findAll(dni?: string, lastName?: string) {
    const params = new URLSearchParams();
    if (dni) params.set('dni', dni);
    if (lastName) params.set('lastName', lastName);
    const qs = params.toString();
    return this.api.get<Teacher[]>(`/teachers${qs ? '?' + qs : ''}`);
  }

  findOne(id: number) {
    return this.api.get<Teacher>(`/teachers/${id}`);
  }

  create(dto: CreateTeacherDto) {
    return this.api.post<Teacher>('/teachers', dto);
  }

  update(id: number, dto: Partial<CreateTeacherDto>) {
    return this.api.patch<Teacher>(`/teachers/${id}`, dto);
  }

  deactivate(id: number) {
    return this.api.patch<Teacher>(`/teachers/${id}/deactivate`, {});
  }

  remove(id: number) {
    return this.api.delete<Teacher>(`/teachers/${id}`);
  }
}
