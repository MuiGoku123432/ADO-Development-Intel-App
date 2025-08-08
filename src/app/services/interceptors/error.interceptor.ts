import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../core/error-handler.service';
import { AdoAuthService } from '../core/ado-auth.service';

/**
 * Functional HTTP Interceptor for global error handling (Angular 17 style)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  const authService = inject(AdoAuthService);

  return next(req).pipe(
    catchError(error => {
      // Handle authentication errors
      if (errorHandler.shouldReauthenticate(error)) {
        // Clear authentication state to trigger re-authentication
        authService.signOut();
        
        // You might want to trigger a sign-in dialog here
        console.warn('Authentication expired. Please sign in again.');
      }

      // Let the error handler process the error
      return errorHandler.handleError(error);
    })
  );
};