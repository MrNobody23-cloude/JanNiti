import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Upload presets for different media types
export const UPLOAD_PRESETS = {
  submission_image: {
    folder: "janniti/submissions/images",
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
    allowed_formats: ["jpg", "jpeg", "png", "webp", "heic"],
    max_file_size: 10_000_000, // 10MB
  },
  submission_video: {
    folder: "janniti/submissions/videos",
    resource_type: "video" as const,
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "mp4" },
    ],
    allowed_formats: ["mp4", "mov", "avi", "webm"],
    max_file_size: 100_000_000, // 100MB
  },
  submission_audio: {
    folder: "janniti/submissions/audio",
    resource_type: "video" as const, // Cloudinary uses 'video' resource_type for audio
    allowed_formats: ["mp3", "wav", "ogg", "m4a", "webm"],
    max_file_size: 25_000_000, // 25MB
  },
  submission_document: {
    folder: "janniti/submissions/documents",
    resource_type: "raw" as const,
    allowed_formats: ["pdf", "doc", "docx", "txt"],
    max_file_size: 20_000_000, // 20MB
  },
  resolution_proof: {
    folder: "janniti/resolutions/proofs",
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto:good" },
    ],
    allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    max_file_size: 15_000_000, // 15MB
  },
} as const;

export type UploadPresetKey = keyof typeof UPLOAD_PRESETS;
