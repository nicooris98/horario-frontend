import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { Auth } from '../../features/auth/services/auth';
import { User } from '../../features/auth/interfaces/login-response.interface';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const user: User = {
    id: 1,
    firstName: 'Ana',
    lastName: 'Perez',
    email: 'ana@example.com',
    isActive: true,
    createdAt: '2026-10-19T12:00:00.000Z',
    updatedAt: '2026-10-19T12:00:00.000Z',
    roles: [],
    permissions: [],
  };
  const auth = {
    currentUser: signal<User | null>(null),
    getMe: vi.fn(),
    clearSession: vi.fn(),
  };
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    auth.currentUser.set(null);
    auth.getMe.mockReset();
    auth.clearSession.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
    });
  });

  it('allows navigation when the session is valid', async () => {
    auth.getMe.mockReturnValue(of(user));

    const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    await expect(firstValueFrom(result as Observable<boolean>)).resolves.toBe(true);
  });

  it('redirects to login when the session has expired', async () => {
    auth.getMe.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    const guardResult = await firstValueFrom(result as Observable<boolean | UrlTree>);
    const router = TestBed.inject(Router);

    expect(guardResult).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(guardResult as UrlTree)).toBe('/login');
    expect(auth.clearSession).toHaveBeenCalledOnce();
  });
});
