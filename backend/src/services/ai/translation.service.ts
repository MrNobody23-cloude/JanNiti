import { geminiService } from "./gemini.service";
import { INDIAN_LANGUAGES } from "./lib/constants";

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface LanguageDetectionResult {
  language: string;
  languageName: string;
  confidence: number;
}

/**
 * Multilingual translation service using Gemini Flash.
 * Supports all 22 scheduled Indian languages + English.
 */
export class TranslationService {
  private supportedLanguages = INDIAN_LANGUAGES.map((l) => l.code);

  /**
   * Detect the language of input text.
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const prompt = `Detect the language of the following text. Respond in JSON format only.

Text: "${text.slice(0, 500)}"

Respond with:
{
  "language": "ISO 639-1 code (e.g., hi, ta, en, bn, te, kn, mr, gu, ml, pa, or, as)",
  "languageName": "full language name",
  "confidence": 0.0 to 1.0
}`;

    const result = await geminiService.generateJSON<LanguageDetectionResult>(prompt, {
      temperature: 0.1,
      systemInstruction: "You are a language detection expert for Indian languages. Respond only with valid JSON.",
    });

    return result;
  }

  /**
   * Translate text from source language to target language.
   */
  async translate(
    text: string,
    targetLanguage: string = "en",
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const sourceLang = sourceLanguage || (await this.detectLanguage(text)).language;

    // No translation needed if same language
    if (sourceLang === targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage,
        confidence: 1.0,
      };
    }

    const targetLangName = INDIAN_LANGUAGES.find((l) => l.code === targetLanguage)?.name ?? targetLanguage;
    const sourceLangName = INDIAN_LANGUAGES.find((l) => l.code === sourceLang)?.name ?? sourceLang;

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Preserve the meaning, tone, and context accurately. If there are proper nouns or location names, keep them as-is.

Source text (${sourceLangName}):
"${text}"

Respond with ONLY the translated text, no additional commentary.`;

    const response = await geminiService.generateText(prompt, {
      temperature: 0.2,
      systemInstruction: `You are an expert translator specializing in Indian languages. Translate accurately while preserving cultural context and meaning.`,
    });

    return {
      translatedText: response.text.trim(),
      sourceLanguage: sourceLang,
      targetLanguage,
      confidence: 0.9,
    };
  }

  /**
   * Translate text to English (most common use case for processing).
   */
  async translateToEnglish(text: string, sourceLanguage?: string): Promise<TranslationResult> {
    return this.translate(text, "en", sourceLanguage);
  }

  /**
   * Batch translate multiple texts.
   */
  async batchTranslate(
    texts: string[],
    targetLanguage: string = "en"
  ): Promise<TranslationResult[]> {
    // Process in parallel with concurrency limit
    const batchSize = 5;
    const results: TranslationResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((text) => this.translate(text, targetLanguage))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Check if a language is supported.
   */
  isSupported(languageCode: string): boolean {
    return this.supportedLanguages.includes(languageCode);
  }
}

// Singleton instance
export const translationService = new TranslationService();
