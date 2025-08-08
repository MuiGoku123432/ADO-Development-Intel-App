export interface PullRequest {
  pullRequestId: number;
  codeReviewId: number;
  status: PullRequestStatus;
  createdBy: IdentityRef;
  creationDate: string;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  mergeStatus: PullRequestAsyncStatus;
  isDraft: boolean;
  mergeId: string;
  lastMergeSourceCommit: GitCommitRef;
  lastMergeTargetCommit: GitCommitRef;
  reviewers: IdentityRefWithVote[];
  url: string;
  _links?: PullRequestLinks;
}

export interface GitCommitRef {
  commitId: string;
  url: string;
}

export interface IdentityRefWithVote extends IdentityRef {
  vote: number;
  hasDeclined: boolean;
  isFlagged: boolean;
  isRequired: boolean;
}

export interface IdentityRef {
  displayName: string;
  url: string;
  id: string;
  uniqueName: string;
  imageUrl: string;
  descriptor: string;
}

export interface PullRequestLinks {
  self: Link;
  repository: Link;
  workItems: Link;
  sourceBranch: Link;
  targetBranch: Link;
  statuses: Link;
  sourceCommit: Link;
  targetCommit: Link;
}

export interface Link {
  href: string;
}

export enum PullRequestStatus {
  NotSet = 0,
  Active = 1,
  Abandoned = 2,
  Completed = 3,
  All = 4
}

export enum PullRequestAsyncStatus {
  NotSet = 0,
  Queued = 1,
  Conflicts = 2,
  Succeeded = 3,
  RejectedByPolicy = 4,
  Failure = 5
}

export interface CreatePullRequestRequest {
  sourceRefName: string;
  targetRefName: string;
  title: string;
  description?: string;
  reviewers?: IdentityRef[];
  isDraft?: boolean;
}

export interface PullRequestComment {
  id: number;
  parentCommentId: number;
  author: IdentityRef;
  content: string;
  publishedDate: string;
  lastUpdatedDate: string;
  lastContentUpdatedDate: string;
  commentType: CommentType;
  usersLiked: IdentityRef[];
  _links?: CommentLinks;
}

export interface CommentLinks {
  self: Link;
  repository: Link;
  threads: Link;
}

export enum CommentType {
  Unknown = 0,
  Text = 1,
  CodeChange = 2,
  System = 3
}