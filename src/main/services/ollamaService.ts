import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface OllamaModel {
  name: string;
  size: number;
  modified: string;
  details?: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
}

export class OllamaService {
  private baseUrl: string = "http://localhost:11434";

  constructor() {
    // Removed axios client
  }

  async getModels(): Promise<OllamaModel[]> {
    try {
      // Try API first
      console.log("Trying Ollama API...");
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      });

      if (response.ok) {
        const data: any = await response.json();
        console.log("API response:", data);
        const models = data.models.map((model: any) => ({
          name: model.name,
          size: model.size || 0,
          modified: model.modified_at || model.modified || "",
          details: model.details || "",
        })) as OllamaModel[];
        console.log("Parsed models from API:", models);
        return models;
      } else {
        console.warn("API response not ok:", response.status);
      }
    } catch (apiError) {
      console.warn("API failed, falling back to CLI:", apiError);
    }

    // Fallback to CLI
    try {
      console.log("Trying Ollama CLI...");
      const { stdout } = await execAsync("ollama list");
      console.log("CLI output:", stdout);
      const lines = stdout.trim().split("\n").slice(1); // Skip header
      console.log("CLI lines:", lines);

      const models = lines
        .map((line: string) => {
          const parts = line.trim().split(/\s+/);
          console.log("Line parts:", parts);
          if (parts.length >= 4) {
            let size = 0;
            let modifiedStartIndex = 3;
            if (parts[2] !== "-") {
              const sizeStr = parts[2];
              if (parts[3] === "GB") {
                size = parseFloat(sizeStr) * 1024 * 1024 * 1024; // Convert GB to bytes
                modifiedStartIndex = 4;
              } else {
                size = parseInt(sizeStr) || 0;
              }
            }
            return {
              name: parts[0],
              size,
              modified: parts.slice(modifiedStartIndex).join(" "),
              details: "",
            } as OllamaModel;
          }
          return null;
        })
        .filter((model): model is OllamaModel => model !== null);
      console.log("Parsed models from CLI:", models);
      return models;
    } catch (cliError) {
      console.error("Error getting models from CLI:", cliError);
      throw new Error(
        "Failed to get Ollama models. Make sure Ollama is installed and running.",
      );
    }
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.message.content;
    } catch (error) {
      console.error("Error in chat:", error);
      throw new Error(`Failed to chat with model ${model}: ${error}`);
    }
  }

  async generate(model: string, prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.response;
    } catch (error) {
      console.error("Error generating:", error);
      throw new Error(`Failed to generate with model ${model}: ${error}`);
    }
  }

  async generateStream(
    model: string,
    prompt: string,
    onData: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
            if (line.trim() === "") continue;

            try {
              const data = JSON.parse(line);
              if (data.response) {
                onData(data.response);
              }
              if (data.done) {
                onComplete();
                break;
              }
            } catch (e) {
              console.error("Error parsing JSON:", e, line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async chatStream(
    model: string,
    messages: Array<{ role: string; content: string }>,
    onData: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    settings?: any,
  ): Promise<void> {
    try {
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

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
            if (line.trim() === "") continue;

            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                onData(data.message.content);
              }
              if (data.done) {
                onComplete();
                break;
              }
            } catch (e) {
              console.error("Error parsing JSON:", e, line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
