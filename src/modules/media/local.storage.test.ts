import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createLocalObjectStorage,
  writeLocalMediaObject,
} from "./local.storage";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("local media storage", () => {
  it("writes objects and returns head metadata", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "artem-media-"));
    tempDirs.push(rootDir);
    const storage = createLocalObjectStorage({
      rootDir,
      uploadEndpoint: "http://localhost:3000/api/admin/media/local-upload",
      signSecret: "s".repeat(32),
    });

    const objectKey = "11111111-1111-4111-8111-111111111111.jpg";
    const signed = await storage.createPresignedPutUrl({
      objectKey,
      mimeType: "image/jpeg",
      size: 4,
      expiresInSeconds: 60,
    });
    expect(signed.uploadUrl).toContain(`objectKey=${objectKey}`);
    expect(signed.uploadUrl).toContain("sig=");

    await writeLocalMediaObject({
      objectKey,
      body: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
      rootDir,
    });
    expect(await readFile(path.join(rootDir, objectKey))).toEqual(
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    );

    await expect(storage.headObject(objectKey)).resolves.toEqual({
      contentType: "image/jpeg",
      contentLength: 6,
    });
  });

  it("rejects path traversal keys", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "artem-media-"));
    tempDirs.push(rootDir);

    await expect(
      writeLocalMediaObject({
        objectKey: "../escape.jpg",
        body: Buffer.from("x"),
        rootDir,
      }),
    ).rejects.toThrow(/Unsafe object key/);
  });

  it("rejects HTML and other non-media object keys", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "artem-media-"));
    tempDirs.push(rootDir);

    await expect(
      writeLocalMediaObject({
        objectKey: "xss.html",
        body: Buffer.from("<script>alert(1)</script>"),
        rootDir,
      }),
    ).rejects.toThrow(/Unsafe object key/);
  });
});
