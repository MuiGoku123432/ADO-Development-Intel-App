export interface AuthState {
  isAuthenticated: boolean;
  organization: string;
  personalAccessToken: string;
  userName?: string;
  userEmail?: string;
  project?: string; // Default project for ADO operations
}

export interface AuthConfig {
  organization: string;
  personalAccessToken: string;
  project?: string; // Optional default project
}

export interface TokenValidationResponse {
  valid: boolean;
  userName?: string;
  userEmail?: string;
  expirationDate?: Date;
}