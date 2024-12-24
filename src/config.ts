import dotenv from "dotenv";

export { CONFIG };

const parsedConfig = dotenv.config().parsed;

interface Config {
    [key: string]: string;
}

const CONFIG: Config = parsedConfig || {};

export function setOperationMode(mode: string) {
    CONFIG.OPERATION_MODE = mode;
}
