import { geminiService } from "./gemini.service";
import { SECTORS } from "./lib/constants";

export interface ClassificationResult {
  sector: string;
  category: string;
  subCategory: string;
  department: string;
  confidence: number;
  sdgGoals: number[];
  tags: string[];
}

export interface SentimentResult {
  score: number; // -1.0 to 1.0
  label: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
  urgencyScore: number; // 0.0 to 1.0
  impactScore: number; // 0.0 to 1.0
  emotions: string[];
}

/**
 * Classification service for sector tagging, sentiment analysis,
 * and department routing of citizen submissions.
 */
export class ClassificationService {
  private sectorList = SECTORS.map((s) => s.id).join(", ");

  /**
   * Classify a submission into sector, category, and department.
   */
  async classifySubmission(params: {
    text: string;
    title?: string;
    location?: string;
  }): Promise<ClassificationResult> {
    const prompt = `Classify the following citizen development complaint/suggestion into the appropriate sector, category, and government department.

Available sectors: ${this.sectorList}

Submission:
${params.title ? `Title: ${params.title}` : ""}
Text: "${params.text}"
${params.location ? `Location: ${params.location}` : ""}

Respond in JSON format:
{
  "sector": "one of the available sectors (use exact id)",
  "category": "specific category within the sector (e.g., 'primary_healthcare', 'drinking_water', 'rural_roads')",
  "subCategory": "more specific sub-category if applicable",
  "department": "relevant government department (e.g., 'Health Department', 'PWD', 'Jal Shakti')",
  "confidence": 0.0 to 1.0,
  "sdgGoals": [list of relevant SDG goal numbers 1-17],
  "tags": ["relevant tags for search and filtering"]
}`;

    return geminiService.generateJSON<ClassificationResult>(prompt, {
      temperature: 0.1,
      systemInstruction: "You are a government administration expert who classifies citizen grievances into the correct sector and department for routing. Use the exact sector IDs provided.",
    });
  }

  /**
   * Analyze sentiment, urgency, and impact of a submission.
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const prompt = `Analyze the sentiment, urgency, and potential impact of this citizen submission about a development issue.

Text: "${text}"

Consider:
- Sentiment: How does the citizen feel? (-1.0 = very angry/desperate, 0 = neutral, 1.0 = positive/hopeful)
- Urgency: How time-sensitive is this? (0.0 = can wait, 1.0 = immediate action needed)
- Impact: How many people are affected and how severely? (0.0 = minor, 1.0 = life-threatening/critical)

Respond in JSON format:
{
  "score": -1.0 to 1.0,
  "label": "very_negative|negative|neutral|positive|very_positive",
  "urgencyScore": 0.0 to 1.0,
  "impactScore": 0.0 to 1.0,
  "emotions": ["list of detected emotions, e.g., 'frustration', 'fear', 'hope'"]
}`;

    return geminiService.generateJSON<SentimentResult>(prompt, {
      temperature: 0.1,
      systemInstruction: "You are a sentiment analysis expert for citizen grievances in the Indian governance context. Be precise with urgency scoring - life-threatening situations should always score above 0.9.",
    });
  }

  /**
   * Detect if a submission is spam or irrelevant.
   */
  async detectSpam(text: string): Promise<{ isSpam: boolean; spamScore: number; reason?: string }> {
    const prompt = `Determine if this citizen submission is spam, irrelevant, or abusive content. Consider that legitimate complaints may be emotional or contain strong language.

Text: "${text.slice(0, 500)}"

Respond in JSON:
{
  "isSpam": true/false,
  "spamScore": 0.0 to 1.0 (0 = definitely legitimate, 1 = definitely spam),
  "reason": "brief reason if spam (e.g., 'promotional content', 'unintelligible', 'abusive without substance')"
}`;

    return geminiService.generateJSON<{ isSpam: boolean; spamScore: number; reason?: string }>(prompt, {
      temperature: 0.1,
    });
  }

  /**
   * Batch classify multiple submissions (for bulk processing).
   */
  async batchClassify(
    submissions: Array<{ id: string; text: string }>
  ): Promise<Map<string, ClassificationResult>> {
    const results = new Map<string, ClassificationResult>();
    const batchSize = 3;

    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize);
      const promises = batch.map(async (sub) => {
        const result = await this.classifySubmission({ text: sub.text });
        results.set(sub.id, result);
      });
      await Promise.all(promises);
    }

    return results;
  }
}

// Singleton instance
export const classificationService = new ClassificationService();
