export type AttachmentType =
  | "file"
  | "code"
  | "structure"
  | "note"
  | "clipboard";

export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  content: string;
  language?: string;
  size?: number;
}

export interface Source {
  id: string;
  type: "web" | "document" | "knowledge";
  title: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface Citation {
  id: string;
  text: string; // The cited text
  source: Source; // Reference to source
  position: number[]; // Character positions in content [start, end]
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  citations?: Citation[];
  sources?: Source[];
}

export interface OllamaModel {
  name: string;
  size: number;
  modified: string;
  details?: string;
}

export type ModelProvider = "ollama" | "openrouter";

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  description?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: "ollama" | "openrouter";
  size?: number;
  modified?: string;
  context_length?: number;
  description?: string;
}

export interface ChatSettings {
  selectedModel: string;
  modelProvider: ModelProvider;
  /** When true, fetch brief web context before sending to the model. */
  webSearchEnabled?: boolean;
  /** Search source for web context (wikipedia, google, duckduckgo, bing) */
  webSearchSource?: "wikipedia" | "google" | "duckduckgo" | "bing";
  /** Number of search results to include in context (1-5) */
  webSearchResults?: number;
  /** API keys for search providers and OpenRouter */
  searchApiKeys?: {
    google?: {
      apiKey: string;
      cx: string;
    };
    bing?: string;
    openRouter?: string;
  };
  /** When true, enables deeper reasoning and analysis for complex questions */
  deepThinkEnabled?: boolean;
  temperature?: number;
  maxTokens?: number;
  tone?: "Balanced" | "Formal" | "Casual" | "Enthusiastic" | "Technical";
  defaultLanguage?: string;
  customStyleGuideEnabled?: boolean;
  responseLengthPreset?: "short" | "medium" | "long" | "very-long";
  bulletHeavyAnswers?: boolean;
  stepByStep?: boolean;
  includeExamples?: boolean;
  detailLevel?: "Concise" | "Standard" | "In-depth";
  fontSizePreset?: "Small" | "Medium" | "Large" | "Extra Large";
  lineSpacing?: "Normal" | "Wide" | "Extra Wide";
  simplifiedLanguageMode?: boolean;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
}

export interface SearchResult {
  title: string;
  url?: string;
  snippet: string;
  source: "wikipedia" | "google" | "duckduckgo" | "bing";
  score?: number; // Relevance score for ranking
  metadata?: Record<string, any>;
}

export interface ChatConversation {
  id: string;
  name: string;
  messages: ChatMessage[];
  settings: ChatSettings;
  spaceId?: string; // Optional: associated space
  createdAt: Date;
  updatedAt: Date;
}

// Space types for workspace organization
export type SpaceVisibility = "private" | "shared" | "public";

export interface SpaceFile {
  id: string;
  name: string;
  type: string; // mime type or extension
  content: string; // file content as text or base64
  size: number;
  spaceId: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface SpaceTask {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  prompt: string; // The AI prompt to run
  schedule: "once" | "hourly" | "daily" | "weekly" | "monthly";
  nextRunAt: Date;
  lastRunAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpaceMember {
  id: string;
  spaceId: string;
  userId: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: Date;
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  icon?: string; // emoji or icon name
  color?: string; // hex color for space theming
  visibility: SpaceVisibility;
  // Custom instructions for this space
  customInstructions?: string;
  // Per-space model settings
  defaultModel?: string;
  defaultProvider?: ModelProvider;
  // Context search settings
  searchSpaceFirst: boolean; // Search space materials before web
  includeFilesInContext: boolean; // Include files in chat context
  // Relationships
  conversationIds: string[]; // Linked conversations
  files: SpaceFile[];
  tasks: SpaceTask[];
  members: SpaceMember[];
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
