import { geminiService } from "@/services/ai/gemini.service";
import { translationService } from "@/services/ai/translation.service";

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration?: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionWithTranslation extends TranscriptionResult {
  translatedText?: string;
  originalLanguage: string;
}

/**
 * Voice/Audio transcription service using Gemini Flash.
 * Handles multilingual audio from citizen submissions.
 */
export class TranscriptionService {
  /**
   * Transcribe audio from base64-encoded data.
   */
  async transcribeAudio(params: {
    audioBase64: string;
    mimeType: string;
    expectedLanguage?: string;
  }): Promise<TranscriptionResult> {
    const { audioBase64, mimeType, expectedLanguage } = params;

    const textPart = {
      text: `Transcribe the following audio recording. This is a citizen submission about a development issue in India.
${expectedLanguage ? `The expected language is ${expectedLanguage}.` : "The audio may be in Hindi, English, or another Indian language."}

Provide:
1. The complete transcription in the original language
2. Identify the language spoken
3. Your confidence level

Respond in JSON format:
{
  "text": "complete transcription in original language",
  "language": "ISO 639-1 language code (e.g., hi, en, ta, te, bn)",
  "confidence": 0.0 to 1.0,
  "segments": [
    {"startTime": 0, "endTime": 5, "text": "segment text", "speaker": "speaker1"}
  ]
}

If the audio is unclear or has multiple speakers, still transcribe what you can hear.`,
    };

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType,
      },
    };

    const response = await geminiService.generateMultimodal(
      [textPart, audioPart],
      {
        temperature: 0.1,
        jsonMode: true,
        systemInstruction: "You are an expert audio transcription system specializing in Indian languages. Transcribe accurately, preserving dialect and colloquialisms.",
      }
    );

    try {
      return JSON.parse(response.text) as TranscriptionResult;
    } catch {
      // Fallback: treat the entire response as the transcription
      return {
        text: response.text,
        language: expectedLanguage ?? "hi",
        confidence: 0.7,
      };
    }
  }

  /**
   * Transcribe and translate audio to English.
   */
  async transcribeAndTranslate(params: {
    audioBase64: string;
    mimeType: string;
    expectedLanguage?: string;
  }): Promise<TranscriptionWithTranslation> {
    const transcription = await this.transcribeAudio(params);

    let translatedText: string | undefined;

    if (transcription.language !== "en" && transcription.text) {
      const translation = await translationService.translateToEnglish(
        transcription.text,
        transcription.language
      );
      translatedText = translation.translatedText;
    }

    return {
      ...transcription,
      translatedText: translatedText ?? transcription.text,
      originalLanguage: transcription.language,
    };
  }

  /**
   * Extract key information from a voice submission (transcribe + extract).
   * Combines transcription with structured extraction in one call.
   */
  async processVoiceSubmission(params: {
    audioBase64: string;
    mimeType: string;
  }): Promise<{
    transcription: string;
    language: string;
    translatedText: string;
    extractedInfo: {
      title: string;
      sector: string;
      location?: string;
      urgency: string;
      keyIssue: string;
    };
  }> {
    const textPart = {
      text: `This is a voice recording from a citizen reporting a development issue in India. 

Please:
1. Transcribe the audio completely in its original language
2. Translate to English if not already in English
3. Extract key information

Respond in JSON:
{
  "transcription": "full transcription in original language",
  "language": "ISO 639-1 code",
  "translatedText": "English translation (same as transcription if already in English)",
  "extractedInfo": {
    "title": "brief title for the issue (max 80 chars)",
    "sector": "one of: education, healthcare, water_sanitation, roads_transport, agriculture, digital_infra, housing, energy, environment, social_welfare, skill_development, sports_culture",
    "location": "any location/village/area mentioned",
    "urgency": "critical|high|medium|low",
    "keyIssue": "one sentence summary of the core issue"
  }
}`,
    };

    const audioPart = {
      inlineData: {
        data: params.audioBase64,
        mimeType: params.mimeType,
      },
    };

    const response = await geminiService.generateMultimodal(
      [textPart, audioPart],
      {
        temperature: 0.2,
        jsonMode: true,
        systemInstruction: "You are an expert at transcribing and understanding citizen grievances from voice recordings in Indian languages.",
      }
    );

    try {
      return JSON.parse(response.text);
    } catch {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to process voice submission");
    }
  }
}

// Singleton instance
export const transcriptionService = new TranscriptionService();
