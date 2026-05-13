import type { ChatMessage, ChatSettings, OpenRouterModel, ModelInfo } from "../../shared/types";
import {
  streamOllamaChat,
  chatOpenRouter,
  streamOpenRouterChat,
  FREE_OPENROUTER_MODELS,
} from "../../shared/openrouterApi";

export interface ModelInfo {
  id: string;
  name: string;
  provider: "ollama" | "openrouter";
  size?: number;
  modified?: string;
  context_length?: number;
  description?: string;
}

export class AIService {
  private openRouterApiKey: string = "";

  setOpenRouterApiKey(apiKey: string) {
    this.openRouterApiKey = apiKey;
  }

  getOpenRouterApiKey(): string {
    return this.openRouterApiKey;
  }

  /**
   * Get all available models from both Ollama and OpenRouter.
   * Returns combined list with provider info.
   */
  async getAllModels(settings: ChatSettings): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];

    // Get Ollama models
    try {
      const ollamaModels = await this.getOllamaModels();
      models.push(
        ...ollamaModels.map((m) => ({
          id: m.name,
          name: m.name,
          provider: "ollama" as const,
          size: m.size,
          modified: m.modified,
        })),
      );
    } catch (error) {
      console.warn("Could not fetch Ollama models:", error);
    }

    // Get OpenRouter free models if API key is available
    console.log("[getAllModels] settings.searchApiKeys:", settings.searchApiKeys);
    if (settings.searchApiKeys?.openRouter) {
      console.log("[getAllModels] OpenRouter API key found, calling live API");
      try {
        const openrouterModels = await this.getOpenRouterModels(
          settings.searchApiKeys.openRouter,
        );
        models.push(
          ...openrouterModels.map((m) => ({
            id: m.id,
            name: m.name,
            provider: "openrouter" as const,
            context_length: m.context_length,
            description: m.description,
          })),
        );
      } catch (error) {
        console.warn("Could not fetch OpenRouter models:", error);
      }
    } else {
      // Add free models without API call (static list)
      models.push(
        ...FREE_OPENROUTER_MODELS.map((m) => ({
          id: m.id,
          name: m.name,
          provider: "openrouter" as const,
          context_length: m.context_length,
          description: m.description,
        })),
      );
    }

    return models;
  }

  /**
   * Fetch Ollama models via API or CLI fallback.
   */
  private async getOllamaModels(): Promise<
    Array<{ name: string; size: number; modified: string }>
  > {
    const baseUrl = "http://127.0.0.1:11434";

    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (response.ok) {
        const data: any = await response.json();
        return data.models?.map((m: any) => ({
          name: m.name,
          size: m.size || 0,
          modified: m.modified_at || m.modified || "",
        })) || [];
      }
    } catch (error) {
      console.warn("Ollama API failed, trying CLI:", error);
    }

    // CLI fallback
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      const { stdout } = await execAsync("ollama list");
      const lines = stdout.trim().split("\n").slice(1);
      return lines
        .map((line: string) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            let size = 0;
            let modifiedStartIndex = 3;
            if (parts[2] !== "-") {
              const sizeStr = parts[2];
              if (parts[3] === "GB") {
                size = parseFloat(sizeStr) * 1024 * 1024 * 1024;
                modifiedStartIndex = 4;
              } else {
                size = parseInt(sizeStr) || 0;
              }
            }
            return {
              name: parts[0],
              size,
              modified: parts.slice(modifiedStartIndex).join(" "),
            };
          }
          return null;
        })
        .filter((m): m is { name: string; size: number; modified: string } => m !== null);
    } catch (cliError) {
      console.error("CLI fallback failed:", cliError);
    }

    return [];
  }

  /**
   * Fetch OpenRouter free models.
   */
  private async getOpenRouterModels(
    apiKey: string,
  ): Promise<OpenRouterModel[]> {
    if (!apiKey) return FREE_OPENROUTER_MODELS;

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const data: any = await response.json();
    const models = data.data as Array<{
      id: string;
      name?: string;
      context_length: number;
      pricing?: { prompt?: string; completion?: string };
      description?: string;
    }>;

    console.log(`[OpenRouter] API returned ${models.length} models`);
    const filtered = models.filter(
      (m) => !m.pricing || m.pricing.prompt === "0" || m.pricing.completion === "0",
    );
    console.log(`[OpenRouter] ${filtered.length} models passed free-tier filter`);

    return filtered;
  }

  /**
   * Stream chat completion based on provider.
   */
  async streamChat(
    messages: ChatMessage[],
    settings: ChatSettings,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const provider = settings.modelProvider || "ollama";
    const model = settings.selectedModel;

    if (provider === "openrouter") {
      const apiKey = settings.searchApiKeys?.openRouter;
      if (!apiKey) {
        throw new Error("OpenRouter API key is required");
      }

      await streamOpenRouterChat(
        model,
        messages.map((m) => ({ role: m.role, content: m.content })),
        onChunk,
        apiKey,
        signal,
        {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
          topK: settings.topK,
        },
      );
    } else {
      // Ollama (default)
      await streamOllamaChat(
        model,
        messages.map((m) => ({ role: m.role, content: m.content })),
        onChunk,
        undefined,
        signal,
        {
          deepThinkEnabled: settings.deepThinkEnabled,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
          topK: settings.topK,
          repeatPenalty: settings.repeatPenalty,
        },
      );
    }
  }

  /**
   * Non-streaming chat completion.
   */
  async chat(
    messages: ChatMessage[],
    settings: ChatSettings,
  ): Promise<string> {
    const provider = settings.modelProvider || "ollama";
    const model = settings.selectedModel;

    if (provider === "openrouter") {
      const apiKey = settings.searchApiKeys?.openRouter;
      if (!apiKey) {
        throw new Error("OpenRouter API key is required");
      }

      return chatOpenRouter(
        model,
        messages.map((m) => ({ role: m.role, content: m.content })),
        apiKey,
        {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
          topK: settings.topK,
        },
      );
    } else {
      // Ollama - use existing implementation
      const baseUrl = "http://127.0.0.1:11434";
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      return data.message?.content || "";
    }
  }
}

export const aiService = new AIService();
