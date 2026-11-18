import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "credifit",
  DB_CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
  JWT_SECRET: process.env.JWT_SECRET || "credifit_secret_jwt_key_admission_screening_register",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  REFRESH_TOKEN_DAYS: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  COOKIE_NAME: process.env.COOKIE_NAME || "credifit_refresh",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",").map(s => s.trim()),
  UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
  MAX_UPLOAD_BYTES: Number(process.env.MAX_UPLOAD_BYTES || 5242880),
};
