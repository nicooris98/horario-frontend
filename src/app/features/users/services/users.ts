import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CreateUserRequest, User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class Users {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<User[]>('users');
  }

  getById(id: number) {
  return this.api.get<User>(`users/${id}`);
  }

  update(id: number, data: { isDisabled?: boolean }) {
    return this.api.patch<User>(`users/${id}`, data);
  }

  create(data: CreateUserRequest) {
    return this.api.post<User>('users', data);
  }
}