import { describe, expect, it, vi } from "vitest";

import { MediaPresignSchema } from "./media.schemas";
import {
  MediaDomainError,
  createMediaService,
  type MediaRepository,
  type ObjectStorage,
} from "./media.service";

describe("MediaPresignSchema", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "video/mp4"] as const)(
    "accepts %s",
    (type) => {
      expect(
        MediaPresignSchema.safeParse({
          name: "asset.bin",
          type,
          size: 1024,
          altText: "Медиафайл",
        }).success,
      ).toBe(true);
    },
  );

  it("rejects files larger than the configured limit", () => {
    expect(
      MediaPresignSchema.safeParse({
        name: "huge.mp4",
        type: "video/mp4",
        size: 101 * 1024 * 1024,
        altText: "Видео",
      }).success,
    ).toBe(false);
  });

  it("rejects images larger than 12 MB", () => {
    expect(
      MediaPresignSchema.safeParse({
        name: "photo.jpg",
        type: "image/jpeg",
        size: 12 * 1024 * 1024 + 1,
        altText: "Фото",
      }).success,
    ).toBe(false);
  });
});

describe("media service", () => {
  it("presigns a PUT URL with a UUID object key and normalized extension", async () => {
    const storage: ObjectStorage = {
      createPresignedPutUrl: vi.fn().mockResolvedValue({
        uploadUrl: "https://s3.example.com/upload",
        expiresInSeconds: 300,
      }),
      headObject: vi.fn(),
    };
    const repository: MediaRepository = {
      insert: vi.fn(),
      list: vi.fn(),
    };
    const service = createMediaService({
      storage,
      repository,
      bucket: "artem-media",
      publicBaseUrl: "https://s3.example.com/artem-media",
      createObjectId: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    });

    const result = await service.presign({
      name: "Hero Poster.JPG",
      type: "image/jpeg",
      size: 2048,
      altText: "Постер",
    });

    expect(result).toEqual({
      objectKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg",
      uploadUrl: "https://s3.example.com/upload",
      expiresInSeconds: 300,
      publicUrl:
        "https://s3.example.com/artem-media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg",
      mimeType: "image/jpeg",
      size: 2048,
      altText: "Постер",
    });
    expect(storage.createPresignedPutUrl).toHaveBeenCalledWith({
      objectKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg",
      mimeType: "image/jpeg",
      size: 2048,
      expiresInSeconds: 300,
    });
  });

  it("completes upload only after HeadObject confirms metadata", async () => {
    const storage: ObjectStorage = {
      createPresignedPutUrl: vi.fn(),
      headObject: vi.fn().mockResolvedValue({
        contentType: "image/png",
        contentLength: 4096,
      }),
    };
    const repository: MediaRepository = {
      insert: vi.fn().mockResolvedValue({
        id: "11111111-1111-4111-8111-111111111111",
        objectKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
        url: "https://s3.example.com/artem-media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
        mimeType: "image/png",
        size: 4096,
        altText: "Схема",
        createdAt: new Date("2026-07-12T00:00:00.000Z"),
        updatedAt: new Date("2026-07-12T00:00:00.000Z"),
      }),
      list: vi.fn(),
    };
    const service = createMediaService({
      storage,
      repository,
      bucket: "artem-media",
      publicBaseUrl: "https://s3.example.com/artem-media",
    });

    const asset = await service.complete({
      objectKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
      mimeType: "image/png",
      size: 4096,
      altText: "Схема",
    });

    expect(storage.headObject).toHaveBeenCalledWith(
      "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
    );
    expect(repository.insert).toHaveBeenCalledOnce();
    expect(asset.id).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rejects complete when HeadObject metadata mismatches", async () => {
    const storage: ObjectStorage = {
      createPresignedPutUrl: vi.fn(),
      headObject: vi.fn().mockResolvedValue({
        contentType: "image/jpeg",
        contentLength: 100,
      }),
    };
    const repository: MediaRepository = {
      insert: vi.fn(),
      list: vi.fn(),
    };
    const service = createMediaService({
      storage,
      repository,
      bucket: "artem-media",
      publicBaseUrl: "https://s3.example.com/artem-media",
    });

    await expect(
      service.complete({
        objectKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
        mimeType: "image/png",
        size: 4096,
        altText: "Схема",
      }),
    ).rejects.toBeInstanceOf(MediaDomainError);
    expect(repository.insert).not.toHaveBeenCalled();
  });
});
