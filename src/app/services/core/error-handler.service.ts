import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let errorDetails: string | undefined;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = this.getServerErrorMessage(error);
      errorDetails = this.getServerErrorDetails(error);
    }

    // Log the error for debugging
    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      details: errorDetails,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    return throwError(() => ({
      message: errorMessage,
      details: errorDetails,
      status: error.status,
      statusText: error.statusText,
      url: error.url
    }));
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return this.parseAdoError(error) || 'Bad Request - Please check your input';
      case 401:
        return 'Authentication failed - Please check your Personal Access Token';
      case 403:
        return 'Access forbidden - You don\'t have permission to access this resource';
      case 404:
        return 'Resource not found - The requested item doesn\'t exist';
      case 409:
        return 'Conflict - The resource is in a conflicting state';
      case 429:
        return 'Too many requests - Please wait before trying again';
      case 500:
        return 'Internal server error - Please try again later';
      case 502:
        return 'Bad gateway - Service temporarily unavailable';
      case 503:
        return 'Service unavailable - Please try again later';
      case 504:
        return 'Gateway timeout - The request took too long to process';
      default:
        return `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
    }
  }

  private getServerErrorDetails(error: HttpErrorResponse): string | undefined {
    if (error.error && typeof error.error === 'object') {
      const adoError = error.error as ApiErrorResponse;
      if (adoError.message) {
        return adoError.message;
      }
      
      // Try to extract any additional error information
      if (error.error.error_description) {
        return error.error.error_description;
      }
      
      if (error.error.details) {
        return error.error.details;
      }
    }
    
    return undefined;
  }

  private parseAdoError(error: HttpErrorResponse): string | null {
    try {
      const adoError = error.error as ApiErrorResponse;
      if (adoError && adoError.message) {
        return adoError.message;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  getUserFriendlyMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    
    if (error?.status) {
      switch (error.status) {
        case 0:
          return 'Network error - Please check your internet connection';
        case 401:
          return 'Please sign in again to continue';
        case 403:
          return 'You don\'t have permission to perform this action';
        case 404:
          return 'The requested resource was not found';
        case 429:
          return 'Too many requests - Please wait a moment and try again';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Server error - Please try again in a few minutes';
        default:
          return 'Something went wrong - Please try again';
      }
    }
    
    return 'An unexpected error occurred';
  }

  isRetryableError(error: any): boolean {
    if (!error?.status) {
      return false;
    }

    // Retry on network errors and temporary server errors
    return [0, 408, 429, 500, 502, 503, 504].includes(error.status);
  }

  shouldReauthenticate(error: any): boolean {
    return error?.status === 401;
  }
}