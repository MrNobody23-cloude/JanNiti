import { Request, Response, NextFunction } from "express";
import { env } from "@/config/env";

// Declare interface expansion for Express Request
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export type UserRole = "citizen" | "mp" | "admin" | "department" | "analyst";

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    constituencyId?: string;
}

/**
 * Optional authentication middleware:
 * Fetches session from Next.js Auth API using the request's cookies.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const cookie = req.headers.cookie;
    if (!cookie) {
        return next();
    }

    try {
        const nextAuthUrl = env.NEXTAUTH_URL || "http://localhost:3000";
        const sessionRes = await fetch(`${nextAuthUrl}/api/auth/session`, {
            headers: { cookie },
        });

        if (!sessionRes.ok) {
            return next();
        }

        const session = (await sessionRes.json()) as any;
        if (session && session.user) {
            req.user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: (session.user.role as UserRole) ?? "citizen",
                constituencyId: session.user.constituencyId,
            };
        }
    } catch (error) {
        console.error("Backend auth session check failed:", error);
    }
    next();
}

/**
 * Require authentication - returns 401 if not authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required",
        });
    }
    next();
}

/**
 * Require specific role(s) - returns 403 if role doesn't match.
 */
export function requireRole(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden",
                message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
            });
        }

        next();
    };
}

/**
 * Check if user has access to a specific constituency.
 */
export function hasConstituencyAccess(
    user: AuthenticatedUser,
    constituencyId: string
): boolean {
    // Admins have access to all constituencies
    if (user.role === "admin") return true;

    // MPs, departments, and analysts are bound to their constituency
    if (user.constituencyId && user.constituencyId === constituencyId) return true;

    // Citizens can submit to any constituency
    if (user.role === "citizen") return true;

    return false;
}
