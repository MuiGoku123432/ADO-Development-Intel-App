import { ApplicationConfig, InjectionToken } from "@angular/core";
import { provideRouter } from "@angular/router";
import { PrimeNGConfig } from 'primeng/api';

import { routes } from "./app.routes";
import { environment } from "../environments/environment";

// Strongly type the environment injection token to avoid `unknown` type when injecting
export type AppEnvironment = typeof environment;
export const ENVIRONMENT = new InjectionToken<AppEnvironment>('environment');

// PrimeNG Configuration Provider
export function providePrimeNGConfig() {
  return {
    provide: PrimeNGConfig,
    useFactory: () => {
      const config = new PrimeNGConfig();
      
      // Enable subtle global interaction effects
      config.ripple = true;
      
      // Set sensible z-index layering for overlays
      config.zIndex = {
        modal: 1100,
        overlay: 1000,
        menu: 1000,
        tooltip: 1100,
        toast: 1200
      };

      return config;
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: ENVIRONMENT, useValue: environment },
    providePrimeNGConfig()
  ],
};
