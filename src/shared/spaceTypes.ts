/**
 * Space Module - Comprehensive Type Definitions
 * Models: Space, Thread, Source, Instruction, Member, Task
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type SpaceVisibility = "private" | "shared" | "org" | "link";

export type SourceType = "file" | "connector" | "url" | "database";

export type FileMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "text/plain"
  | "text/markdown"
  | "text/csv"
  | "application/json"
  | "application/octet-stream";

export type ConnectorProvider =
  | "google_drive"
  | "onedrive"
  | "sharepoint"
  | "box"
  | "dropbox"
  | "notion"
  | "confluence"
  | "custom";

export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type TaskSchedule =
  | { type: "once"; runAt: Date }
  | { type: "recurring"; cron: string; nextRunAt: Date }
  | { type: "manual" }; // Triggered on-demand

export type SearchMode = "space_only" | "space_then_web" | "web_only" | "disabled";

export type IndexingStatus =
  | "pending"
  | "indexing"
  | "completed"
  | "failed"
  | "outdated";

export type AnswerFormat = "auto" | "paragraph" | "bullet_points" | "numbered_list" | "table" | "code";

export type PreferredTone = "neutral" | "formal" | "casual" | "enthusiastic" | "technical" | "concise";

export type ExportFormat = "markdown" | "pdf" | "docx" | "txt" | "json";

export type NotificationTarget =
  | { type: "none" }
  | { type: "email"; addresses: string[] }
  | { type: "webhook"; url: string; headers?: Record<string, string> }
  | { type: "slack"; channelId: string }
  | { type: "teams"; webhookUrl: string };

// ============================================================================
// Core Space Entity
// ============================================================================

export interface Space {
  id: string;
  name: string;
  description: string | null;
  visibility: SpaceVisibility;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;

  // Ownership
  ownerId: string;
  organizationId: string | null; // For org-level spaces

  // Relationships (stored as IDs for normalization)
  threadIds: string[];
  sourceIds: string[];
  memberIds: string[];
  taskIds: string[];

  // Space-level configuration
  instructions: SpaceInstructions;
  defaultSettings: SpaceDefaultSettings;

  // UI/UX
  icon: string | null; // Emoji or Lucide icon name
  color: string | null; // Hex color
  sortOrder: number; // For custom ordering

  // Billing/plan limits
  plan: {
    tier: "free" | "pro" | "enterprise";
    maxSources: number;
    maxMembers: number;
    maxTasks: number;
    maxStorageBytes: number;
    allowExternalConnectors: boolean;
    allowOrgSharing: boolean;
    allowLinkSharing: boolean;
  };

  // Usage metrics
  stats: {
    totalThreads: number;
    totalMessages: number;
    totalSources: number;
    storageUsedBytes: number;
    lastActivityAt: Date | null;
  };
}

// ============================================================================
// Thread (Chat Session) within Space Context
// ============================================================================

export interface Thread {
  id: string;
  spaceIds: string[]; // Can belong to multiple spaces

  // Basic info
  title: string;
  description: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;

  // Ownership
  ownerId: string;
  createdBy: string; // User ID who created it

  // Content preview
  lastMessagePreview: string | null; // Truncated last message
  messageCount: number;

  // Thread configuration (can override Space defaults)
  settings: ThreadSettings;

  // Context snapshot at creation
  spaceContextAtCreation: {
    spaceId: string;
    instructionSnapshot: SpaceInstructions;
    sourceIds: string[];
  } | null;

  // Message IDs (actual messages stored separately)
  messageIds: string[];

  // Export history
  exports: ThreadExport[];
}

export interface ThreadSettings {
  model: string | null; // null = use Space default
  searchMode: SearchMode | null;
  includeSources: boolean | null;
  temperature: number | null;
  maxTokens: number | null;
}

export interface ThreadExport {
  id: string;
  format: ExportFormat;
  exportedAt: Date;
  exportedBy: string;
  fileUrl: string;
  fileSizeBytes: number;
  messageRange: { fromIndex: number; toIndex: number } | null; // null = all
}

// ============================================================================
// Source (Files & External Connectors)
// ============================================================================

export interface Source {
  id: string;
  spaceId: string;

  // Common fields
  type: SourceType;
  name: string;
  description: string | null;
  location: string; // Path, URL, or connector reference

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;

  // Indexing status for search
  indexingStatus: IndexingStatus;
  indexingError: string | null;
  indexedAt: Date | null;
  documentCount: number; // For multi-file sources
  chunkCount: number; // Number of searchable chunks

  // Size info
  sizeBytes: number | null;
  mimeType: string | null;

  // Type-specific metadata
  metadata: FileSourceMetadata | ConnectorSourceMetadata | UrlSourceMetadata | DatabaseSourceMetadata;
}

export interface FileSourceMetadata {
  type: "file";
  originalName: string;
  mimeType: FileMimeType;
  extension: string;
  uploadMethod: "drag_drop" | "picker" | "api";
  checksum: string | null; // For deduplication
  extractedText: string | null; // OCR/extracted content
  pageCount: number | null; // For PDFs
  thumbnailUrl: string | null;
}

export interface ConnectorSourceMetadata {
  type: "connector";
  provider: ConnectorProvider;
  externalId: string; // ID in the external system
  externalUrl: string;
  syncConfig: {
    syncMode: "realtime" | "scheduled" | "manual";
    syncSchedule: string | null; // Cron for scheduled
    lastSyncCursor: string | null; // For incremental sync
  };
  auth: {
    connectedBy: string;
    connectedAt: Date;
    expiresAt: Date | null;
    scope: string[];
  };
  folderPath: string | null; // If connecting a specific folder
  fileCount: number | null;
}

export interface UrlSourceMetadata {
  type: "url";
  url: string;
  method: "single_page" | "crawl";
  crawlDepth: number | null;
  crawlPattern: string | null; // Regex for URL matching
  scrapedContent: string | null;
  headers: Record<string, string> | null; // Custom headers for fetch
}

export interface DatabaseSourceMetadata {
  type: "database";
  connectionString: string; // Encrypted
  schema: string;
  tables: string[];
  query: string | null; // Optional custom query
  refreshInterval: number | null; // Minutes
}

// ============================================================================
// Space Instructions
// ============================================================================

export interface SpaceInstructions {
  // Core behavior
  systemPromptText: string | null; // Custom system prompt

  // Personality
  preferredTone: PreferredTone;
  answerFormat: AnswerFormat;

  // Content guidelines
  guidelines: {
    stepByStep: boolean;
    includeExamples: boolean;
    citeSources: boolean;
    maxLength: "short" | "medium" | "long" | "very_long" | null;
    language: string | null; // Preferred response language
  };

  // Context behavior
  context: {
    searchSpaceFirst: boolean;
    maxSourcesToInclude: number; // 0-10
    sourceRelevanceThreshold: number; // 0-1
    includeThreadHistory: boolean;
    includeSpaceFiles: boolean;
  };

  // Advanced
  customVariables: Record<string, string>; // {{variable}} replacements
  bannedPhrases: string[];
  requiredPhrases: string[];
}

// ============================================================================
// Member & Permissions
// ============================================================================

export interface Member {
  id: string;
  spaceId: string;
  userId: string;

  // Role & permissions
  role: MemberRole;
  permissions: Permission[];

  // Join info
  joinedAt: Date;
  invitedBy: string | null; // null if self-joined via link
  inviteEmail: string | null; // For pending invites

  // Status
  status: "active" | "pending" | "suspended";
  lastAccessedAt: Date | null;

  // Notifications
  notificationPreferences: {
    newMessages: boolean;
    taskCompleted: boolean;
    sourceAdded: boolean;
    memberJoined: boolean;
  };
}

export type Permission =
  | "view_threads"
  | "create_threads"
  | "edit_threads"
  | "delete_threads"
  | "view_sources"
  | "add_sources"
  | "remove_sources"
  | "edit_instructions"
  | "view_members"
  | "invite_members"
  | "remove_members"
  | "manage_roles"
  | "view_tasks"
  | "create_tasks"
  | "edit_tasks"
  | "delete_tasks"
  | "manage_settings"
  | "delete_space";

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: [
    "view_threads", "create_threads", "edit_threads", "delete_threads",
    "view_sources", "add_sources", "remove_sources",
    "edit_instructions",
    "view_members", "invite_members", "remove_members", "manage_roles",
    "view_tasks", "create_tasks", "edit_tasks", "delete_tasks",
    "manage_settings", "delete_space"
  ],
  admin: [
    "view_threads", "create_threads", "edit_threads", "delete_threads",
    "view_sources", "add_sources", "remove_sources",
    "edit_instructions",
    "view_members", "invite_members", "remove_members",
    "view_tasks", "create_tasks", "edit_tasks", "delete_tasks",
    "manage_settings"
  ],
  editor: [
    "view_threads", "create_threads", "edit_threads",
    "view_sources", "add_sources",
    "view_members",
    "view_tasks", "create_tasks"
  ],
  viewer: [
    "view_threads",
    "view_sources",
    "view_members",
    "view_tasks"
  ]
};

// ============================================================================
// Task (Scheduled/Recurring AI Runs)
// ============================================================================

export interface Task {
  id: string;
  spaceId: string;
  createdBy: string;

  // Basic info
  name: string;
  description: string | null;
  status: "active" | "paused" | "completed" | "failed" | "draft";

  // Schedule
  schedule: TaskSchedule;

  // Configuration
  configuration: TaskConfiguration;

  // Execution context
  execution: TaskExecution;

  // Results
  results: TaskResult[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  completedAt: Date | null;
}

export interface TaskConfiguration {
  // Prompt
  basePrompt: string;
  dynamicVariables: Record<string, string>; // {{date}}, {{space_name}}, etc.

  // AI settings
  model: string;
  temperature: number;
  maxTokens: number;

  // Search & context
  searchMode: SearchMode;
  includeRecentThreads: boolean; // Include threads from last N days
  recentThreadsDays: number;
  specificSourceIds: string[] | null; // null = all sources

  // Output
  outputFormat: AnswerFormat;
  outputTemplate: string | null; // Markdown template for result formatting
}

export interface TaskExecution {
  // Current run
  currentRunId: string | null;
  currentRunStartedAt: Date | null;
  currentRunStatus: "idle" | "running" | "cancelling" | null;

  // History
  runCount: number;
  successCount: number;
  failureCount: number;

  // Limits
  maxRetries: number;
  timeoutMinutes: number;
}

export interface TaskResult {
  id: string;
  taskId: string;
  runNumber: number;

  // Timing
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;

  // Status
  status: "success" | "failure" | "timeout" | "cancelled";
  error: string | null;

  // Output
  output: string | null;
  outputLength: number | null;
  sourcesUsed: string[]; // Source IDs referenced
  threadsReferenced: string[];

  // Delivery
  notificationSent: boolean;
  notificationTarget: NotificationTarget;
  deliveredTo: string[] | null; // Record of delivery attempts
}

// ============================================================================
// Share & Invite
// ============================================================================

export interface ShareLink {
  id: string;
  spaceId: string;

  // URL token
  token: string;
  url: string;

  // Settings
  permissions: Permission[];
  expiresAt: Date | null;
  maxUses: number | null;
  usesRemaining: number | null;

  // Tracking
  createdBy: string;
  createdAt: Date;
  usedCount: number;
  lastUsedAt: Date | null;

  // Access log
  accesses: {
    usedAt: Date;
    ipHash: string; // Hashed for privacy
    userAgent: string;
    userId: string | null; // If they created account after
  }[];
}

export interface PendingInvite {
  id: string;
  spaceId: string;
  invitedBy: string;

  email: string;
  role: MemberRole;
  message: string | null;

  token: string;
  expiresAt: Date;

  sentAt: Date;
  resentAt: Date | null;
  acceptedAt: Date | null;
  status: "pending" | "accepted" | "expired" | "cancelled";
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Space CRUD
export interface CreateSpaceRequest {
  name: string;
  description?: string;
  visibility?: SpaceVisibility;
  icon?: string;
  color?: string;
  instructions?: Partial<SpaceInstructions>;
}

export interface UpdateSpaceRequest {
  name?: string;
  description?: string | null;
  visibility?: SpaceVisibility;
  icon?: string | null;
  color?: string | null;
  instructions?: Partial<SpaceInstructions>;
  defaultSettings?: Partial<SpaceDefaultSettings>;
}

export interface SpaceDefaultSettings {
  model: string;
  searchMode: SearchMode;
  temperature: number;
  maxTokens: number;
}

// Thread management in Space
export interface AddThreadToSpaceRequest {
  threadId: string;
  spaceId: string;
}

export interface RemoveThreadFromSpaceRequest {
  threadId: string;
  spaceId: string;
}

export interface CreateThreadInSpaceRequest {
  spaceId: string;
  title?: string;
  initialMessage?: string;
  settings?: Partial<ThreadSettings>;
}

// Source management
export interface UploadSourceRequest {
  spaceId: string;
  file: File; // Multipart upload
  name?: string;
  description?: string;
}

export interface ConnectExternalSourceRequest {
  spaceId: string;
  provider: ConnectorProvider;
  externalId: string;
  folderPath?: string;
  syncConfig?: Partial<ConnectorSourceMetadata["syncConfig"]>;
}

export interface UpdateSourceRequest {
  name?: string;
  description?: string | null;
  syncConfig?: Partial<ConnectorSourceMetadata["syncConfig"]>;
}

// Member & Sharing
export interface InviteMemberRequest {
  spaceId: string;
  email: string;
  role: MemberRole;
  message?: string;
}

export interface AcceptInviteRequest {
  token: string;
}

export interface UpdateMemberRoleRequest {
  memberId: string;
  role: MemberRole;
}

export interface CreateShareLinkRequest {
  spaceId: string;
  permissions?: Permission[];
  expiresInHours?: number | null;
  maxUses?: number | null;
}

// Task management
export interface CreateTaskRequest {
  spaceId: string;
  name: string;
  description?: string;
  schedule: TaskSchedule;
  configuration: TaskConfiguration;
  notificationTarget?: NotificationTarget;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string | null;
  status?: Task["status"];
  schedule?: TaskSchedule;
  configuration?: Partial<TaskConfiguration>;
  notificationTarget?: NotificationTarget;
}

export interface RunTaskNowRequest {
  taskId: string;
  waitForCompletion?: boolean;
}

// Thread operations
export interface RerunThreadRequest {
  threadId: string;
  fromMessageIndex?: number; // Rerun from specific point
  newModel?: string;
  newSearchMode?: SearchMode;
  newSettings?: Partial<ThreadSettings>;
}

export interface ExportThreadRequest {
  threadId: string;
  format: ExportFormat;
  messageRange?: { fromIndex: number; toIndex: number };
}

// Search within Space
export interface SearchSpaceRequest {
  spaceId: string;
  query: string;
  searchIn?: ("sources" | "threads")[];
  limit?: number;
  filters?: {
    sourceTypes?: SourceType[];
    dateRange?: { from: Date; to: Date };
  };
}

export interface SearchSpaceResponse {
  sources: Array<{
    source: Source;
    relevantChunks: Array<{
      text: string;
      score: number;
      location: string;
    }>;
  }>;
  threads: Array<{
    thread: Thread;
    relevantMessages: Array<{
      index: number;
      preview: string;
      score: number;
    }>;
  }>;
  queryTimeMs: number;
}
