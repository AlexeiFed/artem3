import "server-only";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getServerEnv } from "@/lib/env/server";

import type { ObjectStorage } from "./media.service";

export function createS3ClientFromEnv(): S3Client {
  const env = getServerEnv();
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export function createS3ObjectStorage(
  client: S3Client = createS3ClientFromEnv(),
  bucket: string = getServerEnv().S3_BUCKET,
): ObjectStorage {
  return {
    async createPresignedPutUrl({
      objectKey,
      mimeType,
      size,
      expiresInSeconds,
    }) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: mimeType,
        ContentLength: size,
      });
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: expiresInSeconds,
      });
      return { uploadUrl, expiresInSeconds };
    },

    async headObject(objectKey) {
      const result = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      );
      return {
        contentType: result.ContentType ?? "",
        contentLength: result.ContentLength ?? 0,
      };
    },
  };
}

export function buildPublicMediaBaseUrl(
  endpoint: string,
  bucket: string,
): string {
  return `${endpoint.replace(/\/$/, "")}/${bucket}`;
}
