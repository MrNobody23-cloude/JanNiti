import { Router } from "express";
import { z } from "zod";
import { db } from "@/db";
import { submissions, clusters, villages } from "@/db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { validateQuery } from "@/middleware/validation.middleware";
import { geocodingService } from "@/services/geo/geocoding.service";

const router = Router();

const geocodeQuerySchema = z.object({
    address: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
});

const hotspotsQuerySchema = z.object({
    constituencyId: z.string().uuid().optional(),
    sector: z.string().optional(),
    type: z.enum(["submissions", "clusters", "villages"]).default("submissions"),
    minUrgency: z.coerce.number().min(0).max(1).optional(),
});

router.get("/geocode", async (req, res) => {
    try {
        const queryResult = validateQuery(req, res, geocodeQuerySchema);
        if (!queryResult.success) return;

        const { address, lat, lng, district, state } = queryResult.data;

        // Forward geocoding
        if (address) {
            let result;
            if (district && state) {
                result = await geocodingService.geocodeInConstituency({
                    locationText: address,
                    district,
                    state,
                });
            } else {
                result = await geocodingService.geocode(address);
            }

            if (!result) {
                return res.status(404).json({ error: "Could not geocode the provided address" });
            }

            return res.json({ data: result });
        }

        // Reverse geocoding
        if (lat !== undefined && lng !== undefined) {
            const result = await geocodingService.reverseGeocode(lat, lng);

            if (!result) {
                return res.status(404).json({ error: "Could not reverse geocode the provided coordinates" });
            }

            return res.json({ data: result });
        }

        res.status(400).json({
            error: "Provide either 'address' for forward geocoding or 'lat' & 'lng' for reverse geocoding",
        });
    } catch (error) {
        res.status(500).json({ error: "Geocoding failed", details: String(error) });
    }
});

router.get("/hotspots", async (req, res) => {
    try {
        const queryResult = validateQuery(req, res, hotspotsQuerySchema);
        if (!queryResult.success) return;

        const { constituencyId, sector, type, minUrgency } = queryResult.data;

        if (type === "submissions") {
            const conditions = [isNotNull(submissions.lat), isNotNull(submissions.lng)];
            if (constituencyId) conditions.push(eq(submissions.constituencyId, constituencyId));
            if (sector) conditions.push(sql`${submissions.sector} = ${sector}`);
            if (minUrgency) conditions.push(sql`${submissions.urgencyScore} >= ${minUrgency}`);

            const results = await db
                .select({
                    id: submissions.id,
                    lat: submissions.lat,
                    lng: submissions.lng,
                    title: submissions.title,
                    sector: submissions.sector,
                    urgencyScore: submissions.urgencyScore,
                    sentimentScore: submissions.sentimentScore,
                    status: submissions.status,
                    upvotes: submissions.upvotes,
                    createdAt: submissions.createdAt,
                })
                .from(submissions)
                .where(and(...conditions))
                .limit(500);

            const geoJson = {
                type: "FeatureCollection" as const,
                features: results.map((s) => ({
                    type: "Feature" as const,
                    geometry: {
                        type: "Point" as const,
                        coordinates: [s.lng, s.lat],
                    },
                    properties: {
                        id: s.id,
                        title: s.title,
                        sector: s.sector,
                        urgency: s.urgencyScore,
                        sentiment: s.sentimentScore,
                        status: s.status,
                        upvotes: s.upvotes,
                        weight: s.urgencyScore ?? 0.5,
                    },
                })),
            };

            return res.json({ data: geoJson, total: results.length });
        }

        if (type === "clusters") {
            const conditions = [];
            if (constituencyId) conditions.push(eq(clusters.constituencyId, constituencyId));
            if (sector) conditions.push(sql`${clusters.sector} = ${sector}`);

            const results = await db
                .select()
                .from(clusters)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(sql`${clusters.hotspotScore} DESC NULLS LAST`)
                .limit(50);

            return res.json({ data: results, total: results.length });
        }

        if (type === "villages") {
            const conditions = [];
            if (constituencyId) conditions.push(eq(villages.constituencyId, constituencyId));

            const results = await db
                .select({
                    id: villages.id,
                    name: villages.name,
                    lat: villages.lat,
                    lng: villages.lng,
                    population: villages.population,
                    infrastructureScore: villages.infrastructureScore,
                    developmentRank: villages.developmentRank,
                    submissionCount: sql<number>`(
            SELECT COUNT(*) FROM submissions 
            WHERE submissions.village_id = ${villages.id}
          )`,
                    avgUrgency: sql<number>`(
            SELECT AVG(urgency_score) FROM submissions 
            WHERE submissions.village_id = ${villages.id}
          )`,
                })
                .from(villages)
                .where(conditions.length > 0 ? and(...conditions) : undefined);

            const geoJson = {
                type: "FeatureCollection" as const,
                features: results
                    .filter((v) => v.lat && v.lng)
                    .map((v) => ({
                        type: "Feature" as const,
                        geometry: {
                            type: "Point" as const,
                            coordinates: [v.lng, v.lat],
                        },
                        properties: {
                            id: v.id,
                            name: v.name,
                            population: v.population,
                            infrastructureScore: v.infrastructureScore,
                            developmentRank: v.developmentRank,
                            submissionCount: v.submissionCount,
                            avgUrgency: v.avgUrgency,
                        },
                    })),
            };

            return res.json({ data: geoJson, total: results.length });
        }

        res.status(400).json({ error: "Invalid type" });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch hotspot data", details: String(error) });
    }
});

export default router;
