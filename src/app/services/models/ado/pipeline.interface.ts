export interface BuildDefinition {
  id: number;
  name: string;
  url: string;
  uri: string;
  path: string;
  type: DefinitionType;
  queueStatus: DefinitionQueueStatus;
  revision: number;
  createdDate: string;
  project: ProjectReference;
  authoredBy: IdentityRef;
  queue: AgentPoolQueue;
  _links?: BuildDefinitionLinks;
}

export interface Build {
  id: number;
  buildNumber: string;
  status: BuildStatus;
  result: BuildResult;
  queueTime: string;
  startTime: string;
  finishTime: string;
  url: string;
  definition: BuildDefinitionReference;
  buildNumberRevision: number;
  project: ProjectReference;
  uri: string;
  sourceBranch: string;
  sourceVersion: string;
  queue: AgentPoolQueue;
  priority: QueuePriority;
  reason: BuildReason;
  requestedFor: IdentityRef;
  requestedBy: IdentityRef;
  lastChangedDate: string;
  lastChangedBy: IdentityRef;
  logs: BuildLogReference;
  repository: BuildRepository;
  keepForever: boolean;
  retainedByRelease: boolean;
  triggeredByBuild?: Build;
  _links?: BuildLinks;
}

export interface BuildDefinitionReference {
  id: number;
  name: string;
  url: string;
  uri: string;
  path: string;
  type: DefinitionType;
  queueStatus: DefinitionQueueStatus;
  revision: number;
  project: ProjectReference;
}

export interface ProjectReference {
  id: string;
  name: string;
  url: string;
  state: string;
  revision: number;
  visibility: string;
}

export interface IdentityRef {
  displayName: string;
  url: string;
  id: string;
  uniqueName: string;
  imageUrl: string;
  descriptor: string;
}

export interface AgentPoolQueue {
  id: number;
  name: string;
  pool: TaskAgentPoolReference;
}

export interface TaskAgentPoolReference {
  id: number;
  name: string;
  scope: string;
  isHosted: boolean;
  poolType: TaskAgentPoolType;
}

export interface BuildLogReference {
  id: number;
  type: string;
  url: string;
}

export interface BuildRepository {
  id: string;
  name: string;
  url: string;
  type: string;
  defaultBranch: string;
  clean: string;
  checkoutSubmodules: boolean;
}

export interface BuildDefinitionLinks {
  self: Link;
  web: Link;
  editor: Link;
  badge: Link;
}

export interface BuildLinks {
  self: Link;
  web: Link;
  sourceVersionDisplayUri: Link;
  timeline: Link;
  badge: Link;
}

export interface Link {
  href: string;
}

export enum DefinitionType {
  Xaml = 1,
  Build = 2
}

export enum DefinitionQueueStatus {
  Enabled = 0,
  Paused = 1,
  Disabled = 2
}

export enum BuildStatus {
  None = 0,
  InProgress = 1,
  Completed = 2,
  Cancelling = 4,
  Postponed = 8,
  NotStarted = 32,
  All = 47
}

export enum BuildResult {
  None = 0,
  Succeeded = 2,
  PartiallySucceeded = 4,
  Failed = 8,
  Canceled = 32
}

export enum QueuePriority {
  Low = 5,
  BelowNormal = 4,
  Normal = 3,
  AboveNormal = 2,
  High = 1
}

export enum BuildReason {
  None = 0,
  Manual = 1,
  IndividualCI = 2,
  BatchedCI = 4,
  Schedule = 8,
  ScheduleForced = 16,
  UserCreated = 32,
  ValidateShelveset = 64,
  CheckInShelveset = 128,
  PullRequest = 256,
  BuildCompletion = 512,
  ResourceTrigger = 1024,
  All = 2047
}

export enum TaskAgentPoolType {
  Automation = 1,
  Deployment = 2
}

// Release Management Interfaces
export interface ReleaseDefinition {
  id: number;
  name: string;
  path: string;
  projectReference: ProjectReference;
  url: string;
  _links?: ReleaseDefinitionLinks;
}

