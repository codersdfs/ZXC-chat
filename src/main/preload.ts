import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // New unified AI API (supports both Ollama and OpenRouter)
  getModels: (settings?: any) => ipcRenderer.invoke("ai:getModels", settings),
  chat: (
    messages: Array<{ role: string; content: string }>,
    settings: any,
  ) => ipcRenderer.invoke("ai:chat", messages, settings),
  chatStream: (
    messages: Array<{ role: string; content: string }>,
    settings: any,
    onChunk: (chunk: string) => void,
  ) => {
    // Clean up any existing listeners
    ipcRenderer.removeAllListeners("ai:chatStreamChunk");
    ipcRenderer.removeAllListeners("ai:chatStreamComplete");
    ipcRenderer.removeAllListeners("ai:chatStreamError");

    const chunkHandler = (_: any, chunk: string) => onChunk(chunk);
    const completeHandler = () => {
      ipcRenderer.removeAllListeners("ai:chatStreamChunk");
      ipcRenderer.removeAllListeners("ai:chatStreamComplete");
      ipcRenderer.removeAllListeners("ai:chatStreamError");
    };
    const errorHandler = (_: any, error: string) => {
      ipcRenderer.removeAllListeners("ai:chatStreamChunk");
      ipcRenderer.removeAllListeners("ai:chatStreamComplete");
      ipcRenderer.removeAllListeners("ai:chatStreamError");
      throw new Error(error);
    };

    ipcRenderer.on("ai:chatStreamChunk", chunkHandler);
    ipcRenderer.once("ai:chatStreamComplete", completeHandler);
    ipcRenderer.once("ai:chatStreamError", errorHandler);

    return ipcRenderer.invoke("ai:chatStream", messages, settings);
  },

  // Legacy Ollama-only API (backward compatibility)
  ollamaGetModels: () => ipcRenderer.invoke("ollama:getModels"),
  ollamaChat: (model: string, messages: Array<{ role: string; content: string }>) =>
    ipcRenderer.invoke("ollama:chat", model, messages),
  ollamaChatStream: (
    model: string,
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    settings?: any,
  ) => {
    ipcRenderer.removeAllListeners("ollama:chatStreamChunk");
    ipcRenderer.removeAllListeners("ollama:chatStreamComplete");
    ipcRenderer.removeAllListeners("ollama:chatStreamError");

    const chunkHandler = (_: any, chunk: string) => onChunk(chunk);
    const completeHandler = () => {
      ipcRenderer.removeAllListeners("ollama:chatStreamChunk");
      ipcRenderer.removeAllListeners("ollama:chatStreamComplete");
      ipcRenderer.removeAllListeners("ollama:chatStreamError");
    };
    const errorHandler = (_: any, error: string) => {
      ipcRenderer.removeAllListeners("ollama:chatStreamChunk");
      ipcRenderer.removeAllListeners("ollama:chatStreamComplete");
      ipcRenderer.removeAllListeners("ollama:chatStreamError");
      throw new Error(error);
    };

    ipcRenderer.on("ollama:chatStreamChunk", chunkHandler);
    ipcRenderer.once("ollama:chatStreamComplete", completeHandler);
    ipcRenderer.once("ollama:chatStreamError", errorHandler);

    return ipcRenderer.invoke("ollama:chatStream", model, messages, settings);
  },
  ollamaGenerate: (model: string, prompt: string) =>
    ipcRenderer.invoke("ollama:generate", model, prompt),
});
