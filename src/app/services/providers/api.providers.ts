import { Provider, InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

// Service interfaces
import { IWorkItemsService, WorkItemsService } from '../ado/work-items.service';

// Mock service implementations
import { MockWorkItemsService } from '../mock/mock-work-items.service';

// Create injection tokens for interfaces
export const WORK_ITEMS_SERVICE = new InjectionToken<IWorkItemsService>('WorkItemsService');

/**
 * Environment-based service providers
 * Automatically switches between real and mock implementations based on environment
 */
export const apiProviders: Provider[] = [
  // Work Items Service Provider
  {
    provide: WORK_ITEMS_SERVICE,
    useClass: environment.useMockApi ? MockWorkItemsService : WorkItemsService
  }
  
  // Additional service providers will be added here as we implement them
  // Example:
  // {
  //   provide: REPOSITORIES_SERVICE,
  //   useClass: environment.useMockApi ? MockRepositoriesService : RepositoriesService
  // },
  // {
  //   provide: BUILDS_SERVICE,
  //   useClass: environment.useMockApi ? MockBuildsService : BuildsService
  // }
];

/**
 * Factory function to create service providers dynamically
 */
export function createApiProviders(): Provider[] {
  console.log(`🔧 API Mode: ${environment.useMockApi ? 'Mock' : 'Real'} (${environment.production ? 'Production' : 'Development'})`);
  
  return apiProviders;
}

/**
 * Helper function to check current API mode
 */
export function isUsingMockApi(): boolean {
  return environment.useMockApi;
}

/**
 * Helper function to get current environment info
 */
export function getEnvironmentInfo(): {
  production: boolean;
  useMockApi: boolean;
  apiUrl: string;
  adoBaseUrl: string;
} {
  return {
    production: environment.production,
    useMockApi: environment.useMockApi,
    apiUrl: environment.apiUrl,
    adoBaseUrl: environment.adoBaseUrl
  };
}