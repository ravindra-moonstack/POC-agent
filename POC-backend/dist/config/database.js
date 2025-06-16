"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDB = exports.setupDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const env_1 = require("./env");
let db = null;
const setupDatabase = async () => {
    try {
        // Set up Mongoose connection
        mongoose_1.default.set("strictQuery", false);
        await mongoose_1.default.connect(env_1.config.DATABASE_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to MongoDB successfully");
        // Set up MongoDB native client for raw operations
        const client = new mongodb_1.MongoClient(env_1.config.DATABASE_URL);
        await client.connect();
        db = client.db();
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
};
exports.setupDatabase = setupDatabase;
const getDB = () => {
    if (!db) {
        throw new Error("Database not initialized. Call setupDatabase() first.");
    }
    return db;
};
exports.getDB = getDB;
//# sourceMappingURL=database.js.map