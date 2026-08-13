import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const httpsRequest = vi.fn();

vi.mock("node:https", () => ({
  request: (...args: unknown[]) => httpsRequest(...args),
}));

vi.mock("node:dns/promises", () => ({
  resolve4: vi.fn().mockResolvedValue(["149.154.166.110"]),
}));

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(() => {
    throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
  }),
  writeFileSync: vi.fn(),
}));

const { getServerEnv } = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  getServerEnv,
}));

import {
  resetTelegramBotApiStateForTests,
  telegramBotCall,
} from "./telegram-bot-api";

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

function mockHttpsFailThenSuccess(failIp: string, successBody: string) {
  httpsRequest.mockImplementation((options: { host?: string }, callback) => {
    if (options.host === failIp) {
      const req = {
        on(event: string, handler: (err?: Error) => void) {
          if (event === "error") {
            queueMicrotask(() => handler(new Error(`timeout ${failIp}`)));
          }
          return req;
        },
        write: vi.fn(),
        end: vi.fn(),
        destroy: vi.fn(),
      };
      return req;
    }

    const res = {
      statusCode: 200,
      on(event: string, handler: (chunk?: Buffer) => void) {
        if (event === "data") handler(Buffer.from(successBody));
        if (event === "end") handler();
        return res;
      },
    };
    const req = {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };
    queueMicrotask(() => callback(res));
    return req;
  });
}

describe("telegramBotCall", () => {
  beforeEach(() => {
    resetTelegramBotApiStateForTests();
    getServerEnv.mockReturnValue({
      TELEGRAM_API_IP: "149.154.167.220",
    });
    httpsRequest.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs sendMessage via configured IP with SNI api.telegram.org", async () => {
    mockHttpsSuccess(JSON.stringify({ ok: true, result: { message_id: 1 } }));

    const result = await telegramBotCall("123:ABC", "sendMessage", {
      chat_id: "-1001",
      text: "hi",
    });

    expect(result).toEqual({ ok: true, result: { message_id: 1 } });
    expect(httpsRequest).toHaveBeenCalledOnce();
    expect(httpsRequest.mock.calls[0]?.[0]).toMatchObject({
      host: "149.154.167.220",
      servername: "api.telegram.org",
      method: "POST",
      path: "/bot123:ABC/sendMessage",
    });
  });

  it("fails over to next IP when the first candidate times out", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_API_IPS: "10.0.0.1,149.154.167.220",
    });
    mockHttpsFailThenSuccess(
      "10.0.0.1",
      JSON.stringify({ ok: true, result: true }),
    );

    const result = await telegramBotCall("tok", "getMe");

    expect(result).toEqual({ ok: true, result: true });
    expect(httpsRequest).toHaveBeenCalledTimes(2);
    expect(httpsRequest.mock.calls[0]?.[0]).toMatchObject({ host: "10.0.0.1" });
    expect(httpsRequest.mock.calls[1]?.[0]).toMatchObject({
      host: "149.154.167.220",
      servername: "api.telegram.org",
    });
  });

  it("uses TELEGRAM_API_BASE when set", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_API_BASE: "https://tg-proxy.example",
      TELEGRAM_API_IP: "149.154.167.220",
    });
    mockHttpsSuccess(JSON.stringify({ ok: true, result: { id: 9 } }));

    const result = await telegramBotCall("tok", "getMe");

    expect(result).toEqual({ ok: true, result: { id: 9 } });
    expect(httpsRequest.mock.calls[0]?.[0]).toMatchObject({
      hostname: "tg-proxy.example",
      path: "/bottok/getMe",
      method: "GET",
    });
  });
});
