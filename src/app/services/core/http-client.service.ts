import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, mergeMap, timeout } from 'rxjs/operators';
import { ENVIRONMENT } from '../../app.config';
import { ErrorHandlerService } from './error-handler.service';

export interface HttpRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  timeout?: number;
  retryAttempts?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly errorHandler = inject(ErrorHandlerService);

  private readonly defaultTimeout = this.environment.requestTimeout || 30000;
  private readonly defaultRetryAttempts = this.environment.retryAttempts || 2;

  get<T>(url: string, options?: HttpRequestOptions): Observable<T> {
    return this.makeRequest<T>('GET', url, null, options);
  }

  post<T>(url: string, body: any, options?: HttpRequestOptions): Observable<T> {
    return this.makeRequest<T>('POST', url, body, options);
  }

  put<T>(url: string, body: any, options?: HttpRequestOptions): Observable<T> {
    return this.makeRequest<T>('PUT', url, body, options);
  }

  patch<T>(url: string, body: any, options?: HttpRequestOptions): Observable<T> {
    return this.makeRequest<T>('PATCH', url, body, options);
  }

  delete<T>(url: string, options?: HttpRequestOptions): Observable<T> {
    return this.makeRequest<T>('DELETE', url, null, options);
  }

  private makeRequest<T>(
    method: string,
    url: string,
    body: any,
    options?: HttpRequestOptions
  ): Observable<T> {
    const requestOptions = this.buildRequestOptions(options);
    const timeoutDuration = options?.timeout || this.defaultTimeout;
    const retryAttempts = options?.retryAttempts || this.defaultRetryAttempts;

    let request$: Observable<T>;

    switch (method.toUpperCase()) {
      case 'GET':
        request$ = this.http.get(url, requestOptions) as unknown as Observable<T>;
        break;
      case 'POST':
        request$ = this.http.post(url, body, requestOptions) as unknown as Observable<T>;
        break;
      case 'PUT':
        request$ = this.http.put(url, body, requestOptions) as unknown as Observable<T>;
        break;
      case 'PATCH':
        request$ = this.http.patch(url, body, requestOptions) as unknown as Observable<T>;
        break;
      case 'DELETE':
        request$ = this.http.delete(url, requestOptions) as unknown as Observable<T>;
        break;
      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }

    return request$.pipe(
      timeout(timeoutDuration),
      // Use retry with conditional delay instead of retryWhen to satisfy typing
      retry({
        count: retryAttempts,
        delay: (error, retryCount) => {
          if (!this.errorHandler.isRetryableError(error)) {
            // Abort retries for non-retryable errors
            throw error;
          }
          const backoff = Math.pow(2, retryCount - 1) * 1000;
          return timer(backoff);
        },
      }),
      catchError((error: HttpErrorResponse) => this.errorHandler.handleError(error))
    );
  }

  private buildRequestOptions(options?: HttpRequestOptions): any {
    const requestOptions: any = {
      headers: this.buildHeaders(options?.headers),
      responseType: options?.responseType || 'json',
      observe: 'body' as const,
    };

    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }

    return requestOptions;
  }

  private buildHeaders(headers?: HttpHeaders | { [header: string]: string | string[] }): HttpHeaders {
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (headers) {
      if (headers instanceof HttpHeaders) {
        headers.keys().forEach(key => {
          const value = headers.get(key);
          if (value) {
            httpHeaders = httpHeaders.set(key, value);
          }
        });
      } else {
        Object.keys(headers).forEach(key => {
          const value = headers[key];
          if (value) {
            httpHeaders = httpHeaders.set(key, Array.isArray(value) ? value : [value]);
          }
        });
      }
    }

    return httpHeaders;
  }

  private buildParams(params: HttpParams | { [param: string]: string | string[] }): HttpParams {
    if (params instanceof HttpParams) {
      return params;
    }

    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => {
            httpParams = httpParams.append(key, v);
          });
        } else {
          httpParams = httpParams.set(key, value);
        }
      }
    });

    return httpParams;
  }

  private retryStrategy(errors: Observable<any>, maxRetries: number): Observable<any> {
    return errors.pipe(
      mergeMap((error, index) => {
        // Don't retry if we've exceeded max attempts
        if (index >= maxRetries) {
          return throwError(() => error);
        }

        // Only retry on specific error conditions
        if (this.errorHandler.isRetryableError(error)) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = Math.pow(2, index) * 1000;
          console.log(`Retrying request in ${delay}ms (attempt ${index + 1}/${maxRetries})`);
          return timer(delay);
        }

        // Don't retry on non-retryable errors
        return throwError(() => error);
      })
    );
  }

  // Utility method for building query parameters
  buildQueryParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => {
            httpParams = httpParams.append(key, v.toString());
          });
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return httpParams;
  }

  // Utility method for building URL with base path
  buildUrl(endpoint: string, baseUrl?: string): string {
    const base = baseUrl || this.environment.apiUrl;
    
    // Ensure base URL doesn't end with slash and endpoint doesn't start with slash
    const cleanBase = base.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    return `${cleanBase}/${cleanEndpoint}`;
  }
}
