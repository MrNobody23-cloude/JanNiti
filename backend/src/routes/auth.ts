import { Router } from "express";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/verify-credentials", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const results = await db
            .select()
            .from(users)
            .where(sql`${users.email} = ${email}`)
            .limit(1);

        const user = results[0];
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            constituencyId: user.constituencyId,
        });
    } catch (error) {
        res.status(500).json({ error: "Auth verification failed", details: String(error) });
    }
});

export default router;
