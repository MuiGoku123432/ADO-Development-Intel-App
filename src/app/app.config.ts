import { ApplicationConfig, InjectionToken } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { routes } from "./app.routes";
import { environment } from "../environments/environment";
import { authInterceptor } from "./services/interceptors/auth.interceptor";
import { errorInterceptor } from "./services/interceptors/error.interceptor";
import { loadingInterceptor } from "./services/interceptors/loading.interceptor";
import { createApiProviders } from "./services/providers/api.providers";

// Strongly type the environment injection token to avoid `unknown` type when injecting
export type AppEnvironment = typeof environment;
export const ENVIRONMENT = new InjectionToken<AppEnvironment>('environment');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      authInterceptor,
      loadingInterceptor,
      errorInterceptor
    ])),
    { provide: ENVIRONMENT, useValue: environment },
    ...createApiProviders()
  ],
};
