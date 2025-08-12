import { Component } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private primengConfig: PrimeNGConfig) {
    console.log('🚀 Simplified AppComponent initialized');
    // Enable subtle global interaction effects
    this.primengConfig.ripple = true;
    // Set sensible z-index layering for overlays
    this.primengConfig.zIndex = {
      modal: 1100,
      overlay: 1000,
      menu: 1000,
      tooltip: 1100,
      toast: 1200
    };

    // Use filled input style across the app
    document.body.classList.add('p-input-filled');
  }
}
