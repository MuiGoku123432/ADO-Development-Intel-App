import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Track active requests with their IDs
  private readonly activeRequests = new Set<string>();
  
  // Signal for reactive loading state
  private readonly loadingSignal = signal(false);
  
  // Public readonly signal
  readonly isLoading = this.loadingSignal.asReadonly();

  /**
   * Start loading for a specific request
   */
  startLoading(requestId: string): void {
    this.activeRequests.add(requestId);
    this.updateLoadingState();
  }

  /**
   * Stop loading for a specific request
   */
  stopLoading(requestId: string): void {
    this.activeRequests.delete(requestId);
    this.updateLoadingState();
  }

  /**
   * Force stop all loading states (useful for cleanup)
   */
  stopAllLoading(): void {
    this.activeRequests.clear();
    this.updateLoadingState();
  }

  /**
   * Get current loading state
   */
  getCurrentLoadingState(): boolean {
    return this.isLoading();
  }

  /**
   * Get count of active requests
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  private updateLoadingState(): void {
    const isLoading = this.activeRequests.size > 0;
    this.loadingSignal.set(isLoading);
  }
}