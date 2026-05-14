import type { OpenRouterModel } from "./types";

/** OpenRouter API base URL */
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

/** List of free models on OpenRouter (as of April 2026) */
export const FREE_OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    context_length: 128000,
    description: "Google's Gemma 3 27B - Free tier",
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1 24B",
    context_length: 128000,
    description: "Mistral AI's Small 3.1 24B - Free tier",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3",
    context_length: 128000,
    description: "DeepSeek V3 - Free tier",
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    context_length: 128000,
    description: "DeepSeek R1 reasoning model - Free tier",
  },
  {
    id: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
    name: "Llama 3.1 Nemotron Nano 8B",
    context_length: 128000,
    description: "NVIDIA's Llama 3.1 Nemotron Nano - Free tier",
  },
  {
    id: "microsoft/phi-4:free",
    name: "Phi-4",
    context_length: 128000,
    description: "Microsoft's Phi-4 - Free tier",
  },
  {
    id: "qwen/qwen-2.5-7b-instruct:free",
    name: "Qwen 2.5 7B",
    context_length: 32768,
    description: "Alibaba's Qwen 2.5 7B - Free tier",
  },
  {
    id: "qwen/qwen-2.5-72b-instruct:free",
    name: "Qwen 2.5 72B",
    context_length: 32768,
    description: "Alibaba's Qwen 2.5 72B - Free tier",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    context_length: 128000,
    description: "Meta's Llama 3.3 70B - Free tier",
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B",
    context_length: 128000,
    description: "Meta's Llama 3.2 3B - Free tier",
  },
  {
    id: "google/gemma-2-9b-it:free",
    name: "Gemma 2 9B",
    context_length: 8192,
    description: "Google's Gemma 2 9B - Free tier",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B",
    context_length: 32768,
    description: "Mistral AI's 7B - Free tier",
  },
  {
    id: "openchat/openchat-7b:free",
    name: "OpenChat 7B",
    context_length: 8192,
    description: "OpenChat 7B - Free tier",
  },
  {
    id: "teknium/openhermes-2.5-mistral-7b:free",
    name: "OpenHermes 2.5 Mistral 7B",
    context_length: 8192,
    description: "OpenHermes 2.5 - Free tier",
  },
  {
    id: "sophosympatheia/rogue-rose-103b-v0.2:free",
    name: "Rogue Rose 103B",
    context_length: 8192,
    description: "Rogue Rose 103B - Free tier",
  },
];

/**
 * Fetches available free models from OpenRouter.
 * Requires an OpenRouter API key.
 */
export async function fetchOpenRouterModels(
  apiKey: string,
): Promise<OpenRouterModel[]> {
  const response = await fetch(`${OPENROUTER_API_URL}/models`, {
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

  // Filter to only free models (pricing is "0" or undefined)
  const freeModels = models.filter((model) => {
    const isFree =
      !model.pricing ||
      model.pricing.prompt === "0" || Number(model.pricing.prompt) === 0 ||
      model.pricing.completion === "0" || Number(model.pricing.completion) === 0;
    return isFree;
  });

  return freeModels.map((model) => ({
    id: model.id,
    name: model.name || model.id,
    context_length: model.context_length,
    pricing: model.pricing,
    description: model.description,
  }));
}

/**
 * Streams a chat completion from OpenRouter.
 * Uses the chat completions endpoint with streaming enabled.
 */
export async function streamOpenRouterChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  apiKey: string,
  signal?: AbortSignal,
  settings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  },
): Promise<void> {
  const requestBody: any = {
    model,
    messages,
    stream: true,
  };

  // Add optional parameters
  if (settings) {
    requestBody.temperature = settings.temperature;
    requestBody.max_tokens = settings.maxTokens;
    if (settings.topP !== undefined) requestBody.top_p = settings.topP;
    if (settings.topK !== undefined) requestBody.top_k = settings.topK;
  }

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://github.com/your-repo", // Optional: identify your app
      "X-Title": "AI Chat Desktop", // Optional: app name
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter chat failed (${response.status}): ${errText || response.statusText}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
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
        if (!line.trim() || !line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming chat completion with OpenRouter.
 */
export async function chatOpenRouter(
  model: string,
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  settings?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  },
): Promise<string> {
  const requestBody: any = {
    model,
    messages,
    stream: false,
  };

  if (settings) {
    requestBody.temperature = settings.temperature;
    requestBody.max_tokens = settings.maxTokens;
    if (settings.topP !== undefined) requestBody.top_p = settings.topP;
    if (settings.topK !== undefined) requestBody.top_k = settings.topK;
  }

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter chat failed (${response.status}): ${errText || response.statusText}`,
    );
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
