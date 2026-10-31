import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Role } from '../interfaces/role';

@Injectable({ providedIn: 'root' })
export class Roles {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<Role[]>('roles');
  }

  getById(id: number) {
    return this.api.get<Role>(`roles/${id}`);
  }

  getPermissions(id: number) {
    return this.api.get<Role>(`roles/${id}/permissions`);
  }
}