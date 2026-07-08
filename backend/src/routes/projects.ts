import { Router } from "express";
import { db } from "@/db";
import { projects, resolutionProofs, submissions, users } from "@/db/schema";
import { desc, eq, and, sql, count, ilike } from "drizzle-orm";
import { z } from "zod";
import { validateBody, validateQuery } from "@/middleware/validation.middleware";

const router = Router();

async function getOrCreateResolvedByUser(user: { id?: string } | undefined) {
    if (user?.id) return user.id;

    const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, "system@janniti.local"))
        .limit(1);

    if (existingUser?.id) return existingUser.id;

    const [createdUser] = await db
        .insert(users)
        .values({
            name: "System Resolution User",
            email: "system@janniti.local",
            role: "department",
            isActive: true,
        })
        .returning({ id: users.id });

    return createdUser.id;
}

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    constituencyId: z.string().uuid().optional(),
    sector: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(["aiPriorityScore", "createdAt", "estimatedCost", "completionPercentage"]).default("aiPriorityScore"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createProjectSchema = z.object({
    constituencyId: z.string().uuid(),
    title: z.string().min(5).max(500),
    description: z.string().optional(),
    sector: z.enum([
        "education", "healthcare", "water_sanitation", "roads_transport",
        "agriculture", "energy_digital", "housing",
        "environment", "social_welfare", "skill_youth",
    ]),
    estimatedCost: z.number().positive().optional(),
    allocatedBudget: z.number().min(0).optional(),
    estimatedBeneficiaries: z.number().int().positive().optional(),
    sdgGoals: z.array(z.number().int().min(1).max(17)).optional(),
    villageIds: z.array(z.string().uuid()).optional(),
    linkedClusterIds: z.array(z.string().uuid()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

const resolveSchema = z.object({
    submissionId: z.string().uuid().optional(),
    resolutionType: z.enum(["full", "partial", "rejected", "deferred"]).default("full"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    photos: z.array(z.string().url()).optional(),
    documents: z.array(z.string().url()).optional(),
    budgetUsed: z.number().min(0).optional(),
    percentageResolved: z.number().min(0).max(100).default(100),
    contractorName: z.string().optional(),
    departmentName: z.string().optional(),
    workOrderNumber: z.string().optional(),
    completionDate: z.string().optional(),
});

router.get("/", async (req, res) => {
    try {
        const queryResult = validateQuery(req, res, querySchema);
        if (!queryResult.success) return;

        const { page, limit, constituencyId, sector, status, priority, search, sortBy, sortOrder } = queryResult.data;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (constituencyId) conditions.push(eq(projects.constituencyId, constituencyId));
        if (sector) conditions.push(sql`${projects.sector} = ${sector}`);
        if (status) conditions.push(sql`${projects.status} = ${status}`);
        if (priority) conditions.push(sql`${projects.priority} = ${priority}`);
        if (search) conditions.push(ilike(projects.title, `%${search}%`));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const sortColumn = {
            aiPriorityScore: projects.aiPriorityScore,
            createdAt: projects.createdAt,
            estimatedCost: projects.estimatedCost,
            completionPercentage: projects.completionPercentage,
        }[sortBy];

        const orderFn = sortOrder === "asc"
            ? sql`${sortColumn} ASC NULLS LAST`
            : sql`${sortColumn} DESC NULLS LAST`;

        const [results, totalResult] = await Promise.all([
            db
                .select()
                .from(projects)
                .where(whereClause)
                .orderBy(orderFn)
                .limit(limit)
                .offset(offset),
            db
                .select({ total: count(projects.id) })
                .from(projects)
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
        res.status(500).json({ error: "Failed to fetch projects", details: String(error) });
    }
});

router.post("/", async (req, res) => {
    try {
        const bodyResult = validateBody(req, res, createProjectSchema);
        if (!bodyResult.success) return;

        const data = bodyResult.data;

        const [project] = await db
            .insert(projects)
            .values({
                constituencyId: data.constituencyId,
                title: data.title,
                description: data.description ?? null,
                sector: data.sector,
                estimatedCost: data.estimatedCost ?? null,
                allocatedBudget: data.allocatedBudget ?? null,
                estimatedBeneficiaries: data.estimatedBeneficiaries ?? null,
                sdgGoals: data.sdgGoals ?? null,
                villageIds: data.villageIds ?? null,
                linkedClusterIds: data.linkedClusterIds ?? null,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
            })
            .returning();

        res.status(201).json({ data: project });
    } catch (error) {
        res.status(500).json({ error: "Failed to create project", details: String(error) });
    }
});

// Resolution routes
router.get("/resolve", async (_req, res) => {
    try {
        const proofs = await db
            .select({
                id: resolutionProofs.id,
                submissionId: resolutionProofs.submissionId,
                projectId: resolutionProofs.projectId,
                description: resolutionProofs.description,
                resolutionType: resolutionProofs.resolutionType,
                photos: resolutionProofs.photos,
                documents: resolutionProofs.documents,
                budgetUsed: resolutionProofs.budgetUsed,
                percentageResolved: resolutionProofs.percentageResolved,
                contractorName: resolutionProofs.contractorName,
                departmentName: resolutionProofs.departmentName,
                workOrderNumber: resolutionProofs.workOrderNumber,
                completionDate: resolutionProofs.completionDate,
                createdAt: resolutionProofs.createdAt,
                projectTitle: projects.title,
                projectSector: projects.sector,
                projectStatus: projects.status,
                submissionTitle: submissions.title,
                submissionDescription: submissions.description,
                submissionStatus: submissions.status,
            })
            .from(resolutionProofs)
            .leftJoin(projects, eq(resolutionProofs.projectId, projects.id))
            .leftJoin(submissions, eq(resolutionProofs.submissionId, submissions.id))
            .orderBy(desc(resolutionProofs.createdAt));

        res.json({ data: proofs });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch resolution proofs", details: String(error) });
    }
});

router.get("/:id/resolve", async (req, res) => {
    try {
        const { id: projectId } = req.params;

        if (!projectId || !z.string().uuid().safeParse(projectId).success) {
            return res.status(400).json({ error: "Invalid project ID" });
        }

        const proofs = await db
            .select()
            .from(resolutionProofs)
            .where(eq(resolutionProofs.projectId, projectId));

        res.json({ data: proofs });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch resolution proofs", details: String(error) });
    }
});

router.post("/:id/resolve", async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const resolvedByUserId = await getOrCreateResolvedByUser(req.user);

        if (!projectId || !z.string().uuid().safeParse(projectId).success) {
            return res.status(400).json({ error: "Invalid project ID" });
        }

        const bodyResult = validateBody(req, res, resolveSchema);
        if (!bodyResult.success) return;

        const data = bodyResult.data;

        // Verify project exists
        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Create resolution proof
        const [proof] = await db
            .insert(resolutionProofs)
            .values({
                submissionId: data.submissionId ?? null,
                projectId,
                resolvedBy: resolvedByUserId,
                resolutionType: data.resolutionType,
                description: data.description,
                photos: data.photos ?? null,
                documents: data.documents ?? null,
                budgetUsed: data.budgetUsed ?? null,
                percentageResolved: data.percentageResolved,
                contractorName: data.contractorName ?? null,
                departmentName: data.departmentName ?? null,
                workOrderNumber: data.workOrderNumber ?? null,
                completionDate: data.completionDate ? new Date(data.completionDate) : null,
            })
            .returning();

        // Update project status and completion
        const newStatus = data.resolutionType === "full" ? "completed" : "in_progress";
        await db
            .update(projects)
            .set({
                status: newStatus,
                completionPercentage: data.percentageResolved,
                updatedAt: new Date(),
            })
            .where(eq(projects.id, projectId));

        // If linked to a submission, update submission status
        if (data.submissionId) {
            const submissionStatus = data.resolutionType === "full" ? "completed" : "in_progress";
            await db
                .update(submissions)
                .set({
                    status: submissionStatus,
                    updatedAt: new Date(),
                })
                .where(eq(submissions.id, data.submissionId));
        }

        res.status(201).json({
            data: proof,
            message: `Resolution proof created. Project marked as ${newStatus}.`,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create resolution proof", details: String(error) });
    }
});

export default router;
