import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './../services/auth.service';
import { Observable, switchMap, throwError } from 'rxjs';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const expiresAt = localStorage.getItem('expiresAt');

  if (token && expiresAt && new Date(expiresAt) < new Date()) {
    return authService.refreshToken().pipe(
      switchMap(() => {
        const newToken = authService.getAccessToken();
        const clonedRequest = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        });
        return next(clonedRequest);
      }),
      throwError
    );
  }

  const clonedRequest = req.clone({
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return next(clonedRequest);
};
