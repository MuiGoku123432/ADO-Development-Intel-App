export interface Repository {
  id: string;
  name: string;
  url: string;
  project: ProjectReference;
  defaultBranch: string;
  size: number;
  remoteUrl: string;
  sshUrl: string;
  webUrl: string;
  _links?: RepositoryLinks;
}

export interface ProjectReference {
  id: string;
  name: string;
  url: string;
  state: string;
  revision: number;
  visibility: string;
}

export interface RepositoryLinks {
  self: Link;
  project: Link;
  web: Link;
  ssh: Link;
  clone: Link;
}

export interface GitRef {
  name: string;
  objectId: string;
  creator: GitUserDate;
  url: string;
  statuses?: GitStatus[];
  _links?: GitRefLinks;
}

export interface GitUserDate {
  name: string;
  email: string;
  date: string;
}

export interface GitStatus {
  state: string;
  description: string;
  context: GitStatusContext;
  creationDate: string;
  createdBy: IdentityRef;
  targetUrl: string;
}

export interface GitStatusContext {
  name: string;
  genre: string;
}

export interface IdentityRef {
  displayName: string;
  url: string;
  id: string;
  uniqueName: string;
  imageUrl: string;
}

export interface GitRefLinks {
  self: Link;
  statuses: Link;
}

export interface GitCommit {
  commitId: string;
  author: GitUserDate;
  committer: GitUserDate;
  comment: string;
  commentTruncated: boolean;
  changeCounts: ChangeCountDictionary;
  url: string;
  remoteUrl: string;
  _links?: GitCommitLinks;
}

export interface ChangeCountDictionary {
  Add: number;
  Edit: number;
  Delete: number;
}

export interface GitCommitLinks {
  self: Link;
  repository: Link;
  changes: Link;
  web: Link;
}

export interface Link {
  href: string;
}