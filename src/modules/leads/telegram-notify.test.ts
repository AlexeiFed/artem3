import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getServerEnv } = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  getServerEnv,
}));

import { notifyLeadTelegram } from "./telegram-notify";

const LEAD_INPUT = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Алексей",
  phone: "+79991234567",
  situation: "Нужна консультация",
  serviceName: "Раздел имущества",
};

describe("notifyLeadTelegram", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("no-ops when telegram credentials are missing", async () => {
    getServerEnv.mockReturnValue({});

    await notifyLeadTelegram(LEAD_INPUT);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("no-ops when only token is present", async () => {
    getServerEnv.mockReturnValue({ TELEGRAM_BOT_TOKEN: "123:ABC" });

    await notifyLeadTelegram(LEAD_INPUT);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends a message when credentials are configured", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
    });
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));

    await notifyLeadTelegram(LEAD_INPUT);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:ABC/sendMessage",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const body = JSON.parse(
      vi.mocked(fetch).mock.calls[0]?.[1]?.body as string,
    );
    expect(body).toMatchObject({
      chat_id: "-1001234567890",
      disable_web_page_preview: true,
    });
    expect(body.text).toContain("Алексей");
    expect(body.text).toContain("+79991234567");
    expect(body.text).toContain("Нужна консультация");
    expect(body.text).toContain("Раздел имущества");
    expect(body.text).toContain(LEAD_INPUT.id);
  });

  it("logs and does not throw when telegram API returns an error", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response("bad request", { status: 400 }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyLeadTelegram(LEAD_INPUT)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs and does not throw when fetch rejects", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
    });
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyLeadTelegram(LEAD_INPUT)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
