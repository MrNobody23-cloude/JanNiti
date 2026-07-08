import "dotenv/config";
import express from "express";
import cors from "cors";
import { env } from "@/config/env";
import { optionalAuth } from "@/middleware/auth.middleware";

// Routes
import healthRouter from "@/routes/health";
import authRouter from "@/routes/auth";
import submissionsRouter from "@/routes/submissions";
import projectsRouter from "@/routes/projects";
import analyticsRouter from "@/routes/analytics";
import budgetRouter from "@/routes/budget";
import mapsRouter from "@/routes/maps";
import copilotRouter from "@/routes/copilot";
import decisionEngineRouter from "@/routes/decisionEngine";
import digitalTwinRouter from "@/routes/digitalTwin";
import constituenciesRouter from "@/routes/constituencies";

const app = express();

// Middleware
app.use(cors({
    origin: env.NEXTAUTH_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(optionalAuth as any);

// Mount routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/maps", mapsRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api/decision-engine", decisionEngineRouter);
app.use("/api/digital-twin", digitalTwinRouter);
app.use("/api/constituencies", constituenciesRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
});

const PORT = env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

export default app;
