import "server-only";

export class PayloadTooLargeError extends Error {
  constructor() {
    super("PAYLOAD_TOO_LARGE");
    this.name = "PayloadTooLargeError";
  }
}

export async function readLimitedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > maximumBytes
  ) {
    throw new PayloadTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return parseJson("");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return parseJson(new TextDecoder().decode(bytes));
}

const MAX_JSON_DEPTH = 8;
const MAX_JSON_KEYS = 40;

function parseJson(value: string): unknown {
  const parsed: unknown = JSON.parse(value);
  assertJsonBounds(parsed, 0);
  return parsed;
}

function assertJsonBounds(value: unknown, depth: number): void {
  if (depth > MAX_JSON_DEPTH) {
    throw new PayloadTooLargeError();
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_JSON_KEYS) {
      throw new PayloadTooLargeError();
    }
    for (const item of value) {
      assertJsonBounds(item, depth + 1);
    }
    return;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length > MAX_JSON_KEYS) {
      throw new PayloadTooLargeError();
    }
    for (const key of keys) {
      assertJsonBounds(Reflect.get(value, key), depth + 1);
    }
  }
}
