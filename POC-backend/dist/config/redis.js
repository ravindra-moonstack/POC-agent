"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initializeClient();
    }
    initializeClient() {
        try {
            // Use Redis URL if provided, otherwise use host and port
            this.client = env_1.config.REDIS_URL
                ? new ioredis_1.default(env_1.config.REDIS_URL)
                : new ioredis_1.default({
                    host: env_1.config.REDIS_HOST,
                    port: parseInt(env_1.config.REDIS_PORT),
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                });
            this.client.on("connect", () => {
                console.log("Connected to Redis successfully");
                this.isConnected = true;
            });
            this.client.on("error", (err) => {
                console.warn("Redis connection error:", err.message);
                this.isConnected = false;
            });
        }
        catch (error) {
            console.error("Failed to initialize Redis client:", error);
            this.client = null;
        }
    }
    async get(key) {
        if (!this.client || !this.isConnected) {
            return null;
        }
        try {
            return await this.client.get(key);
        }
        catch (error) {
            console.warn("Redis get error:", error);
            return null;
        }
    }
    async setex(key, seconds, value) {
        if (!this.client || !this.isConnected) {
            return;
        }
        try {
            await this.client.setex(key, seconds, value);
        }
        catch (error) {
            console.warn("Redis setex error:", error);
        }
    }
}
exports.redis = new RedisClient();
//# sourceMappingURL=redis.js.map