import { Router } from "express";
import { db } from "@/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
    try {
        await db.execute(sql`SELECT 1 as ok`);
        res.json({
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString(),
            platform: "CDIP v2.1.0 (Express)",
        });
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            database: "disconnected",
            error: String(error),
        });
    }
});

export default router;
