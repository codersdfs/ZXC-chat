import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Space,
  SpaceFile,
  SpaceTask,
  SpaceMember,
  SpaceVisibility,
  ModelProvider,
} from "../../shared/types";

interface SpaceState {
  // Current space
  currentSpaceId: string | null;

  // All spaces
  spaces: Space[];

  // UI state
  isCreatingSpace: boolean;
  isEditingSpace: boolean;
  spaceSettingsOpen: boolean;
  filesPanelOpen: boolean;
  tasksPanelOpen: boolean;
  spacesViewOpen: boolean;

  // Actions
  setCurrentSpace: (spaceId: string | null) => void;
  setSpacesViewOpen: (open: boolean) => void;

  // Space CRUD
  createSpace: (
    name: string,
    options?: {
      description?: string;
      icon?: string;
      color?: string;
      visibility?: SpaceVisibility;
      customInstructions?: string;
      defaultModel?: string;
      defaultProvider?: ModelProvider;
    }
  ) => string;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  deleteSpace: (spaceId: string) => void;

  // Files
  addFile: (
    spaceId: string,
    file: Omit<SpaceFile, "id" | "spaceId" | "uploadedAt">
  ) => string;
  removeFile: (spaceId: string, fileId: string) => void;
  updateFile: (spaceId: string, fileId: string, updates: Partial<SpaceFile>) => void;
  getSpaceFiles: (spaceId: string) => SpaceFile[];

  // Tasks
  addTask: (
    spaceId: string,
    task: Omit<SpaceTask, "id" | "spaceId" | "createdAt" | "updatedAt" | "lastRunAt">
  ) => string;
  removeTask: (spaceId: string, taskId: string) => void;
  updateTask: (spaceId: string, taskId: string, updates: Partial<SpaceTask>) => void;
  runTask: (spaceId: string, taskId: string) => void;
  getSpaceTasks: (spaceId: string) => SpaceTask[];

  // Members
  addMember: (spaceId: string, member: Omit<SpaceMember, "id" | "spaceId" | "joinedAt">) => void;
  removeMember: (spaceId: string, userId: string) => void;
  updateMemberRole: (
    spaceId: string,
    userId: string,
    role: SpaceMember["role"]
  ) => void;

  // Conversations
  linkConversation: (spaceId: string, conversationId: string) => void;
  unlinkConversation: (spaceId: string, conversationId: string) => void;
  getSpaceConversations: (spaceId: string) => string[];

  // UI actions
  setIsCreatingSpace: (creating: boolean) => void;
  setIsEditingSpace: (editing: boolean) => void;
  setSpaceSettingsOpen: (open: boolean) => void;
  setFilesPanelOpen: (open: boolean) => void;
  setTasksPanelOpen: (open: boolean) => void;

  // Search within space
  searchSpaceContent: (
    spaceId: string,
    query: string
  ) => { files: SpaceFile[]; conversations: string[] };

  // Derived state
  currentSpace: Space | null;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSpaceId: null,
      spaces: [],
      isCreatingSpace: false,
      isEditingSpace: false,
      spaceSettingsOpen: false,
      filesPanelOpen: false,
      tasksPanelOpen: false,
      spacesViewOpen: false,

      // Actions
      setCurrentSpace: (spaceId) => {
        set({ currentSpaceId: spaceId });
      },

