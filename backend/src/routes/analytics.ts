import { Router } from "express";
import { db } from "@/db";
import { submissions, projects, clusters } from "@/db/schema";
import { sql, count, avg, eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";
import { validateQuery } from "@/middleware/validation.middleware";

const router = Router();

const querySchema = z.object({
    constituencyId: z.string().uuid().optional(),
    period: z.enum(["7d", "30d", "90d", "1y", "all"]).default("30d"),
});

router.get("/", async (req, res) => {
    try {
        const queryResult = validateQuery(req, res, querySchema);
        if (!queryResult.success) return;

        const { constituencyId, period } = queryResult.data;

        // Calculate date range
        const periodDays: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: 9999 };
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (periodDays[period] ?? 30));

        const conditions = [];
        if (constituencyId) conditions.push(eq(submissions.constituencyId, constituencyId));
        conditions.push(gte(submissions.createdAt, startDate));

        const whereClause = and(...conditions);

        // Submission stats
        const [submissionStats] = await db
            .select({
                total: count(submissions.id),
                avgSentiment: avg(submissions.sentimentScore),
                avgUrgency: avg(submissions.urgencyScore),
                avgImpact: avg(submissions.impactScore),
                spamCount: sql<number>`COUNT(*) FILTER (WHERE ${submissions.isSpam} = true)`,
                duplicateCount: sql<number>`COUNT(*) FILTER (WHERE ${submissions.isDuplicate} = true)`,
            })
            .from(submissions)
            .where(whereClause);

        // Project stats
        const projectConditions = [];
        if (constituencyId) projectConditions.push(eq(projects.constituencyId, constituencyId));

        const [projectStats] = await db
            .select({
                total: count(projects.id),
                avgScore: avg(projects.aiPriorityScore),
                completedCount: sql<number>`COUNT(*) FILTER (WHERE ${projects.status} = 'completed')`,
                inProgressCount: sql<number>`COUNT(*) FILTER (WHERE ${projects.status} = 'in_progress')`,
                proposedCount: sql<number>`COUNT(*) FILTER (WHERE ${projects.status} = 'proposed')`,
                totalBudgetAllocated: sql<number>`COALESCE(SUM(${projects.allocatedBudget}), 0)`,
                totalEstimatedCost: sql<number>`COALESCE(SUM(${projects.estimatedCost}), 0)`,
            })
            .from(projects)
            .where(projectConditions.length > 0 ? and(...projectConditions) : undefined);

        // Sector distribution
        const sectorDist = await db
            .select({
                sector: submissions.sector,
                count: count(submissions.id),
                avgUrgency: avg(submissions.urgencyScore),
                avgSentiment: avg(submissions.sentimentScore),
            })
            .from(submissions)
            .where(whereClause)
            .groupBy(submissions.sector);

        // Channel distribution
        const channelDist = await db
            .select({
                channel: submissions.channel,
                count: count(submissions.id),
            })
            .from(submissions)
            .where(whereClause)
            .groupBy(submissions.channel);

        // Status distribution
        const statusDist = await db
            .select({
                status: submissions.status,
                count: count(submissions.id),
            })
            .from(submissions)
            .where(whereClause)
            .groupBy(submissions.status);

        // Monthly trends (last 7 months)
        const monthlyTrends = await db
            .select({
                month: sql<string>`TO_CHAR(${submissions.createdAt}, 'YYYY-MM')`,
                count: count(submissions.id),
                avgUrgency: avg(submissions.urgencyScore),
                avgSentiment: avg(submissions.sentimentScore),
            })
            .from(submissions)
            .where(constituencyId ? eq(submissions.constituencyId, constituencyId) : undefined)
            .groupBy(sql`TO_CHAR(${submissions.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${submissions.createdAt}, 'YYYY-MM') DESC`)
            .limit(7);

        // Top clusters
        const topClusters = await db
            .select()
            .from(clusters)
            .where(constituencyId ? eq(clusters.constituencyId, constituencyId) : undefined)
            .orderBy(desc(clusters.hotspotScore))
            .limit(5);

        res.json({
            data: {
                submissions: {
                    total: submissionStats.total,
                    avgSentiment: Number(submissionStats.avgSentiment ?? 0),
                    avgUrgency: Number(submissionStats.avgUrgency ?? 0),
                    avgImpact: Number(submissionStats.avgImpact ?? 0),
                    spamCount: submissionStats.spamCount,
                    duplicateCount: submissionStats.duplicateCount,
                },
                projects: {
                    total: projectStats.total,
                    avgAIScore: Number(projectStats.avgScore ?? 0),
                    completed: projectStats.completedCount,
                    inProgress: projectStats.inProgressCount,
                    proposed: projectStats.proposedCount,
                    totalBudgetAllocated: projectStats.totalBudgetAllocated,
                    totalEstimatedCost: projectStats.totalEstimatedCost,
                },
                sectorDistribution: sectorDist,
                channelDistribution: channelDist,
                statusDistribution: statusDist,
                monthlyTrends: monthlyTrends.reverse(),
                topClusters,
            },
            meta: {
                period,
                constituencyId: constituencyId ?? "all",
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics", details: String(error) });
    }
});

export default router;
