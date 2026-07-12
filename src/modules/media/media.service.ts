import "server-only";

import { randomUUID } from "node:crypto";

import { desc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";

import {
  MediaCompleteSchema,
  MediaPresignSchema,
  PRESIGN_EXPIRES_IN_SECONDS,
  type MediaCompleteInput,
  type MediaPresignInput,
} from "./media.schemas";

export type MediaErrorCode = "VALIDATION" | "CONFLICT" | "PERSISTENCE";

export class MediaDomainError extends Error {
  constructor(
    readonly code: MediaErrorCode,
    readonly fields?: Record<string, string[]>,
    cause?: Error,
  ) {
    super(code, cause ? { cause } : undefined);
    this.name = "MediaDomainError";
  }
}

export interface MediaAssetRecord {
  id: string;
  objectKey: string;
  url: string;
  mimeType: string;
  size: number;
  altText: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObjectStorage {
  createPresignedPutUrl(input: {
    objectKey: string;
    mimeType: string;
    size: number;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; expiresInSeconds: number }>;
  headObject(objectKey: string): Promise<{
    contentType: string;
    contentLength: number;
  }>;
}

export interface MediaRepository {
  insert(input: {
    objectKey: string;
    url: string;
    mimeType: string;
    size: number;
    altText: string;
  }): Promise<MediaAssetRecord>;
  list(): Promise<MediaAssetRecord[]>;
}

export interface PresignResult {
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
  publicUrl: string;
  mimeType: string;
  size: number;
  altText: string;
}

interface MediaServiceDependencies {
  storage: ObjectStorage;
  repository: MediaRepository;
  bucket: string;
  publicBaseUrl: string;
  createObjectId?: () => string;
}

export interface MediaService {
  presign(input: unknown): Promise<PresignResult>;
  complete(input: unknown): Promise<MediaAssetRecord>;
  list(): Promise<MediaAssetRecord[]>;
}

const EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
} as const;

export function createMediaService({
  storage,
  repository,
  publicBaseUrl,
  createObjectId = randomUUID,
}: MediaServiceDependencies): MediaService {
  return {
    async presign(input: unknown): Promise<PresignResult> {
      const parsed = parsePresign(input);
      const extension = EXTENSION_BY_MIME[parsed.type];
      const objectKey = `${createObjectId()}.${extension}`;
      const signed = await storage.createPresignedPutUrl({
        objectKey,
        mimeType: parsed.type,
        size: parsed.size,
        expiresInSeconds: PRESIGN_EXPIRES_IN_SECONDS,
      });

      return {
        objectKey,
        uploadUrl: signed.uploadUrl,
        expiresInSeconds: signed.expiresInSeconds,
        publicUrl: `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`,
        mimeType: parsed.type,
        size: parsed.size,
        altText: parsed.altText,
      };
    },

    async complete(input: unknown): Promise<MediaAssetRecord> {
      const parsed = parseComplete(input);
      let head: { contentType: string; contentLength: number };
      try {
        head = await storage.headObject(parsed.objectKey);
      } catch (error) {
        throw new MediaDomainError(
          "PERSISTENCE",
          undefined,
          error instanceof Error ? error : undefined,
        );
      }

      if (
        normalizeMime(head.contentType) !== normalizeMime(parsed.mimeType) ||
        head.contentLength !== parsed.size
      ) {
        throw new MediaDomainError("CONFLICT", {
          objectKey: [
            "Метаданные объекта в S3 не совпадают с заявленными значениями",
          ],
        });
      }

      try {
        return await repository.insert({
          objectKey: parsed.objectKey,
          url: `${publicBaseUrl.replace(/\/$/, "")}/${parsed.objectKey}`,
          mimeType: parsed.mimeType,
          size: parsed.size,
          altText: parsed.altText,
        });
      } catch (error) {
        throw new MediaDomainError(
          "PERSISTENCE",
          undefined,
          error instanceof Error ? error : undefined,
        );
      }
    },

    async list(): Promise<MediaAssetRecord[]> {
      try {
        return await repository.list();
      } catch (error) {
        throw new MediaDomainError(
          "PERSISTENCE",
          undefined,
          error instanceof Error ? error : undefined,
        );
      }
    },
  };
}

export class DrizzleMediaRepository implements MediaRepository {
  constructor(private readonly db = getDb()) {}

  async insert(input: {
    objectKey: string;
    url: string;
    mimeType: string;
    size: number;
    altText: string;
  }): Promise<MediaAssetRecord> {
    const [created] = await this.db
      .insert(mediaAssets)
      .values({
        objectKey: input.objectKey,
        url: input.url,
        mimeType: input.mimeType,
        size: input.size,
        altText: input.altText,
      })
      .returning();

    if (!created) {
      throw new Error("Media insert returned no row");
    }

    return created;
  }

  list(): Promise<MediaAssetRecord[]> {
    return this.db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt));
  }
}

function parsePresign(input: unknown): MediaPresignInput {
  const parsed = MediaPresignSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  return parsed.data;
}

function parseComplete(input: unknown): MediaCompleteInput {
  const parsed = MediaCompleteSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  return parsed.data;
}

function validationError(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): MediaDomainError {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_form";
    fields[path] ??= [];
    fields[path].push(issue.message);
  }
  return new MediaDomainError("VALIDATION", fields);
}

function normalizeMime(value: string): string {
  return value.trim().toLowerCase().split(";")[0] ?? "";
}
