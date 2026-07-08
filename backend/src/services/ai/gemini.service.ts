import { geminiFlash, AI_CONFIG } from "@/config/ai-clients";
import type { GenerateContentResult, Part } from "@google/generative-ai";

export interface GeminiResponse {
  text: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  jsonMode?: boolean;
}

/**
 * Core Gemini 2.5 Flash service wrapper with retry logic and structured output support.
 */
export class GeminiService {
  private maxRetries = 3;
  private baseDelay = 1000;

  /**
   * Generate text content from a prompt.
   */
  async generateText(
    prompt: string,
    options: GeminiOptions = {}
  ): Promise<GeminiResponse> {
    const {
      temperature = AI_CONFIG.gemini.temperature,
      maxOutputTokens = AI_CONFIG.gemini.maxOutputTokens,
      systemInstruction,
      jsonMode = false,
    } = options;

    return this.withRetry(async () => {
      const result = await geminiFlash.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: jsonMode ? "application/json" : "text/plain",
        },
        ...(systemInstruction && {
          systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        }),
      });

      return this.parseResult(result);
    });
  }

  /**
   * Generate content with multimodal input (text + images/audio).
   */
  async generateMultimodal(
    parts: Part[],
    options: GeminiOptions = {}
  ): Promise<GeminiResponse> {
    const {
      temperature = AI_CONFIG.gemini.temperature,
      maxOutputTokens = AI_CONFIG.gemini.maxOutputTokens,
      systemInstruction,
      jsonMode = false,
    } = options;

    return this.withRetry(async () => {
      const result = await geminiFlash.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: jsonMode ? "application/json" : "text/plain",
        },
        ...(systemInstruction && {
          systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        }),
      });

      return this.parseResult(result);
    });
  }

  /**
   * Generate structured JSON output from a prompt.
   */
  async generateJSON<T = Record<string, unknown>>(
    prompt: string,
    options: Omit<GeminiOptions, "jsonMode"> = {}
  ): Promise<T> {
    const response = await this.generateText(prompt, { ...options, jsonMode: true });

    try {
      return JSON.parse(response.text) as T;
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error(`Failed to parse JSON response: ${response.text.slice(0, 200)}`);
    }
  }

  /**
   * Stream text generation for real-time responses.
   */
  async *streamText(
    prompt: string,
    options: GeminiOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const {
      temperature = AI_CONFIG.gemini.temperature,
      maxOutputTokens = AI_CONFIG.gemini.maxOutputTokens,
      systemInstruction,
    } = options;

    const result = await geminiFlash.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
      ...(systemInstruction && {
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
      }),
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  private parseResult(result: GenerateContentResult): GeminiResponse {
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      text,
      tokensUsed: {
        prompt: usage?.promptTokenCount ?? 0,
        completion: usage?.candidatesTokenCount ?? 0,
        total: usage?.totalTokenCount ?? 0,
      },
    };
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const message = lastError.message || "";

        // Don't retry on invalid request errors
        if (message.includes("400") || message.includes("INVALID_ARGUMENT")) {
          throw lastError;
        }

        // Retry on rate limits and server errors
        if (
          message.includes("429") ||
          message.includes("503") ||
          message.includes("500")
        ) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }
}

// Singleton instance
export const geminiService = new GeminiService();
