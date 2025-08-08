import { Provider, Injector } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ENVIRONMENT } from '../../app.config';

// Import clean tokens without circular dependencies
import { WORK_ITEMS_SERVICE, IWorkItemsService } from '../tokens/service-tokens';

// Re-export tokens for consumer components
export { WORK_ITEMS_SERVICE, IWorkItemsService } from '../tokens/service-tokens';

// Configuration error type
import { ConfigError } from '../../shared/components/config-error/config-error.component';

// Mock service implementations
import { MockWorkItemsService } from '../mock/mock-work-items.service';

// Real service implementations
import { WorkItemsService } from '../ado/work-items.service';

// Configuration validation
export function validateApiConfiguration(): ConfigError | null {
  if (environment.useMockApi) {
    return null; // Mock mode doesn't require validation
  }

  // Check if this is a browser environment and Tauri is available
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    return {
      type: 'connection-failed',
      title: 'Tauri Environment Required',
      message: 'Real API mode requires the Tauri desktop application environment.',
      details: ['This application must be run using "npm run tauri:dev:real" for real API access'],
      actionable: true
    };
  }

  return null; // Configuration will be validated at runtime by Tauri services
}

/**
 * Environment-based service providers
 * Automatically switches between real and mock implementations based on environment
 */
export const apiProviders: Provider[] = [
  // Work Items Service Provider with environment-based factory
  {
    provide: WORK_ITEMS_SERVICE,
    useFactory: (): IWorkItemsService => {
      console.log('🏭 WorkItemsService factory called');
      console.log('🔧 Current environment in factory:', {
        production: environment.production,
        useMockApi: environment.useMockApi
      });
      
      const configError = validateApiConfiguration();
      
      if (configError) {
        console.error('❌ API Configuration Error:', configError.message);
        // Store the error for the app to display
        (window as any).__API_CONFIG_ERROR__ = configError;
        // Return a mock service as fallback to prevent app crash
        console.log('🎭 Returning MockWorkItemsService due to config error');
        return new MockWorkItemsService();
      }

      if (environment.useMockApi) {
        console.log('🎭 Creating MockWorkItemsService instance (Mock mode)');
        return new MockWorkItemsService();
      } else {
        console.log('🔗 Getting real WorkItemsService instance for ADO API (Real mode)');
        // Use Angular's injector to properly create the service with all its dependencies
        console.log('🔗 Creating WorkItemsService with environment:', environment);
        return new WorkItemsService(environment);
      }
    },
    deps: []
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
/**
 * Modern Angular provider configuration using class-based providers
 * Clean separation without complex factory functions
 */
export function createApiProviders(): Provider[] {
  console.log(`🔧 API Mode: ${environment.useMockApi ? 'Mock' : 'Real'} (${environment.production ? 'Production' : 'Development'})`);
  
  const providers: Provider[] = [];
  
  // Work Items Service Provider - Modern class-based approach
  if (environment.useMockApi) {
    console.log('🎭 Registering MockWorkItemsService');
    providers.push({
      provide: WORK_ITEMS_SERVICE,
      useClass: MockWorkItemsService
    });
  } else {
    console.log('🔗 Registering real WorkItemsService');
    providers.push({
      provide: WORK_ITEMS_SERVICE,
      useFactory: (env: any) => {
        console.log('🏭 Creating WorkItemsService with environment injection');
        return new WorkItemsService(env);
      },
      deps: [ENVIRONMENT]
    });
  }
  
  console.log(`✅ Created ${providers.length} API providers using modern pattern`);
  return providers;
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