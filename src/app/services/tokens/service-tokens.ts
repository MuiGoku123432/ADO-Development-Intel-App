import { InjectionToken } from '@angular/core';

/**
 * Interface for Work Items service
 * Separated from implementation to avoid circular dependencies
 */
export interface IWorkItemsService {
  getWorkItems(query?: any, project?: string): any;
  getWorkItem(id: number, project?: string): any;
  createWorkItem(request: any, project?: string): any;
  updateWorkItem(id: number, updates: any[], project?: string): any;
  updateWorkItemField(id: number, field: string, value: any, project?: string): any;
  deleteWorkItem(id: number, project?: string): any;
  getMyWorkItems(project?: string): any;
  getWorkItemsByAssignee(assignee: string, project?: string): any;
  getWorkItemsByState(state: string, project?: string): any;
  createTask(request: any, project?: string): any;
  searchWorkItems(searchText: string, project?: string): any;
}

/**
 * Injection token for Work Items service
 * Clean token definition without circular dependencies
 */
export const WORK_ITEMS_SERVICE = new InjectionToken<IWorkItemsService>('WorkItemsService');

/**
 * Re-export for compatibility
 */
export { IWorkItemsService as IWorkItemsServiceInterface };