export interface Release {
  id: number;
  name: string;
  status: ReleaseStatus;
  createdOn: string;
  createdBy: IdentityRef;
  modifiedBy: IdentityRef;
  modifiedOn: string;
  releaseDefinition: ReleaseDefinitionShallowReference;
  project: ProjectReference;
  environments: ReleaseEnvironment[];
  artifacts: Artifact[];
  releaseNameFormat: string;
  keepForever: boolean;
  url: string;
  _links?: ReleaseLinks;
}

export interface ReleaseDefinitionShallowReference {
  id: number;
  name: string;
  path: string;
  projectReference: ProjectReference;
  url: string;
  _links?: ReleaseDefinitionLinks;
}

export interface ReleaseEnvironment {
  id: number;
  name: string;
  status: EnvironmentStatus;
  variables: { [key: string]: ConfigurationVariableValue };
  preDeployApprovals: ReleaseApproval[];
  postDeployApprovals: ReleaseApproval[];
  preApprovalsSnapshot: ReleaseDefinitionApprovals;
  postApprovalsSnapshot: ReleaseDefinitionApprovals;
  deploySteps: DeploymentAttempt[];
  rank: number;
  definitionEnvironmentId: number;
  queueId: number;
  environmentOptions: EnvironmentOptions;
  demands: any[];
  conditions: Condition[];
  createdOn: string;
  modifiedOn: string;
  workflowTasks: WorkflowTask[];
  deployPhasesSnapshot: DeployPhase[];
  owner: IdentityRef;
  schedules: ReleaseSchedule[];
  release: ReleaseShallowReference;
  releaseDefinition: ReleaseDefinitionShallowReference;
  releaseCreatedBy: IdentityRef;
  triggerReason: string;
  timeToDeploy: number;
}

export interface ConfigurationVariableValue {
  value: string;
  isSecret: boolean;
}

export interface ReleaseApproval {
  id: number;
  revision: number;
  approver: IdentityRef;
  approvedBy: IdentityRef;
  approvalType: ApprovalType;
  status: ApprovalStatus;
  comments: string;
  isAutomated: boolean;
  isNotificationOn: boolean;
  trialNumber: number;
  attempt: number;
  rank: number;
  release: ReleaseShallowReference;
  releaseDefinition: ReleaseDefinitionShallowReference;
  releaseEnvironment: ReleaseEnvironmentShallowReference;
  url: string;
  _links?: ReleaseApprovalLinks;
}

export interface ReleaseDefinitionLinks {
  self: Link;
  web: Link;
}

export interface ReleaseLinks {
  self: Link;
  web: Link;
}

export interface ReleaseApprovalLinks {
  self: Link;
}

export interface ReleaseShallowReference {
  id: number;
  name: string;
  url: string;
  _links?: ReleaseLinks;
}

export interface ReleaseEnvironmentShallowReference {
  id: number;
  name: string;
  url: string;
}

export interface Artifact {
  sourceId: string;
  type: string;
  alias: string;
  definitionReference: { [key: string]: ArtifactSourceReference };
  isPrimary: boolean;
  isRetained: boolean;
}

export interface ArtifactSourceReference {
  id: string;
  name: string;
}

export enum ReleaseStatus {
  Undefined = 0,
  Draft = 1,
  Active = 2,
  Abandoned = 4
}

export enum EnvironmentStatus {
  Undefined = 0,
  NotStarted = 1,
  InProgress = 2,
  Succeeded = 4,
  Canceled = 8,
  Rejected = 16,
  Queued = 32,
  Scheduled = 64,
  PartiallySucceeded = 128
}

export enum ApprovalType {
  Undefined = 0,
  PreDeploy = 1,
  PostDeploy = 2,
  All = 3
}

export enum ApprovalStatus {
  Undefined = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 4,
  Reassigned = 6,
  Canceled = 7,
  Skipped = 8
}

// Additional interfaces for completeness
export interface ReleaseDefinitionApprovals {
  approvals: ReleaseDefinitionApprovalStep[];
  approvalOptions: ApprovalOptions;
}

