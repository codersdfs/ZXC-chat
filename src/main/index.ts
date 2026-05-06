import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { AIService } from "./services/aiService.js";

const __dirname = path.resolve();

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(process.cwd(), "dist/main/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "AI Chat Desktop",
  });

  mainWindow.loadURL("http://localhost:5173");
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const aiService = new AIService();

// Set OpenRouter API key from environment or config
if (process.env.OPENROUTER_API_KEY) {
  aiService.setOpenRouterApiKey(process.env.OPENROUTER_API_KEY);
}

/**
 * Get all available models from both Ollama and OpenRouter.
 * Returns combined list with provider information.
 */
ipcMain.handle("ai:getModels", async (_, settings: any) => {
  try {
    return await aiService.getAllModels(settings);
  } catch (error) {
    console.error("Error getting models:", error);
    throw error;
  }
});

/**
 * Stream chat completion - provider-agnostic.
 */
ipcMain.handle(
  "ai:chatStream",
  (
    event,
    messages: Array<{ role: string; content: string }>,
    settings: any,
  ) => {
    return new Promise<void>((resolve, reject) => {
      aiService
        .streamChat(
          messages.map((m) => ({
            id: Date.now().toString(),
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            timestamp: new Date(),
          })),
          settings,
          (chunk) => {
            try {
              event.sender.send("ai:chatStreamChunk", chunk);
            } catch (e) {
              console.error("Error sending chunk:", e);
            }
          },
        )
        .then(() => {
          try {
            event.sender.send("ai:chatStreamComplete");
            resolve();
          } catch (e) {
            console.error("Error sending complete:", e);
            reject(e);
          }
        })
        .catch((error) => {
          try {
            event.sender.send("ai:chatStreamError", error.message);
            reject(error);
          } catch (e) {
            console.error("Error sending error:", e);
            reject(e);
          }
        });
    });
  },
);

/**
 * Non-streaming chat completion.
 */
ipcMain.handle(
  "ai:chat",
  async (
    _,
    messages: Array<{ role: string; content: string }>,
    settings: any,
  ) => {
    try {
      return await aiService.chat(
        messages.map((m) => ({
          id: Date.now().toString(),
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: new Date(),
        })),
        settings,
      );
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  },
);

// Legacy Ollama-only handlers (for backward compatibility)
ipcMain.handle("ollama:getModels", async () => {
  try {
    const models = await aiService.getAllModels({
      modelProvider: "ollama",
      selectedModel: "",
      searchApiKeys: {},
    });
    return models.filter((m) => m.provider === "ollama");
  } catch (error) {
    console.error("Error getting models:", error);
    throw error;
  }
});

ipcMain.handle(
  "ollama:chat",
  async (
    _,
    model: string,
    messages: Array<{ role: string; content: string }>,
  ) => {
    try {
      return await aiService.chat(
        messages.map((m) => ({
          id: Date.now().toString(),
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: new Date(),
        })),
        { modelProvider: "ollama", selectedModel: model, searchApiKeys: {} },
      );
    } catch (error) {
      console.error("Error in chat:", error);
      throw error;
    }
  },
);

ipcMain.handle(
  "ollama:chatStream",
  (
    event,
    model: string,
    messages: Array<{ role: string; content: string }>,
    settings?: any,
  ) => {
    return new Promise<void>((resolve, reject) => {
      aiService
        .streamChat(
          messages.map((m) => ({
            id: Date.now().toString(),
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            timestamp: new Date(),
          })),
          { ...settings, modelProvider: "ollama", selectedModel: model, searchApiKeys: {} },
          (chunk) => {
            try {
              event.sender.send("ollama:chatStreamChunk", chunk);
            } catch (e) {
              console.error("Error sending chunk:", e);
            }
          },
        )
        .then(() => {
          try {
            event.sender.send("ollama:chatStreamComplete");
            resolve();
          } catch (e) {
            console.error("Error sending complete:", e);
            reject(e);
          }
        })
        .catch((error) => {
          try {
            event.sender.send("ollama:chatStreamError", error.message);
            reject(error);
          } catch (e) {
            console.error("Error sending error:", e);
            reject(e);
          }
        });
    });
  },
);
