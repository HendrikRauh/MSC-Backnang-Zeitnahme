import chokidar from "chokidar";
import { CONFIG } from "./config";
import { handleSerialPort } from "./serialport";
import { websocketSend } from "./server";

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    websocketSend("reload");
});

handleSerialPort();
