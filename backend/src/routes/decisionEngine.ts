import { Router } from "express";
import { z } from "zod";
import { db } from "@/db";
import { projects, submissions, priorityScoringHistory } from "@/db/schema";
import { eq, desc, and, count, avg, sql } from "drizzle-orm";
import { requireRole } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { deepseekService } from "@/services/ai/deepseek.service";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/middleware/rate-limit.middleware";

const router = Router();

const explainSchema = z.object({
    projectId: z.string().uuid(),
    compareWithIds: z.array(z.string().uuid()).max(3).optional(),
});

const prioritizeSchema = z.object({
    projectId: z.string().uuid().optional(),
    constituencyId: z.string().uuid(),
    recalculateAll: z.boolean().default(false),
});

// Weight configuration for the 6-parameter scoring
const WEIGHTS = {
    demandScore: 0.25,
    feasibilityScore: 0.15,
    socialImpactScore: 0.25,
    environmentalImpactScore: 0.10,
    infrastructureGapScore: 0.15,
    budgetAlignmentScore: 0.10,
};

router.post("/explain", requireRole(["admin", "mp", "analyst"]), async (req, res) => {
    try {
        // Rate limit (AI-heavy endpoint)
        const rateLimitResult = await checkRateLimit(req, res, RATE_LIMIT_PRESETS.ai);
        if (!rateLimitResult.allowed) return;

        const bodyResult = validateBody(req, res, explainSchema);
        if (!bodyResult.success) return;

        const { projectId, compareWithIds } = bodyResult.data;

        // Get project details
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Get scoring history
        const [latestScore] = await db
            .select()
            .from(priorityScoringHistory)
            .where(eq(priorityScoringHistory.projectId, projectId))
            .orderBy(desc(priorityScoringHistory.scoredAt))
            .limit(1);

        // Get related submission stats
        const [submissionStats] = await db
            .select({
                total: count(submissions.id),
                avgUrgency: avg(submissions.urgencyScore),
                avgSentiment: avg(submissions.sentimentScore),
            })
            .from(submissions)
            .where(
                and(
                    eq(submissions.constituencyId, project.constituencyId),
                    project.sector ? eq(submissions.sector, project.sector) : undefined
                )
            );

        // Build context for DeepSeek R1
        let comparisonContext = "";
        if (compareWithIds && compareWithIds.length > 0) {
            const compareProjects = await db
                .select()
                .from(projects)
                .where(sql`${projects.id} IN (${sql.join(compareWithIds.map(id => sql`${id}`), sql`, `)})`);

            comparisonContext = `\n\n## Comparison Projects\n${compareProjects.map(p =>
                `- "${p.title}" (Score: ${p.aiPriorityScore}, Sector: ${p.sector}, Cost: ₹${p.estimatedCost?.toLocaleString("en-IN")}, Beneficiaries: ${p.estimatedBeneficiaries?.toLocaleString("en-IN")})`
            ).join("\n")}`;
        }

        const context = `## Project Under Analysis
Title: ${project.title}
Sector: ${project.sector}
Status: ${project.status}
Estimated Cost: ₹${project.estimatedCost?.toLocaleString("en-IN") ?? "Not estimated"}
Allocated Budget: ₹${project.allocatedBudget?.toLocaleString("en-IN") ?? "None"}
Estimated Beneficiaries: ${project.estimatedBeneficiaries?.toLocaleString("en-IN") ?? "Unknown"}
AI Priority Score: ${project.aiPriorityScore ?? "Not scored"}
Description: ${project.description ?? "No description"}

## Score Breakdown
${latestScore ? `
- Demand Score: ${latestScore.demandScore}/100 (weight: 25%)
- Feasibility Score: ${latestScore.feasibilityScore}/100 (weight: 15%)
- Social Impact Score: ${latestScore.socialImpactScore}/100 (weight: 25%)
- Environmental Impact: ${latestScore.environmentalImpactScore}/100 (weight: 10%)
- Infrastructure Gap: ${latestScore.infrastructureGapScore}/100 (weight: 15%)
- Budget Alignment: ${latestScore.budgetAlignmentScore}/100 (weight: 10%)
` : "No scoring data available."}

## Citizen Feedback Data
- Total related submissions: ${submissionStats?.total ?? 0}
- Average urgency: ${Number(submissionStats?.avgUrgency ?? 0).toFixed(2)}/1.0
- Average sentiment: ${Number(submissionStats?.avgSentiment ?? 0).toFixed(2)} (-1 to +1)
${comparisonContext}`;

        // Use DeepSeek R1 for deep reasoning
        const result = await deepseekService.explainDecision({
            context,
            question: compareWithIds
                ? `Why should "${project.title}" be prioritized over the comparison projects? Provide a detailed comparative analysis.`
                : `Explain why "${project.title}" has been given its current priority score. What factors drive this ranking, and what could change it?`,
            factors: [
                "Citizen demand volume and urgency",
                "Project feasibility and implementation complexity",
                "Social impact and equity considerations",
                "Environmental sustainability",
                "Infrastructure gap severity",
                "Budget availability and scheme eligibility",
            ],
            constraints: [
                "Limited MPLADS budget of ₹5 crore per year",
                "Implementation capacity of local agencies",
                "Seasonal factors (monsoon, agricultural cycles)",
                "Ongoing projects consuming resources",
            ],
        });

        res.json({
            data: {
                projectId,
                projectTitle: project.title,
                score: project.aiPriorityScore,
                explanation: result.explanation,
                reasoning: result.reasoning,
                confidence: result.confidence,
                keyFactors: result.keyFactors,
                scoreBreakdown: latestScore ? {
                    demandScore: latestScore.demandScore,
                    feasibilityScore: latestScore.feasibilityScore,
                    socialImpactScore: latestScore.socialImpactScore,
                    environmentalImpactScore: latestScore.environmentalImpactScore,
                    infrastructureGapScore: latestScore.infrastructureGapScore,
                    budgetAlignmentScore: latestScore.budgetAlignmentScore,
                } : null,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Explanation generation failed", details: String(error) });
    }
});

router.post("/prioritize", requireRole(["admin", "mp", "analyst"]), async (req, res) => {
    try {
        const bodyResult = validateBody(req, res, prioritizeSchema);
        if (!bodyResult.success) return;

        const { projectId, constituencyId, recalculateAll } = bodyResult.data;

        // Get projects to score
        let projectsToScore;
        if (projectId) {
            projectsToScore = await db
                .select()
                .from(projects)
                .where(eq(projects.id, projectId));
        } else if (recalculateAll) {
            projectsToScore = await db
                .select()
                .from(projects)
                .where(eq(projects.constituencyId, constituencyId));
        } else {
            // Only score proposed/approved projects
            projectsToScore = await db
                .select()
                .from(projects)
                .where(
                    and(
                        eq(projects.constituencyId, constituencyId),
                        sql`${projects.status} IN ('proposed', 'approved')`
                    )
                );
        }

        const scoredProjects = [];

        for (const project of projectsToScore) {
            // Calculate demand score from linked submissions
            const [demandData] = await db
                .select({
                    submissionCount: count(submissions.id),
                    avgUrgency: avg(submissions.urgencyScore),
                    totalUpvotes: sql<number>`COALESCE(SUM(${submissions.upvotes}), 0)`,
                })
                .from(submissions)
                .where(
                    and(
                        eq(submissions.constituencyId, constituencyId),
                        project.sector ? eq(submissions.sector, project.sector) : undefined
                    )
                );

            const submissionCount = demandData?.submissionCount ?? 0;
            const avgUrgency = Number(demandData?.avgUrgency ?? 0);
            const totalUpvotes = Number(demandData?.totalUpvotes ?? 0);

            // Demand score (0-100): based on submission count, urgency, and upvotes
            const demandScore = Math.min(100,
                (Number(submissionCount) / 50) * 30 + // Normalize to 50 submissions
                avgUrgency * 40 +
                Math.min(totalUpvotes / 500, 1) * 30
            );

            // Feasibility score (use existing or estimate)
            const feasibilityScore = project.feasibilityScore ??
                (project.estimatedCost && project.estimatedCost < 5000000 ? 85 :
                    project.estimatedCost && project.estimatedCost < 20000000 ? 70 : 55);

            // Social impact score
            const socialImpactScore = project.socialImpactScore ??
                (project.estimatedBeneficiaries
                    ? Math.min(100, (project.estimatedBeneficiaries / 50000) * 100)
                    : 60);

            // Environmental impact score
            const environmentalImpactScore = project.environmentalImpactScore ?? 65;

            // Infrastructure gap score
            const infrastructureGapScore = project.infrastructureGapScore ?? 70;

            // Budget alignment score
            const budgetAlignmentScore = project.allocatedBudget
                ? (project.allocatedBudget >= (project.estimatedCost ?? 0) ? 95 : 60)
                : 40;

            // Calculate weighted overall score
            const overallScore =
                demandScore * WEIGHTS.demandScore +
                feasibilityScore * WEIGHTS.feasibilityScore +
                socialImpactScore * WEIGHTS.socialImpactScore +
                environmentalImpactScore * WEIGHTS.environmentalImpactScore +
                infrastructureGapScore * WEIGHTS.infrastructureGapScore +
                budgetAlignmentScore * WEIGHTS.budgetAlignmentScore;

            // Update project with new score
            await db
                .update(projects)
                .set({
                    aiPriorityScore: overallScore,
                    demandScore,
                    feasibilityScore,
                    socialImpactScore,
                    environmentalImpactScore,
                    infrastructureGapScore,
                    updatedAt: new Date(),
                })
                .where(eq(projects.id, project.id));

            // Record scoring history
            await db.insert(priorityScoringHistory).values({
                projectId: project.id,
                overallScore,
                demandScore,
                feasibilityScore,
                socialImpactScore,
                environmentalImpactScore,
                infrastructureGapScore,
                budgetAlignmentScore,
                factors: {
                    submissionCount: Number(submissionCount),
                    avgUrgency,
                    totalUpvotes,
                    estimatedCost: project.estimatedCost,
                    estimatedBeneficiaries: project.estimatedBeneficiaries,
                    hasAllocatedBudget: !!project.allocatedBudget,
                },
                modelVersion: "v1.0",
            });

            scoredProjects.push({
                projectId: project.id,
                title: project.title,
                overallScore: Math.round(overallScore * 10) / 10,
                breakdown: {
                    demandScore: Math.round(demandScore * 10) / 10,
                    feasibilityScore: Math.round(feasibilityScore * 10) / 10,
                    socialImpactScore: Math.round(socialImpactScore * 10) / 10,
                    environmentalImpactScore: Math.round(environmentalImpactScore * 10) / 10,
                    infrastructureGapScore: Math.round(infrastructureGapScore * 10) / 10,
                    budgetAlignmentScore: Math.round(budgetAlignmentScore * 10) / 10,
                },
                weights: WEIGHTS,
            });
        }

        // Sort by score descending
        scoredProjects.sort((a, b) => b.overallScore - a.overallScore);

        res.json({
            data: scoredProjects,
            meta: {
                totalScored: scoredProjects.length,
                weights: WEIGHTS,
                scoredAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Prioritization failed", details: String(error) });
    }
});

export default router;
