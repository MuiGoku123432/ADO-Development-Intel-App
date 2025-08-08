import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdoApiBaseService } from './ado-api-base.service';
import { 
  WorkItem, 
  WorkItemQuery, 
  CreateWorkItemRequest, 
  WorkItemUpdate 
} from '../models/ado/work-item.interface';
import { ApiResponse } from '../models/api-response.interface';

/**
 * Interface for Work Items service
 */
export interface IWorkItemsService {
  getWorkItems(query?: WorkItemQuery, project?: string): Observable<WorkItem[]>;
  getWorkItem(id: number, project?: string): Observable<WorkItem>;
  createWorkItem(request: CreateWorkItemRequest, project?: string): Observable<WorkItem>;
  updateWorkItem(id: number, updates: WorkItemUpdate[], project?: string): Observable<WorkItem>;
  updateWorkItemField(id: number, field: string, value: any, project?: string): Observable<WorkItem>;
  deleteWorkItem(id: number, project?: string): Observable<void>;
  getMyWorkItems(project?: string): Observable<WorkItem[]>;
  getWorkItemsByAssignee(assignee: string, project?: string): Observable<WorkItem[]>;
  getWorkItemsByState(state: string, project?: string): Observable<WorkItem[]>;
  createTask(request: CreateWorkItemRequest, project?: string): Observable<WorkItem>;
  searchWorkItems(searchText: string, project?: string): Observable<WorkItem[]>;
}

/**
 * Real ADO Work Items API service implementation
 */
@Injectable({
  providedIn: 'root'
})
export class WorkItemsService extends AdoApiBaseService implements IWorkItemsService {