      createSpace: (name, options = {}) => {
        const id = Date.now().toString();
        const now = new Date();
        const newSpace: Space = {
          id,
          name,
          description: options.description,
          icon: options.icon || "📁",
          color: options.color || "#6366F1",
          visibility: options.visibility || "private",
          customInstructions: options.customInstructions,
          defaultModel: options.defaultModel,
          defaultProvider: options.defaultProvider,
          searchSpaceFirst: true,
          includeFilesInContext: true,
          conversationIds: [],
          files: [],
          tasks: [],
          members: [
            {
              id: Date.now().toString(),
              spaceId: id,
              userId: "current-user",
              role: "owner",
              joinedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
          createdBy: "current-user",
        };

        set((state) => ({
          spaces: [newSpace, ...state.spaces],
          currentSpaceId: id,
          isCreatingSpace: false,
        }));

        return id;
      },

      updateSpace: (spaceId, updates) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? { ...space, ...updates, updatedAt: new Date() }
              : space
          ),
        }));
      },

      deleteSpace: (spaceId) => {
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== spaceId),
          currentSpaceId:
            state.currentSpaceId === spaceId ? null : state.currentSpaceId,
        }));
      },

      // Files
      addFile: (spaceId, file) => {
        const id = Date.now().toString();
        const newFile: SpaceFile = {
          ...file,
          id,
          spaceId,
          uploadedAt: new Date(),
        };

        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? { ...space, files: [...space.files, newFile], updatedAt: new Date() }
              : space
          ),
        }));

        return id;
      },

      removeFile: (spaceId, fileId) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  files: space.files.filter((f) => f.id !== fileId),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      updateFile: (spaceId, fileId, updates) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  files: space.files.map((f) =>
                    f.id === fileId ? { ...f, ...updates } : f
                  ),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      getSpaceFiles: (spaceId) => {
        const space = get().spaces.find((s) => s.id === spaceId);
        return space?.files || [];
      },

      // Tasks
      addTask: (spaceId, task) => {
        const id = Date.now().toString();
        const now = new Date();
        const newTask: SpaceTask = {
          ...task,
          id,
          spaceId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? { ...space, tasks: [...space.tasks, newTask], updatedAt: new Date() }
              : space
          ),
        }));

        return id;
      },

      removeTask: (spaceId, taskId) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  tasks: space.tasks.filter((t) => t.id !== taskId),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      updateTask: (spaceId, taskId, updates) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  tasks: space.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t
                  ),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      runTask: (spaceId, taskId) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  tasks: space.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          lastRunAt: new Date(),
                          nextRunAt: calculateNextRun(t.schedule),
                          updatedAt: new Date(),
                        }
                      : t
                  ),
                }
              : space
          ),
        }));
      },

      getSpaceTasks: (spaceId) => {
        const space = get().spaces.find((s) => s.id === spaceId);
        return space?.tasks || [];
      },

      // Members
      addMember: (spaceId, member) => {
        const newMember: SpaceMember = {
          ...member,
          id: Date.now().toString(),
          spaceId,
          joinedAt: new Date(),
        };

        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? { ...space, members: [...space.members, newMember], updatedAt: new Date() }
              : space
          ),
        }));
      },

      removeMember: (spaceId, userId) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  members: space.members.filter((m) => m.userId !== userId),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      updateMemberRole: (spaceId, userId, role) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  members: space.members.map((m) =>
                    m.userId === userId ? { ...m, role } : m
                  ),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      // Conversations
      linkConversation: (spaceId, conversationId) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId && !space.conversationIds.includes(conversationId)
              ? {
                  ...space,
                  conversationIds: [...space.conversationIds, conversationId],
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      unlinkConversation: (spaceId, conversationId) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === spaceId
              ? {
                  ...space,
                  conversationIds: space.conversationIds.filter(
                    (id) => id !== conversationId
                  ),
                  updatedAt: new Date(),
                }
              : space
          ),
        }));
      },

      getSpaceConversations: (spaceId) => {
        const space = get().spaces.find((s) => s.id === spaceId);
        return space?.conversationIds || [];
      },

      // UI actions
      setIsCreatingSpace: (creating) => {
        set({ isCreatingSpace: creating });
      },

      setIsEditingSpace: (editing) => {
        set({ isEditingSpace: editing });
      },

      setSpaceSettingsOpen: (open) => {
        set({ spaceSettingsOpen: open });
      },

      setFilesPanelOpen: (open) => {
        set({ filesPanelOpen: open });
      },

      setTasksPanelOpen: (open) => {
        set({ tasksPanelOpen: open });
      },

      setSpacesViewOpen: (open) => {
        set({ spacesViewOpen: open });
      },

      // Search within space
      searchSpaceContent: (spaceId, query) => {
        const space = get().spaces.find((s) => s.id === spaceId);
        if (!space) return { files: [], conversations: [] };

        const normalizedQuery = query.toLowerCase();

        const matchingFiles = space.files.filter(
          (f) =>
            f.name.toLowerCase().includes(normalizedQuery) ||
            f.content.toLowerCase().includes(normalizedQuery)
        );

        // For conversations, we'd need to search through conversation content
        // This is a simplified version
        const matchingConversations: string[] = [];

        return { files: matchingFiles, conversations: matchingConversations };
      },

      // Derived state
      get currentSpace() {
        const { currentSpaceId, spaces } = get();
        return currentSpaceId ? spaces.find((s) => s.id === currentSpaceId) || null : null;
      },
    }),
    {
      name: "space-storage",
      partialize: (state) => ({
        currentSpaceId: state.currentSpaceId,
        spaces: state.spaces,
      }),
    }
  )
);

// Helper function to calculate next run time for scheduled tasks
function calculateNextRun(
  schedule: SpaceTask["schedule"],
  from: Date = new Date()
): Date {
  const next = new Date(from);

  switch (schedule) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "once":
    default:
      // For one-time tasks, don't schedule again
      next.setFullYear(next.getFullYear() + 100);
      break;
  }

  return next;
}
