// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServiceIcon } from "./ServiceIcon";

afterEach(cleanup);

describe("ServiceIcon", () => {
  it("keeps the built-in svg when no upload is set", () => {
    const { container } = render(<ServiceIcon slug="razvod" />);

    expect(container.querySelector("svg.service-icon")).not.toBeNull();
    expect(container.querySelector("img.service-icon")).toBeNull();
  });

  it("renders an uploaded icon through next/image with a compact sizes hint", () => {
    const { container } = render(
      <ServiceIcon
        slug="razvod"
        iconUrl="/media/custom-service-icon.png"
        sizes="32px"
      />,
    );

    const uploaded = container.querySelector("img.service-icon");
    expect(uploaded).toHaveAttribute(
      "src",
      expect.stringContaining(
        "/_next/image?url=%2Fmedia%2Fcustom-service-icon.png",
      ),
    );
    expect(uploaded).toHaveAttribute("sizes", "32px");
    expect(uploaded?.getAttribute("srcset") ?? "").toMatch(/w=32/u);
    expect(uploaded).toHaveAttribute("alt", "");
    expect(uploaded).toHaveAttribute("width");
    expect(uploaded).toHaveAttribute("height");
  });
});
