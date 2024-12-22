import dotenv from "dotenv";

const parsedConfig = dotenv.config().parsed;

interface Config {
    [key: string]: string;
}

export const CONFIG: Config = parsedConfig || {};
