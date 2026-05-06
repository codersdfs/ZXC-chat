import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { OllamaService } from "./services/ollamaService.js";
const __dirname = path.resolve();
let mainWindow = null;
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
const ollamaService = new OllamaService();
ipcMain.handle("ollama:getModels", async () => {
    try {
        return await ollamaService.getModels();
    }
    catch (error) {
        console.error("Error getting models:", error);
        throw error;
    }
});
ipcMain.handle("ollama:chat", async (_, model, messages) => {
    try {
        return await ollamaService.chat(model, messages);
    }
    catch (error) {
        console.error("Error in chat:", error);
        throw error;
    }
});
ipcMain.handle("ollama:chatStream", (event, model, messages, settings) => {
    return new Promise((resolve, reject) => {
        ollamaService.chatStream(model, messages, (chunk) => {
            try {
                event.sender.send("ollama:chatStreamChunk", chunk);
            }
            catch (e) {
                console.error("Error sending chunk:", e);
            }
        }, () => {
            try {
                event.sender.send("ollama:chatStreamComplete");
                resolve();
            }
            catch (e) {
                console.error("Error sending complete:", e);
                reject(e);
            }
        }, (error) => {
            try {
                event.sender.send("ollama:chatStreamError", error.message);
                reject(error);
            }
            catch (e) {
                console.error("Error sending error:", e);
                reject(e);
            }
        }, settings);
    });
});
ipcMain.handle("ollama:generate", async (_, model, prompt) => {
    try {
        return await ollamaService.generate(model, prompt);
    }
    catch (error) {
        console.error("Error generating:", error);
        throw error;
    }
});
ipcMain.handle("ollama:generateStream", (event, model, prompt) => {
    return new Promise((resolve, reject) => {
        ollamaService.generateStream(model, prompt, (chunk) => {
            event.sender.send("ollama:generateStreamChunk", chunk);
        }, () => {
            event.sender.send("ollama:generateStreamComplete");
            resolve();
        }, (error) => {
            event.sender.send("ollama:generateStreamError", error.message);
            reject(error);
        });
    });
});
//# sourceMappingURL=index.js.map