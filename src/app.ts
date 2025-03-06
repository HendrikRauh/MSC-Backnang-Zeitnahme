import io from "@pm2/io";
import { exec } from "child_process";
import chokidar from "chokidar";
import { CONFIG } from "./config";
import { handleSerialPort } from "./serialport";
import { websocketSend } from "./server";

interface ExecCallback {
    (err: Error | null, stdout: string, stderr: string): void;
}

io.action("restart", (cb: () => void) => {
    exec(
        "npm run restart",
        (err: Error | null, stdout: string, stderr: string) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            console.error(stderr);
            cb();
        }
    );
});

io.action("update", (cb: () => void) => {
    exec(
        "npm run update",
        (err: Error | null, stdout: string, stderr: string) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            console.error(stderr);
            cb();
        }
    );
});

io.action("SYS RESTART", (cb: () => void) => {
    exec(
        "shutdown /r /t 0",
        (err: Error | null, stdout: string, stderr: string) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            console.error(stderr);
            cb();
        }
    );
});

io.action("SYS SHUTDOWN", (cb: () => void) => {
    exec(
        "shutdown /s /t 0",
        (err: Error | null, stdout: string, stderr: string) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            console.error(stderr);
            cb();
        }
    );
});

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    websocketSend("reload");
});

handleSerialPort();
