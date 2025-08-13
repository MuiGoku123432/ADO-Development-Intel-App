import { Injectable, inject } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Simple work item interface matching the Rust WorkItemLite structure
export interface WorkItemLite {
  id: number;
  title?: string;
  state?: string;
  type?: string;
  assigned_to?: string;
  description?: string;
  created_date?: string;
  changed_date?: string;
  priority?: number;
  story_points?: number;
  area_path?: string;
  iteration_path?: string;
  project_name: string;
}

// Response from begin_transition command
export interface TransitionResponse {
  status: string; // "completed" | "pending"
  work_item_id: number;
  target_state?: string;
  payload?: FieldsRequiredEvent;
}

// Event payload when fields are required
export interface FieldsRequiredEvent {
  correlation_id: string;
  work_item_id: number;
  current_state: string;
  target_state: string;
  prompts: UiFieldPrompt[];
}

// UI field prompt for Angular form rendering
export interface UiFieldPrompt {
  ref_name: string;
  label: string;
  kind: string; // "number" | "string" | "picklist" | "identity" | "datetime"
  required: boolean;
  allowed_values?: string[];
  placeholder?: string;
  default_value?: any;
}

// Response from preview_transition command
export interface TransitionPreview {
  work_item_id: number;
  current_state: string;
  target_state?: string;
  available: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TauriAdoService {
  
  // Simple auth state tracking
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Transition preview cache
  private previewCache = new Map<number, TransitionPreview>();
  private cacheExpiry = new Map<number, number>();
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds
  
  constructor() {
    console.log('🔧 TauriAdoService initialized');
  }

  /**
   * Set Personal Access Token for ADO authentication
   * This replaces the complex authentication flow
   */
  setPAT(pat: String, organization: string, project?: string): Observable<void> {
    console.log('🔐 [TAURI-ADO] Setting PAT credentials');
    console.log('  ├─ Organization:', organization);
    console.log('  └─ Project:', project || 'Not specified');
    
    return from(invoke<void>('set_pat', { 
      pat, 
      organization, 
      project 
    })).pipe(
      tap(() => {
        console.log('✅ [TAURI-ADO] PAT set successfully');
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  /**
   * Get work items assigned to the current user
   * Uses direct Rust WIQL query with @Me
   */
  getMyWorkItems(organization?: string, project?: string): Observable<WorkItemLite[]> {
    console.log('📥 [TAURI-ADO] Fetching my work items');
    console.log('  ├─ Organization:', organization || 'Using stored/env');
    console.log('  └─ Project:', project || 'Using stored/env');
    
    return from(invoke<WorkItemLite[]>('get_my_work_items', { 
      organization, 
      project 
    })).pipe(
      tap(items => {
        console.log(`✅ [TAURI-ADO] Retrieved ${items.length} work items`);
        items.forEach(item => {
          console.log(`  • ${item.id}: ${item.title} (${item.state})`);
        });
        // Clear preview cache since work item states may have changed
        this.clearAllPreviewCache();
      })
    );
  }

  /**
   * Get available projects from configuration
   */
  getAvailableProjects(): Observable<string[]> {
    console.log('📋 [TAURI-ADO] Fetching available projects from configuration');
    
    return from(invoke<string[]>('get_available_projects')).pipe(
      tap(projects => {
        console.log(`✅ [TAURI-ADO] Retrieved ${projects.length} available projects:`, projects);
      })
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Test authentication by trying to fetch work items
   */
  testAuthentication(organization?: string, project?: string): Observable<boolean> {
    console.log('🧪 [TAURI-ADO] Testing authentication');
    
    return this.getMyWorkItems(organization, project).pipe(
      map(items => {
        console.log('✅ [TAURI-ADO] Authentication test successful');
        this.isAuthenticatedSubject.next(true);
        return true;
      })
    );
  }

  /**
   * Convert WorkItemLite to the existing WorkItem interface for compatibility
   */
  convertToLegacyWorkItem(lite: WorkItemLite): any {
    return {
      id: lite.id,
      fields: {
        'System.Id': lite.id,
        'System.Title': lite.title,
        'System.State': lite.state,
        'System.WorkItemType': lite.type,
        'System.AssignedTo': { displayName: lite.assigned_to },
        'System.Description': lite.description,
        'System.CreatedDate': lite.created_date,
        'System.ChangedDate': lite.changed_date,
        'System.AreaPath': lite.area_path,
        'System.IterationPath': lite.iteration_path,
        'Microsoft.VSTS.Common.Priority': lite.priority,
        'Microsoft.VSTS.Scheduling.StoryPoints': lite.story_points,
      },
      _links: {},
      url: ''
    };
  }

  /**
   * Get work items in legacy format for existing components
   */
  getMyWorkItemsLegacy(organization?: string, project?: string): Observable<any[]> {
    return this.getMyWorkItems(organization, project).pipe(
      map(items => items.map(item => this.convertToLegacyWorkItem(item)))
    );
  }

  /**
   * Begin a work item state transition (new dynamic API)
   */
  beginTransition(workItemId: number): Observable<TransitionResponse> {
    console.log('🔄 [TAURI-ADO] Beginning state transition for work item:', workItemId);
    
    return from(invoke<TransitionResponse>('begin_transition', {
      workItemId: workItemId
    })).pipe(
      tap(response => {
        console.log('✅ [TAURI-ADO] Transition response:', response);
        if (response.status === 'completed') {
          console.log(`🎯 [TAURI-ADO] Transition completed immediately to: ${response.target_state}`);
        } else if (response.status === 'pending') {
          console.log(`⏳ [TAURI-ADO] Transition pending - fields required for: ${response.target_state}`);
        }
      })
    );
  }

  /**
   * Complete a pending transition with user-provided field values
   */
  finishTransition(correlationId: string, fieldValues: Record<string, any>): Observable<any> {
    console.log('🏁 [TAURI-ADO] Finishing transition with correlation ID:', correlationId);
    console.log('📝 [TAURI-ADO] Field values:', fieldValues);
    
    return from(invoke<any>('finish_transition', {
      correlationId: correlationId,
      values: fieldValues
    })).pipe(
      tap(result => {
        console.log('✅ [TAURI-ADO] Transition completed:', result);
        // Clear cache entry for this work item since state may have changed
        if (result.workItemId) {
          this.clearPreviewCache(result.workItemId);
        }
      })
    );
  }

  /**
   * Preview the next state transition for a work item (with caching)
   */
  previewTransition(workItemId: number): Observable<TransitionPreview> {
    console.log('👁️ [TAURI-ADO] Previewing transition for work item:', workItemId);
    
    // Check cache first
    const cached = this.getFromCache(workItemId);
    if (cached) {
      console.log('💾 [TAURI-ADO] Using cached preview for work item:', workItemId);
      return from([cached]);
    }
    
    // Fetch from API and cache result
    return from(invoke<TransitionPreview>('preview_transition', {
      workItemId: workItemId
    })).pipe(
      tap(preview => {
        console.log('✅ [TAURI-ADO] Preview received:', preview);
        this.cachePreview(workItemId, preview);
      })
    );
  }

  /**
   * Clear all preview cache (call when work items are refreshed)
   */
  clearAllPreviewCache(): void {
    console.log('🧹 [TAURI-ADO] Clearing all preview cache');
    this.previewCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Clear preview cache for a specific work item
   */
  private clearPreviewCache(workItemId: number): void {
    console.log('🧹 [TAURI-ADO] Clearing preview cache for work item:', workItemId);
    this.previewCache.delete(workItemId);
    this.cacheExpiry.delete(workItemId);
  }

  /**
   * Get cached preview if valid
   */
  private getFromCache(workItemId: number): TransitionPreview | null {
    const expiry = this.cacheExpiry.get(workItemId);
    if (!expiry || Date.now() > expiry) {
      // Cache expired
      this.clearPreviewCache(workItemId);
      return null;
    }
    
    return this.previewCache.get(workItemId) || null;
  }

  /**
   * Cache a preview result
   */
  private cachePreview(workItemId: number, preview: TransitionPreview): void {
    this.previewCache.set(workItemId, preview);
    this.cacheExpiry.set(workItemId, Date.now() + this.CACHE_DURATION_MS);
    console.log(`💾 [TAURI-ADO] Cached preview for work item ${workItemId} (expires in ${this.CACHE_DURATION_MS/1000}s)`);
  }

  /**
   * Sign out (clear authentication state)
   */
  signOut(): void {
    console.log('🔓 [TAURI-ADO] Signing out');
    this.isAuthenticatedSubject.next(false);
  }
}