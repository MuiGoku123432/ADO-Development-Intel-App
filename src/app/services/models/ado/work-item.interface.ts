export interface WorkItem {
  id: number;
  rev: number;
  url: string;
  fields: WorkItemFields;
  relations?: WorkItemRelation[];
  _links?: WorkItemLinks;
}

export interface WorkItemFields {
  'System.Id': number;
  'System.Title': string;
  'System.WorkItemType': string;
  'System.State': string;
  'System.Reason': string;
  'System.AssignedTo'?: AssignedTo;
  'System.CreatedDate': string;
  'System.CreatedBy': AssignedTo;
  'System.ChangedDate': string;
  'System.ChangedBy': AssignedTo;
  'System.Description'?: string;
  'System.AreaPath': string;
  'System.IterationPath': string;
  'Microsoft.VSTS.Common.Priority'?: number;
  'Microsoft.VSTS.Common.Severity'?: string;
  'Microsoft.VSTS.Scheduling.Effort'?: number;
  'Microsoft.VSTS.Scheduling.StoryPoints'?: number;
  [key: string]: any;
}

export interface AssignedTo {
  displayName: string;
  url: string;
  id: string;
  uniqueName: string;
  imageUrl: string;
  descriptor: string;
}

export interface WorkItemRelation {
  rel: string;
  url: string;
  attributes?: { [key: string]: any };
}

export interface WorkItemLinks {
  self: Link;
  workItemUpdates: Link;
  workItemRevisions: Link;
  workItemComments: Link;
  html: Link;
  workItemType: Link;
  fields: Link;
}

export interface Link {
  href: string;
}

export interface WorkItemQuery {
  assignedTo?: string;
  state?: string;
  workItemType?: string;
  areaPath?: string;
  iterationPath?: string;
  createdBy?: string;
  top?: number;
  skip?: number;
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  workItemType: string;
  assignedTo?: string;
  areaPath?: string;
  iterationPath?: string;
  priority?: number;
  effort?: number;
}

export interface WorkItemUpdate {
  op: 'add' | 'remove' | 'replace' | 'test';
  path: string;
  value?: any;
  from?: string;
}