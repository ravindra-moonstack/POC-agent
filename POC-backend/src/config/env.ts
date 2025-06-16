import dotenv from "dotenv";
dotenv.config(); // Load .env variables into process.env

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  LINKEDIN_API_KEY: z.string().optional(),
  CIBIL_API_KEY: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string(),
  LINKEDIN_CLIENT_SECRET: z.string(),
  LINKEDIN_REDIRECT_URI: z.string(),
  SERP_API_KEY: z.string().optional(),
  PAN_API_KEY: z.string().optional(),
  // API_KEY: z.string(),
});

const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:", error.errors);
    }
    process.exit(1);
  }
};

export const config = validateEnv();
