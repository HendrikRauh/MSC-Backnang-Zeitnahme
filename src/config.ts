import dotenv from "dotenv";
import fs from "fs";

export { CONFIG };

const parsedConfig = dotenv.config({ path: [".env", ".env.example"] }).parsed;

interface Config {
    [key: string]: string;
}

const CONFIG: Config = parsedConfig || {};

export function setOperationMode(mode: string) {
    const envFilePath = ".env";
    let envFileContent = "";

    if (fs.existsSync(envFilePath)) {
        envFileContent = fs.readFileSync(envFilePath, "utf-8");
    }

    const regex = /^OPERATION_MODE=.*$/m;
    const newLine = `OPERATION_MODE=${mode}`;

    if (regex.test(envFileContent)) {
        envFileContent = envFileContent.replace(regex, newLine);
    } else {
        envFileContent += `${newLine}`;
    }

    fs.writeFileSync(envFilePath, envFileContent);

    CONFIG.OPERATION_MODE = mode;
}
