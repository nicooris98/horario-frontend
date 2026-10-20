
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../../features/auth/services/auth';
import { API_CONFIG } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = API_CONFIG.baseUrl;

  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }

  const auth = inject(Auth);
  const router = inject(Router);
  const endpoint = req.url.split('?')[0];
  const isAuthRequest = endpoint.endsWith('/auth/login') || endpoint.endsWith('/auth/me');

  return next(
    req.clone({
      withCredentials: true,
    }),
  ).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRequest) {
        auth.clearSession();

        if (router.url !== '/login') {
          void router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    }),
  );
};
