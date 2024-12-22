import chokidar from "chokidar";
import _colors from "colors";
import { websocketSend } from "./src/server.js";
import { CONFIG } from "./src/config";

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    websocketSend("reload");
});
