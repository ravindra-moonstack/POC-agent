import Redis from "ioredis";
import { config } from "./env";

class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Use Redis URL if provided, otherwise use host and port
      this.client = config.REDIS_URL
        ? new Redis(config.REDIS_URL)
        : new Redis({
            host: config.REDIS_HOST,
            port: parseInt(config.REDIS_PORT),
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
        // console.warn("Redis connection error:", err.message);
        this.isConnected = false;
      });
    } catch (error) {
      console.error("Failed to initialize Redis client:", error);
      this.client = null;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      console.warn("Redis get error:", error);
      return null;
    }
  }

  public async setex(
    key: string,
    seconds: number,
    value: string
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.setex(key, seconds, value);
    } catch (error) {
      console.warn("Redis setex error:", error);
    }
  }
}

export const redis = new RedisClient();
