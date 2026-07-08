import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "./env";

// Lazy initialization — only create clients when actually used
let _genAI: GoogleGenerativeAI | null = null;
let _geminiFlash: GenerativeModel | null = null;
let _geminiEmbedding: GenerativeModel | null = null;
let _deepseek: OpenAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
    _genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return _genAI;
}

export function getGeminiFlash(): GenerativeModel {
  if (!_geminiFlash) {
    _geminiFlash = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return _geminiFlash;
}

// Keep backward-compatible exports
export const geminiFlash = new Proxy({} as GenerativeModel, {
  get(_, prop) {
    return (getGeminiFlash() as any)[prop];
  },
});

export const geminiFlashWithVision = geminiFlash;

export const geminiEmbedding = new Proxy({} as GenerativeModel, {
  get(_, prop) {
    if (!_geminiEmbedding) {
      _geminiEmbedding = getGenAI().getGenerativeModel({ model: "text-embedding-004" });
    }
    return (_geminiEmbedding as any)[prop];
  },
});

export const deepseek = new Proxy({} as OpenAI, {
  get(_, prop) {
    if (!_deepseek) {
      if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");
      _deepseek = new OpenAI({
        apiKey: env.DEEPSEEK_API_KEY,
        baseURL: env.DEEPSEEK_BASE_URL,
      });
    }
    return (_deepseek as any)[prop];
  },
});

// Model identifiers
export const MODELS = {
  GEMINI_FLASH: "gemini-2.5-flash",
  GEMINI_EMBEDDING: "text-embedding-004",
  DEEPSEEK_R1: "deepseek-reasoner",
  DEEPSEEK_CHAT: "deepseek-chat",
} as const;

// Token limits and configuration
export const AI_CONFIG = {
  gemini: {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
  deepseek: {
    maxTokens: 4096,
    temperature: 0.6,
  },
  embedding: {
    dimensions: 768,
    taskType: "RETRIEVAL_DOCUMENT" as const,
  },
} as const;
