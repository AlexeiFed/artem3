import { createHmac, timingSafeEqual } from "node:crypto";

export function createUploadSignature(input: {
  objectKey: string;
  mimeType: string;
  size: number;
  expiresAtUnix: number;
  secret: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(
      `${input.objectKey}\n${input.mimeType}\n${input.size}\n${input.expiresAtUnix}`,
    )
    .digest("hex");
}

export function verifyUploadSignature(input: {
  objectKey: string;
  mimeType: string;
  size: number;
  expiresAtUnix: number;
  secret: string;
  signature: string;
}): boolean {
  if (!/^[0-9a-f]{64}$/u.test(input.signature)) {
    return false;
  }
  const expected = createUploadSignature(input);
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(input.signature, "hex"),
  );
}
