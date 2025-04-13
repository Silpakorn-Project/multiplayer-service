import dotenv from "dotenv";
import path from "path";

function getEnv(key: string, fallback?: string): string {
    const value = process.env[key];
    if (!value && fallback === undefined) {
        throw new Error(`Missing required env var: ${key}`);
    }
    return value ?? fallback!;
}

export function loadEnv() {
    const env = process.env.NODE_ENV || "development";
    const envPath = path.resolve(__dirname, `../../.env.${env}`);
    // console.log("✅ Loading .env from:", envPath);
    dotenv.config({ path: envPath });
}

export function getConfig() {
    return {
        BASE_URL_API: getEnv("BASE_URL_API", "http://localhost:3000"),
    };
}
