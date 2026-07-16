import "server-only";

import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ObjectStorage } from "./media.service";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

export function getLocalMediaRootDir(): string {
  return path.join(process.cwd(), "public", "media", "uploads");
}

export function buildLocalMediaPublicBaseUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/media/uploads`;
}

export function createLocalObjectStorage(options: {
  rootDir?: string;
  uploadEndpoint: string;
}): ObjectStorage {
  const rootDir = options.rootDir ?? getLocalMediaRootDir();

  return {
    async createPresignedPutUrl({ objectKey, expiresInSeconds }) {
      const separator = options.uploadEndpoint.includes("?") ? "&" : "?";
      return {
        uploadUrl: `${options.uploadEndpoint}${separator}objectKey=${encodeURIComponent(objectKey)}`,
        expiresInSeconds,
      };
    },

    async headObject(objectKey) {
      assertSafeObjectKey(objectKey);
      const filePath = path.join(rootDir, objectKey);
      const info = await stat(filePath);
      if (!info.isFile()) {
        throw new Error("Local media object is not a file");
      }
      const extension = path.extname(objectKey).toLowerCase();
      return {
        contentType: MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
        contentLength: info.size,
      };
    },
  };
}

export async function writeLocalMediaObject(input: {
  objectKey: string;
  body: Buffer;
  rootDir?: string;
}): Promise<void> {
  assertSafeObjectKey(input.objectKey);
  const rootDir = input.rootDir ?? getLocalMediaRootDir();
  await mkdir(rootDir, { recursive: true });
  const filePath = path.join(rootDir, input.objectKey);
  await writeFile(filePath, input.body);
}

function assertSafeObjectKey(objectKey: string): void {
  if (
    objectKey.includes("..") ||
    objectKey.includes("/") ||
    objectKey.includes("\\") ||
    objectKey.length === 0
  ) {
    throw new Error("Unsafe object key");
  }
}
