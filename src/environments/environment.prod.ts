export const environment = {
  production: true,
  apiUrl: 'https://dev.azure.com',
  adoBaseUrl: 'https://dev.azure.com',
  useMockApi: false,
  apiVersion: '7.0',
  requestTimeout: 30000,
  retryAttempts: 2,
  cacheTimeout: 600000, // 10 minutes
  
  // Configuration validation settings
  requireAdoCredentials: true,
  strictValidation: true,
  
  // Default ADO project (can be overridden by .env or auth state)
  defaultProject: 'DefaultProject' // Replace with your actual ADO project name
};