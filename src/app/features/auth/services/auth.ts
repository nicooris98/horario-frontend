import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Api } from '../../../core/services/api';

import { LoginRequest } from '../interfaces/login-request.interface';
import { LoginResponse, User } from '../interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly api = inject(Api);

  readonly currentUser = signal<User | null>(null);

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }

  login(data: LoginRequest) {
    return this.api.post<LoginResponse>('auth/login', data);
  }

  verifyOtp(email: string, code: string) {
    return this.api.post('auth/activation/verify-code', { email, code });
  }

  resendOtp(email: string) {
    return this.api.post<{ message: string }>('auth/activation/resend-code', { email });
  }

  getMe() {
    return this.api.get<User>('auth/me').pipe(tap((user) => this.currentUser.set(user)));
  }

  clearSession(): void {
    this.currentUser.set(null);
  }

  logout() {
    return this.api.post('auth/logout', {}).pipe(tap(() => this.clearSession()));
  }
}
