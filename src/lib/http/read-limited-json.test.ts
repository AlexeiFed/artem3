import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  PayloadTooLargeError,
  readLimitedJson,
} from "./read-limited-json";

describe("readLimitedJson", () => {
  it("rejects an oversized Content-Length before reading the body", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "Content-Length": "8193" },
      body: "{}",
    });

    await expect(readLimitedJson(request, 8192)).rejects.toBeInstanceOf(
      PayloadTooLargeError,
    );
  });

  it("stops a chunked stream once it exceeds the byte limit", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(5));
        controller.enqueue(new Uint8Array(5));
      },
      cancel() {
        cancelled = true;
      },
    });
    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      body,
      duplex: "half",
    };
    const request = new Request("https://example.test", init);

    await expect(readLimitedJson(request, 8)).rejects.toBeInstanceOf(
      PayloadTooLargeError,
    );
    expect(cancelled).toBe(true);
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: "{",
    });

    await expect(readLimitedJson(request, 8192)).rejects.toBeInstanceOf(
      SyntaxError,
    );
  });

  it("returns valid JSON as unknown", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ email: "admin@example.com" }),
    });

    await expect(readLimitedJson(request, 8192)).resolves.toEqual({
      email: "admin@example.com",
    });
  });
});
