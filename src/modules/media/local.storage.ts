import "server-only";

import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";

import type { ObjectStorage } from "./media.service";
import { MediaCompleteSchema, PRESIGN_EXPIRES_IN_SECONDS } from "./media.schemas";
import { createUploadSignature } from "./upload-signature";

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
  signSecret: string;
  now?: () => Date;
}): ObjectStorage {
  const rootDir = options.rootDir ?? getLocalMediaRootDir();
  const now = options.now ?? (() => new Date());

  return {
    async createPresignedPutUrl({
      objectKey,
      mimeType,
      size,
      expiresInSeconds,
    }) {
      const expiresAtUnix = Math.floor(now().getTime() / 1000) + expiresInSeconds;
      const sig = createUploadSignature({
        objectKey,
        mimeType,
        size,
        expiresAtUnix,
        secret: options.signSecret,
      });
      const params = new URLSearchParams({
        objectKey,
        mime: mimeType,
        size: String(size),
        exp: String(expiresAtUnix),
        sig,
      });
      const separator = options.uploadEndpoint.includes("?") ? "&" : "?";
      return {
        uploadUrl: `${options.uploadEndpoint}${separator}${params.toString()}`,
        expiresInSeconds: expiresInSeconds ?? PRESIGN_EXPIRES_IN_SECONDS,
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

export function assertMediaMagic(bytes: Uint8Array, objectKey: string): void {
  const extension = path.extname(objectKey).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return;
    }
  } else if (extension === ".png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (png.every((value, index) => bytes[index] === value)) {
      return;
    }
  } else if (extension === ".webp") {
    const header = Buffer.from(bytes.subarray(0, 12)).toString("ascii");
    if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
      return;
    }
  } else if (extension === ".mp4") {
    const box = Buffer.from(bytes.subarray(4, 8)).toString("ascii");
    if (box === "ftyp") {
      return;
    }
  }
  throw new Error("MEDIA_MAGIC_MISMATCH");
}

export async function writeLocalMediaObject(input: {
  objectKey: string;
  body: Buffer;
  rootDir?: string;
}): Promise<void> {
  assertSafeObjectKey(input.objectKey);
  assertMediaMagic(input.body, input.objectKey);
  const rootDir = input.rootDir ?? getLocalMediaRootDir();
  await mkdir(rootDir, { recursive: true });
  const filePath = path.join(rootDir, input.objectKey);
  await writeFile(filePath, input.body);
}

export async function writeLocalMediaStream(input: {
  objectKey: string;
  body: ReadableStream<Uint8Array> | null;
  maxBytes: number;
  rootDir?: string;
}): Promise<void> {
  assertSafeObjectKey(input.objectKey);
  if (!input.body) {
    throw new Error("EMPTY_BODY");
  }
  const rootDir = input.rootDir ?? getLocalMediaRootDir();
  await mkdir(rootDir, { recursive: true });
  const filePath = path.join(rootDir, input.objectKey);
  const reader = input.body.getReader();
  const first = await reader.read();
  if (first.done || !first.value) {
    throw new Error("EMPTY_BODY");
  }
  assertMediaMagic(first.value, input.objectKey);
  let total = first.value.byteLength;
  if (total > input.maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  const stream = createWriteStream(filePath);
  try {
    if (!stream.write(Buffer.from(first.value))) {
      await once(stream, "drain");
    }
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > input.maxBytes) {
        throw new Error("PAYLOAD_TOO_LARGE");
      }
      if (!stream.write(Buffer.from(value))) {
        await once(stream, "drain");
      }
    }
    stream.end();
    await once(stream, "finish");
  } catch (error) {
    stream.destroy();
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
}

function assertSafeObjectKey(objectKey: string): void {
  if (!MediaCompleteSchema.shape.objectKey.safeParse(objectKey).success) {
    throw new Error("Unsafe object key");
  }
}
