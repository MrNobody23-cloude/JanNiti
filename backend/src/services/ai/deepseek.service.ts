import { deepseek, MODELS, AI_CONFIG } from "@/config/ai-clients";

export interface DeepSeekResponse {
  text: string;
  reasoning?: string; // Chain-of-thought reasoning from R1
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface DeepSeekOptions {
  model?: typeof MODELS.DEEPSEEK_R1 | typeof MODELS.DEEPSEEK_CHAT;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * DeepSeek R1 service wrapper for reasoning-heavy tasks
 * (decision explanations, solution recommendations).
 */
export class DeepSeekService {
  private maxRetries = 3;
  private baseDelay = 2000;

  /**
   * Generate a reasoned response using DeepSeek R1.
   * Returns both the reasoning chain and the final answer.
   */
  async generateReasoning(
    prompt: string,
    options: DeepSeekOptions = {}
  ): Promise<DeepSeekResponse> {
    const {
      model = MODELS.DEEPSEEK_R1,
      maxTokens = AI_CONFIG.deepseek.maxTokens,
      systemPrompt,
    } = options;

    return this.withRetry(async () => {
      const messages: Array<{ role: "system" | "user"; content: string }> = [];

      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await deepseek.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        // Note: DeepSeek R1 ignores temperature (always uses internal reasoning)
        stream: false,
      });

      const choice = response.choices[0];
      const message = choice?.message;

      return {
        text: message?.content ?? "",
        reasoning: (message as unknown as Record<string, unknown>)?.reasoning_content as string | undefined,
        tokensUsed: {
          prompt: response.usage?.prompt_tokens ?? 0,
          completion: response.usage?.completion_tokens ?? 0,
          total: response.usage?.total_tokens ?? 0,
        },
      };
    });
  }

  /**
   * Generate a chat response using DeepSeek Chat (faster, cheaper than R1).
   * Use for less complex tasks that still benefit from DeepSeek's capabilities.
   */
  async generateChat(
    prompt: string,
    options: Omit<DeepSeekOptions, "model"> = {}
  ): Promise<DeepSeekResponse> {
    return this.generateReasoning(prompt, {
      ...options,
      model: MODELS.DEEPSEEK_CHAT,
    });
  }

  /**
   * Stream reasoning response for real-time display.
   */
  async *streamReasoning(
    prompt: string,
    options: DeepSeekOptions = {}
  ): AsyncGenerator<{ type: "reasoning" | "content"; text: string }, void, unknown> {
    const {
      model = MODELS.DEEPSEEK_R1,
      maxTokens = AI_CONFIG.deepseek.maxTokens,
      systemPrompt,
    } = options;

    const messages: Array<{ role: "system" | "user"; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const stream = await deepseek.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // DeepSeek R1 streams reasoning_content before content
      const reasoningContent = (delta as Record<string, unknown>)?.reasoning_content;
      if (reasoningContent && typeof reasoningContent === "string") {
        yield { type: "reasoning", text: reasoningContent };
      }

      if (delta.content) {
        yield { type: "content", text: delta.content };
      }
    }
  }

  /**
   * Generate a decision explanation with structured reasoning.
   */
  async explainDecision(params: {
    context: string;
    question: string;
    factors: string[];
    constraints?: string[];
  }): Promise<{
    explanation: string;
    reasoning: string;
    confidence: number;
    keyFactors: string[];
  }> {
    const prompt = `You are a governance and development policy expert. Analyze the following decision context and provide a detailed explanation.

## Context
${params.context}

## Question
${params.question}

## Factors to Consider
${params.factors.map((f, i) => `${i + 1}. ${f}`).join("\n")}

${params.constraints ? `## Constraints\n${params.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}` : ""}

Respond in JSON format:
{
  "explanation": "Clear, concise explanation of the decision (2-3 paragraphs)",
  "keyFactors": ["list of most influential factors"],
  "confidence": 0.0 to 1.0,
  "tradeoffs": "brief description of tradeoffs",
  "recommendation": "final recommendation"
}`;

    const response = await this.generateReasoning(prompt, {
      systemPrompt: "You are an expert policy analyst. Respond only with valid JSON.",
    });

    try {
      const parsed = JSON.parse(response.text);
      return {
        explanation: parsed.explanation ?? response.text,
        reasoning: response.reasoning ?? "",
        confidence: parsed.confidence ?? 0.7,
        keyFactors: parsed.keyFactors ?? params.factors,
      };
    } catch {
      return {
        explanation: response.text,
        reasoning: response.reasoning ?? "",
        confidence: 0.7,
        keyFactors: params.factors,
      };
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const message = lastError.message || "";

        // Don't retry on client errors (except rate limits)
        if (
          message.includes("400") ||
          message.includes("401") ||
          message.includes("403")
        ) {
          throw lastError;
        }

        // Retry on rate limits and server errors
        if (
          message.includes("429") ||
          message.includes("502") ||
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
export const deepseekService = new DeepSeekService();
