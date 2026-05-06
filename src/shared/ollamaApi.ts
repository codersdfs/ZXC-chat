import type { OllamaModel } from "./types";

/** Default Ollama HTTP API base (local). */
export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

/**
 * Fetches installed models from Ollama via `GET /api/tags`.
 * Works from the renderer when Ollama is running locally (same machine).
 */
export async function fetchOllamaModels(
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
): Promise<OllamaModel[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/tags`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} (${url})`);
  }
  const data = (await response.json()) as {
    models?: Array<{
      name: string;
      size?: number;
      modified_at?: string;
      details?: unknown;
    }>;
  };
  const models = data.models ?? [];
  return models.map((m) => ({
    name: m.name,
    size: m.size ?? 0,
    modified: m.modified_at ?? "",
    details: m.details !== undefined ? JSON.stringify(m.details) : undefined,
  }));
}

export type OllamaChatMessage = { role: string; content: string };

/**
 * Streams a chat completion from Ollama (`POST /api/chat` with `stream: true`).
 * Each parsed chunk calls `onChunk` with incremental `message.content` text.
 */
export async function streamOllamaChat(
  model: string,
  messages: OllamaChatMessage[],
  onChunk: (text: string) => void,
  baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
  signal?: AbortSignal,
  settings?: {
    deepThinkEnabled?: boolean;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    repeatPenalty?: number;
  },
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;
  const requestBody: any = {
    model,
    messages,
    stream: true,
  };

  // Add deep thinking parameters
  if (settings?.deepThinkEnabled) {
    requestBody.options = {
      ...requestBody.options,
      temperature: settings.temperature ?? 0.3, // Lower temp for reasoning
      num_ctx: settings.maxTokens ?? 4096, // Larger context
      num_predict: settings.maxTokens ?? 2048, // More tokens for reasoning
      top_k: settings.topK ?? 20, // More focused sampling
      top_p: settings.topP ?? 0.8, // More focused sampling
      repeat_penalty: settings.repeatPenalty ?? 1.0, // Less repetition
    };
  } else if (settings) {
    // Apply regular settings if provided
    requestBody.options = {
      temperature: settings.temperature,
      num_ctx: settings.maxTokens,
      num_predict: settings.maxTokens,
      top_k: settings.topK,
      top_p: settings.topP,
      repeat_penalty: settings.repeatPenalty,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Ollama chat failed (${response.status}): ${errText || response.statusText}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body from Ollama");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line) as {
            message?: { content?: string };
            done?: boolean;
          };
          if (data.message?.content) {
            onChunk(data.message.content);
          }
        } catch {
          // skip malformed line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
