import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Api } from '../../../core/services/api';

import { User } from '../interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly api = inject(Api);

  readonly currentUser = signal<User | null>(null);

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }

  login(email: string) {
    return this.api.post<{ verificationRequired: boolean }>('auth/login', { email });
  }

  verifyOtp(email: string, code: string) {
    return this.api.post('auth/activation/verify-code', { email, code });
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
