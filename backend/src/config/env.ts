import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // AI Models
  GEMINI_API_KEY: z.string().default(""),
  DEEPSEEK_API_KEY: z.string().default(""),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().default(""),

  // Auth
  NEXTAUTH_SECRET: z.string().default("dev-secret-change-in-production"),
  NEXTAUTH_URL: z.string().default("http://localhost:3000"),

  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Optional
  BHASHINI_API_KEY: z.string().optional(),
  BHASHINI_USER_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(", ")}`)
      .join("\n");

    console.error("❌ Environment validation failed:\n" + errorMessages);

    // In development, return defaults so the app doesn't crash
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️  Running with partial env. Some features may be unavailable.");
      return envSchema.parse(process.env ?? {});
    }

    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();