  /**
   * Get work items with optional filtering
   */
  getWorkItems(query: WorkItemQuery = {}, project?: string): Observable<WorkItem[]> {
    this.requireAuthentication();
    
    const currentProject = project || this.getCurrentProject();
    const params: { [key: string]: any } = {};

    // Build query parameters
    if (query.top) params['$top'] = query.top;
    if (query.skip) params['$skip'] = query.skip;
    
    // For simplicity, we'll use a basic query here
    // In a real implementation, you might want to use WIQL queries for complex filtering
    let endpoint = '/_apis/wit/workitems';
    
    // If we have specific IDs or need complex filtering, we might need to use WIQL
    if (this.hasComplexQuery(query)) {
      return this.executeWiqlQuery(this.buildWiqlQuery(query), currentProject);
    }

    return this.adoGet<ApiResponse<WorkItem>>(endpoint, params, undefined, currentProject).pipe(
      map(response => this.extractApiResponseValue(response)),
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Get a specific work item by ID
   */
  getWorkItem(id: number, project?: string): Observable<WorkItem> {
    this.requireAuthentication();
    
    const currentProject = project || this.getCurrentProject();
    const endpoint = `/_apis/wit/workitems/${id}`;
    
    const params = {
      '$expand': 'relations'
    };

    return this.adoGet<WorkItem>(endpoint, params, undefined, currentProject).pipe(
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Create a new work item
   */
  createWorkItem(request: CreateWorkItemRequest, project?: string): Observable<WorkItem> {
    this.requireAuthentication();
    
    const currentProject = project || this.getCurrentProject();
    const endpoint = `/_apis/wit/workitems/$${request.workItemType}`;
    
    // Convert request to ADO patch format
    const patchOperations: Array<{ op: string; path: string; value: any }> = [
      { op: 'add', path: '/fields/System.Title', value: request.title }
    ];

    if (request.description) {
      patchOperations.push({ 
        op: 'add', 
        path: '/fields/System.Description', 
        value: request.description 
      });
    }

    if (request.assignedTo) {
      patchOperations.push({ 
        op: 'add', 
        path: '/fields/System.AssignedTo', 
        value: request.assignedTo 
      });
    }

    if (request.areaPath) {
      patchOperations.push({ 
        op: 'add', 
        path: '/fields/System.AreaPath', 
        value: request.areaPath 
      });
    }

    if (request.iterationPath) {
      patchOperations.push({ 
        op: 'add', 
        path: '/fields/System.IterationPath', 
        value: request.iterationPath 
      });
    }

    if (request.priority) {
      patchOperations.push({ 
        op: 'add', 
        path: '/fields/Microsoft.VSTS.Common.Priority', 
        value: request.priority 
      });
    }

    if (request.effort) {
      patchOperations.push({ 
        op: 'add', 
        path: '/fields/Microsoft.VSTS.Scheduling.Effort', 
        value: request.effort 
      });
    }

    return this.adoPost<WorkItem>(endpoint, patchOperations, {}, undefined, currentProject).pipe(
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Update an existing work item
   */
  updateWorkItem(id: number, updates: WorkItemUpdate[], project?: string): Observable<WorkItem> {
    this.requireAuthentication();
    
    const currentProject = project || this.getCurrentProject();
    const endpoint = `/_apis/wit/workitems/${id}`;
    
    // Convert updates to proper PATCH format
    const patchOperations = updates.map(update => ({
      op: update.op,
      path: update.path.startsWith('/fields/') ? update.path : `/fields/${update.path}`,
      value: update.value,
      from: update.from
    }));

    return this.adoPatch<WorkItem>(endpoint, patchOperations, {}, undefined, currentProject).pipe(
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Delete a work item
   */
  deleteWorkItem(id: number, project?: string): Observable<void> {
    this.requireAuthentication();
    
    const currentProject = project || this.getCurrentProject();
    const endpoint = `/_apis/wit/workitems/${id}`;
    
    return this.adoDelete<void>(endpoint, {}, undefined, currentProject).pipe(
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Get work items assigned to current user
   * Uses ADO API filter: System.AssignedTo eq @Me
   */
  getMyWorkItems(project?: string): Observable<WorkItem[]> {
    this.requireAuthentication();
    
    const currentProject = project || this.getCurrentProject();
    const endpoint = '/_apis/wit/workitems';
    
    // Use ADO's @Me filter to get current user's work items
    const params = {
      '$filter': 'System.AssignedTo eq @Me',
      '$expand': 'relations',
      'fields': this.buildFieldsSelection([
        'System.Id',
        'System.Title', 
        'System.WorkItemType',
        'System.State',
        'System.AssignedTo',
        'System.CreatedDate',
        'System.ChangedDate',
        'Microsoft.VSTS.Common.Priority',
        'Microsoft.VSTS.Scheduling.StoryPoints',
        'Microsoft.VSTS.Scheduling.Effort',
        'System.Description'
      ])
    };

    return this.adoGet<ApiResponse<WorkItem>>(endpoint, params, undefined, currentProject).pipe(
      map(response => this.extractApiResponseValue(response)),
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Get work items by assignee
   */
  getWorkItemsByAssignee(assignee: string, project?: string): Observable<WorkItem[]> {
    return this.getWorkItems({ assignedTo: assignee }, project);
  }

  /**
   * Get work items by state
   */
  getWorkItemsByState(state: string, project?: string): Observable<WorkItem[]> {
    return this.getWorkItems({ state }, project);
  }

  /**
   * Execute a WIQL (Work Item Query Language) query
   */
  private executeWiqlQuery(wiql: string, project: string): Observable<WorkItem[]> {
    const endpoint = '/_apis/wit/wiql';
    const body = { query: wiql };

    return this.adoPost<{ workItems: { id: number }[] }>(endpoint, body, {}, undefined, project).pipe(
      map(result => {
        const workItemIds = result.workItems.map(wi => wi.id);
        if (workItemIds.length === 0) {
          return [];
        }
        
        // Get full work item details for the IDs returned by WIQL
        return this.getWorkItemsBatch(workItemIds, project);
      }),
      // Flatten the observable
      map(workItemsObservable => workItemsObservable),
      catchError(error => this.handleAdoError(error))
    ) as any; // Type assertion needed due to complex observable mapping
  }

  /**
   * Get multiple work items by their IDs
   */
  private getWorkItemsBatch(ids: number[], project: string): Observable<WorkItem[]> {
    if (ids.length === 0) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const endpoint = `/_apis/wit/workitems`;
    const params = {
      'ids': ids.join(','),
      '$expand': 'relations'
    };

    return this.adoGet<ApiResponse<WorkItem>>(endpoint, params, undefined, project).pipe(
      map(response => this.extractApiResponseValue(response)),
      catchError(error => this.handleAdoError(error))
    );
  }

  /**
   * Check if query requires WIQL
   */
  private hasComplexQuery(query: WorkItemQuery): boolean {
    return !!(query.assignedTo || query.state || query.workItemType || 
              query.areaPath || query.iterationPath || query.createdBy);
  }

  /**
   * Build WIQL query from WorkItemQuery parameters
   */
  private buildWiqlQuery(query: WorkItemQuery): string {
    let wiql = 'SELECT [System.Id] FROM WorkItems WHERE ';
    const conditions: string[] = [];

    if (query.assignedTo) {
      conditions.push(`[System.AssignedTo] = '${query.assignedTo}'`);
    }

    if (query.state) {
      conditions.push(`[System.State] = '${query.state}'`);
    }

    if (query.workItemType) {
      conditions.push(`[System.WorkItemType] = '${query.workItemType}'`);
    }

    if (query.areaPath) {
      conditions.push(`[System.AreaPath] UNDER '${query.areaPath}'`);
    }

    if (query.iterationPath) {
      conditions.push(`[System.IterationPath] UNDER '${query.iterationPath}'`);
    }

    if (query.createdBy) {
      conditions.push(`[System.CreatedBy] = '${query.createdBy}'`);
    }

    // Default condition if no specific filters
    if (conditions.length === 0) {
      conditions.push(`[System.TeamProject] = @project`);
    }

    wiql += conditions.join(' AND ');

    // Add ordering and limits
    wiql += ' ORDER BY [System.ChangedDate] DESC';

    return wiql;
  }
}
