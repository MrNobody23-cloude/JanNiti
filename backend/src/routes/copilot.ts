import { Router } from "express";
import { z } from "zod";
import { geminiService } from "@/services/ai/gemini.service";
import { db } from "@/db";
import { submissions, copilotConversations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { validateBody } from "@/middleware/validation.middleware";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/middleware/rate-limit.middleware";

const router = Router();

const chatSchema = z.object({
    message: z.string().min(1).max(2000),
    conversationId: z.string().uuid().optional(),
    constituencyId: z.string().uuid().optional(),
});

router.post("/chat", async (req, res) => {
    try {
        // Rate limit
        const rateLimitResult = await checkRateLimit(req, res, RATE_LIMIT_PRESETS.copilot);
        if (!rateLimitResult.allowed) return;

        const bodyResult = validateBody(req, res, chatSchema);
        if (!bodyResult.success) return;

        const { message, conversationId, constituencyId } = bodyResult.data;
        const user = req.user;

        // Retrieve context: recent submissions from DB (simple keyword-based)
        const recentSubmissions = await db
            .select({
                title: submissions.title,
                description: submissions.description,
                sector: submissions.sector,
                status: submissions.status,
                address: submissions.address,
                urgencyScore: submissions.urgencyScore,
            })
            .from(submissions)
            .orderBy(desc(submissions.createdAt))
            .limit(10);

        const contextText = recentSubmissions
            .map(
                (s, i) =>
                    `[${i + 1}] "${s.title}" (${s.sector}, ${s.status}, urgency: ${(
                        (s.urgencyScore ?? 0) * 100
                    ).toFixed(0)}%) - ${s.description?.slice(0, 150)}`
            )
            .join("\n");

        const systemPrompt = `You are JanNiti AI Copilot, an intelligent assistant for Indian constituency development management. You help MPs, administrators, and analysts make data-driven decisions about development projects.

You have access to the following recent citizen submissions from the database:

--- CONSTITUENCY DATA ---
${contextText}
--- END DATA ---

Guidelines:
- Answer questions about submissions, projects, budget, and development priorities
- Provide data-backed recommendations when possible
- Reference specific submissions or projects when relevant
- Be concise but thorough
- If you don't have enough data to answer, say so clearly
- Use Indian governance terminology (MPLADS, PHC, PWD, etc.)
- Format numbers in Indian notation (lakhs, crores)`;

        // Setup Server-Sent Events headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no"); // Suppress Nginx buffer buffering if any
        res.flushHeaders();

        try {
            const generator = geminiService.streamText(message, {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                maxOutputTokens: 2048,
            });

            let fullResponse = "";

            for await (const chunk of generator) {
                fullResponse += chunk;
                res.write(`data: ${JSON.stringify({ type: "content", text: chunk })}\n\n`);
            }

            // Save conversation (only if user is authenticated)
            if (user) {
                const messages = [
                    { role: "user", content: message, timestamp: new Date().toISOString() },
                    { role: "assistant", content: fullResponse, timestamp: new Date().toISOString() },
                ];

                await db.insert(copilotConversations).values({
                    userId: user.id,
                    constituencyId: constituencyId ?? user.constituencyId ?? null,
                    title: message.slice(0, 100),
                    messages,
                    context: [],
                });
            }

            // Send done signal
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            res.end();
        } catch (generatorErr) {
            console.error("Gemini stream error:", generatorErr);
            res.write(`data: ${JSON.stringify({ type: "error", message: String(generatorErr) })}\n\n`);
            res.end();
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: "Copilot request failed", details: String(error) });
        }
    }
});

export default router;
