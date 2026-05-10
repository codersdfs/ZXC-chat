/**
 * Type definitions for Spaces and Chat functionality
 */

/** Represents a Space with custom AI instructions */
export interface Space {
  id: string;
  name: string;
  customInstructions: string;
  lastActive: number; // timestamp
  createdAt: number; // timestamp
  color?: string; // optional custom color
}

/** Represents a persona/AI personality */
export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

/** Represents a chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  spaceId?: string;
}

/** Represents a chat tab/window */
export interface ChatTab {
  id: string;
  title: string;
  spaceId: string;
  messages: ChatMessage[];
  createdAt: number;
  isActive: boolean;
}

/** Represents workflow category */
export interface WorkflowCategory {
  id: string;
  name: string;
  icon: string;
  spaceIds: string[];
}

/** Format time difference to human-readable string */
export const formatLastActive = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/** Generate a consistent color based on an ID */
export const getColor = (id: string): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
    '#84cc16', '#f43f5e', '#14b8a6', '#6366f1'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/** Generate a unique ID */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};