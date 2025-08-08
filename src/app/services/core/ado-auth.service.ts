import { Injectable, inject, signal } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';
import { ENVIRONMENT } from '../../app.config';
import { AuthState, AuthConfig, TokenValidationResponse } from '../models/auth.interface';
import { TauriEnvService, AuthDiagnostics } from '../tauri/tauri-env.service';

@Injectable({
  providedIn: 'root'
})
export class AdoAuthService {
  private readonly http = inject(HttpClientService);
  private readonly environment = inject(ENVIRONMENT);
  private readonly tauriEnv = inject(TauriEnvService);

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
    console.log('🔐 AdoAuthService initialized');
    
    // Initialize auth state from storage
    this.initializeAuthState();
    
    // Keep signals in sync
    this.authStateSubject.subscribe(state => {
      console.log('🔄 Auth state changed:', state);
      this.authStateSignal.set(state);
      this.isAuthenticated.set(!!state?.isAuthenticated);
      this.currentOrganization.set(state?.organization || '');
      this.currentUser.set(state?.userName || '');
    });

    // Try to auto-authenticate from environment
    this.tryAutoAuthenticate();
  }

  /**
   * Attempt to auto-authenticate using Tauri environment credentials
   */
  private async tryAutoAuthenticate(): Promise<void> {
    const startTime = performance.now();
    console.log('🔄 [AUTH] Starting enhanced auto-authentication process...');
    
    // Step 1: Check Tauri context with improved detection
    if (!this.tauriEnv.isTauriContext()) {
      console.log('🌐 [AUTH] Tauri context check failed - skipping auto-authentication');
      console.log('  └─ Running in browser-only mode - manual authentication will be required');
      return;
    }

    try {
      // Step 2: Test actual backend connection
      console.log('🔍 [AUTH] Step 1: Testing Tauri backend connection...');
      const connectionWorks = await this.tauriEnv.testTauriConnection();
      if (!connectionWorks) {
        console.warn('⚠️ [AUTH] Tauri backend connection failed');
        console.warn('  └─ Even though Tauri context was detected, backend is not responding');
        console.warn('  └─ Check that "npm run tauri:dev:real" started successfully');
        return;
      }

      // Step 3: Validate environment configuration
      console.log('🔍 [AUTH] Step 2: Validating environment configuration...');
      const isValid = await this.tauriEnv.validateAdoConfig();
      if (!isValid) {
        console.log('📋 [AUTH] Environment validation failed - manual authentication required');
        console.log('  └─ Create a .env file with ADO_ORGANIZATION and ADO_PAT variables');
        console.log('  └─ Or set these environment variables in your system');
        return;
      }

      // Step 4: Retrieve credentials from environment
      console.log('🔍 [AUTH] Step 3: Retrieving credentials from environment...');
      const credentials = await this.tauriEnv.getAdoCredentials();
      if (!credentials) {
        console.warn('⚠️ [AUTH] Could not retrieve credentials despite validation success');
        console.warn('  └─ This may indicate a timing issue or environment inconsistency');
        console.warn('  └─ Try restarting the Tauri development server');
        return;
      }

      const elapsed = performance.now() - startTime;
      console.log(`🚀 [AUTH] Step 4: Attempting authentication with retrieved credentials (${elapsed.toFixed(2)}ms elapsed)...`);
      console.log(`  ├─ Organization: ${credentials.organization}`);
      console.log(`  ├─ PAT: ${'*'.repeat(Math.min(credentials.personal_access_token.length, 10))}`);
      console.log(`  └─ Project: ${credentials.project || 'Not specified'}`);
      
      this.authenticate({
        organization: credentials.organization,
        personalAccessToken: credentials.personal_access_token,
        project: credentials.project
      }).subscribe({
        next: (authState) => {
          const totalElapsed = performance.now() - startTime;
          console.log(`✅ [AUTH] Auto-authentication completed successfully (${totalElapsed.toFixed(2)}ms total):`);
          console.log(`  ├─ Authenticated as: ${authState.userName}`);
          console.log(`  ├─ Email: ${authState.userEmail}`);
          console.log(`  ├─ Organization: ${authState.organization}`);
          console.log(`  └─ Ready to make ADO API calls!`);
        },
        error: (error) => {
          const totalElapsed = performance.now() - startTime;
          console.error(`❌ [AUTH] Auto-authentication failed (${totalElapsed.toFixed(2)}ms):`, error);
          console.error('  └─ Will fall back to manual authentication');
          
          // Enhanced error analysis with specific guidance
          if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            console.warn('💡 [TROUBLESHOOT] Authentication failed - PAT may be invalid or expired');
            console.warn('  └─ Generate a new Personal Access Token in Azure DevOps');
            console.warn('  └─ Make sure PAT has "Work Items (read)" permissions');
          } else if (error?.message?.includes('404') || error?.message?.includes('organization')) {
            console.warn('💡 [TROUBLESHOOT] Organization not found - check ADO_ORGANIZATION value');
            console.warn(`  └─ Verify organization name: ${credentials?.organization}`);
          } else if (error?.message?.includes('network') || error?.message?.includes('connection')) {
            console.warn('💡 [TROUBLESHOOT] Network issue - check internet connectivity');
            console.warn('  └─ Verify you can access Azure DevOps in your browser');
          }
        }
      });
    } catch (error: any) {
      const totalElapsed = performance.now() - startTime;
      console.error(`❌ [AUTH] Auto-authentication process failed (${totalElapsed.toFixed(2)}ms):`, error);
      console.error('  └─ Error type:', typeof error);
      console.error('  └─ Error details:', error?.message || error);
      console.error('  └─ This suggests a problem with the Tauri backend communication');
    }
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
        userEmail: 'mock.user@company.com',
        project: config.project
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
          userEmail: validation.userEmail,
          project: config.project
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

  /**
   * Get comprehensive authentication diagnostics
   * Useful for troubleshooting authentication issues
   */
  async getAuthDiagnostics(): Promise<{
    frontend: any;
    backend?: AuthDiagnostics;
    overall_status: string;
  }> {
    console.log('🔬 [AUTH] Generating comprehensive authentication diagnostics...');
    const startTime = performance.now();

    // Frontend diagnostics
    const frontendDiag = {
      tauri_context: this.tauriEnv.isTauriContext(),
      current_auth_state: {
        is_authenticated: this.isAuthenticated(),
        has_organization: !!this.currentOrganization(),
        has_user: !!this.currentUser(),
        auth_state_exists: !!this.getCurrentAuthState()
      },
      environment_config: {
        api_mode: this.environment.useMockApi ? 'Mock' : 'Real',
        api_url: this.environment.apiUrl,
        ado_base_url: this.environment.adoBaseUrl,
        api_version: this.environment.apiVersion
      },
      storage: {
        session_storage_available: typeof sessionStorage !== 'undefined',
        stored_auth_present: !!this.getStoredAuth()
      }
    };

    // Backend diagnostics (if available)
    let backendDiag: AuthDiagnostics | undefined;
    try {
      if (this.tauriEnv.isTauriContext()) {
        backendDiag = await this.tauriEnv.getAuthDiagnostics() || undefined;
      }
    } catch (error) {
      console.warn('⚠️ [AUTH] Could not retrieve backend diagnostics:', error);
    }

    // Overall status assessment
    let overallStatus = '🔴 CRITICAL - Multiple issues detected';
    
    if (frontendDiag.current_auth_state.is_authenticated) {
      overallStatus = '🟢 HEALTHY - Fully authenticated and operational';
    } else if (frontendDiag.tauri_context && backendDiag?.validation_results?.['has_organization'] && backendDiag?.validation_results?.['has_pat']) {
      overallStatus = '🟡 READY - Credentials available, authentication pending';
    } else if (!frontendDiag.tauri_context && this.environment.useMockApi) {
      overallStatus = '🟡 BROWSER MODE - Mock API ready for development';
    } else if (!frontendDiag.tauri_context) {
      overallStatus = '🔴 INCOMPLETE - Browser mode requires manual authentication';
    } else if (backendDiag && !backendDiag.validation_results?.['has_organization']) {
      overallStatus = '🔴 MISSING CONFIG - ADO credentials not configured';
    }

    const elapsed = performance.now() - startTime;
    console.log(`🔬 [AUTH] Diagnostics completed (${elapsed.toFixed(2)}ms):`);
    console.log('  ├─ Overall Status:', overallStatus);
    console.log('  ├─ Tauri Context:', frontendDiag.tauri_context ? '✅' : '❌');
    console.log('  ├─ Authenticated:', frontendDiag.current_auth_state.is_authenticated ? '✅' : '❌');
    console.log('  └─ Backend Diagnostics:', backendDiag ? '✅' : '❌');

    return {
      frontend: frontendDiag,
      backend: backendDiag,
      overall_status: overallStatus
    };
  }

  private validateToken(config: AuthConfig): Observable<TokenValidationResponse> {
    const startTime = performance.now();
    console.log('🔐 [AUTH] Validating Personal Access Token...');
    
    // Build URL based on environment
    const baseUrl = this.environment.useMockApi 
      ? this.environment.apiUrl 
      : `${this.environment.adoBaseUrl}/${config.organization}`;
    
    const url = this.http.buildUrl('/_apis/profile/profiles/me', baseUrl);
    console.log(`📡 [AUTH] Token validation URL: ${url}`);
    console.log(`🔧 [AUTH] Using ${this.environment.useMockApi ? 'Mock API' : 'Real ADO API'} for validation`);

    // Create temporary auth header for validation
    const tempCredentials = btoa(`:${config.personalAccessToken}`);
    const headers = {
      'Authorization': `Basic ${tempCredentials}`
    };
    
    console.log('📊 [AUTH] Request headers configured, making validation call...');

    return this.http.get<any>(url, { 
      headers,
      params: { 'api-version': this.environment.apiVersion }
    }).pipe(
      tap(() => {
        const elapsed = performance.now() - startTime;
        console.log(`📡 [AUTH] HTTP request completed (${elapsed.toFixed(2)}ms)`);
      }),
      map(profile => {
        const elapsed = performance.now() - startTime;
        console.log(`✅ [AUTH] Token validation successful (${elapsed.toFixed(2)}ms total):`);
        console.log(`  ├─ User: ${profile.displayName || 'Unknown'}`);
        console.log(`  ├─ Email: ${profile.emailAddress || 'Not provided'}`);
        console.log(`  └─ Profile ID: ${profile.id || 'Not available'}`);
        
        return {
          valid: true,
          userName: profile.displayName,
          userEmail: profile.emailAddress,
          expirationDate: profile.expirationDate ? new Date(profile.expirationDate) : undefined
        };
      }),
      catchError(error => {
        const elapsed = performance.now() - startTime;
        console.error(`❌ [AUTH] Token validation failed (${elapsed.toFixed(2)}ms):`, error);
        
        if (error.status === 401) {
          console.warn('🔒 [AUTH] HTTP 401 Unauthorized - PAT is invalid or expired');
          console.warn('  └─ Check that your Personal Access Token has the required permissions');
          return of({ valid: false });
        } else if (error.status === 403) {
          console.warn('🚫 [AUTH] HTTP 403 Forbidden - PAT lacks required permissions');
          console.warn('  └─ Ensure your PAT has "Read" access to user profile');
          return of({ valid: false });
        } else if (error.status === 404) {
          console.warn('🔍 [AUTH] HTTP 404 Not Found - Organization may not exist');
          console.warn(`  └─ Check organization name: ${config.organization}`);
        } else if (error.status === 0) {
          console.warn('🌐 [AUTH] Network error - Unable to reach ADO API');
          console.warn('  └─ Check internet connectivity and firewall settings');
        } else {
          console.warn(`⚠️ [AUTH] HTTP ${error.status} - Unexpected validation error`);
          console.warn('  └─ Error details:', error.message || error);
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