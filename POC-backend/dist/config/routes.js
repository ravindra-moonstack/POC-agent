"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_1 = __importDefault(require("../routes/auth"));
const customers_1 = __importDefault(require("../routes/customers"));
const setupRoutes = (app) => {
    // Mount authentication routes
    app.use("/auth", auth_1.default);
    // Mount customer routes
    app.use("/api", customers_1.default);
    // Mount profile enrichment routes
    // app.use("/api", profileEnrichmentRoutes);
    // Health check endpoint
    app.get("/health", (_, res) => res.status(200).json({ status: "ok" }));
    // Catch-all route for undefined endpoints
    app.use("*", (_, res) => {
        res.status(404).json({
            error: {
                message: "Resource not found",
            },
        });
    });
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=routes.js.map