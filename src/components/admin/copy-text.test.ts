// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { copyTextToClipboard } from "./copy-text";

describe("copyTextToClipboard", () => {
  it("falls back to execCommand when the clipboard API is unavailable", async () => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: exec,
    });

    await copyTextToClipboard("/media/uploads/icon.png");

    expect(exec).toHaveBeenCalledWith("copy");
  });
});
