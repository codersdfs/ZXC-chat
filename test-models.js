import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
async function testGetModels() {
    try {
        const { stdout } = await execAsync("ollama list");
        const lines = stdout.trim().split("\n").slice(1); // Skip header
        const models = lines
            .map((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
                return {
                    name: parts[0],
                    size: parts[2] !== "-" ? parseInt(parts[2]) || 0 : 0,
                    modified: parts.slice(3).join(" "),
                    details: "",
                };
            }
            return null;
        })
            .filter((model) => model !== null);
        console.log("Models found:", models);
    }
    catch (error) {
        console.error("Error:", error);
    }
}
testGetModels();
