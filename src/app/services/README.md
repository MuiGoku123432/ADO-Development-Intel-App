# ADO API Services

This directory contains the complete HTTP/HTTPS service implementation for Azure DevOps API integration with Mockoon support.

## Architecture Overview

```
services/
├── core/                     # Core HTTP and auth services
│   ├── http-client.service.ts    # Base HTTP client with retry logic
│   ├── ado-auth.service.ts       # ADO authentication (PAT-based)
│   ├── error-handler.service.ts  # Global error handling
│   └── loading.service.ts        # Loading state management
├── ado/                      # ADO API service implementations
│   ├── ado-api-base.service.ts   # Abstract base for ADO services
│   └── work-items.service.ts     # Work items CRUD operations
├── mock/                     # Mock service implementations
│   └── mock-work-items.service.ts
├── models/                   # TypeScript interfaces
│   ├── api-response.interface.ts
│   ├── auth.interface.ts
│   └── ado/                      # ADO entity interfaces
│       ├── work-item.interface.ts
│       ├── repository.interface.ts
│       ├── pull-request.interface.ts
│       └── pipeline.interface.ts
├── interceptors/             # HTTP interceptors
│   ├── auth.interceptor.ts       # PAT token injection
│   ├── error.interceptor.ts      # Global error handling
│   └── loading.interceptor.ts    # Loading state management
└── providers/                # Service providers
    └── api.providers.ts          # Environment-based service injection
```

## Features Implemented

### ✅ Core Infrastructure
- **HttpClientService**: Base HTTP client with retry logic, timeout handling, and error management
- **AdoAuthService**: Authentication service using Angular signals for reactive state
- **ErrorHandlerService**: Comprehensive error handling with user-friendly messages
- **LoadingService**: Global loading state management with request tracking

### ✅ Authentication
- Personal Access Token (PAT) based authentication
- Secure storage integration (ready for Tauri secure storage)
- Token validation and refresh capabilities
- Automatic auth header injection via interceptors

### ✅ HTTP Interceptors (Angular 17 Functional Style)
- **Auth Interceptor**: Automatic PAT token injection for ADO API calls
- **Error Interceptor**: Global error handling and authentication state management
- **Loading Interceptor**: Automatic loading state management

### ✅ ADO API Integration
- **AdoApiBaseService**: Abstract base class with common ADO API functionality
- **WorkItemsService**: Complete CRUD operations for work items
- Support for WIQL (Work Item Query Language) queries
- Batch operations and complex filtering

### ✅ Mock API Support
- **Mockoon Integration**: Complete mock server setup with realistic ADO data
- **MockWorkItemsService**: Full mock implementation matching real service interface
- Simulated API delays and error scenarios
- Environment-based switching between real and mock APIs

### ✅ Environment Configuration
- Separate development and production configurations
- Environment-based service provider injection
- Automatic API mode detection and logging

## Development Commands

```bash
# Start development with mock API
npm run dev

# Start mock API only
npm run mock-api

# Start with real ADO API
npm run start:prod
```

## Environment Configuration

### Development (Mock API)
```typescript
// environment.ts
{
  useMockApi: true,
  apiUrl: 'http://localhost:3001',  // Mockoon server
  adoBaseUrl: 'https://dev.azure.com'
}
```

### Production (Real ADO API)  
```typescript
// environment.prod.ts
{
  useMockApi: false,
  apiUrl: 'https://dev.azure.com',
  adoBaseUrl: 'https://dev.azure.com'
}
```

## Service Usage Examples

### Using Work Items Service

```typescript
import { inject } from '@angular/core';
import { WORK_ITEMS_SERVICE } from './services/providers/api.providers';

@Component({...})
export class MyComponent {
  private workItemsService = inject(WORK_ITEMS_SERVICE);

  loadWorkItems() {
    this.workItemsService.getWorkItems({ 
      state: 'Active',
      assignedTo: 'john.doe@company.com'
    }).subscribe({
      next: workItems => console.log('Work items:', workItems),
      error: error => console.error('Error:', error)
    });
  }
}
```

### Using Authentication Service

```typescript
import { inject } from '@angular/core';
import { AdoAuthService } from './services/core/ado-auth.service';

@Component({...})
export class AuthComponent {
  private authService = inject(AdoAuthService);
  
  // Reactive authentication state
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  signIn(organization: string, pat: string) {
    this.authService.authenticate({ organization, personalAccessToken: pat })
      .subscribe({
        next: authState => console.log('Signed in:', authState),
        error: error => console.error('Auth failed:', error)
      });
  }
}
```

### Using Loading State

```typescript
import { inject } from '@angular/core';
import { LoadingService } from './services/core/loading.service';

@Component({...})
export class LoadingComponent {
  private loadingService = inject(LoadingService);
  
  // Reactive loading state
  isLoading = this.loadingService.isLoading;
}
```

## Mock API Endpoints

The Mockoon server provides these endpoints:

- `GET /_apis/profile/profiles/me` - User profile
- `GET /_apis/projects` - List projects  
- `GET /proj-001/_apis/wit/workitems` - List work items
- `GET /proj-001/_apis/git/repositories` - List repositories
- `GET /proj-001/_apis/build/builds` - List builds

## Security Features

- ✅ PAT tokens never logged or exposed
- ✅ HTTPS-only requests in production
- ✅ Request/response sanitization
- ✅ Secure storage integration (Tauri ready)
- ✅ Authentication state protection

## Performance Optimizations

- ✅ Request retry with exponential backoff
- ✅ Configurable timeouts and retry limits
- ✅ Request deduplication and caching ready
- ✅ Lazy loading compatible
- ✅ Memory-efficient error handling

## Next Steps

1. Add more ADO service implementations (repositories, builds, releases)
2. Implement caching strategies
3. Add real-time updates via polling or webhooks  
4. Integrate with Tauri secure storage
5. Add comprehensive error recovery mechanisms