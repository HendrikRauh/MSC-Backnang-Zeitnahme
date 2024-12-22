import dotenv from "dotenv";

const envPath = "../.env";
const parsedConfig = dotenv.config({ path: envPath }).parsed;

interface Config {
    [key: string]: string;
}

export const CONFIG: Config = parsedConfig || {};
