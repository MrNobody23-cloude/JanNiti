import { Router } from "express";
import { db } from "@/db";
import { constituencies } from "@/db/schema";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const results = await db.select().from(constituencies);
        res.json({ data: results });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch constituencies", details: String(error) });
    }
});

export default router;
