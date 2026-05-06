import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ChatMessage,
  ChatConversation,
  ChatSettings,
  Citation,
  Source,
  ModelProvider,
  ModelInfo,
} from "../../shared/types";
import { decryptSearchApiKeys } from "../../shared/encryption";

interface ChatState {
  // Current conversation
  currentConversationId: string | null;
  messages: ChatMessage[];

  // Conversations list
  conversations: ChatConversation[];

  // Settings
  settings: ChatSettings;
  availableModels: ModelInfo[];

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  isLoadingModels: boolean;
  textSize: "small" | "medium" | "large";
  highContrast: boolean;

  // Search state
  searchStatus: Record<string, "idle" | "searching" | "completed" | "error">;
  activeMessageId: string | null;

  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, content: string) => void;
  updateMessageCitations: (
    messageId: string,
    citations: Citation[],
    sources: Source[],
  ) => void;
  clearMessages: () => void;

  setConversations: (conversations: ChatConversation[]) => void;
  createConversation: (name: string) => string;
  deleteConversation: (conversationId: string) => void;

  setSettings: (settings: Partial<ChatSettings>) => void;
  setAvailableModels: (models: ModelInfo[]) => void;

  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setIsLoadingModels: (loading: boolean) => void;
  setSearchStatus: (
    messageId: string,
    status: "idle" | "searching" | "completed" | "error",
  ) => void;
  setActiveMessageId: (messageId: string | null) => void;
  setTextSize: (size: "small" | "medium" | "large") => void;
  setHighContrast: (enabled: boolean) => void;

  // Derived state
  currentConversation: ChatConversation | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversationId: null,
      messages: [],
      conversations: [],
      settings: {
        selectedModel: "llama2",
        modelProvider: "ollama" as ModelProvider,
        webSearchEnabled: false,
        webSearchSource: "wikipedia",
        webSearchResults: 3,
        searchApiKeys: {},
        deepThinkEnabled: false,
        temperature: 0.7,
        maxTokens: 2048,
        tone: "Balanced",
        defaultLanguage: "English",
        customStyleGuideEnabled: false,
        responseLengthPreset: "medium",
        bulletHeavyAnswers: false,
        stepByStep: false,
        includeExamples: false,
        detailLevel: "Standard",
        fontSizePreset: "Medium",
        lineSpacing: "Normal",
        simplifiedLanguageMode: false,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
      },
      availableModels: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      isLoadingModels: false,
      searchStatus: {},
      activeMessageId: null,
      textSize: "medium",
      highContrast: false,

      // Actions
      setCurrentConversation: (conversationId) => {
        if (conversationId === null) {
          set({ currentConversationId: null, messages: [] });
          return;
        }

        const conversation = get().conversations.find(
          (c) => c.id === conversationId,
        );
        if (conversation) {
          set({
            currentConversationId: conversationId,
            messages: [...conversation.messages],
          });
        }
      },

      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));

        // Auto-save to current conversation if exists
        const { currentConversationId, conversations } = get();
        if (currentConversationId) {
          const updatedConversations = conversations.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date(),
                }
              : conv,
          );
          set({ conversations: updatedConversations });
        }
      },

      updateMessage: (messageId, content) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg,
          ),
        }));

        // Update in conversations
        const { currentConversationId, conversations } = get();
        if (currentConversationId) {
          const updatedConversations = conversations.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg,
                  ),
                  updatedAt: new Date(),
                }
              : conv,
          );
          set({ conversations: updatedConversations });
        }
      },

      updateMessageCitations: (messageId, citations, sources) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, citations, sources } : msg,
          ),
        }));

        // Update in conversations
        const { currentConversationId, conversations } = get();
        if (currentConversationId) {
          const updatedConversations = conversations.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, citations, sources } : msg,
                  ),
                  updatedAt: new Date(),
                }
              : conv,
          );
          set({ conversations: updatedConversations });
        }
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      setConversations: (conversations) => {
        set({ conversations });
      },

      createConversation: (name) => {
        const id = Date.now().toString();
        const newConversation: ChatConversation = {
          id,
          name,
          messages: [],
          settings: get().settings,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
          messages: [],
        }));

        return id;
      },

      deleteConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter(
            (c) => c.id !== conversationId,
          ),
          currentConversationId:
            state.currentConversationId === conversationId
              ? null
              : state.currentConversationId,
        }));
      },

      setSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      setAvailableModels: (models) => {
        set({ availableModels: models });
      },

      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      setIsStreaming: (streaming) => {
        set({ isStreaming: streaming });
      },

      setError: (error) => {
        set({ error });
      },

      setIsLoadingModels: (loading) => {
        set({ isLoadingModels: loading });
      },

      setSearchStatus: (messageId, status) => {
        set((state) => ({
          searchStatus: { ...state.searchStatus, [messageId]: status },
        }));
      },

      setActiveMessageId: (messageId) => {
        set({ activeMessageId: messageId });
      },

      setTextSize: (size) => {
        set({ textSize: size });
      },

      setHighContrast: (enabled) => {
        set({ highContrast: enabled });
      },

      // Derived state
      get currentConversation() {
        const { currentConversationId, conversations } = get();
        return currentConversationId
          ? conversations.find((c) => c.id === currentConversationId) || null
          : null;
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        currentConversationId: state.currentConversationId,
        conversations: state.conversations,
        settings: state.settings,
        availableModels: state.availableModels,
        textSize: state.textSize,
        highContrast: state.highContrast,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.settings?.searchApiKeys) {
          state.settings.searchApiKeys = decryptSearchApiKeys(
            state.settings.searchApiKeys,
          );
        }
        // Load messages from the persisted currentConversation
        if (state && state.currentConversationId) {
          const conversation = state.conversations.find(
            (c) => c.id === state.currentConversationId,
          );
          if (conversation) {
            state.messages = [...conversation.messages];
          }
        }
      },
    },
  ),
);