export interface ReleaseDefinitionApprovalStep {
  id: number;
  assignedApprover: IdentityRef;
  isAutomated: boolean;
  isNotificationOn: boolean;
  rank: number;
}

export interface ApprovalOptions {
  requiredApproverCount: number;
  releaseCreatorCanBeApprover: boolean;
  autoTriggeredAndPreviousEnvironmentApprovedCanBeSkipped: boolean;
  enforceIdentityRevalidation: boolean;
  timeoutInMinutes: number;
  executionOrder: ApprovalExecutionOrder;
}

export interface DeploymentAttempt {
  id: number;
  deploymentId: number;
  attempt: number;
  reason: DeploymentReason;
  status: DeploymentStatus;
  operationStatus: DeploymentOperationStatus;
  releaseDeployPhases: ReleaseDeployPhase[];
  requestedBy: IdentityRef;
  requestedFor: IdentityRef;
  queuedOn: string;
  lastModifiedBy: IdentityRef;
  lastModifiedOn: string;
  hasStarted: boolean;
}

export interface EnvironmentOptions {
  emailNotificationType: string;
  emailRecipients: string;
  skipArtifactsDownload: boolean;
  timeoutInMinutes: number;
  enableAccessToken: boolean;
  publishDeploymentStatus: boolean;
  badgeEnabled: boolean;
  autoLinkWorkItems: boolean;
  pullRequestDeploymentEnabled: boolean;
}

export interface Condition {
  name: string;
  conditionType: ConditionType;
  value: string;
  result: boolean;
}

export interface WorkflowTask {
  taskId: string;
  version: string;
  name: string;
  refName: string;
  enabled: boolean;
  alwaysRun: boolean;
  continueOnError: boolean;
  timeoutInMinutes: number;
  definitionType: string;
  overrideInputs: { [key: string]: string };
  condition: string;
  environment: { [key: string]: string };
  inputs: { [key: string]: string };
}

export interface DeployPhase {
  deploymentInput: DeploymentInput;
  rank: number;
  phaseType: DeployPhaseTypes;
  name: string;
  refName: string;
  workflowTasks: WorkflowTask[];
}

export interface DeploymentInput {
  parallelExecution: ExecutionInput;
  agentSpecification: AgentSpecification;
  skipArtifactsDownload: boolean;
  artifactsDownloadInput: ArtifactsDownloadInput;
  queueId: number;
  demands: Demand[];
  enableAccessToken: boolean;
  timeoutInMinutes: number;
  jobCancelTimeoutInMinutes: number;
  condition: string;
  overrideInputs: { [key: string]: string };
}

export interface ReleaseSchedule {
  daysToRelease: ScheduleDays;
  jobId: string;
  scheduleOnlyWithChanges: boolean;
  startHours: number;
  startMinutes: number;
  timeZoneId: string;
}

export interface ExecutionInput {
  parallelExecutionType: ParallelExecutionTypes;
  multipliers: string[];
  maxNumberOfAgents: number;
  continueOnError: boolean;
  agentSpecification: AgentSpecification;
}

export interface AgentSpecification {
  identifier: string;
}

export interface ArtifactsDownloadInput {
  downloadInputs: ArtifactDownloadInputBase[];
}

export interface ArtifactDownloadInputBase {
  artifactType: string;
  artifactItems: string[];
}

export interface Demand {
  name: string;
  value: string;
}

export interface ReleaseDeployPhase {
  id: number;
  phaseId: string;
  name: string;
  rank: number;
  phaseType: DeployPhaseTypes;
  status: DeployPhaseStatus;
  runPlanId: string;
  deploymentJobs: DeploymentJob[];
  startedOn: string;
  completedOn: string;
  manualInterventions: ManualIntervention[];
}

export interface DeploymentJob {
  job: ReleaseTask;
  tasks: ReleaseTask[];
}

