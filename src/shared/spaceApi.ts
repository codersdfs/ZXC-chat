/**
 * Space Module - API Endpoint Signatures
 * RESTful API definitions for Space operations
 */

import type {
  Space,
  Thread,
  Source,
  Task,
  Member,
  ShareLink,
  PendingInvite,
  MemberRole,
  SearchMode,
  IndexingStatus,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  CreateThreadInSpaceRequest,
  AddThreadToSpaceRequest,
  RemoveThreadFromSpaceRequest,
  ConnectExternalSourceRequest,
  UpdateSourceRequest,
  InviteMemberRequest,
  AcceptInviteRequest,
  UpdateMemberRoleRequest,
  CreateShareLinkRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  RunTaskNowRequest,
  RerunThreadRequest,
  ExportThreadRequest,
  SearchSpaceRequest,
  SearchSpaceResponse,
  SpaceInstructions,
  TaskResult,
  ThreadExport,
} from "./spaceTypes";

// ============================================================================
// Common Response Types
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiError | null;
  meta: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
}

interface ResponseMeta {
  requestId: string;
  timestamp: Date;
  pagination?: PaginationInfo;
}

interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ListOptions {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filters?: Record<string, unknown>;
}

// ============================================================================
// Space CRUD Endpoints
// ============================================================================

/**
 * POST /api/spaces
 * Create a new Space
 */
export type CreateSpaceEndpoint = {
  Request: {
    body: CreateSpaceRequest;
    headers: {
      "X-User-Id": string;
      "X-Organization-Id"?: string;
    };
  };
  Response: ApiResponse<{
    space: Space;
    member: Member; // Owner member record
  }>;
};

/**
 * GET /api/spaces
 * List all spaces accessible to the user
 */
export type ListSpacesEndpoint = {
  Request: {
    query: ListOptions & {
      visibility?: ("private" | "shared" | "org")[];
      ownedOnly?: boolean;
      includeStats?: boolean;
    };
    headers: {
      "X-User-Id": string;
      "X-Organization-Id"?: string;
    };
  };
  Response: ApiResponse<{
    spaces: Space[];
    membershipMap: Record<string, MemberRole>; // spaceId -> role
  }>;
};

/**
 * GET /api/spaces/:spaceId
 * Get a single Space with all details
 */
