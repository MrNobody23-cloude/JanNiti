import { Router } from "express";
import { z } from "zod";
import { db } from "@/db";
import { submissions, projects, digitalTwinScenarios } from "@/db/schema";
import { eq, and, sql, count, avg } from "drizzle-orm";
import { requireRole } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { geminiService } from "@/services/ai/gemini.service";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/middleware/rate-limit.middleware";

const router = Router();

const simulateSchema = z.object({
    constituencyId: z.string().uuid(),
    scenarioType: z.enum(["forecast", "what_if", "optimization"]),
    name: z.string().min(1).max(255),
    timeHorizon: z.enum(["3_months", "6_months", "1_year", "2_years", "5_years"]).default("1_year"),
    parameters: z.object({
        budgetChange: z.number().optional(), // e.g., +5000000 or -2000000
        newProjects: z.array(z.string()).optional(), // Sector IDs for proposed new projects
        removeSectors: z.array(z.string()).optional(),
        populationGrowth: z.number().optional(), // Percentage
        forecastMetric: z.enum(["submissions", "satisfaction", "infrastructure", "budget"]).optional(),
    }).default({}),
});

router.post("/simulate", requireRole(["admin", "mp", "analyst"]), async (req, res) => {
    try {
        const rateLimitResult = await checkRateLimit(req, res, RATE_LIMIT_PRESETS.ai);
        if (!rateLimitResult.allowed) return;

        const user = req.user!;

        const bodyResult = validateBody(req, res, simulateSchema);
        if (!bodyResult.success) return;

        const { constituencyId, scenarioType, name, timeHorizon, parameters } = bodyResult.data;

        // Gather historical data for the simulation
        const [submissionStats] = await db
            .select({
                total: count(submissions.id),
                avgUrgency: avg(submissions.urgencyScore),
                avgSentiment: avg(submissions.sentimentScore),
            })
            .from(submissions)
            .where(eq(submissions.constituencyId, constituencyId));

        const activeProjects = await db
            .select()
            .from(projects)
            .where(
                and(
                    eq(projects.constituencyId, constituencyId),
                    sql`${projects.status} IN ('approved', 'in_progress')`
                )
            );

        const sectorDistribution = await db
            .select({
                sector: submissions.sector,
                count: count(submissions.id),
                avgUrgency: avg(submissions.urgencyScore),
            })
            .from(submissions)
            .where(eq(submissions.constituencyId, constituencyId))
            .groupBy(submissions.sector);

        // Build simulation context
        const historicalContext = `
## Current State
- Total submissions: ${submissionStats?.total ?? 0}
- Average urgency: ${Number(submissionStats?.avgUrgency ?? 0).toFixed(2)}
- Average sentiment: ${Number(submissionStats?.avgSentiment ?? 0).toFixed(2)}
- Active projects: ${activeProjects.length}
- Total active project budget: ₹${activeProjects.reduce((sum, p) => sum + (p.allocatedBudget ?? 0), 0).toLocaleString("en-IN")}

## Sector Distribution (by submission volume)
${sectorDistribution.map(s => `- ${s.sector}: ${s.count} submissions (avg urgency: ${Number(s.avgUrgency ?? 0).toFixed(2)})`).join("\n")}

## Active Projects
${activeProjects.slice(0, 10).map(p => `- ${p.title} (${p.sector}, ${p.status}, ${p.completionPercentage ?? 0}% complete)`).join("\n")}
`;

        // Generate simulation with LLM
        const simulationPrompt = `You are a digital twin simulator for an Indian parliamentary constituency. Analyze historical data and generate a ${timeHorizon.replace("_", " ")} ${scenarioType} simulation.

${historicalContext}

## Simulation Parameters
- Type: ${scenarioType}
- Time Horizon: ${timeHorizon.replace("_", " ")}
${parameters.budgetChange ? `- Budget Change: ₹${parameters.budgetChange.toLocaleString("en-IN")}` : ""}
${parameters.newProjects ? `- New Projects in: ${parameters.newProjects.join(", ")}` : ""}
${parameters.populationGrowth ? `- Population Growth: ${parameters.populationGrowth}%` : ""}
${parameters.forecastMetric ? `- Forecast Metric: ${parameters.forecastMetric}` : ""}

Generate a detailed simulation result in JSON format:
{
  "summary": "2-3 sentence executive summary of the simulation outcome",
  "predictions": [
    {"metric": "name", "currentValue": number, "predictedValue": number, "changePercent": number, "confidence": 0-1}
  ],
  "risks": [
    {"risk": "description", "probability": 0-1, "impact": "high|medium|low", "mitigation": "suggestion"}
  ],
  "recommendations": [
    {"action": "what to do", "priority": "high|medium|low", "expectedImpact": "description", "timeline": "when"}
  ],
  "scenarioOutcome": {
    "citizenSatisfaction": number (0-100),
    "infrastructureImprovement": number (percentage),
    "budgetUtilization": number (percentage),
    "projectsCompleted": number,
    "newIssuesExpected": number
  }
}`;

        const simulationResult = await geminiService.generateJSON<{
            summary: string;
            predictions: Array<{ metric: string; currentValue: number; predictedValue: number; changePercent: number; confidence: number }>;
            risks: Array<{ risk: string; probability: number; impact: string; mitigation: string }>;
            recommendations: Array<{ action: string; priority: string; expectedImpact: string; timeline: string }>;
            scenarioOutcome: {
                citizenSatisfaction: number;
                infrastructureImprovement: number;
                budgetUtilization: number;
                projectsCompleted: number;
                newIssuesExpected: number;
            };
        }>(simulationPrompt, {
            temperature: 0.5,
            systemInstruction: "You are a governance and development simulation expert. Provide realistic, data-grounded predictions for Indian constituency development. Always respond with valid JSON.",
        });

        // Generate narrative
        const narrativePrompt = `Based on this simulation result, write a 3-4 paragraph narrative explanation in plain language for a Member of Parliament. Explain what will likely happen, what risks exist, and what actions should be taken.

Simulation: ${JSON.stringify(simulationResult)}
Context: ${historicalContext}
Time Horizon: ${timeHorizon.replace("_", " ")}`;

        const narrativeResponse = await geminiService.generateText(narrativePrompt, {
            temperature: 0.6,
            systemInstruction: "Write in clear, professional English suitable for a government official. Be specific about timelines and numbers.",
        });

        // Save scenario to database
        const [scenario] = await db.insert(digitalTwinScenarios).values({
            constituencyId,
            createdBy: user.id,
            name,
            scenarioType,
            parameters,
            results: simulationResult,
            narrative: narrativeResponse.text,
            timeHorizon,
            confidence: simulationResult.predictions.reduce((sum, p) => sum + p.confidence, 0) / (simulationResult.predictions.length || 1),
            status: "completed",
            completedAt: new Date(),
        }).returning();

        res.json({
            data: {
                scenarioId: scenario.id,
                name,
                scenarioType,
                timeHorizon,
                results: simulationResult,
                narrative: narrativeResponse.text,
                confidence: scenario.confidence,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Simulation failed", details: String(error) });
    }
});

export default router;
