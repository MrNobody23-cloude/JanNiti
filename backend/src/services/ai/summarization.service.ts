import { geminiService } from "./gemini.service";

export interface SummaryResult {
  title: string;
  summary: string;
  keyPoints: string[];
  urgencyIndicators: string[];
  affectedPopulation?: string;
}

export interface ClusterSummaryResult {
  clusterName: string;
  description: string;
  commonThemes: string[];
  sentimentOverview: string;
  recommendedAction: string;
  totalAffected: string;
}

/**
 * Summarization service for citizen complaints and cluster summaries.
 * Uses Gemini Flash for fast, accurate summarization.
 */
export class SummarizationService {
  /**
   * Summarize a single citizen submission/complaint.
   */
  async summarizeSubmission(params: {
    text: string;
    channel?: string;
    location?: string;
  }): Promise<SummaryResult> {
    const prompt = `Summarize the following citizen development complaint/suggestion submitted via ${params.channel ?? "web"}.
${params.location ? `Location: ${params.location}` : ""}

Citizen's submission:
"${params.text}"

Respond in JSON format:
{
  "title": "concise title (max 80 chars) capturing the core issue",
  "summary": "2-3 sentence summary of the issue, preserving key facts and figures",
  "keyPoints": ["list of 3-5 key points/facts mentioned"],
  "urgencyIndicators": ["any words/phrases indicating urgency or emergency"],
  "affectedPopulation": "estimated affected population if mentioned (e.g., '5700 households')"
}`;

    return geminiService.generateJSON<SummaryResult>(prompt, {
      temperature: 0.2,
      systemInstruction: "You are an expert at summarizing citizen grievances for government officials. Be factual, concise, and preserve critical numbers and locations.",
    });
  }

  /**
   * Generate a summary for a cluster of related submissions.
   */
  async summarizeCluster(params: {
    submissions: Array<{ text: string; location?: string; date?: string }>;
    existingClusterName?: string;
  }): Promise<ClusterSummaryResult> {
    const submissionTexts = params.submissions
      .slice(0, 20) // Limit to 20 for context window
      .map((s, i) => `[${i + 1}] ${s.location ? `(${s.location})` : ""} ${s.text}`)
      .join("\n\n");

    const prompt = `Analyze the following cluster of ${params.submissions.length} related citizen submissions and provide a cluster summary.
${params.existingClusterName ? `Current cluster name: "${params.existingClusterName}"` : ""}

Submissions:
${submissionTexts}

Respond in JSON format:
{
  "clusterName": "descriptive name for this issue cluster (3-5 words)",
  "description": "2-3 sentence description of the common issue",
  "commonThemes": ["list of recurring themes across submissions"],
  "sentimentOverview": "overall sentiment description (e.g., 'Frustrated and urgent, with growing desperation')",
  "recommendedAction": "suggested high-level action to address this cluster",
  "totalAffected": "estimated total affected population based on mentions"
}`;

    return geminiService.generateJSON<ClusterSummaryResult>(prompt, {
      temperature: 0.3,
      systemInstruction: "You are a governance analyst specializing in clustering and summarizing citizen feedback for policy makers. Identify patterns and recommend actions.",
    });
  }

  /**
   * Generate a brief one-line summary (for list views, notifications).
   */
  async generateBrief(text: string): Promise<string> {
    const response = await geminiService.generateText(
      `Summarize this citizen complaint in exactly one sentence (max 100 characters): "${text.slice(0, 500)}"`,
      {
        temperature: 0.1,
        maxOutputTokens: 100,
      }
    );

    return response.text.trim();
  }
}

// Singleton instance
export const summarizationService = new SummarizationService();