export type GetSpaceEndpoint = {
  Request: {
    params: { spaceId: string };
    query: {
      includeThreads?: boolean;
      includeSources?: boolean;
      includeMembers?: boolean;
      includeTasks?: boolean;
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    space: Space;
    threads?: Thread[];
    sources?: Source[];
    members?: Member[];
    tasks?: Task[];
    currentUserRole: MemberRole;
    permissions: string[];
  }>;
};

/**
 * PATCH /api/spaces/:spaceId
 * Update Space metadata, instructions, or settings
 */
export type UpdateSpaceEndpoint = {
  Request: {
    params: { spaceId: string };
    body: UpdateSpaceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    space: Space;
  }>;
};

/**
 * DELETE /api/spaces/:spaceId
 * Delete a Space (owner only)
 */
export type DeleteSpaceEndpoint = {
  Request: {
    params: { spaceId: string };
    query: {
      deleteThreads?: boolean; // If false, threads become unlinked
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    deleted: boolean;
    threadsDeleted: number;
    sourcesDeleted: number;
  }>;
};

// ============================================================================
// Thread Management Endpoints
// ============================================================================

/**
 * POST /api/spaces/:spaceId/threads
 * Create a new Thread within this Space
 */
export type CreateThreadInSpaceEndpoint = {
  Request: {
    params: { spaceId: string };
    body: CreateThreadInSpaceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    thread: Thread;
    space: Space; // Updated with new threadId
  }>;
};

/**
 * GET /api/spaces/:spaceId/threads
 * List all Threads in a Space
 */
export type ListSpaceThreadsEndpoint = {
  Request: {
    params: { spaceId: string };
    query: ListOptions & {
      includePreview?: boolean;
      includeOwner?: boolean;
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    threads: Thread[];
    owners?: Record<string, { id: string; name: string; avatar: string | null }>;
  }>;
};

/**
 * POST /api/spaces/:spaceId/threads/:threadId/link
 * Add an existing Thread to this Space
 */
export type LinkThreadToSpaceEndpoint = {
  Request: {
    params: { spaceId: string; threadId: string };
    body: AddThreadToSpaceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    space: Space;
    thread: Thread;
  }>;
};

/**
 * DELETE /api/spaces/:spaceId/threads/:threadId/link
 * Remove a Thread from this Space (doesn't delete Thread)
 */
export type UnlinkThreadFromSpaceEndpoint = {
  Request: {
    params: { spaceId: string; threadId: string };
    body: RemoveThreadFromSpaceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    space: Space;
    thread: Thread;
  }>;
};

/**
 * GET /api/threads/:threadId
 * Get Thread details with full messages
 */
export type GetThreadEndpoint = {
  Request: {
    params: { threadId: string };
    query: {
      includeMessages?: boolean;
      messageRange?: { from: number; to: number };
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    thread: Thread;
    messages?: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string;
      timestamp: Date;
      attachments: unknown[];
      citations: unknown[];
    }>;
    spaces: Space[]; // Spaces this thread belongs to
  }>;
};

/**
 * POST /api/threads/:threadId/rerun
 * Rerun/continue a thread with new settings
 */
export type RerunThreadEndpoint = {
  Request: {
    params: { threadId: string };
    body: RerunThreadRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    thread: Thread;
    newBranchThreadId: string | null; // If branching, ID of new thread
  }>;
};

/**
 * POST /api/threads/:threadId/export
 * Export Thread to file format
 */
export type ExportThreadEndpoint = {
  Request: {
    params: { threadId: string };
    body: ExportThreadRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    export: ThreadExport;
    downloadUrl: string;
    expiresAt: Date;
  }>;
};

// ============================================================================
// Source Management Endpoints
// ============================================================================

/**
 * POST /api/spaces/:spaceId/sources/upload
 * Upload a file source (multipart/form-data)
 */
export type UploadSourceEndpoint = {
  Request: {
    params: { spaceId: string };
    body: FormData; // Contains file and metadata
    headers: {
      "X-User-Id": string;
      "Content-Type": "multipart/form-data";
    };
  };
  Response: ApiResponse<{
    source: Source;
    uploadUrl?: string; // For large files, return presigned URL
  }>;
};

/**
 * POST /api/spaces/:spaceId/sources/connect
 * Connect external source (Google Drive, etc.)
 */
export type ConnectExternalSourceEndpoint = {
  Request: {
    params: { spaceId: string };
    body: ConnectExternalSourceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    source: Source;
    authUrl?: string; // OAuth redirect if auth needed
  }>;
};

/**
 * GET /api/spaces/:spaceId/sources
 * List all sources in a Space
 */
export type ListSourcesEndpoint = {
  Request: {
    params: { spaceId: string };
    query: ListOptions & {
      type?: ("file" | "connector" | "url" | "database")[];
      status?: ("pending" | "indexing" | "completed" | "failed")[];
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    sources: Source[];
    stats: {
      total: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      totalSizeBytes: number;
    };
  }>;
};

/**
 * GET /api/sources/:sourceId
 * Get source details
 */
export type GetSourceEndpoint = {
  Request: {
    params: { sourceId: string };
    query: {
      includeContent?: boolean;
      includeChunks?: boolean;
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    source: Source;
    content?: string | null;
    chunks?: Array<{
      id: string;
      text: string;
      metadata: Record<string, unknown>;
    }>;
  }>;
};

/**
 * PATCH /api/sources/:sourceId
 * Update source metadata
 */
export type UpdateSourceEndpoint = {
  Request: {
    params: { sourceId: string };
    body: UpdateSourceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    source: Source;
  }>;
};

/**
 * DELETE /api/sources/:sourceId
 * Remove a source
 */
export type DeleteSourceEndpoint = {
  Request: {
    params: { sourceId: string };
    query: {
      deleteFile?: boolean; // For file sources, delete from storage
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    deleted: boolean;
    storageFreedBytes: number;
  }>;
};

/**
 * POST /api/sources/:sourceId/sync
 * Trigger manual sync for external sources
 */
export type SyncSourceEndpoint = {
  Request: {
    params: { sourceId: string };
    body: {
      fullSync?: boolean; // true = full reindex, false = incremental
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    source: Source;
    syncJobId: string;
  }>;
};

// ============================================================================
// Instructions Endpoints
// ============================================================================

/**
 * GET /api/spaces/:spaceId/instructions
 * Get Space instructions
 */
export type GetSpaceInstructionsEndpoint = {
  Request: {
    params: { spaceId: string };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    instructions: SpaceInstructions;
    lastModifiedBy: string;
    lastModifiedAt: Date;
  }>;
};

/**
 * PUT /api/spaces/:spaceId/instructions
 * Update Space instructions
 */
export type UpdateSpaceInstructionsEndpoint = {
  Request: {
    params: { spaceId: string };
    body: Partial<SpaceInstructions>;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    instructions: SpaceInstructions;
    space: Space;
  }>;
};

// ============================================================================
// Member & Sharing Endpoints
// ============================================================================

/**
 * POST /api/spaces/:spaceId/invite
 * Invite a member by email
 */
export type InviteMemberEndpoint = {
  Request: {
    params: { spaceId: string };
    body: InviteMemberRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    invite: PendingInvite;
    memberPreview: {
      email: string;
      role: string;
      status: "pending";
    };
  }>;
};

/**
 * POST /api/invites/:token/accept
 * Accept an invitation
 */
export type AcceptInviteEndpoint = {
  Request: {
    params: { token: string };
    body: AcceptInviteRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    member: Member;
    space: Space;
  }>;
};

/**
 * GET /api/spaces/:spaceId/members
 * List all members
 */
export type ListMembersEndpoint = {
  Request: {
    params: { spaceId: string };
    query: ListOptions & {
      includePending?: boolean;
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    members: Array<Member & {
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
      };
    }>;
    pendingInvites: PendingInvite[];
  }>;
};

/**
 * PATCH /api/spaces/:spaceId/members/:memberId
 * Update member role
 */
export type UpdateMemberRoleEndpoint = {
  Request: {
    params: { spaceId: string; memberId: string };
    body: UpdateMemberRoleRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    member: Member;
  }>;
};

/**
 * DELETE /api/spaces/:spaceId/members/:memberId
 * Remove a member
 */
export type RemoveMemberEndpoint = {
  Request: {
    params: { spaceId: string; memberId: string };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    removed: boolean;
  }>;
};

// ============================================================================
// Share Link Endpoints
// ============================================================================

/**
 * POST /api/spaces/:spaceId/share-links
 * Create a shareable link
 */
export type CreateShareLinkEndpoint = {
  Request: {
    params: { spaceId: string };
    body: CreateShareLinkRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    shareLink: ShareLink;
  }>;
};

/**
 * GET /api/spaces/:spaceId/share-links
 * List all share links
 */
export type ListShareLinksEndpoint = {
  Request: {
    params: { spaceId: string };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    shareLinks: ShareLink[];
  }>;
};

/**
 * DELETE /api/share-links/:linkId
 * Revoke a share link
 */
export type RevokeShareLinkEndpoint = {
  Request: {
    params: { linkId: string };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    revoked: boolean;
  }>;
};

/**
 * POST /api/share/:token/access
 * Access a Space via share link
 */
export type AccessSharedSpaceEndpoint = {
  Request: {
    params: { token: string };
    headers: {
      "X-User-Id"?: string; // Optional - may create anonymous session
    };
  };
  Response: ApiResponse<{
    space: Space;
    permissions: string[];
    isAnonymous: boolean;
  }>;
};

// ============================================================================
// Task Endpoints
// ============================================================================

/**
 * POST /api/spaces/:spaceId/tasks
 * Create a new Task
 */
export type CreateTaskEndpoint = {
  Request: {
    params: { spaceId: string };
    body: CreateTaskRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    task: Task;
  }>;
};

/**
 * GET /api/spaces/:spaceId/tasks
 * List all Tasks in a Space
 */
export type ListTasksEndpoint = {
  Request: {
    params: { spaceId: string };
    query: ListOptions & {
      status?: ("active" | "paused" | "completed" | "failed")[];
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    tasks: Task[];
    stats: {
      total: number;
      active: number;
      bySchedule: Record<string, number>;
    };
  }>;
};

/**
 * GET /api/tasks/:taskId
 * Get Task details
 */
export type GetTaskEndpoint = {
  Request: {
    params: { taskId: string };
    query: {
      includeResults?: boolean;
      resultLimit?: number;
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    task: Task;
    results?: TaskResult[];
    space: Space;
  }>;
};

/**
 * PATCH /api/tasks/:taskId
 * Update Task
 */
export type UpdateTaskEndpoint = {
  Request: {
    params: { taskId: string };
    body: UpdateTaskRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    task: Task;
  }>;
};

/**
 * DELETE /api/tasks/:taskId
 * Delete a Task
 */
export type DeleteTaskEndpoint = {
  Request: {
    params: { taskId: string };
    query: {
      preserveResults?: boolean;
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    deleted: boolean;
    resultsDeleted: number;
  }>;
};

/**
 * POST /api/tasks/:taskId/run
 * Run Task immediately
 */
export type RunTaskNowEndpoint = {
  Request: {
    params: { taskId: string };
    body: RunTaskNowRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    result: TaskResult;
    task: Task;
  }>;
};

/**
 * GET /api/tasks/:taskId/results
 * Get Task results history
 */
export type ListTaskResultsEndpoint = {
  Request: {
    params: { taskId: string };
    query: ListOptions;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    results: TaskResult[];
    task: Task;
  }>;
};

// ============================================================================
// Search Endpoints
// ============================================================================

/**
 * POST /api/spaces/:spaceId/search
 * Search within Space sources and threads
 */
export type SearchSpaceEndpoint = {
  Request: {
    params: { spaceId: string };
    body: SearchSpaceRequest;
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<SearchSpaceResponse>;
};

/**
 * POST /api/chat/with-space-context
 * Send a chat message with Space context (sources + instructions)
 * This is the main endpoint for chatting within a Space
 */
export type ChatWithSpaceContextEndpoint = {
  Request: {
    body: {
      spaceId: string;
      threadId?: string; // If continuing existing thread
      message: string;
      attachments?: unknown[];
      settings?: {
        model?: string;
        searchMode?: SearchMode;
        overrideInstructions?: Partial<SpaceInstructions>;
      };
    };
    headers: {
      "X-User-Id": string;
    };
  };
  Response: ApiResponse<{
    threadId: string;
    messageId: string;
    response: string;
    citations: Array<{
      sourceId: string;
      sourceName: string;
      text: string;
      relevanceScore: number;
    }>;
    sourcesSearched: string[];
    usedInstructions: boolean;
  }>;
};

// ============================================================================
// WebSocket / Real-time Events (for streaming)
// ============================================================================

export type SpaceWebSocketEvents = {
  // Server -> Client
  "source.indexing": {
    sourceId: string;
    spaceId: string;
    status: IndexingStatus;
    progress: number; // 0-100
    chunksIndexed: number;
    error?: string;
  };

  "task.run.started": {
    taskId: string;
    runId: string;
    startedAt: Date;
  };

  "task.run.progress": {
    taskId: string;
    runId: string;
    step: string;
    progress: number;
  };

  "task.run.completed": {
    taskId: string;
    runId: string;
    result: TaskResult;
  };

  "member.joined": {
    spaceId: string;
    member: Member;
  };

  "thread.updated": {
    spaceId: string;
    threadId: string;
    updateType: "created" | "linked" | "unlinked" | "deleted";
    preview?: Thread["lastMessagePreview"];
  };

  // Client -> Server
  "subscribe.space": { spaceId: string };
  "unsubscribe.space": { spaceId: string };
};
