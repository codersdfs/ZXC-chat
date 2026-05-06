import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSpaceStore } from "../store/useSpaceStore";
import {
  fetchWebSearchWithRanking,
  determineSearchSources,
} from "../../shared/webSearch";
import type { Attachment } from "../../shared/types";

// Import Electron IPC types if available
declare global {
  interface Window {
    electronAPI?: {
      getModels: (settings?: any) => Promise<any[]>;
      chat: (
        messages: Array<{ role: string; content: string }>,
        settings: any,
      ) => Promise<string>;
      chatStream: (
        messages: Array<{ role: string; content: string }>,
        settings: any,
        onChunk: (chunk: string) => void,
      ) => Promise<void>;
      // Legacy Ollama-only API
      ollamaGetModels: () => Promise<any[]>;
      ollamaChat: (model: string, messages: any[]) => Promise<string>;
      ollamaChatStream: (
        model: string,
        messages: any[],
        onData: (chunk: string) => void,
        settings?: any,
      ) => Promise<void>;
      ollamaGenerate: (model: string, prompt: string) => Promise<string>;
    };
  }
}

export const useOllama = () => {
  const {
    settings,
    addMessage,
    updateMessage,
    updateMessageCitations,
    setIsLoading,
    setIsStreaming,
    setError,
    setAvailableModels,
    setIsLoadingModels,
    setSearchStatus,
    setActiveMessageId,
  } = useChatStore();
  const { currentSpace } = useSpaceStore();

  // Load available models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Reload models when provider changes
  useEffect(() => {
    loadModels();
  }, [settings.modelProvider]);

  const loadModels = async () => {
    try {
      setIsLoadingModels(true);

      if (window.electronAPI) {
        // Use Electron IPC with current settings to get all models
        const models = await window.electronAPI.getModels(settings);
        setAvailableModels(models);
      } else {
        // Fallback: fetch from Ollama only (browser mode)
        console.log(
          "Electron API not available, fetching from Ollama directly...",
        );
        const response = await fetch("http://localhost:11434/api/tags");
        if (response.ok) {
          const data = await response.json();
          const models = data.models.map((model: any) => ({
            id: model.name,
            name: model.name,
            provider: "ollama",
            size: model.size || 0,
            modified: model.modified_at || model.modified || "",
          }));
          setAvailableModels(models);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      setError(null);
    } catch (error) {
      console.error("Failed to load models:", error);
      setError(
        "Failed to load models. Make sure Ollama is running on localhost:11434 or check your OpenRouter API key.",
      );
    } finally {
      setIsLoadingModels(false);
    }
  };

  const sendMessage = async (content: string, attachments?: Attachment[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Build attachment context
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
      attachmentContext = attachments
        .map((att) => {
          if (att.type === "code") {
            return `\n\n=== File: ${att.name} (${att.language}) ===\n\`\`\`${att.language}\n${att.content}\n\`\`\``;
          } else if (att.type === "structure") {
            return `\n\n=== ${att.name} ===\n${att.content}`;
          } else {
            return `\n\n=== ${att.name} ===\n${att.content}`;
          }
        })
        .join("\n");
    }

    // Build space context (custom instructions + files)
    let spaceContext = "";
    if (currentSpace) {
      // Add custom instructions if present
      if (currentSpace.customInstructions) {
        spaceContext += `\n\n=== Space Instructions ===\n${currentSpace.customInstructions}\n`;
      }

      // Add file content if enabled and files exist
      if (currentSpace.includeFilesInContext && currentSpace.files.length > 0) {
        const relevantFiles = currentSpace.files.slice(0, 5); // Limit to 5 files
        const filesContent = relevantFiles
          .map(
            (file) =>
              `\n\n=== File: ${file.name} ===\n${file.content.slice(0, 5000)}${file.content.length > 5000 ? "\n... (truncated)" : ""}`
          )
          .join("\n");
        spaceContext += `\n\n=== Space Files ===${filesContent}\n`;
      }
    }

    // Add user message immediately
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      role: "user" as const,
      content: (content.trim() + attachmentContext + spaceContext).trim(),
      timestamp: new Date(),
      attachments,
    };

    addMessage(userMessage);

    // Add assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant" as const,
      content: "",
      timestamp: new Date(),
    };

    addMessage(assistantMessage);

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    // Start web search in background if enabled
    let searchContext = "";
    const abortController = new AbortController();

    if (settings.webSearchEnabled) {
      setSearchStatus(userMessageId, "searching");

      // Create a promise that can be aborted
      const searchPromise = (async () => {
        try {
          // Check if aborted before starting
          if (abortController.signal.aborted) {
            return { results: [], citations: [], sources: [], context: "" };
          }

          const searchSources = determineSearchSources(
            content,
            settings.searchApiKeys || {},
          );

          const { results, citations, sources, context } =
            await fetchWebSearchWithRanking(
              content,
              searchSources,
              settings.webSearchResults ?? 3,
              settings.searchApiKeys || {},
            );

          // Check if aborted after search completes
          if (abortController.signal.aborted) {
            return { results: [], citations: [], sources: [], context: "" };
          }

          // Update message with citations and sources only for this message
          updateMessageCitations(userMessageId, citations, sources);
          setSearchStatus(userMessageId, "completed");
          setActiveMessageId(userMessageId);
          return { results, citations, sources, context };
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.warn("Enhanced web search failed:", error);
            setSearchStatus(userMessageId, "error");
          }
          return { results: [], citations: [], sources: [], context: "" };
        }
      })();

      // Wait for search to complete
      const searchData = await searchPromise;
      searchContext = searchData.context;
    }

    try {
      // Build message history with search context as system message if available
      // Keep all user messages and assistant replies, but ignore empty assistant placeholders.
      const messageHistory = useChatStore
        .getState()
        .messages.filter((msg) => msg.role !== "assistant" || msg.content);

      const messages = [] as { role: string; content: string }[];

      // Add space instructions as system message if available
      if (currentSpace?.customInstructions) {
        messages.push({
          role: "system",
          content: `You are operating in the "${currentSpace.name}" space. ${currentSpace.customInstructions}`,
        });
      }

      // Add search context as system message if available
      if (searchContext) {
        messages.push({ role: "system", content: searchContext });
      }

      // Add user and assistant message history
      messages.push(
        ...messageHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      );

      let fullResponse = "";

      if (window.electronAPI) {
        // Use Electron IPC with unified AI API
        try {
          await window.electronAPI.chatStream(
            messages,
            settings,
            (chunk) => {
              fullResponse += chunk;
              updateMessage(assistantMessage.id, fullResponse);
            },
          );
        } catch (error) {
          console.error("Error in chatStream:", error);
          throw error;
        }
      } else {
        // Fallback: fetch directly from Ollama API (browser mode)
        const response = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: settings.selectedModel,
            messages,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                fullResponse += data.message.content;
                updateMessage(assistantMessage.id, fullResponse);
              }
            } catch (e) {
              console.error("Error parsing JSON:", e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message",
      );
      updateMessage(
        assistantMessage.id,
        "Sorry, I encountered an error. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const regenerateResponse = async () => {
    const { messages } = useChatStore.getState();
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop();

    if (!lastUserMessage) return;

    // Remove the last assistant message
    const filteredMessages = messages.filter(
      (msg, index) =>
        !(msg.role === "assistant" && index === messages.length - 1),
    );

    useChatStore.setState({ messages: filteredMessages });

    // Send the last user message again
    await sendMessage(lastUserMessage.content);
  };

  const clearConversation = () => {
    useChatStore.getState().clearMessages();
    setError(null);
  };

  return {
    sendMessage,
    regenerateResponse,
    clearConversation,
    loadModels,
  };
};
