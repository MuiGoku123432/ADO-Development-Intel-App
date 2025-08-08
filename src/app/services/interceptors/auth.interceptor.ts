import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdoAuthService } from '../core/ado-auth.service';
import { ENVIRONMENT } from '../../app.config';

/**
 * Functional HTTP Interceptor for adding authentication headers (Angular 17 style)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AdoAuthService);
  const environment = inject(ENVIRONMENT);

  // Only add auth headers to ADO API requests
  const isAdoApiRequest = isAdoApiUrl(req.url, environment);
  
  if (!isAdoApiRequest) {
    return next(req);
  }

  // Get authorization header from auth service
  const authHeader = authService.getAuthorizationHeader();
  
  if (!authHeader) {
    // No auth header available - let the request proceed
    // The error interceptor will handle 401 responses
    return next(req);
  }

  // Clone the request and add authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: authHeader
    }
  });

  return next(authReq);
};

/**
 * Helper function to determine if URL is an ADO API request
 */
function isAdoApiUrl(url: string, environment: any): boolean {
  // Check if URL contains ADO API patterns
  const adoApiPatterns = [
    '/_apis/',
    environment.adoBaseUrl,
    environment.apiUrl
  ];

  return adoApiPatterns.some(pattern => url.includes(pattern));
}