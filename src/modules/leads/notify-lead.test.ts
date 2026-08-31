import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { notifyLeadTelegram } = vi.hoisted(() => ({
  notifyLeadTelegram: vi.fn().mockResolvedValue(undefined),
}));

const { notifyLeadMax } = vi.hoisted(() => ({
  notifyLeadMax: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./telegram-notify", () => ({
  notifyLeadTelegram,
}));

vi.mock("./max-notify", () => ({
  notifyLeadMax,
}));

import { notifyLead } from "./notify-lead";

const LEAD_INPUT = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Алексей",
  phone: "+79991234567",
};

describe("notifyLead", () => {
  beforeEach(() => {
    notifyLeadTelegram.mockReset().mockResolvedValue(undefined);
    notifyLeadMax.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends Telegram and MAX in parallel", async () => {
    await notifyLead(LEAD_INPUT);

    expect(notifyLeadTelegram).toHaveBeenCalledOnce();
    expect(notifyLeadMax).toHaveBeenCalledOnce();
    expect(notifyLeadTelegram).toHaveBeenCalledWith(LEAD_INPUT);
    expect(notifyLeadMax).toHaveBeenCalledWith(LEAD_INPUT);
  });

  it("still notifies MAX when Telegram rejects", async () => {
    notifyLeadTelegram.mockRejectedValue(new Error("telegram down"));

    await expect(notifyLead(LEAD_INPUT)).resolves.toBeUndefined();
    expect(notifyLeadMax).toHaveBeenCalledOnce();
  });

  it("still notifies Telegram when MAX rejects", async () => {
    notifyLeadMax.mockRejectedValue(new Error("max down"));

    await expect(notifyLead(LEAD_INPUT)).resolves.toBeUndefined();
    expect(notifyLeadTelegram).toHaveBeenCalledOnce();
  });
});
