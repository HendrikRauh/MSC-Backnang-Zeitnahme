import chokidar from "chokidar";
import _colors from "colors";
import { websocketSend } from "./server";
import { CONFIG } from "./config";

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    websocketSend("reload");
});
