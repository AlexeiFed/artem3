import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getServerEnv } = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

const { telegramBotCall } = vi.hoisted(() => ({
  telegramBotCall: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  getServerEnv,
}));

vi.mock("./telegram-bot-api", () => ({
  telegramBotCall,
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
    telegramBotCall.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when telegram credentials are missing", async () => {
    getServerEnv.mockReturnValue({});

    await notifyLeadTelegram(LEAD_INPUT);

    expect(telegramBotCall).not.toHaveBeenCalled();
  });

  it("no-ops when only token is present", async () => {
    getServerEnv.mockReturnValue({ TELEGRAM_BOT_TOKEN: "123:ABC" });

    await notifyLeadTelegram(LEAD_INPUT);

    expect(telegramBotCall).not.toHaveBeenCalled();
  });

  it("sends a message when credentials are configured", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
    });
    telegramBotCall.mockResolvedValue({ ok: true, result: { message_id: 1 } });

    await notifyLeadTelegram(LEAD_INPUT);

    expect(telegramBotCall).toHaveBeenCalledOnce();
    expect(telegramBotCall).toHaveBeenCalledWith(
      "123:ABC",
      "sendMessage",
      expect.objectContaining({
        chat_id: "-1001234567890",
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    );

    const payload = telegramBotCall.mock.calls[0]?.[2] as {
      text: string;
    };
    expect(payload.text).toContain("Алексей");
    expect(payload.text).toContain("+79991234567");
    expect(payload.text).toContain("Нужна консультация");
    expect(payload.text).toContain("Раздел имущества");
    expect(payload.text).toContain(LEAD_INPUT.id);
  });

  it("logs and does not throw when telegram API returns an error", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
    });
    telegramBotCall.mockResolvedValue({
      ok: false,
      description: "bad request",
      error_code: 400,
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyLeadTelegram(LEAD_INPUT)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs and does not throw when telegramBotCall rejects", async () => {
    getServerEnv.mockReturnValue({
      TELEGRAM_BOT_TOKEN: "123:ABC",
      TELEGRAM_CHAT_ID: "-1001234567890",
    });
    telegramBotCall.mockRejectedValue(new Error("network down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyLeadTelegram(LEAD_INPUT)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
