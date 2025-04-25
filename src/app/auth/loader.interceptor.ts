import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { LoaderService } from '../services/loader.service';
import { catchError, finalize, Observable } from 'rxjs';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';

export const LoaderInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>, 
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const loaderService = inject(LoaderService);  // Inject the LoaderService

  // Show the loader before the request is sent
  loaderService.show();

  return next(req).pipe(
    // Finalize the request by hiding the loader after the request completes
    finalize(() => {
      loaderService.hide();
    }),

    // Catch and log any errors that occur during the request
    catchError((error) => {
      console.error('Request failed with error:', error);
      throw error;  // Rethrow the error for further handling
    })
  );
};
