import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../features/auth/services/auth';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const permission = route.data['permission'];

  if (typeof permission !== 'string' || permission.length === 0) {
    return router.createUrlTree(['/dashboard']);
  }

  return auth.hasPermission(permission) ? true : router.createUrlTree(['/dashboard']);
};
