import chokidar from "chokidar";
import _colors from "colors";

import { tellClients } from "./src/server.js";

import dotenv from "dotenv";
const CONFIG = dotenv.config().parsed;

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    tellClients("reload");
});
