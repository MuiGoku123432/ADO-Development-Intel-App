import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

// Import Tauri API functions directly (Tauri v2 modern approach)
import { invoke } from '@tauri-apps/api/core';

console.log('🔧 Bootstrap starting - initializing Angular application');
console.log('🔍 Tauri invoke function available:', typeof invoke);

// Test Tauri availability by attempting to use invoke function
if (typeof invoke === 'function') {
  console.log('✅ Tauri invoke function is available');
  // Test if we can call a simple Tauri command
  invoke('greet', { name: 'Angular' })
    .then((response) => {
      console.log('✅ Tauri backend communication successful:', response);
    })
    .catch((error) => {
      console.log('⚠️ Tauri backend call failed (may be expected in browser mode):', error);
    });
} else {
  console.log('❌ Tauri invoke function not available');
}

bootstrapApplication(AppComponent, appConfig)
  .then(appRef => {
    console.log('✅ Angular application bootstrapped successfully');
    console.log('📱 App reference:', appRef);
  })
  .catch((err) => {
    console.error('❌ Bootstrap failed:', err);
  });
