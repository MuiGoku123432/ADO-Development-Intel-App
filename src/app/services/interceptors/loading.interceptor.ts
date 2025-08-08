import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../core/loading.service';

/**
 * Functional HTTP Interceptor for managing loading states (Angular 17 style)
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for certain requests
  if (shouldSkipLoading(req.url)) {
    return next(req);
  }

  // Start loading
  const requestId = generateRequestId();
  loadingService.startLoading(requestId);

  return next(req).pipe(
    finalize(() => {
      // Stop loading when request completes (success or error)
      loadingService.stopLoading(requestId);
    })
  );
};

/**
 * Helper function to determine if loading should be skipped for certain requests
 */
function shouldSkipLoading(url: string): boolean {
  const skipPatterns = [
    // Skip loading for frequent polling requests
    '/heartbeat',
    '/ping',
    '/health',
    // Skip for analytics/tracking requests
    '/analytics',
    '/tracking'
  ];

  return skipPatterns.some(pattern => url.includes(pattern));
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}