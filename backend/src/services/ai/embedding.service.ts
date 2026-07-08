import { geminiEmbedding, AI_CONFIG } from "@/config/ai-clients";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
}

export interface SimilarityResult {
  id: string;
  score: number;
  distance: number;
}

/**
 * Embedding service for vector search, duplicate detection, and RAG.
 * Uses Gemini text-embedding-004 model (768 dimensions).
 */
export class EmbeddingService {
  private dimensions = AI_CONFIG.embedding.dimensions;

  /**
   * Generate embedding for a single text.
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const result = await geminiEmbedding.embedContent({
      content: { parts: [{ text }], role: "user" },
    });

    const embedding = result.embedding.values;

    return {
      embedding,
      dimensions: embedding.length,
    };
  }

  /**
   * Generate embeddings for multiple texts (batch).
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((text) => this.generateEmbedding(text))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Find similar submissions using cosine similarity via pgvector.
   */
  async findSimilar(params: {
    embedding: number[];
    table?: string;
    limit?: number;
    threshold?: number;
    excludeId?: string;
  }): Promise<SimilarityResult[]> {
    const {
      embedding,
      table = "submissions",
      limit = 10,
      threshold = 0.8,
      excludeId,
    } = params;

    const embeddingStr = `[${embedding.join(",")}]`;

    const query = sql`
      SELECT 
        id,
        1 - (embedding <=> ${embeddingStr}::vector) as score,
        embedding <=> ${embeddingStr}::vector as distance
      FROM ${sql.raw(table)}
      WHERE embedding IS NOT NULL
      ${excludeId ? sql`AND id != ${excludeId}` : sql``}
      AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${threshold}
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    const results = await db.execute(query);

    return (results.rows as Array<{ id: string; score: number; distance: number }>).map((row) => ({
      id: row.id,
      score: Number(row.score),
      distance: Number(row.distance),
    }));
  }

  /**
   * Check if a submission is a duplicate of an existing one.
   */
  async checkDuplicate(params: {
    text: string;
    constituencyId: string;
    threshold?: number;
  }): Promise<{
    isDuplicate: boolean;
    duplicateOfId?: string;
    similarity: number;
  }> {
    const { text, threshold = 0.92 } = params;

    const { embedding } = await this.generateEmbedding(text);
    const embeddingStr = `[${embedding.join(",")}]`;

    const query = sql`
      SELECT 
        id,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM submissions
      WHERE embedding IS NOT NULL
        AND constituency_id = ${params.constituencyId}
      ORDER BY embedding <=> ${embeddingStr}::vector ASC
      LIMIT 1
    `;

    const results = await db.execute(query);
    const topMatch = results.rows[0] as { id: string; similarity: number } | undefined;

    if (topMatch && Number(topMatch.similarity) >= threshold) {
      return {
        isDuplicate: true,
        duplicateOfId: topMatch.id,
        similarity: Number(topMatch.similarity),
      };
    }

    return {
      isDuplicate: false,
      similarity: topMatch ? Number(topMatch.similarity) : 0,
    };
  }

  /**
   * Find the nearest cluster for a submission based on embeddings.
   */
  async findNearestCluster(params: {
    embedding: number[];
    constituencyId: string;
    threshold?: number;
  }): Promise<{ clusterId: string; similarity: number } | null> {
    const { embedding, constituencyId, threshold = 0.75 } = params;
    const embeddingStr = `[${embedding.join(",")}]`;

    const query = sql`
      SELECT 
        c.id,
        1 - (s.embedding <=> ${embeddingStr}::vector) as similarity
      FROM clusters c
      JOIN submissions s ON s.cluster_id = c.id
      WHERE c.constituency_id = ${constituencyId}
        AND s.embedding IS NOT NULL
      GROUP BY c.id
      HAVING AVG(1 - (s.embedding <=> ${embeddingStr}::vector)) >= ${threshold}
      ORDER BY AVG(s.embedding <=> ${embeddingStr}::vector) ASC
      LIMIT 1
    `;

    const results = await db.execute(query);
    const match = results.rows[0] as { id: string; similarity: number } | undefined;

    if (match) {
      return { clusterId: match.id, similarity: Number(match.similarity) };
    }

    return null;
  }

  /**
   * Retrieve relevant documents for RAG based on a query.
   */
  async retrieveForRAG(params: {
    query: string;
    limit?: number;
    tables?: string[];
  }): Promise<Array<{ id: string; table: string; score: number; content: string }>> {
    const { query, limit = 5, tables = ["submissions"] } = params;
    const { embedding } = await this.generateEmbedding(query);
    const embeddingStr = `[${embedding.join(",")}]`;

    const results: Array<{ id: string; table: string; score: number; content: string }> = [];

    for (const table of tables) {
      const contentColumn = table === "submissions" ? "description" : "description";

      const queryResult = await db.execute(sql`
        SELECT 
          id,
          ${sql.raw(contentColumn)} as content,
          1 - (embedding <=> ${embeddingStr}::vector) as score
        FROM ${sql.raw(table)}
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingStr}::vector ASC
        LIMIT ${limit}
      `);

      for (const row of queryResult.rows as Array<{ id: string; content: string; score: number }>) {
        results.push({
          id: row.id,
          table,
          score: Number(row.score),
          content: row.content,
        });
      }
    }

    // Sort by score descending and return top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
