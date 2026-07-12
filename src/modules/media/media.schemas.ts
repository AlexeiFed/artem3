import { z } from "zod";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_MIME_TYPES = ["video/mp4"] as const;
export const ALLOWED_MEDIA_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
] as const;

export const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const PRESIGN_EXPIRES_IN_SECONDS = 5 * 60;

const MediaMimeTypeSchema = z.enum(ALLOWED_MEDIA_MIME_TYPES);

export const MediaPresignSchema = z
  .object({
    name: z.string().trim().min(1).max(180),
    type: MediaMimeTypeSchema,
    size: z.number().int().positive(),
    altText: z.string().trim().min(1).max(500),
  })
  .strict()
  .superRefine((value, context) => {
    const maximum = IMAGE_MIME_TYPES.includes(
      value.type as (typeof IMAGE_MIME_TYPES)[number],
    )
      ? IMAGE_MAX_BYTES
      : VIDEO_MAX_BYTES;
    if (value.size > maximum) {
      context.addIssue({
        code: "custom",
        path: ["size"],
        message: `Размер файла превышает лимит ${maximum} байт`,
      });
    }
  });

export const MediaCompleteSchema = z
  .object({
    objectKey: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpe?g|png|webp|mp4)$/i,
      ),
    mimeType: MediaMimeTypeSchema,
    size: z.number().int().positive(),
    altText: z.string().trim().min(1).max(500),
  })
  .strict()
  .superRefine((value, context) => {
    const maximum = IMAGE_MIME_TYPES.includes(
      value.mimeType as (typeof IMAGE_MIME_TYPES)[number],
    )
      ? IMAGE_MAX_BYTES
      : VIDEO_MAX_BYTES;
    if (value.size > maximum) {
      context.addIssue({
        code: "custom",
        path: ["size"],
        message: `Размер файла превышает лимит ${maximum} байт`,
      });
    }
  });

export type MediaPresignInput = z.infer<typeof MediaPresignSchema>;
export type MediaCompleteInput = z.infer<typeof MediaCompleteSchema>;
