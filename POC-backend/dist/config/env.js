"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load .env variables into process.env
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: zod_1.z.coerce.number().default(8080),
    DATABASE_URL: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string(),
    OPENAI_API_KEY: zod_1.z.string(),
    REDIS_URL: zod_1.z.string().default("redis://localhost:6379"),
    REDIS_HOST: zod_1.z.string().default("localhost"),
    REDIS_PORT: zod_1.z.string().default("6379"),
    LINKEDIN_API_KEY: zod_1.z.string().optional(),
    CIBIL_API_KEY: zod_1.z.string().optional(),
    LINKEDIN_CLIENT_ID: zod_1.z.string(),
    LINKEDIN_CLIENT_SECRET: zod_1.z.string(),
    LINKEDIN_REDIRECT_URI: zod_1.z.string(),
    SERP_API_KEY: zod_1.z.string().optional(),
    PAN_API_KEY: zod_1.z.string().optional(),
});
const validateEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error("❌ Invalid environment variables:", error.errors);
        }
        process.exit(1);
    }
};
exports.config = validateEnv();
//# sourceMappingURL=env.js.map