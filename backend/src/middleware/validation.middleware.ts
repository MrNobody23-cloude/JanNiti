import { Request, Response } from "express";
import { z, type ZodSchema } from "zod";

export interface ValidationSuccess<T> {
    success: true;
    data: T;
}

export interface ValidationFailure {
    success: false;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validate request body against a Zod schema.
 * Returns parsed data or sends a 400 error response.
 */
export function validateBody<T>(
    req: Request,
    res: Response,
    schema: ZodSchema<T>
): ValidationResult<T> {
    try {
        const parsed = schema.safeParse(req.body);

        if (!parsed.success) {
            const errors = parsed.error.flatten();
            res.status(400).json({
                error: "Validation Error",
                message: "Invalid request body",
                details: {
                    fieldErrors: errors.fieldErrors,
                    formErrors: errors.formErrors,
                },
            });
            return { success: false };
        }

        return { success: true, data: parsed.data };
    } catch {
        res.status(400).json({
            error: "Invalid JSON",
            message: "Request body must be valid JSON",
        });
        return { success: false };
    }
}

/**
 * Validate query parameters against a Zod schema.
 */
export function validateQuery<T>(
    req: Request,
    res: Response,
    schema: ZodSchema<T>
): ValidationResult<T> {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
        res.status(400).json({
            error: "Validation Error",
            message: "Invalid query parameters",
            details: parsed.error.flatten().fieldErrors,
        });
        return { success: false };
    }

    return { success: true, data: parsed.data };
}

/**
 * Validate route parameters (e.g., :id path segments).
 */
export function validateParams<T>(
    req: Request,
    res: Response,
    schema: ZodSchema<T>
): ValidationResult<T> {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
        res.status(400).json({
            error: "Validation Error",
            message: "Invalid route parameters",
            details: parsed.error.flatten().fieldErrors,
        });
        return { success: false };
    }

    return { success: true, data: parsed.data };
}

// Common validation schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const uuidParamSchema = z.object({
    id: z.string().uuid("Invalid ID format"),
});

export const constituencyFilterSchema = z.object({
    constituencyId: z.string().uuid().optional(),
    sector: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type ConstituencyFilter = z.infer<typeof constituencyFilterSchema>;
