import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";
import { config } from "./env";

let db: Db | null = null;

export const setupDatabase = async () => {
  try {
    // Set up Mongoose connection
    mongoose.set("strictQuery", false);
    await mongoose.connect(config.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    console.log("Connected to MongoDB successfully");

    // Set up MongoDB native client for raw operations
    const client = new MongoClient(config.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("Database not initialized. Call setupDatabase() first.");
  }
  return db;
};
