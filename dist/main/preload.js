import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
    getModels: () => ipcRenderer.invoke("ollama:getModels"),
    chat: (model, messages) => ipcRenderer.invoke("ollama:chat", model, messages),
    chatStream: (model, messages, onChunk, settings) => {
        // First, clean up any existing listeners to prevent duplicate callbacks
        ipcRenderer.removeAllListeners("ollama:chatStreamChunk");
        ipcRenderer.removeAllListeners("ollama:chatStreamComplete");
        ipcRenderer.removeAllListeners("ollama:chatStreamError");
        // Set up event listeners for streaming
        const chunkHandler = (_, chunk) => onChunk(chunk);
        const completeHandler = () => {
            ipcRenderer.removeAllListeners("ollama:chatStreamChunk");
            ipcRenderer.removeAllListeners("ollama:chatStreamComplete");
            ipcRenderer.removeAllListeners("ollama:chatStreamError");
        };
        const errorHandler = (_, error) => {
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
    generate: (model, prompt) => ipcRenderer.invoke("ollama:generate", model, prompt),
});
//# sourceMappingURL=preload.js.map