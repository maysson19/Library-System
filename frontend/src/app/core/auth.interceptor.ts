import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from './config';
import { I18nService } from './i18n';

// Adds the JWT and the current language to every API request,
// and signs the user out if the token is rejected
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const i18n = inject(I18nService);
  const token = auth.token;

  let authReq = req;
  if (req.url.startsWith(API_URL)) {
    const headers: Record<string, string> = { 'Accept-Language': i18n.lang() };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    authReq = req.clone({ setHeaders: headers });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
