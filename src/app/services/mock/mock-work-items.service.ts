import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IWorkItemsService } from '../ado/work-items.service';
import {
  WorkItem,
  WorkItemQuery,
  CreateWorkItemRequest,
  WorkItemUpdate,
  AssignedTo
} from '../models/ado/work-item.interface';

/**
 * Mock implementation of Work Items service for development
 */
@Injectable()
export class MockWorkItemsService implements IWorkItemsService {
  
  constructor() {
    console.log('🎭 MockWorkItemsService initialized');
  }

  private mockWorkItems: WorkItem[] = [
    {
      id: 1001,
      rev: 3,
      url: 'https://dev.azure.com/org/_apis/wit/workitems/1001',
      fields: {
        'System.Id': 1001,
        'System.Title': 'Implement user authentication',
        'System.WorkItemType': 'User Story',
        'System.State': 'Active',
        'System.Reason': 'New',
        'System.AssignedTo': {
          displayName: 'John Developer',
          url: 'https://dev.azure.com/org/_apis/Identities/user-001',
          id: 'user-001',
          uniqueName: 'john.dev@company.com',
          imageUrl: 'https://dev.azure.com/org/_apis/GraphProfile/MemberAvatars/msa.user-001',
          descriptor: 'msa.user-001'
        },
        'System.CreatedDate': '2024-01-15T10:00:00Z',
        'System.CreatedBy': this.createMockUser('Product Owner', 'po@company.com', 'user-002'),
        'System.ChangedDate': '2024-01-18T14:30:00Z',
        'System.ChangedBy': this.createMockUser('John Developer', 'john.dev@company.com', 'user-001'),
        'System.Description': 'As a user, I want to be able to sign in securely so that I can access my personal data.',
        'System.AreaPath': 'Sample Project 1\\Authentication',
        'System.IterationPath': 'Sample Project 1\\Sprint 1',
        'Microsoft.VSTS.Common.Priority': 1,
        'Microsoft.VSTS.Scheduling.StoryPoints': 8
      }
    },
    {
      id: 1002,
      rev: 1,
      url: 'https://dev.azure.com/org/_apis/wit/workitems/1002',
      fields: {
        'System.Id': 1002,
        'System.Title': 'Fix login page styling',
        'System.WorkItemType': 'Bug',
        'System.State': 'New',
        'System.Reason': 'New',
        'System.AssignedTo': this.createMockUser('Jane Designer', 'jane.designer@company.com', 'user-003'),
        'System.CreatedDate': '2024-01-18T09:15:00Z',
        'System.CreatedBy': this.createMockUser('QA Tester', 'qa@company.com', 'user-004'),
        'System.ChangedDate': '2024-01-18T09:15:00Z',
        'System.ChangedBy': this.createMockUser('QA Tester', 'qa@company.com', 'user-004'),
        'System.Description': 'Login page styling is broken on mobile devices',
        'System.AreaPath': 'Sample Project 1\\UI',
        'System.IterationPath': 'Sample Project 1\\Sprint 1',
        'Microsoft.VSTS.Common.Priority': 2,
        'Microsoft.VSTS.Common.Severity': '3 - Medium'
      }
    },
    {
      id: 1003,
      rev: 2,
      url: 'https://dev.azure.com/org/_apis/wit/workitems/1003',
      fields: {
        'System.Id': 1003,
        'System.Title': 'Create user profile page',
        'System.WorkItemType': 'Feature',
        'System.State': 'Done',
        'System.Reason': 'Completed',
        'System.AssignedTo': this.createMockUser('John Developer', 'john.dev@company.com', 'user-001'),
        'System.CreatedDate': '2024-01-10T14:20:00Z',
        'System.CreatedBy': this.createMockUser('Product Owner', 'po@company.com', 'user-002'),
        'System.ChangedDate': '2024-01-16T11:45:00Z',
        'System.ChangedBy': this.createMockUser('John Developer', 'john.dev@company.com', 'user-001'),
        'System.Description': 'Users need a comprehensive profile page to manage their account settings',
        'System.AreaPath': 'Sample Project 1\\User Management',
        'System.IterationPath': 'Sample Project 1\\Sprint 1',
        'Microsoft.VSTS.Common.Priority': 1,
        'Microsoft.VSTS.Scheduling.StoryPoints': 13
      }
    },
    {
      id: 1004,
      rev: 1,
      url: 'https://dev.azure.com/org/_apis/wit/workitems/1004',
      fields: {
        'System.Id': 1004,
        'System.Title': 'Setup CI/CD pipeline',
        'System.WorkItemType': 'Task',
        'System.State': 'In Progress',
        'System.Reason': 'Work started',
        'System.AssignedTo': this.createMockUser('DevOps Engineer', 'devops@company.com', 'user-005'),
        'System.CreatedDate': '2024-01-19T08:30:00Z',
        'System.CreatedBy': this.createMockUser('Tech Lead', 'techlead@company.com', 'user-006'),
        'System.ChangedDate': '2024-01-20T13:15:00Z',
        'System.ChangedBy': this.createMockUser('DevOps Engineer', 'devops@company.com', 'user-005'),
        'System.Description': 'Setup automated build and deployment pipeline for the application',
        'System.AreaPath': 'Sample Project 1\\Infrastructure',
        'System.IterationPath': 'Sample Project 1\\Sprint 2',
        'Microsoft.VSTS.Common.Priority': 2,
        'Microsoft.VSTS.Scheduling.Effort': 5
      }
    },
    {
      id: 1005,
      rev: 1,
      url: 'https://dev.azure.com/org/_apis/wit/workitems/1005',
      fields: {
        'System.Id': 1005,
        'System.Title': 'Performance optimization',
        'System.WorkItemType': 'Epic',
        'System.State': 'New',
        'System.Reason': 'New',
        'System.AssignedTo': this.createMockUser('Tech Lead', 'techlead@company.com', 'user-006'),
        'System.CreatedDate': '2024-01-20T16:00:00Z',
        'System.CreatedBy': this.createMockUser('Product Owner', 'po@company.com', 'user-002'),
        'System.ChangedDate': '2024-01-20T16:00:00Z',
        'System.ChangedBy': this.createMockUser('Product Owner', 'po@company.com', 'user-002'),
        'System.Description': 'Improve application performance and optimize loading times',
        'System.AreaPath': 'Sample Project 1\\Performance',
        'System.IterationPath': 'Sample Project 1\\Sprint 3',
        'Microsoft.VSTS.Common.Priority': 3,
        'Microsoft.VSTS.Scheduling.StoryPoints': 21
      }
    }
  ];

