import { geminiService } from "./gemini.service";

export interface ImageAnalysisResult {
  description: string;
  category: string;
  issues: string[];
  severity: "critical" | "high" | "medium" | "low";
  infrastructureType?: string;
  condition?: string;
  estimatedDamage?: string;
  locationClues: string[];
  relevantSector: string;
  tags: string[];
}

export interface DocumentOCRResult {
  extractedText: string;
  documentType: string;
  language: string;
  confidence: number;
  structuredFields: Record<string, string>;
}

/**
 * Vision/Image understanding service using Gemini Flash.
 * Analyzes images of infrastructure damage, documents, and development sites.
 */
export class VisionService {
  /**
   * Analyze an image submitted with a citizen complaint.
   * Identifies infrastructure issues, damage severity, and context.
   */
  async analyzeSubmissionImage(params: {
    imageBase64: string;
    mimeType: string;
    submissionContext?: string;
  }): Promise<ImageAnalysisResult> {
    const textPart = {
      text: `Analyze this image submitted by a citizen as part of a development complaint in India.
${params.submissionContext ? `Context from citizen: "${params.submissionContext}"` : ""}

Identify:
1. What infrastructure or issue is shown
2. The severity/condition of the problem
3. Any location clues visible
4. Which development sector this relates to

Respond in JSON:
{
  "description": "detailed description of what's shown in the image",
  "category": "type of issue (e.g., 'road_damage', 'water_contamination', 'building_collapse', 'flooding')",
  "issues": ["list of specific problems visible"],
  "severity": "critical|high|medium|low",
  "infrastructureType": "type of infrastructure shown (e.g., 'road', 'school', 'hospital', 'water_pipe')",
  "condition": "current condition (e.g., 'severely damaged', 'partially functional')",
  "estimatedDamage": "rough estimate of damage extent if visible",
  "locationClues": ["any text, signs, landmarks visible that could help locate this"],
  "relevantSector": "most relevant sector (education, healthcare, water_sanitation, roads_transport, etc.)",
  "tags": ["relevant tags for categorization"]
}`,
    };

    const imagePart = {
      inlineData: {
        data: params.imageBase64,
        mimeType: params.mimeType,
      },
    };

    const response = await geminiService.generateMultimodal(
      [textPart, imagePart],
      {
        temperature: 0.2,
        jsonMode: true,
        systemInstruction: "You are an infrastructure assessment expert analyzing citizen-submitted images of development issues in India. Be precise about severity assessment.",
      }
    );

    try {
      return JSON.parse(response.text) as ImageAnalysisResult;
    } catch {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ImageAnalysisResult;
      }
      throw new Error("Failed to parse vision analysis result");
    }
  }

  /**
   * OCR a document image (letters, petitions, certificates).
   */
  async ocrDocument(params: {
    imageBase64: string;
    mimeType: string;
    expectedLanguage?: string;
  }): Promise<DocumentOCRResult> {
    const textPart = {
      text: `Extract all text from this document image. The document is likely in ${params.expectedLanguage ?? "Hindi or English"} and is a government or citizen document from India.

Respond in JSON:
{
  "extractedText": "full text extracted from the document, preserving structure",
  "documentType": "type of document (e.g., 'complaint_letter', 'application', 'certificate', 'notice')",
  "language": "primary language of the document",
  "confidence": 0.0 to 1.0,
  "structuredFields": {
    "subject": "subject line if present",
    "date": "date if present",
    "from": "sender if identifiable",
    "to": "recipient if identifiable",
    "reference_number": "any reference/file number"
  }
}`,
    };

    const imagePart = {
      inlineData: {
        data: params.imageBase64,
        mimeType: params.mimeType,
      },
    };

    const response = await geminiService.generateMultimodal(
      [textPart, imagePart],
      {
        temperature: 0.1,
        jsonMode: true,
        systemInstruction: "You are an OCR expert for Indian government documents in multiple languages. Extract text accurately and identify document structure.",
      }
    );

    try {
      return JSON.parse(response.text) as DocumentOCRResult;
    } catch {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as DocumentOCRResult;
      }
      throw new Error("Failed to parse OCR result");
    }
  }

  /**
   * Analyze a resolution proof image (before/after comparison).
   */
  async analyzeResolutionProof(params: {
    imageBase64: string;
    mimeType: string;
    originalIssue: string;
    claimedResolution: string;
  }): Promise<{
    isResolved: boolean;
    confidence: number;
    observations: string[];
    concerns?: string[];
  }> {
    const textPart = {
      text: `Verify if this image shows evidence of a resolved development issue.

Original issue: "${params.originalIssue}"
Claimed resolution: "${params.claimedResolution}"

Analyze the image and determine if it credibly shows the issue has been resolved.

Respond in JSON:
{
  "isResolved": true/false,
  "confidence": 0.0 to 1.0,
  "observations": ["what you can see in the image that supports/contradicts resolution"],
  "concerns": ["any concerns about the resolution quality or authenticity"]
}`,
    };

    const imagePart = {
      inlineData: {
        data: params.imageBase64,
        mimeType: params.mimeType,
      },
    };

    const response = await geminiService.generateMultimodal(
      [textPart, imagePart],
      {
        temperature: 0.2,
        jsonMode: true,
      }
    );

    try {
      return JSON.parse(response.text);
    } catch {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse resolution proof analysis");
    }
  }
}

// Singleton instance
export const visionService = new VisionService();
