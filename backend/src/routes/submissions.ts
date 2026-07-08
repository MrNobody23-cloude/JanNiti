import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq, and, desc, sql, count, ilike } from "drizzle-orm";
import { requireRole } from "@/middleware/auth.middleware";
import { validateBody, validateQuery } from "@/middleware/validation.middleware";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/middleware/rate-limit.middleware";
import { enqueueSubmission } from "@/queues/submission-processor.queue";
import { uploadService } from "@/services/media/upload.service";
import { transcriptionService } from "@/services/media/transcription.service";
import type { UploadPresetKey } from "@/config/cloudinary";

const router = Router();

// Configure multer for memory storage uploads
const storage = multer.memoryStorage();
const uploadConfig = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max limit
    },
});

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    constituencyId: z.string().uuid().optional(),
    sector: z.string().optional(),
    status: z.string().optional(),
    channel: z.string().optional(),
    search: z.string().optional(),
    isSpam: z.coerce.boolean().optional(),
    isDuplicate: z.coerce.boolean().optional(),
    sortBy: z.enum(["createdAt", "urgencyScore", "upvotes", "sentimentScore"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createSchema = z.object({
    constituencyId: z.string().uuid(),
    villageId: z.string().uuid().optional(),
    title: z.string().min(5).max(200),
    description: z.string().min(10).max(4000),
    sector: z.enum([
        "education", "healthcare", "water_sanitation", "roads_transport",
        "agriculture", "energy_digital", "housing",
        "environment", "social_welfare", "skill_youth",
    ]),
    attachments: z.array(z.object({
        type: z.enum(["image", "video", "audio", "document"]),
        url: z.string().url(),
        publicId: z.string().optional(),
    })).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    address: z.string().optional(),
});

const updateSchema = z.object({
    status: z.enum(["pending", "verified", "clustered", "prioritized", "in_progress", "completed", "rejected"]).optional(),
    title: z.string().max(500).optional(),
    sector: z.string().optional(),
    priority: z.string().optional(),
    clusterId: z.string().uuid().optional(),
}).refine(data => Object.values(data).some(v => v !== undefined), {
    message: "At least one field must be provided for update",
});

// GET /
router.get("/", async (req, res) => {
    try {
        const queryResult = validateQuery(req, res, querySchema);
        if (!queryResult.success) return;

        const { page, limit, constituencyId, sector, status, channel, search, isSpam, isDuplicate, sortBy, sortOrder } = queryResult.data;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (constituencyId) conditions.push(eq(submissions.constituencyId, constituencyId));
        if (sector) conditions.push(eq(submissions.sector, sector as any));
        if (status) conditions.push(eq(submissions.status, status as any));
        if (channel) conditions.push(eq(submissions.channel, channel as any));

        if (isSpam !== undefined) conditions.push(eq(submissions.isSpam, isSpam));
        if (isDuplicate !== undefined) conditions.push(eq(submissions.isDuplicate, isDuplicate));

        if (search) {
            conditions.push(
                sql`(${submissions.title} ILIKE ${`%${search}%`} OR ${submissions.description} ILIKE ${`%${search}%`})`
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const orderFn = sortOrder === "asc"
            ? sql`${submissions[sortBy]} ASC NULLS LAST`
            : sql`${submissions[sortBy]} DESC NULLS LAST`;

        const [results, totalResult] = await Promise.all([
            db
                .select()
                .from(submissions)
                .where(whereClause)
                .orderBy(orderFn)
                .limit(limit)
                .offset(offset),
            db
                .select({ total: count(submissions.id) })
                .from(submissions)
                .where(whereClause),
        ]);

        res.json({
            data: results,
            pagination: {
                page,
                limit,
                total: totalResult[0]?.total ?? 0,
                totalPages: Math.ceil((totalResult[0]?.total ?? 0) / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch submissions", details: String(error) });
    }
});

// POST /
router.post("/", async (req, res) => {
    try {
        // Rate limit
        const rateLimitResult = await checkRateLimit(req, res, RATE_LIMIT_PRESETS.submission);
        if (!rateLimitResult.allowed) return;

        const bodyResult = validateBody(req, res, createSchema);
        if (!bodyResult.success) return;

        const data = bodyResult.data;
        const user = req.user;

        const [submission] = await db
            .insert(submissions)
            .values({
                citizenId: user?.id ?? null,
                constituencyId: data.constituencyId,
                villageId: data.villageId ?? null,
                channel: "web",
                status: "pending",
                title: data.title,
                description: data.description,
                sector: data.sector,
                attachments: data.attachments ?? null,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
                address: data.address ?? null,
            })
            .returning();

        // Enqueue for background AI processing
        await enqueueSubmission({
            submissionId: submission.id,
            constituencyId: data.constituencyId,
            text: data.description,
            channel: "web",
            location: data.lat && data.lng ? {
                lat: data.lat,
                lng: data.lng,
                address: data.address,
            } : undefined,
        });

        res.status(201).json({ data: submission });
    } catch (error) {
        res.status(500).json({ error: "Failed to create submission", details: String(error) });
    }
});

// POST /upload
router.post("/upload", uploadConfig.single("file"), async (req, res) => {
    try {
        const rateLimitResult = await checkRateLimit(req, res, RATE_LIMIT_PRESETS.upload);
        if (!rateLimitResult.allowed) return;

        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const submissionId = req.body.submissionId as string | undefined;
        const mediaType = req.body.type as string | undefined; // image, video, audio, document
        const user = req.user;

        const presetMap: Record<string, UploadPresetKey> = {
            image: "submission_image",
            video: "submission_video",
            audio: "submission_audio",
            document: "submission_document",
        };

        const preset = presetMap[mediaType ?? "image"] ?? "submission_image";

        // Validate size
        const sizeCheck = uploadService.validateFileSize(file.size, preset);
        if (!sizeCheck.valid) {
            return res.status(413).json({
                error: "File too large",
                message: `Maximum file size is ${(sizeCheck.maxSize / 1_000_000).toFixed(0)}MB`,
            });
        }

        // Validate format
        const extension = file.originalname.split(".").pop()?.toLowerCase() ?? "";
        if (!uploadService.validateFormat(extension, preset)) {
            return res.status(415).json({
                error: "Unsupported file format",
                format: extension,
            });
        }

        const result = await uploadService.uploadFromBuffer(file.buffer, {
            preset,
            submissionId,
            userId: user?.id,
            tags: [mediaType ?? "image"],
        });

        res.json({
            data: {
                url: result.secureUrl,
                publicId: result.publicId,
                format: result.format,
                resourceType: result.resourceType,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                duration: result.duration,
                thumbnailUrl: result.thumbnailUrl,
            },
        });
    } catch (error) {
        console.error("UPLOAD ERROR:", error);

        res.status(500).json({
            error: "Upload failed",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

// POST /voice
router.post("/voice", uploadConfig.single("audio"), async (req, res) => {
    try {
        const rateLimitResult = await checkRateLimit(req, res, RATE_LIMIT_PRESETS.submission);
        if (!rateLimitResult.allowed) return;

        const audioFile = req.file;
        if (!audioFile) {
            return res.status(400).json({ error: "No audio file provided" });
        }

        const { constituencyId, villageId, lat, lng, address } = req.body;

        if (!constituencyId) {
            return res.status(400).json({ error: "constituencyId is required" });
        }

        // Convert audio to base64
        const audioBase64 = audioFile.buffer.toString("base64");
        const mimeType = audioFile.mimetype || "audio/webm";

        // Upload audio to Cloudinary
        const uploadResult = await uploadService.uploadFromBuffer(audioFile.buffer, {
            preset: "submission_audio",
            userId: req.user?.id,
            tags: ["voice_submission"],
        });

        // Transcribe and extract metadata via Gemini
        const processed = await transcriptionService.processVoiceSubmission({
            audioBase64,
            mimeType,
        });

        const parsedLat = lat ? parseFloat(lat) : null;
        const parsedLng = lng ? parseFloat(lng) : null;

        // Save submission to db
        const [submission] = await db
            .insert(submissions)
            .values({
                citizenId: req.user?.id ?? null,
                constituencyId,
                villageId: villageId ?? null,
                channel: "voice",
                status: "pending",
                originalText: processed.transcription,
                translatedText: processed.translatedText,
                originalLanguage: processed.language,
                title: processed.extractedInfo.title,
                sector: processed.extractedInfo.sector as any,
                attachments: [
                    {
                        type: "audio",
                        url: uploadResult.secureUrl,
                        publicId: uploadResult.publicId,
                        mimeType,
                        duration: uploadResult.duration,
                    },
                ],
                lat: parsedLat,
                lng: parsedLng,
                address: address ?? processed.extractedInfo.location ?? null,
            })
            .returning();

        // Enqueue
        await enqueueSubmission({
            submissionId: submission.id,
            constituencyId,
            text: processed.translatedText || processed.transcription,
            channel: "voice",
            location: parsedLat && parsedLng ? {
                lat: parsedLat,
                lng: parsedLng,
                address: address ?? processed.extractedInfo.location ?? undefined,
            } : undefined,
        });

        res.status(201).json({
            data: submission,
            transcription: {
                original: processed.transcription,
                translated: processed.translatedText,
                language: processed.language,
                extractedInfo: processed.extractedInfo,
            },
            audio: {
                url: uploadResult.secureUrl,
                duration: uploadResult.duration,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Voice submission failed", details: String(error) });
    }
});

// GET /:id
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !z.string().uuid().safeParse(id).success) {
            return res.status(400).json({ error: "Invalid submission ID" });
        }

        const [submission] = await db
            .select()
            .from(submissions)
            .where(eq(submissions.id, id))
            .limit(1);

        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        res.json({ data: submission });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch submission", details: String(error) });
    }
});

// PATCH /:id
router.patch("/:id", requireRole(["admin", "mp", "department"]), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !z.string().uuid().safeParse(id).success) {
            return res.status(400).json({ error: "Invalid submission ID" });
        }

        const bodyResult = validateBody(req, res, updateSchema);
        if (!bodyResult.success) return;

        const updateData = {
            ...bodyResult.data,
            updatedAt: new Date(),
        };

        const [updated] = await db
            .update(submissions)
            .set(updateData as Record<string, unknown>)
            .where(eq(submissions.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: "Submission not found" });
        }

        res.json({ data: updated });
    } catch (error) {
        res.status(500).json({ error: "Failed to update submission", details: String(error) });
    }
});

// DELETE /:id
router.delete("/:id", requireRole(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !z.string().uuid().safeParse(id).success) {
            return res.status(400).json({ error: "Invalid submission ID" });
        }

        const [deleted] = await db
            .delete(submissions)
            .where(eq(submissions.id, id))
            .returning({ id: submissions.id });

        if (!deleted) {
            return res.status(404).json({ error: "Submission not found" });
        }

        res.json({ message: "Submission deleted", id: deleted.id });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete submission", details: String(error) });
    }
});

export default router;
