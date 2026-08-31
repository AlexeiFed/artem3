import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const httpsRequest = vi.fn();

vi.mock("node:https", () => ({
  request: (...args: unknown[]) => httpsRequest(...args),
}));

const { getServerEnv } = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  getServerEnv,
}));

import { maxBotSendMessage } from "./max-bot-api";

function mockHttpsSuccess(body: string, status = 200) {
  httpsRequest.mockImplementation((_options, callback) => {
    const res = {
      statusCode: status,
      on(event: string, handler: (chunk?: Buffer) => void) {
        if (event === "data") handler(Buffer.from(body));
        if (event === "end") handler();
        return res;
      },
    };
    queueMicrotask(() => callback(res));
    return {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };
  });
}

describe("maxBotSendMessage", () => {
  beforeEach(() => {
    getServerEnv.mockReturnValue({});
    httpsRequest.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs /messages with Authorization header and Минцифры CA", async () => {
    mockHttpsSuccess(JSON.stringify({ message: { body: { text: "hi" } } }));

    const result = await maxBotSendMessage("max-token", "-123", "<b>hi</b>");

    expect(result).toEqual({ ok: true });
    expect(httpsRequest).toHaveBeenCalledOnce();
    const options = httpsRequest.mock.calls[0]?.[0] as {
      hostname: string;
      method: string;
      path: string;
      headers: Record<string, string>;
      ca: unknown;
      allowPartialTrustChain: boolean;
    };
    expect(options).toMatchObject({
      hostname: "platform-api2.max.ru",
      method: "POST",
      path: "/messages?chat_id=-123&disable_link_preview=true",
      allowPartialTrustChain: true,
    });
    expect(options.headers.Authorization).toBe("max-token");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(Array.isArray(options.ca) || typeof options.ca === "string").toBe(
      true,
    );

    const req = httpsRequest.mock.results[0]?.value as { write: ReturnType<typeof vi.fn> };
    expect(req.write).toHaveBeenCalledWith(
      JSON.stringify({ text: "<b>hi</b>", format: "html" }),
    );
  });

  it("uses MAX_API_BASE when set", async () => {
    getServerEnv.mockReturnValue({
      MAX_API_BASE: "https://max-proxy.example",
    });
    mockHttpsSuccess(JSON.stringify({ message: { body: { text: "ok" } } }));

    const result = await maxBotSendMessage("tok", "1", "text");

    expect(result).toEqual({ ok: true });
    expect(httpsRequest.mock.calls[0]?.[0]).toMatchObject({
      hostname: "max-proxy.example",
      path: "/messages?chat_id=1&disable_link_preview=true",
      method: "POST",
    });
  });

  it("returns ok:false when MAX API responds with an error body", async () => {
    mockHttpsSuccess(
      JSON.stringify({ code: "chat.not.found", message: "missing" }),
      404,
    );

    await expect(maxBotSendMessage("tok", "1", "text")).resolves.toEqual({
      ok: false,
      status: 404,
      code: "chat.not.found",
      description: "missing",
    });
  });
});
