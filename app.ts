import { handleSerialPort } from "./src/serialport.js";
import chokidar from "chokidar";
import _colors from "colors";
import { websocketSend, startServer } from "./src/server.js";
import dotenv from "dotenv";
import { startDb } from "./src/db.js";

const CONFIG = dotenv.config().parsed;

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    websocketSend("reload");
});

startDb();
startServer();
handleSerialPort();
