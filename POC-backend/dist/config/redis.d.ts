declare class RedisClient {
    private client;
    private isConnected;
    constructor();
    private initializeClient;
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<void>;
}
export declare const redis: RedisClient;
export {};
