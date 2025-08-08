import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { ConfigErrorComponent, ConfigError } from './shared/components/config-error/config-error.component';
import { LoadingService } from './services/core/loading.service';
import { environment } from '../environments/environment';
import { invoke } from '@tauri-apps/api/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingSpinnerComponent, ConfigErrorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  protected loadingService = inject(LoadingService);
  
  configError: ConfigError | null = null;
  showApp: boolean = true;

  constructor() {
    console.log('🚀 AppComponent initialized - Angular app is starting');
    console.log('🗺️ Current URL:', window.location.href);
  }

  ngOnInit() {
    console.log('🔄 AppComponent ngOnInit - setting up router logging and configuration validation');
    
    // Check for configuration errors that might have been set by providers
    this.checkConfigurationErrors();
    
    // Log all router events
    this.router.events.subscribe(event => {
      console.log('🧭 Router event:', event.constructor.name, event);
    });
    
    // Log successful navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      console.log('✅ Navigation completed:', (event as NavigationEnd).url);
    });
    
    // Check initial router state
    console.log('🎯 Initial router URL:', this.router.url);
    console.log('🎯 Router config:', this.router.config);
  }

  private checkConfigurationErrors(): void {
    // Check if configuration error was set by API providers
    if ((window as any).__API_CONFIG_ERROR__) {
      this.configError = (window as any).__API_CONFIG_ERROR__;
      this.showApp = false;
      console.error('❌ Configuration error detected:', this.configError);
      return;
    }

    // In production mode with real API, check for Tauri environment
    if (!environment.useMockApi && environment.production) {
      console.log('🔍 Checking Tauri environment using invoke function...');
      console.log('🔍 invoke function available:', typeof invoke === 'function');
      
      if (typeof invoke === 'function') {
        // Test Tauri backend communication
        invoke('greet', { name: 'ConfigCheck' })
          .then((response) => {
            console.log('✅ Tauri backend communication successful:', response);
            this.showApp = true;
          })
          .catch((error) => {
            console.error('❌ Tauri backend communication failed:', error);
            this.configError = {
              type: 'connection-failed',
              title: 'Tauri Backend Communication Failed',
              message: 'Unable to communicate with Tauri backend.',
              details: [
                'Make sure you are running "npm run tauri:dev:real"',
                'Check if Tauri backend is properly configured',
                `Error: ${error.message || error}`
              ],
              actionable: true
            };
            this.showApp = false;
          });
        return;
      } else {
        console.error('❌ Tauri invoke function not available');
        this.configError = {
          type: 'connection-failed',
          title: 'Tauri API Not Available',
          message: 'Tauri invoke function is not available.',
          details: [
            'Make sure you are running "npm run tauri:dev:real"',
            'Or use "npm start" for development with mock data'
          ],
          actionable: true
        };
        this.showApp = false;
        return;
      }
    }

    // Configuration is valid
    this.showApp = true;
    console.log('✅ Configuration validation passed');
  }
}