  private nextId = 1006;

  getWorkItems(query: WorkItemQuery = {}, project?: string): Observable<WorkItem[]> {
    let filteredItems = [...this.mockWorkItems];

    // Apply filters
    if (query.assignedTo) {
      filteredItems = filteredItems.filter(item =>
        item.fields['System.AssignedTo']?.displayName.includes(query.assignedTo!) ||
        item.fields['System.AssignedTo']?.uniqueName.includes(query.assignedTo!)
      );
    }

    if (query.state) {
      filteredItems = filteredItems.filter(item =>
        item.fields['System.State'] === query.state
      );
    }

    if (query.workItemType) {
      filteredItems = filteredItems.filter(item =>
        item.fields['System.WorkItemType'] === query.workItemType
      );
    }

    if (query.areaPath) {
      filteredItems = filteredItems.filter(item =>
        item.fields['System.AreaPath'].includes(query.areaPath!)
      );
    }

    if (query.iterationPath) {
      filteredItems = filteredItems.filter(item =>
        item.fields['System.IterationPath'].includes(query.iterationPath!)
      );
    }

    // Apply pagination
    if (query.skip) {
      filteredItems = filteredItems.slice(query.skip);
    }

    if (query.top) {
      filteredItems = filteredItems.slice(0, query.top);
    }

    // Simulate API delay
    return of(filteredItems).pipe(delay(300));
  }

  getWorkItem(id: number, project?: string): Observable<WorkItem> {
    const item = this.mockWorkItems.find(wi => wi.id === id);
    
    if (!item) {
      return throwError(() => ({
        status: 404,
        message: `Work item ${id} not found`
      }));
    }

    return of(item).pipe(delay(200));
  }

