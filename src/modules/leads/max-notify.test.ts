import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getServerEnv } = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
}));

const { maxBotSendMessage } = vi.hoisted(() => ({
  maxBotSendMessage: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  getServerEnv,
}));

vi.mock("./max-bot-api", () => ({
  maxBotSendMessage,
}));

import { notifyLeadMax } from "./max-notify";

const LEAD_INPUT = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Алексей",
  phone: "+79991234567",
  situation: "Нужна консультация",
  serviceName: "Раздел имущества",
};

describe("notifyLeadMax", () => {
  beforeEach(() => {
    maxBotSendMessage.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when MAX credentials are missing", async () => {
    getServerEnv.mockReturnValue({});

    await notifyLeadMax(LEAD_INPUT);

    expect(maxBotSendMessage).not.toHaveBeenCalled();
  });

  it("no-ops when only token is present", async () => {
    getServerEnv.mockReturnValue({ MAX_BOT_TOKEN: "max-token" });

    await notifyLeadMax(LEAD_INPUT);

    expect(maxBotSendMessage).not.toHaveBeenCalled();
  });

  it("sends a message when credentials are configured", async () => {
    getServerEnv.mockReturnValue({
      MAX_BOT_TOKEN: "max-token",
      MAX_CHAT_ID: "-123456789",
    });
    maxBotSendMessage.mockResolvedValue({ ok: true });

    await notifyLeadMax(LEAD_INPUT);

    expect(maxBotSendMessage).toHaveBeenCalledOnce();
    expect(maxBotSendMessage).toHaveBeenCalledWith(
      "max-token",
      "-123456789",
      expect.stringContaining("Алексей"),
    );

    const text = maxBotSendMessage.mock.calls[0]?.[2] as string;
    expect(text).toContain("+79991234567");
    expect(text).toContain("Нужна консультация");
    expect(text).toContain("Раздел имущества");
    expect(text).toContain(LEAD_INPUT.id);
  });

  it("logs and does not throw when MAX API returns an error", async () => {
    getServerEnv.mockReturnValue({
      MAX_BOT_TOKEN: "max-token",
      MAX_CHAT_ID: "-123456789",
    });
    maxBotSendMessage.mockResolvedValue({
      ok: false,
      status: 400,
      description: "bad request",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyLeadMax(LEAD_INPUT)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs and does not throw when maxBotSendMessage rejects", async () => {
    getServerEnv.mockReturnValue({
      MAX_BOT_TOKEN: "max-token",
      MAX_CHAT_ID: "-123456789",
    });
    maxBotSendMessage.mockRejectedValue(new Error("network down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyLeadMax(LEAD_INPUT)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
