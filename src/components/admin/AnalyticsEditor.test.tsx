// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalyticsEditor } from "./AnalyticsEditor";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const YANDEX_HTML_FILE = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: e071a1e968e00937</body>
</html>`;

describe("AnalyticsEditor", () => {
  it("saves the token extracted from a pasted Yandex HTML file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ ok: true, data: {} })),
    );

    render(
      <AnalyticsEditor
        initialAnalytics={{ metrikaCounterId: "", yandexVerificationContent: "" }}
        loadError={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Код проверки Яндекса"), {
      target: { value: YANDEX_HTML_FILE },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({
      analytics: {
        metrikaCounterId: "",
        yandexVerificationContent: "e071a1e968e00937",
      },
    });
    expect(screen.getByLabelText("Код проверки Яндекса")).toHaveValue(
      "e071a1e968e00937",
    );
  });
});