  createWorkItem(request: CreateWorkItemRequest, project?: string): Observable<WorkItem> {
    const newWorkItem: WorkItem = {
      id: this.nextId++,
      rev: 1,
      url: `https://dev.azure.com/org/_apis/wit/workitems/${this.nextId - 1}`,
      fields: {
        'System.Id': this.nextId - 1,
        'System.Title': request.title,
        'System.WorkItemType': request.workItemType,
        'System.State': 'New',
        'System.Reason': 'New',
        'System.AssignedTo': request.assignedTo ? 
          this.createMockUser(request.assignedTo, `${request.assignedTo.toLowerCase().replace(' ', '.')}@company.com`, `user-${Date.now()}`) : 
          undefined,
        'System.CreatedDate': new Date().toISOString(),
        'System.CreatedBy': this.createMockUser('Mock User', 'mock.user@company.com', 'user-mock'),
        'System.ChangedDate': new Date().toISOString(),
        'System.ChangedBy': this.createMockUser('Mock User', 'mock.user@company.com', 'user-mock'),
        'System.Description': request.description || '',
        'System.AreaPath': request.areaPath || 'Sample Project 1',
        'System.IterationPath': request.iterationPath || 'Sample Project 1\\Sprint 1',
        'Microsoft.VSTS.Common.Priority': request.priority || 2,
        'Microsoft.VSTS.Scheduling.Effort': request.effort
      }
    };

    this.mockWorkItems.push(newWorkItem);
    return of(newWorkItem).pipe(delay(400));
  }

  updateWorkItem(id: number, updates: WorkItemUpdate[], project?: string): Observable<WorkItem> {
    const itemIndex = this.mockWorkItems.findIndex(wi => wi.id === id);
    
    if (itemIndex === -1) {
      return throwError(() => ({
        status: 404,
        message: `Work item ${id} not found`
      }));
    }

    const item = { ...this.mockWorkItems[itemIndex] };
    
    // Apply updates
    updates.forEach(update => {
      const fieldPath = update.path.replace('/fields/', '').replace('/', '');
      
      switch (update.op) {
        case 'replace':
        case 'add':
          (item.fields as any)[fieldPath] = update.value;
          break;
        case 'remove':
          delete (item.fields as any)[fieldPath];
          break;
      }
    });

    // Update metadata
    item.rev++;
    item.fields['System.ChangedDate'] = new Date().toISOString();
    item.fields['System.ChangedBy'] = this.createMockUser('Mock User', 'mock.user@company.com', 'user-mock');

    this.mockWorkItems[itemIndex] = item;
    return of(item).pipe(delay(300));
  }

  deleteWorkItem(id: number, project?: string): Observable<void> {
    const itemIndex = this.mockWorkItems.findIndex(wi => wi.id === id);
    
    if (itemIndex === -1) {
      return throwError(() => ({
        status: 404,
        message: `Work item ${id} not found`
      }));
    }

    this.mockWorkItems.splice(itemIndex, 1);
    return of(undefined).pipe(delay(200));
  }

  getMyWorkItems(project?: string): Observable<WorkItem[]> {
    console.log('📋 MockWorkItemsService.getMyWorkItems called -', this.mockWorkItems.length, 'work items available');
    // Return items assigned to mock user
    return this.getWorkItemsByAssignee('Mock User', project);
  }

  getWorkItemsByAssignee(assignee: string, project?: string): Observable<WorkItem[]> {
    return this.getWorkItems({ assignedTo: assignee }, project);
  }

  getWorkItemsByState(state: string, project?: string): Observable<WorkItem[]> {
    return this.getWorkItems({ state }, project);
  }

  updateWorkItemField(id: number, field: string, value: any, project?: string): Observable<WorkItem> {
    const update: WorkItemUpdate = {
      op: 'replace',
      path: field,
      value: value
    };
    return this.updateWorkItem(id, [update], project);
  }

  createTask(request: CreateWorkItemRequest, project?: string): Observable<WorkItem> {
    const taskRequest: CreateWorkItemRequest = {
      ...request,
      workItemType: 'Task'
    };
    return this.createWorkItem(taskRequest, project);
  }

  searchWorkItems(searchText: string, project?: string): Observable<WorkItem[]> {
    const filteredItems = this.mockWorkItems.filter(item =>
      item.fields['System.Title'].toLowerCase().includes(searchText.toLowerCase()) ||
      (item.fields['System.Description'] && item.fields['System.Description'].toLowerCase().includes(searchText.toLowerCase()))
    );
    
    return of(filteredItems).pipe(delay(300));
  }

  private createMockUser(displayName: string, email: string, id: string): AssignedTo {
    return {
      displayName,
      url: `https://dev.azure.com/org/_apis/Identities/${id}`,
      id,
      uniqueName: email,
      imageUrl: `https://dev.azure.com/org/_apis/GraphProfile/MemberAvatars/msa.${id}`,
      descriptor: `msa.${id}`
    };
  }
}