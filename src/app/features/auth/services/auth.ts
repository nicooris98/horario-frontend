import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';

import { LoginRequest } from '../interfaces/login-request.interface';
import { LoginResponse } from '../interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly api = inject(Api);

  login(data: LoginRequest) {
    return this.api.post<LoginResponse>('auth/login', data);
  }

  getMe() {
    return this.api.get('auth/me');
  }

  logout() {
    return this.api.post('auth/logout', {});
  }
}