import "dotenv/config";
import { createSubmissionWorker } from "@/queues/submission-processor.queue";
import { getRedisClient } from "@/config/redis";

console.log("🚀 Starting JanNiti AI Background Worker...");

const redis = getRedisClient();
redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

const worker = createSubmissionWorker();

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
    process.exit(1);
});

process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down worker...");
    await worker.close();
    process.exit(0);
});

console.log("✅ Worker started. Listening for jobs...");
