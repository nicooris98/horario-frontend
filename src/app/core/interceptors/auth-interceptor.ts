
import { HttpInterceptorFn } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = API_CONFIG.baseUrl;

  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }

  return next(
    req.clone({
      withCredentials: true,
    }),
  );
};
