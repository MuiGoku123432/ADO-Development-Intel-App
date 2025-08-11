import { ApplicationConfig, InjectionToken } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { environment } from "../environments/environment";

// Strongly type the environment injection token to avoid `unknown` type when injecting
export type AppEnvironment = typeof environment;
export const ENVIRONMENT = new InjectionToken<AppEnvironment>('environment');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: ENVIRONMENT, useValue: environment }
  ],
};
