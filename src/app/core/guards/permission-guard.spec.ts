import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Auth } from '../../features/auth/services/auth';
import { permissionGuard } from './permission-guard';

describe('permissionGuard', () => {
  const auth = {
    hasPermission: vi.fn(),
  };
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => permissionGuard(...guardParameters));

  beforeEach(() => {
    auth.hasPermission.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Auth, useValue: auth }],
    });
  });

  it('allows access when the user has the required permission', () => {
    auth.hasPermission.mockReturnValue(true);

    expect(
      executeGuard(
        { data: { permission: 'users.read' } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    ).toBe(true);
    expect(auth.hasPermission).toHaveBeenCalledWith('users.read');
  });

  it('redirects to the dashboard when the user lacks the required permission', () => {
    auth.hasPermission.mockReturnValue(false);

    const result = executeGuard(
      { data: { permission: 'users.read' } } as unknown as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    );
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('redirects to the dashboard when the route has no permission configured', () => {
    const result = executeGuard(
      { data: {} } as unknown as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    );
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
    expect(auth.hasPermission).not.toHaveBeenCalled();
  });
});
