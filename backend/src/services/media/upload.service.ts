import { cloudinary, UPLOAD_PRESETS, type UploadPresetKey } from "@/config/cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number; // For audio/video
  thumbnailUrl?: string;
  createdAt: string;
}

export interface UploadOptions {
  preset: UploadPresetKey;
  submissionId?: string;
  userId?: string;
  tags?: string[];
}

/**
 * Media upload service using Cloudinary.
 * Handles images, videos, audio, and documents for citizen submissions.
 */
export class UploadService {
  /**
   * Upload a file from a base64-encoded buffer.
   */
  async uploadFromBase64(
    base64Data: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const preset = UPLOAD_PRESETS[options.preset];
    const dataUri = base64Data.startsWith("data:")
      ? base64Data
      : `data:application/octet-stream;base64,${base64Data}`;

    const tags = [
      ...(options.tags ?? []),
      options.preset,
      ...(options.submissionId ? [`submission:${options.submissionId}`] : []),
      ...(options.userId ? [`user:${options.userId}`] : []),
    ];

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(dataUri, {
        folder: preset.folder,
        resource_type: "resource_type" in preset ? preset.resource_type : "image",
        tags,
        ...("transformation" in preset && { transformation: preset.transformation }),
        context: {
          submission_id: options.submissionId ?? "",
          user_id: options.userId ?? "",
          upload_preset: options.preset,
        },
      });

      return this.mapResult(result);
    } catch (error) {
      const cloudinaryError = error as UploadApiErrorResponse;
      throw new Error(
        `Upload failed: ${cloudinaryError.message ?? "Unknown error"}`
      );
    }
  }

  /**
   * Upload a file from a URL (e.g., WhatsApp media URL).
   */
  async uploadFromUrl(
    url: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const preset = UPLOAD_PRESETS[options.preset];

    const tags = [
      ...(options.tags ?? []),
      options.preset,
      ...(options.submissionId ? [`submission:${options.submissionId}`] : []),
    ];

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(url, {
        folder: preset.folder,
        resource_type: "resource_type" in preset ? preset.resource_type : "image",
        tags,
        ...("transformation" in preset && { transformation: preset.transformation }),
      });

      return this.mapResult(result);
    } catch (error) {
      const cloudinaryError = error as UploadApiErrorResponse;
      throw new Error(
        `Upload from URL failed: ${cloudinaryError.message ?? "Unknown error"}`
      );
    }
  }

  /**
   * Upload a file from a Buffer (server-side file handling).
   */
  async uploadFromBuffer(
    buffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    const base64 = buffer.toString("base64");
    return this.uploadFromBase64(base64, options);
  }

  /**
   * Delete a file from Cloudinary.
   */
  async deleteFile(publicId: string, resourceType: string = "image"): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as "image" | "video" | "raw",
      });
      return result.result === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Generate a thumbnail URL for a video.
   */
  getVideoThumbnail(publicId: string, options?: { width?: number; height?: number }): string {
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        {
          width: options?.width ?? 400,
          height: options?.height ?? 300,
          crop: "fill",
          gravity: "auto",
        },
        { start_offset: "1" }, // Grab frame at 1 second
      ],
    });
  }

  /**
   * Get a signed URL for a private/restricted file.
   */
  getSignedUrl(publicId: string, resourceType: string = "image", expiresInSeconds: number = 3600): string {
    return cloudinary.url(publicId, {
      resource_type: resourceType as "image" | "video" | "raw",
      sign_url: true,
      type: "authenticated",
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    });
  }

  /**
   * Validate file size against preset limits.
   */
  validateFileSize(bytes: number, preset: UploadPresetKey): { valid: boolean; maxSize: number } {
    const maxSize = UPLOAD_PRESETS[preset].max_file_size;
    return {
      valid: bytes <= maxSize,
      maxSize,
    };
  }

  /**
   * Validate file format against preset allowed formats.
   */
  validateFormat(format: string, preset: UploadPresetKey): boolean {
    const allowedFormats = UPLOAD_PRESETS[preset].allowed_formats;
    return (allowedFormats as readonly string[]).includes(format.toLowerCase());
  }

  private mapResult(result: UploadApiResponse): UploadResult {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      thumbnailUrl: result.resource_type === "video"
        ? this.getVideoThumbnail(result.public_id)
        : undefined,
      createdAt: result.created_at,
    };
  }
}

// Singleton instance
export const uploadService = new UploadService();
