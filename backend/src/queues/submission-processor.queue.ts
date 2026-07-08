import { Queue, Worker, Job, type ConnectionOptions } from "bullmq";
import { getRedisClient } from "@/config/redis";
import { translationService } from "@/services/ai/translation.service";
import { summarizationService } from "@/services/ai/summarization.service";
import { classificationService } from "@/services/ai/classification.service";
import { extractionService } from "@/services/ai/extraction.service";
import { embeddingService } from "@/services/ai/embedding.service";
import { geocodingService } from "@/services/geo/geocoding.service";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Job types
export interface SubmissionProcessingJob {
  submissionId: string;
  constituencyId: string;
  text: string;
  channel: string;
  attachments?: Array<{
    type: "image" | "video" | "audio" | "document";
    url: string;
    base64?: string;
    mimeType: string;
  }>;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
}

export interface EmbeddingGenerationJob {
  submissionId: string;
  text: string;
}

// Queue names
export const QUEUE_NAMES = {
  SUBMISSION_PROCESSOR: "submission-processor",
  EMBEDDING_GENERATOR: "embedding-generator",
  REPORT_GENERATOR: "report-generator",
} as const;

/**
 * Create the submission processing queue.
 */
export function createSubmissionQueue(): Queue<SubmissionProcessingJob> {
  const connection = getRedisClient() as unknown as ConnectionOptions;

  return new Queue(QUEUE_NAMES.SUBMISSION_PROCESSOR, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  });
}

/**
 * Create the embedding generation queue.
 */
export function createEmbeddingQueue(): Queue<EmbeddingGenerationJob> {
  const connection = getRedisClient() as unknown as ConnectionOptions;

  return new Queue(QUEUE_NAMES.EMBEDDING_GENERATOR, {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
      removeOnComplete: {
        count: 500,
      },
    },
  });
}

/**
 * Create the submission processing worker.
 * This is the main AI pipeline that processes each citizen submission.
 */
export function createSubmissionWorker(): Worker<SubmissionProcessingJob> {
  const connection = getRedisClient() as unknown as ConnectionOptions;

  const worker = new Worker(
    QUEUE_NAMES.SUBMISSION_PROCESSOR,
    async (job: Job<SubmissionProcessingJob>) => {
      const { submissionId, constituencyId, text, channel, location } = job.data;

      console.log(`[Queue] Processing submission ${submissionId} (step 1/7)`);

      try {
        // Step 1: Language detection & translation
        await job.updateProgress(10);
        const languageResult = await translationService.detectLanguage(text);
        let translatedText = text;

        if (languageResult.language !== "en") {
          const translation = await translationService.translateToEnglish(
            text,
            languageResult.language
          );
          translatedText = translation.translatedText;
        }

        // Step 2: Summarization
        await job.updateProgress(25);
        const summary = await summarizationService.summarizeSubmission({
          text: translatedText,
          channel,
          location: location?.address,
        });

        // Step 3: Classification (sector, sentiment, spam)
        await job.updateProgress(40);
        const [classification, sentiment, spam] = await Promise.all([
          classificationService.classifySubmission({ text: translatedText, title: summary.title }),
          classificationService.analyzeSentiment(translatedText),
          classificationService.detectSpam(translatedText),
        ]);

        // Step 4: Structured extraction
        await job.updateProgress(55);
        const extracted = await extractionService.extractFromSubmission({
          text: translatedText,
          channel,
        });

        // Step 5: Geocoding (if address available but no coordinates)
        await job.updateProgress(70);
        let geoResult = null;
        if (location?.address && (!location?.lat || !location?.lng)) {
          geoResult = await geocodingService.geocode(location.address);
        } else if (extracted.location?.address) {
          geoResult = await geocodingService.geocode(
            [
              extracted.location.village,
              extracted.location.block,
              extracted.location.district,
              extracted.location.state,
            ]
              .filter(Boolean)
              .join(", ") + ", India"
          );
        }

        // Step 6: Embedding generation
        await job.updateProgress(85);
        const embeddingText = `${summary.title}. ${translatedText}`;
        const { embedding } = await embeddingService.generateEmbedding(embeddingText);

        // Step 7: Duplicate detection
        const duplicateCheck = await embeddingService.checkDuplicate({
          text: embeddingText,
          constituencyId,
        });

        // Step 8: Cluster assignment
        const clusterMatch = await embeddingService.findNearestCluster({
          embedding,
          constituencyId,
        });

        await job.updateProgress(95);

        // Update submission with AI results
        const updateData = {
          originalLanguage: languageResult.language,
          translatedText: languageResult.language !== "en" ? translatedText : null,
          title: summary.title,
          description: extracted.description || summary.summary,
          sector: classification.sector as typeof submissions.$inferInsert.sector,
          category: classification.category,
          subCategory: classification.subCategory,
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label,
          urgencyScore: sentiment.urgencyScore,
          impactScore: sentiment.impactScore,
          isDuplicate: duplicateCheck.isDuplicate,
          duplicateOfId: duplicateCheck.duplicateOfId ?? null,
          isSpam: spam.isSpam,
          spamScore: spam.spamScore,
          topics: classification.tags,
          keywords: extracted.keywords,
          clusterId: clusterMatch?.clusterId ?? null,
          lat: geoResult?.lat ?? location?.lat ?? null,
          lng: geoResult?.lng ?? location?.lng ?? null,
          address: geoResult?.formattedAddress ?? location?.address ?? null,
          status: spam.isSpam ? "rejected" : duplicateCheck.isDuplicate ? "verified" : "verified",
          updatedAt: new Date(),
        };

        await db
          .update(submissions)
          .set(updateData as Record<string, unknown>)
          .where(eq(submissions.id, submissionId));

        await job.updateProgress(100);

        return {
          success: true,
          submissionId,
          results: {
            language: languageResult.language,
            sector: classification.sector,
            sentiment: sentiment.label,
            urgency: sentiment.urgencyScore,
            isDuplicate: duplicateCheck.isDuplicate,
            isSpam: spam.isSpam,
            clusterId: clusterMatch?.clusterId,
            geocoded: !!geoResult,
          },
        };
      } catch (error) {
        console.error(`[Queue] Error processing submission ${submissionId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 3, // Process 3 submissions concurrently
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute (rate limit protection)
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Queue] Submission ${job.data.submissionId} processed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Queue] Submission ${job?.data.submissionId} failed:`, err.message);
  });

  return worker;
}

// Queue instances (lazy initialization)
let submissionQueue: Queue<SubmissionProcessingJob> | null = null;
let embeddingQueue: Queue<EmbeddingGenerationJob> | null = null;

export function getSubmissionQueue(): Queue<SubmissionProcessingJob> {
  if (!submissionQueue) {
    submissionQueue = createSubmissionQueue();
  }
  return submissionQueue;
}

export function getEmbeddingQueue(): Queue<EmbeddingGenerationJob> {
  if (!embeddingQueue) {
    embeddingQueue = createEmbeddingQueue();
  }
  return embeddingQueue;
}

/**
 * Add a submission to the processing queue.
 */
export async function enqueueSubmission(data: SubmissionProcessingJob): Promise<string> {
  const queue = getSubmissionQueue();
  const job = await queue.add("process-submission", data, {
    priority: data.channel === "voice" ? 1 : 2, // Prioritize voice (likely urgent)
  });
  return job.id!;
}
