import { handleSerialPort } from "./src/serialport.js";
import chokidar from "chokidar";
import _colors from "colors";
import { websocketSend } from "./src/server.js";
import dotenv from "dotenv";

const CONFIG = dotenv.config().parsed;

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    websocketSend("reload");
});

handleSerialPort();
