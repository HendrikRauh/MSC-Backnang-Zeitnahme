import dotenv from "dotenv";

export { CONFIG };

const parsedConfig = dotenv.config().parsed;

interface Config {
    [key: string]: string;
}

const CONFIG: Config = parsedConfig || {};
