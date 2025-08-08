import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../core/http-client.service';
import { ENVIRONMENT } from '../../app.config';
import { AdoAuthService } from '../core/ado-auth.service';
import { ApiResponse, ApiSingleResponse } from '../models/api-response.interface';

/**
 * Abstract base class for all ADO API services
 * Provides common functionality and enforces consistent patterns
 */
export abstract class AdoApiBaseService {
  protected readonly http = inject(HttpClientService);
  protected readonly environment = inject(ENVIRONMENT);
  protected readonly authService = inject(AdoAuthService);

  /**
   * Build ADO API URL with organization and project context
   */
  protected buildAdoUrl(endpoint: string, organization?: string, project?: string): string {
    const org = organization || this.authService.currentOrganization();
    
    if (!org) {
      throw new Error('Organization is required for ADO API calls');
    }

    let baseUrl: string;
    
    if (this.environment.useMockApi) {
      baseUrl = this.environment.apiUrl;
      
      // For mock API, we need to structure URLs to match our mock endpoints
      if (project) {
        endpoint = `/${project}${endpoint}`;
      }
    } else {
      // Real ADO API structure
      baseUrl = `${this.environment.adoBaseUrl}/${org}`;
      if (project) {
        baseUrl += `/${project}`;
      }
    }

    return this.http.buildUrl(endpoint, baseUrl);
  }

  /**
   * Build query parameters with ADO API version
   */
  protected buildAdoParams(params: { [key: string]: any } = {}): { [key: string]: any } {
    return {
      'api-version': this.environment.apiVersion,
      ...params
    };
  }

  /**
   * Make a GET request to ADO API
   */
  protected adoGet<T>(
    endpoint: string, 
    params: { [key: string]: any } = {},
    organization?: string,
    project?: string
  ): Observable<T> {
    const url = this.buildAdoUrl(endpoint, organization, project);
    const queryParams = this.buildAdoParams(params);
    
    return this.http.get<T>(url, { 
      params: this.http.buildQueryParams(queryParams)
    });
  }

  /**
   * Make a POST request to ADO API
   */
  protected adoPost<T>(
    endpoint: string,
    body: any,
    params: { [key: string]: any } = {},
    organization?: string,
    project?: string
  ): Observable<T> {
    const url = this.buildAdoUrl(endpoint, organization, project);
    const queryParams = this.buildAdoParams(params);
    
    return this.http.post<T>(url, body, {
      params: this.http.buildQueryParams(queryParams)
    });
  }

  /**
   * Make a PATCH request to ADO API
   */
  protected adoPatch<T>(
    endpoint: string,
    body: any,
    params: { [key: string]: any } = {},
    organization?: string,
    project?: string
  ): Observable<T> {
    const url = this.buildAdoUrl(endpoint, organization, project);
    const queryParams = this.buildAdoParams(params);
    
    return this.http.patch<T>(url, body, {
      params: this.http.buildQueryParams(queryParams)
    });
  }

  /**
   * Make a PUT request to ADO API
   */
  protected adoPut<T>(
    endpoint: string,
    body: any,
    params: { [key: string]: any } = {},
    organization?: string,
    project?: string
  ): Observable<T> {
    const url = this.buildAdoUrl(endpoint, organization, project);
    const queryParams = this.buildAdoParams(params);
    
    return this.http.put<T>(url, body, {
      params: this.http.buildQueryParams(queryParams)
    });
  }

  /**
   * Make a DELETE request to ADO API
   */
  protected adoDelete<T>(
    endpoint: string,
    params: { [key: string]: any } = {},
    organization?: string,
    project?: string
  ): Observable<T> {
    const url = this.buildAdoUrl(endpoint, organization, project);
    const queryParams = this.buildAdoParams(params);
    
    return this.http.delete<T>(url, {
      params: this.http.buildQueryParams(queryParams)
    });
  }

  /**
   * Extract value from ADO API response
   */
  protected extractApiResponseValue<T>(response: ApiResponse<T>): T[] {
    return response.value || [];
  }

  /**
   * Extract single value from ADO API response
   */
  protected extractApiSingleValue<T>(response: ApiSingleResponse<T>): T {
    return response.value;
  }

  /**
   * Build work item fields selection string
   */
  protected buildFieldsSelection(fields: string[]): string {
    return fields.join(',');
  }

  /**
   * Build expand parameter for ADO API
   */
  protected buildExpandParams(expand: string[]): string {
    return expand.join(',');
  }

  /**
   * Convert JavaScript object to ADO PATCH operations
   */
  protected buildPatchOperations(updates: { [path: string]: any }): Array<{
    op: string;
    path: string;
    value: any;
  }> {
    return Object.keys(updates).map(path => ({
      op: updates[path] === null || updates[path] === undefined ? 'remove' : 'replace',
      path: path.startsWith('/') ? path : `/${path}`,
      value: updates[path]
    }));
  }

  /**
   * Get current project from auth state or use default
   */
  protected getCurrentProject(): string {
    // This could be enhanced to get project from auth state or user preferences
    return 'proj-001'; // Default project for development
  }

  /**
   * Validate that user is authenticated before making requests
   */
  protected requireAuthentication(): void {
    if (!this.authService.isCurrentlyAuthenticated()) {
      throw new Error('Authentication required for ADO API access');
    }
  }

  /**
   * Handle common ADO API error scenarios
   */
  protected handleAdoError(error: any): Observable<never> {
    // This could be enhanced with ADO-specific error handling
    throw error;
  }
}