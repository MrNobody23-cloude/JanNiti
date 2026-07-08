import { geminiService } from "./gemini.service";

export interface ExtractedSubmissionData {
  title: string;
  description: string;
  sector: string;
  category: string;
  location: {
    village?: string;
    block?: string;
    district?: string;
    state?: string;
    landmark?: string;
    address?: string;
  };
  affectedPopulation?: number;
  affectedHouseholds?: number;
  financialImpact?: number;
  duration?: string; // How long the problem has persisted
  previousAttempts?: string[]; // Previous attempts to resolve
  requestedSolution?: string;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  keywords: string[];
  entities: {
    people: string[];
    organizations: string[];
    schemes: string[];
    infrastructure: string[];
  };
}

export interface ExtractedDocumentData {
  documentType: string;
  title: string;
  content: string;
  keyFigures: Record<string, string | number>;
  dates: string[];
  references: string[];
}

/**
 * Structured JSON extraction service.
 * Extracts structured data from unstructured citizen submissions.
 */
export class ExtractionService {
  /**
   * Extract structured data from a raw citizen submission text.
   */
  async extractFromSubmission(params: {
    text: string;
    channel?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ExtractedSubmissionData> {
    const prompt = `Extract structured information from this citizen development submission. The submission was received via ${params.channel ?? "web"}.

Raw submission text:
"${params.text}"

${params.metadata ? `Additional metadata: ${JSON.stringify(params.metadata)}` : ""}

Extract all available information into this JSON structure:
{
  "title": "concise title (max 80 chars)",
  "description": "clean, structured description of the issue",
  "sector": "most relevant sector (education, healthcare, water_sanitation, roads_transport, agriculture, digital_infra, housing, energy, environment, social_welfare, skill_development, sports_culture)",
  "category": "specific category within sector",
  "location": {
    "village": "village name if mentioned",
    "block": "block/tehsil name if mentioned",
    "district": "district name if mentioned",
    "state": "state name if mentioned",
    "landmark": "any landmark mentioned",
    "address": "full address if constructible"
  },
  "affectedPopulation": number or null,
  "affectedHouseholds": number or null,
  "financialImpact": estimated financial impact in INR or null,
  "duration": "how long the problem has existed (e.g., '3 weeks', '2 years')",
  "previousAttempts": ["any previous attempts to get the issue resolved"],
  "requestedSolution": "what the citizen is asking for",
  "urgencyLevel": "critical|high|medium|low",
  "keywords": ["relevant keywords for search"],
  "entities": {
    "people": ["names of people mentioned"],
    "organizations": ["govt departments, NGOs, contractors mentioned"],
    "schemes": ["govt schemes mentioned (e.g., PMAY, JJM, MPLADS)"],
    "infrastructure": ["specific infrastructure mentioned (e.g., PHC, school, road)"]
  }
}

If information is not available, use null for optional fields or empty arrays.`;

    return geminiService.generateJSON<ExtractedSubmissionData>(prompt, {
      temperature: 0.1,
      systemInstruction: "You are a data extraction expert specializing in Indian governance and development contexts. Extract facts precisely without making assumptions. Use null for unavailable data.",
    });
  }

  /**
   * Extract structured data from a scanned/OCR document.
   */
  async extractFromDocument(params: {
    text: string;
    documentType?: string;
  }): Promise<ExtractedDocumentData> {
    const prompt = `Extract structured information from this ${params.documentType ?? "government"} document text (possibly from OCR):

Document text:
"${params.text}"

Respond in JSON:
{
  "documentType": "type of document (e.g., 'complaint_letter', 'petition', 'report', 'certificate')",
  "title": "document title or subject",
  "content": "cleaned and structured content",
  "keyFigures": {"figure_name": "value" for any numbers, amounts, measurements},
  "dates": ["any dates mentioned in ISO format"],
  "references": ["any reference numbers, file numbers, order numbers"]
}`;

    return geminiService.generateJSON<ExtractedDocumentData>(prompt, {
      temperature: 0.1,
      systemInstruction: "You are a document analysis expert for Indian government documents. Extract data precisely, handle OCR errors gracefully.",
    });
  }

  /**
   * Extract location information specifically for geocoding.
   */
  async extractLocation(text: string): Promise<{
    fullAddress: string;
    components: {
      village?: string;
      block?: string;
      district?: string;
      state?: string;
      pincode?: string;
      landmark?: string;
    };
    confidence: number;
  }> {
    const prompt = `Extract location/address information from this text for geocoding. This is from an Indian constituency context.

Text: "${text}"

Respond in JSON:
{
  "fullAddress": "best constructible address string for Google Maps geocoding",
  "components": {
    "village": "village/town name",
    "block": "block/tehsil",
    "district": "district",
    "state": "state",
    "pincode": "PIN code if mentioned",
    "landmark": "nearest landmark"
  },
  "confidence": 0.0 to 1.0 (how confident you are about the location)
}`;

    return geminiService.generateJSON(prompt, {
      temperature: 0.1,
    });
  }
}

// Singleton instance
export const extractionService = new ExtractionService();
