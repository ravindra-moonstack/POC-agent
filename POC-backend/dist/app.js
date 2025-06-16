"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("express");
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = require("./config/routes");
const database_1 = require("./config/database");
const errorHandler_1 = require("./utils/errorHandler");
const winston_1 = __importDefault(require("winston"));
// Initialize logger
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: "error.log", level: "error" }),
        new winston_1.default.transports.File({ filename: "combined.log" }),
    ],
});
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple(),
    }));
}
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? "your-production-domain.com" // Replace with your production domain
        : "http://localhost:5173", // Your frontend development server
    credentials: true,
}));
app.use((0, express_2.json)());
app.use(errorHandler_1.errorHandler);
// Setup routes
(0, routes_1.setupRoutes)(app);
// Initialize database and start server
(0, database_1.setupDatabase)()
    .then(() => {
    app.listen(env_1.config.PORT, () => {
        logger.info(`Server is running on port ${env_1.config.PORT}`);
    });
})
    .catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=app.js.map