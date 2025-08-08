import { Injectable, inject, signal } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';
import { ENVIRONMENT } from '../../app.config';
import { AuthState, AuthConfig, TokenValidationResponse } from '../models/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AdoAuthService {
  private readonly http = inject(HttpClientService);
  private readonly environment = inject(ENVIRONMENT);

  // Signal-based reactive state (Angular 17 best practice)
  private readonly authStateSignal = signal<AuthState | null>(null);
  
  // Observable for compatibility with existing RxJS patterns
  private readonly authStateSubject = new BehaviorSubject<AuthState | null>(null);

  // Public readonly signals
  readonly authState = this.authStateSignal.asReadonly();
  readonly authState$ = this.authStateSubject.asObservable();

  // Computed signals
  readonly isAuthenticated = signal(false);
  readonly currentOrganization = signal<string>('');
  readonly currentUser = signal<string>('');

  constructor() {
    // Initialize auth state from storage
    this.initializeAuthState();
    
    // Keep signals in sync
    this.authStateSubject.subscribe(state => {
      this.authStateSignal.set(state);
      this.isAuthenticated.set(!!state?.isAuthenticated);
      this.currentOrganization.set(state?.organization || '');
      this.currentUser.set(state?.userName || '');
    });
  }

  /**
   * Authenticate with ADO using organization and PAT
   */
  authenticate(config: AuthConfig): Observable<AuthState> {
    if (!config.organization || !config.personalAccessToken) {
      return throwError(() => new Error('Organization and Personal Access Token are required'));
    }

    // In mock mode, skip actual validation
    if (this.environment.useMockApi) {
      const mockAuthState: AuthState = {
        isAuthenticated: true,
        organization: config.organization,
        personalAccessToken: config.personalAccessToken,
        userName: 'Mock User',
        userEmail: 'mock.user@company.com'
      };
      
      this.setAuthState(mockAuthState);
      return of(mockAuthState);
    }

    // Validate token with real ADO API
    return this.validateToken(config).pipe(
      map(validation => {
        if (!validation.valid) {
          throw new Error('Invalid Personal Access Token');
        }

        const authState: AuthState = {
          isAuthenticated: true,
          organization: config.organization,
          personalAccessToken: config.personalAccessToken,
          userName: validation.userName,
          userEmail: validation.userEmail
        };

        this.setAuthState(authState);
        return authState;
      }),
      catchError(error => {
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Sign out and clear authentication state
   */
  signOut(): void {
    this.clearAuthState();
  }

  /**
   * Get current authentication state
   */
  getCurrentAuthState(): AuthState | null {
    return this.authStateSignal();
  }

  /**
   * Check if user is currently authenticated
   */
  isCurrentlyAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get authorization header for API calls
   */
  getAuthorizationHeader(): string | null {
    const authState = this.getCurrentAuthState();
    if (!authState?.personalAccessToken) {
      return null;
    }

    // ADO uses Basic auth with empty username and PAT as password
    const credentials = btoa(`:${authState.personalAccessToken}`);
    return `Basic ${credentials}`;
  }

  /**
   * Validate the current token
   */
  validateCurrentToken(): Observable<boolean> {
    const authState = this.getCurrentAuthState();
    if (!authState) {
      return of(false);
    }

    return this.validateToken({
      organization: authState.organization,
      personalAccessToken: authState.personalAccessToken
    }).pipe(
      map(validation => validation.valid),
      catchError(() => of(false))
    );
  }

  /**
   * Refresh authentication state if needed
   */
  refreshAuth(): Observable<AuthState | null> {
    const currentState = this.getCurrentAuthState();
    if (!currentState) {
      return of(null);
    }

    return this.authenticate({
      organization: currentState.organization,
      personalAccessToken: currentState.personalAccessToken
    }).pipe(
      catchError(() => {
        this.clearAuthState();
        return of(null);
      })
    );
  }

  private validateToken(config: AuthConfig): Observable<TokenValidationResponse> {
    // Build URL based on environment
    const baseUrl = this.environment.useMockApi 
      ? this.environment.apiUrl 
      : `${this.environment.adoBaseUrl}/${config.organization}`;
    
    const url = this.http.buildUrl('/_apis/profile/profiles/me', baseUrl);

    // Create temporary auth header for validation
    const tempCredentials = btoa(`:${config.personalAccessToken}`);
    const headers = {
      'Authorization': `Basic ${tempCredentials}`
    };

    return this.http.get<any>(url, { 
      headers,
      params: { 'api-version': this.environment.apiVersion }
    }).pipe(
      map(profile => ({
        valid: true,
        userName: profile.displayName,
        userEmail: profile.emailAddress,
        expirationDate: profile.expirationDate ? new Date(profile.expirationDate) : undefined
      })),
      catchError(error => {
        if (error.status === 401) {
          return of({ valid: false });
        }
        return throwError(() => error);
      })
    );
  }

  private initializeAuthState(): void {
    try {
      // Try to load from secure storage (Tauri) or fallback to sessionStorage
      const storedAuth = this.getStoredAuth();
      if (storedAuth) {
        this.authStateSubject.next(storedAuth);
      }
    } catch (error) {
      console.warn('Failed to load stored authentication state:', error);
    }
  }

  private setAuthState(authState: AuthState): void {
    this.authStateSubject.next(authState);
    this.storeAuth(authState);
  }

  private clearAuthState(): void {
    this.authStateSubject.next(null);
    this.clearStoredAuth();
  }

  private getStoredAuth(): AuthState | null {
    try {
      // TODO: Replace with Tauri secure storage when available
      const stored = sessionStorage.getItem('ado-auth-state');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }

  private storeAuth(authState: AuthState): void {
    try {
      // TODO: Replace with Tauri secure storage when available
      sessionStorage.setItem('ado-auth-state', JSON.stringify(authState));
    } catch (error) {
      console.warn('Failed to store authentication state:', error);
    }
  }

  private clearStoredAuth(): void {
    try {
      // TODO: Replace with Tauri secure storage when available
      sessionStorage.removeItem('ado-auth-state');
    } catch {
      // Ignore storage errors
    }
  }
}