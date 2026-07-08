import { Router } from "express";
import { db } from "@/db";
import { budgetAllocations, projects } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { validateBody, validateQuery } from "@/middleware/validation.middleware";
import { requireRole } from "@/middleware/auth.middleware";

const router = Router();

const querySchema = z.object({
    constituencyId: z.string().uuid().optional(),
    financialYear: z.string().optional(),
});

const createAllocationSchema = z.object({
    constituencyId: z.string().uuid(),
    financialYear: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-YY (e.g., 2025-26)"),
    totalMplads: z.number().positive(),
    allocated: z.number().min(0).default(0),
    spent: z.number().min(0).default(0),
    sectorBreakdown: z.record(z.string(), z.object({
        allocated: z.number().min(0),
        spent: z.number().min(0),
    })).optional(),
});

router.get("/", async (req, res) => {
    try {
        const queryResult = validateQuery(req, res, querySchema);
        if (!queryResult.success) return;

        const { constituencyId, financialYear } = queryResult.data;

        const conditions = [];
        if (constituencyId) conditions.push(eq(budgetAllocations.constituencyId, constituencyId));
        if (financialYear) conditions.push(eq(budgetAllocations.financialYear, financialYear));

        const allocations = await db
            .select()
            .from(budgetAllocations)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(budgetAllocations.financialYear));

        // Calculate sector-wise spending from projects
        let sectorSpending: Array<{ sector: string | null; totalSpent: string | null; projectCount: string | null }> = [];
        if (constituencyId) {
            sectorSpending = await db
                .select({
                    sector: projects.sector,
                    totalSpent: sql<string>`COALESCE(SUM(${projects.allocatedBudget}), 0)`,
                    projectCount: sql<string>`COUNT(*)`,
                })
                .from(projects)
                .where(eq(projects.constituencyId, constituencyId))
                .groupBy(projects.sector);
        }

        // Summary
        const totalAllocated = allocations.reduce((sum, a) => sum + (a.totalMplads ?? 0), 0);
        const totalSpent = allocations.reduce((sum, a) => sum + (a.spent ?? 0), 0);
        const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

        res.json({
            data: {
                allocations,
                sectorSpending,
                summary: {
                    totalAllocated,
                    totalSpent,
                    balance: totalAllocated - totalSpent,
                    utilizationRate: Math.round(utilizationRate * 10) / 10,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch budget data", details: String(error) });
    }
});

router.post("/", requireRole(["admin", "mp"]), async (req, res) => {
    try {
        const bodyResult = validateBody(req, res, createAllocationSchema);
        if (!bodyResult.success) return;

        const { constituencyId, financialYear, totalMplads, allocated, spent, sectorBreakdown } = bodyResult.data;

        const [allocation] = await db
            .insert(budgetAllocations)
            .values({
                constituencyId,
                financialYear,
                totalMplads,
                allocated,
                spent,
                sectorBreakdown: sectorBreakdown ?? null,
            })
            .returning();

        res.status(201).json({ data: allocation });
    } catch (error) {
        res.status(500).json({ error: "Failed to create budget allocation", details: String(error) });
    }
});

export default router;
