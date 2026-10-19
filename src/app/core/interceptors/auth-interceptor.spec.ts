import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Auth } from '../../features/auth/services/auth';
import { API_CONFIG } from '../config/api.config';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const auth = {
    clearSession: vi.fn(),
  };
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    auth.clearSession.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: auth },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('sends API requests with credentials', () => {
    TestBed.inject(HttpClient).get(`${API_CONFIG.baseUrl}/courses`).subscribe();

    const request = httpTestingController.expectOne(`${API_CONFIG.baseUrl}/courses`);
    expect(request.request.withCredentials).toBe(true);
    request.flush({});
  });

  it('clears the session and redirects when an API request returns 401', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(HttpClient)
      .get(`${API_CONFIG.baseUrl}/courses`)
      .subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(`${API_CONFIG.baseUrl}/courses`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearSession).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not redirect when login credentials return 401', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(HttpClient)
      .post(`${API_CONFIG.baseUrl}/auth/login`, {})
      .subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(`${API_CONFIG.baseUrl}/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
