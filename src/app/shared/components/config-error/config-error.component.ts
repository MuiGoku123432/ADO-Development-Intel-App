import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

export interface ConfigError {
  type: 'missing-env' | 'invalid-credentials' | 'connection-failed' | 'generic';
  title: string;
  message: string;
  details?: string[];
  actionable?: boolean;
}

@Component({
  selector: 'app-config-error',
  standalone: true,
  imports: [CommonModule, MessageModule, CardModule, ButtonModule],
  templateUrl: './config-error.component.html',
  styleUrls: ['./config-error.component.scss']
})
export class ConfigErrorComponent {
  @Input() error: ConfigError = {
    type: 'generic',
    title: 'Configuration Error',
    message: 'There was an error with the application configuration.'
  };

  @Input() showInstructions: boolean = true;

  getIconClass(): string {
    switch (this.error.type) {
      case 'missing-env':
        return 'pi pi-exclamation-triangle';
      case 'invalid-credentials':
        return 'pi pi-lock';
      case 'connection-failed':
        return 'pi pi-wifi';
      default:
        return 'pi pi-times-circle';
    }
  }

  getSeverity(): string {
    switch (this.error.type) {
      case 'missing-env':
      case 'invalid-credentials':
        return 'warn';
      case 'connection-failed':
        return 'error';
      default:
        return 'error';
    }
  }

  onRefreshClick(): void {
    // Refresh the page to retry configuration
    window.location.reload();
  }
}