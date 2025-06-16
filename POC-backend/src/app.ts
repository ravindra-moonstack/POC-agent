import express from "express";
import { json } from "express";
import cors from "cors";
import { config } from "./config/env";
import { setupRoutes } from "./config/routes";
import { setupDatabase } from "./config/database";
import { errorHandler } from "./utils/errorHandler";
import winston from "winston";

// Initialize logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

const app = express();

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "your-production-domain.com" // Replace with your production domain
        : "http://localhost:5173", // Your frontend development server
    credentials: true,
  })
);
app.use(json());
app.use(errorHandler);

// Setup routes
setupRoutes(app);

// Initialize database and start server
setupDatabase()
  .then(() => {
    app.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
  });
