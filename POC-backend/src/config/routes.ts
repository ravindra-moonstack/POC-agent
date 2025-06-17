import { Express } from "express";
import { authenticateJWT } from "../middleware/auth";
import authRoutes from "../routes/auth";
import customerRoutes from "../routes/customers";
import ollamaRoutes from "../routes/ollama";
import profileEnrichmentRoutes from "../routes/profileEnrichment";

export const setupRoutes = (app: Express): void => {
  // Mount authentication routes
  app.use("/auth", authRoutes);

  // Mount customer routes
  app.use("/api", customerRoutes);

  // Mount profile enrichment routes
  app.use("/api/profile", profileEnrichmentRoutes);
  app.use("/api/ollama", ollamaRoutes);
  
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