export interface ReleaseTask {
  id: number;
  name: string;
  status: TaskStatus;
  startTime: string;
  finishTime: string;
  percentComplete: number;
  logUrl: string;
  task: WorkflowTaskReference;
  attempt: number;
  errorIssues: Issue[];
  warningIssues: Issue[];
  dateStarted: string;
  dateEnded: string;
  rank: number;
  issues: Issue[];
  timelineRecordId: string;
  agentName: string;
}

export interface WorkflowTaskReference {
  id: string;
  name: string;
  version: string;
}

export interface Issue {
  type: IssueType;
  category: string;
  message: string;
  data: { [key: string]: string };
}

export interface ManualIntervention {
  id: number;
  name: string;
  instructions: string;
  url: string;
  status: ManualInterventionStatus;
  user: IdentityRef;
  modifiedBy: IdentityRef;
  createdOn: string;
  modifiedOn: string;
  comments: string;
  releaseEnvironment: ReleaseEnvironmentShallowReference;
}

export enum ApprovalExecutionOrder {
  BeforeGates = 1,
  AfterSuccessfulGates = 2,
  AfterGatesAlways = 4
}

export enum DeploymentReason {
  None = 0,
  Manual = 1,
  Automated = 2,
  Scheduled = 4,
  RedeployTrigger = 8
}

export enum DeploymentStatus {
  Undefined = 0,
  NotDeployed = 1,
  InProgress = 2,
  Succeeded = 4,
  PartiallySucceeded = 8,
  Failed = 16,
  Canceled = 32,
  Skipped = 64,
  Deferred = 128
}

export enum DeploymentOperationStatus {
  Undefined = 0,
  Queued = 1,
  Scheduled = 2,
  Pending = 4,
  Approved = 8,
  Rejected = 16,
  Deferred = 32,
  QueuedForAgent = 64,
  PhaseInProgress = 128,
  PhaseSucceeded = 256,
  PhasePartiallySucceeded = 512,
  PhaseFailed = 1024,
  PhaseCanceled = 2048,
  PhaseSkipped = 4096,
  ApprovalWaiting = 8192,
  ApprovalApproved = 16384,
  ApprovalRejected = 32768,
  ApprovalCanceled = 65536,
  ApprovalSkipped = 131072,
  PreDeploymentGatesWaiting = 262144,
  PreDeploymentGatesSucceeded = 524288,
  PreDeploymentGatesFailed = 1048576,
  PostDeploymentGatesWaiting = 2097152,
  PostDeploymentGatesSucceeded = 4194304,
  PostDeploymentGatesFailed = 8388608,
  ManualInterventionWaiting = 16777216,
  ManualInterventionSucceeded = 33554432,
  ManualInterventionRejected = 67108864,
  EvaluatingGates = 134217728,
  GateFailed = 268435456,
  All = 536870911
}

export enum ConditionType {
  Undefined = 0,
  Event = 1,
  EnvironmentState = 2,
  Artifact = 4
}

export enum DeployPhaseTypes {
  Undefined = 0,
  AgentBasedDeployment = 1,
  MachineGroupBasedDeployment = 2,
  DeploymentGates = 4,
  ServerBasedDeployment = 8,
  RunOnServer = 8
}

export enum ScheduleDays {
  None = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 4,
  Thursday = 8,
  Friday = 16,
  Saturday = 32,
  Sunday = 64,
  All = 127
}

export enum ParallelExecutionTypes {
  None = 0,
  MultiConfiguration = 1,
  MultiMachine = 2
}

export enum DeployPhaseStatus {
  Undefined = 0,
  NotStarted = 1,
  InProgress = 2,
  PartiallySucceeded = 4,
  Succeeded = 8,
  Failed = 16,
  Canceled = 32,
  Skipped = 64
}

export enum TaskStatus {
  Unknown = 0,
  Initialized = 1,
  InProgress = 2,
  Completed = 3
}

export enum IssueType {
  Error = 1,
  Warning = 2
}

export enum ManualInterventionStatus {
  Unknown = 0,
  Pending = 1,
  Rejected = 2,
  Approved = 4,
  Canceled = 8
}