import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

export interface AdoCredentials {
  organization: string;
  personal_access_token: string;
  project?: string;
}

export interface AuthDiagnostics {
  environment_status: Record<string, string>;
  validation_results: Record<string, boolean>;
  configuration_health: string;
  recommendations: string[];
  system_info: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class TauriEnvService {

  constructor() {
    console.log('🔧 TauriEnvService initialized');
  }

  /**
   * Get ADO credentials from Tauri environment
   * Securely retrieves credentials from .env file via Rust backend
   */
  async getAdoCredentials(): Promise<AdoCredentials | null> {
    const startTime = performance.now();
    console.log('🔐 [TAURI] Requesting ADO credentials from Tauri backend...');
    
    try {
      console.log('📞 Invoking Tauri command: get_ado_credentials');
      const credentials = await invoke<AdoCredentials>('get_ado_credentials');
      
      const elapsed = performance.now() - startTime;
      console.log(`✅ [TAURI] Successfully retrieved ADO credentials (${elapsed.toFixed(2)}ms):`);
      console.log(`  └─ Organization: ${credentials.organization}`);
      console.log(`  └─ PAT Length: ${credentials.personal_access_token?.length || 0} characters`);
      console.log(`  └─ Default Project: ${credentials.project || 'Not configured'}`);
      
      return credentials;
    } catch (error: any) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ [TAURI] Failed to retrieve ADO credentials (${elapsed.toFixed(2)}ms):`, error);
      console.error('  └─ Error type:', typeof error);
      console.error('  └─ Error message:', error?.message || error);
      
      // Provide helpful troubleshooting information
      if (error?.message?.includes('environment variable not found')) {
        console.warn('💡 [TROUBLESHOOT] Environment variables not found. Expected variables:');
        console.warn('  - ADO_ORGANIZATION: Your Azure DevOps organization name');
        console.warn('  - ADO_PAT: Your Personal Access Token');
        console.warn('  - ADO_PROJECT: Your default project name (optional)');
      }
      
      return null;
    }
  }

  /**
   * Validate if ADO environment configuration is available
   * Returns true if both organization and PAT are present
   */
  async validateAdoConfig(): Promise<boolean> {
    const startTime = performance.now();
    console.log('🔍 [TAURI] Validating ADO environment configuration...');
    
    try {
      console.log('📞 Invoking Tauri command: validate_ado_config');
      const isValid = await invoke<boolean>('validate_ado_config');
      
      const elapsed = performance.now() - startTime;
      if (isValid) {
        console.log(`✅ [TAURI] ADO environment configuration is valid (${elapsed.toFixed(2)}ms)`);
        console.log('  └─ All required environment variables are present');
      } else {
        console.log(`❌ [TAURI] ADO environment configuration is invalid (${elapsed.toFixed(2)}ms)`);
        console.warn('  └─ Missing required environment variables (check Rust logs for details)');
      }
      
      return isValid;
    } catch (error: any) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ [TAURI] Error validating ADO config (${elapsed.toFixed(2)}ms):`, error);
      console.error('  └─ This might indicate a problem with Tauri communication');
      return false;
    }
  }

  /**
   * Test actual Tauri backend connection
   * More reliable than just checking for API availability
   */
  async testTauriConnection(): Promise<boolean> {
    console.log('🧪 [TAURI] Testing actual backend connection...');
    
    if (!this.isTauriContext()) {
      console.log('❌ [TAURI] Context check failed, skipping connection test');
      return false;
    }

    try {
      console.log('📞 [TAURI] Testing with greet command...');
      const startTime = performance.now();
      
      const response = await invoke<string>('greet', { name: 'ConnectionTest' });
      const elapsed = performance.now() - startTime;
      
      console.log(`✅ [TAURI] Backend connection successful (${elapsed.toFixed(2)}ms):`);
      console.log(`  └─ Response: ${response}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ [TAURI] Backend connection failed:', error);
      console.error('  └─ This indicates Tauri backend is not running properly');
      console.error('  └─ Make sure "npm run tauri:dev:real" started successfully');
      return false;
    }
  }

  /**
   * Get comprehensive authentication diagnostics
   * Returns detailed system and environment analysis
   */
  async getAuthDiagnostics(): Promise<AuthDiagnostics | null> {
    const startTime = performance.now();
    console.log('🔬 [TAURI] Requesting comprehensive authentication diagnostics...');
    
    if (!this.isTauriContext()) {
      console.warn('🌐 [TAURI] Not in Tauri context - diagnostics unavailable');
      return null;
    }
    
    try {
      console.log('📞 Invoking Tauri command: get_auth_diagnostics');
      const diagnostics = await invoke<AuthDiagnostics>('get_auth_diagnostics');
      
      const elapsed = performance.now() - startTime;
      console.log(`🔬 [TAURI] Diagnostics completed (${elapsed.toFixed(2)}ms):`);
      console.log('  ├─ Health Status:', diagnostics.configuration_health);
      console.log('  ├─ Environment Variables:', Object.keys(diagnostics.environment_status).length);
      console.log('  ├─ Validation Results:', Object.keys(diagnostics.validation_results).length);
      console.log('  ├─ Recommendations:', diagnostics.recommendations.length);
      console.log('  └─ System Info:', Object.keys(diagnostics.system_info).length);
      
      if (diagnostics.recommendations.length > 0) {
        console.warn('💡 [DIAGNOSTICS] Recommendations:');
        diagnostics.recommendations.forEach((rec, index) => {
          console.warn(`  ${index + 1}. ${rec}`);
        });
      }
      
      return diagnostics;
    } catch (error: any) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ [TAURI] Failed to get diagnostics (${elapsed.toFixed(2)}ms):`, error);
      return null;
    }
  }

  /**
   * Check if we're running in a Tauri context
   * Updated for Tauri v2 API detection
   */
  isTauriContext(): boolean {
    console.log('🔍 [TAURI] Performing comprehensive Tauri v2 context detection...');
    
    // Check if we're in a browser environment first
    if (typeof window === 'undefined') {
      console.log('❌ [TAURI] Not in browser environment (no window object)');
      return false;
    }

    // Multiple detection methods for Tauri v2
    const detectionMethods = {
      // Method 1: Check for Tauri v2 invoke function
      hasInvokeFunction: typeof window !== 'undefined' && typeof (window as any).__TAURI_INVOKE__ === 'function',
      
      // Method 2: Check for legacy __TAURI__ object (backward compatibility)
      hasLegacyTauriObject: '__TAURI__' in window,
      
      // Method 3: Check if invoke is available from our import
      hasImportedInvoke: typeof invoke === 'function',
      
      // Method 4: Check for Tauri-specific globals
      hasTauriGlobals: typeof (window as any).__TAURI_METADATA__ !== 'undefined' || 
                      typeof (window as any).__TAURI__ !== 'undefined',
      
      // Method 5: Check user agent for Tauri
      hasTauriUserAgent: navigator.userAgent.toLowerCase().includes('tauri')
    };

    console.log('🔬 [TAURI] Detection results:', detectionMethods);

    // Determine if we're in Tauri context
    const isTauriContext = detectionMethods.hasInvokeFunction || 
                          detectionMethods.hasImportedInvoke || 
                          detectionMethods.hasLegacyTauriObject ||
                          detectionMethods.hasTauriGlobals ||
                          detectionMethods.hasTauriUserAgent;

    if (isTauriContext) {
      console.log('✅ [TAURI] Context detected! Running in Tauri desktop environment');
      console.log('  └─ Detection methods that passed:');
      if (detectionMethods.hasInvokeFunction) console.log('     • __TAURI_INVOKE__ function available');
      if (detectionMethods.hasImportedInvoke) console.log('     • Imported invoke function available');
      if (detectionMethods.hasLegacyTauriObject) console.log('     • Legacy __TAURI__ object present');
      if (detectionMethods.hasTauriGlobals) console.log('     • Tauri global objects found');
      if (detectionMethods.hasTauriUserAgent) console.log('     • Tauri user agent detected');
    } else {
      console.log('❌ [TAURI] No Tauri context detected - running in browser-only mode');
      console.log('  └─ Troubleshooting:');
      console.log('     • Make sure you\'re running "npm run tauri:dev:real"');
      console.log('     • Check that Tauri development server started successfully');
      console.log('     • Verify that the frontend is connecting to the Tauri app');
      console.log('     • Look for Tauri backend startup logs in the terminal');
    }

    return isTauriContext;
  }
}