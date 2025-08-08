export interface AuthState {
  isAuthenticated: boolean;
  organization: string;
  personalAccessToken: string;
  userName?: string;
  userEmail?: string;
}

export interface AuthConfig {
  organization: string;
  personalAccessToken: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  userName?: string;
  userEmail?: string;
  expirationDate?: Date;
}