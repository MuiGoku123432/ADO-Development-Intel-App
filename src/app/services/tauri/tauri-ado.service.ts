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
}

@Injectable({
  providedIn: 'root'
})
export class TauriAdoService {
  
  // Simple auth state tracking
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
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
   * Sign out (clear authentication state)
   */
  signOut(): void {
    console.log('🔓 [TAURI-ADO] Signing out');
    this.isAuthenticatedSubject.next(false);
  }
}