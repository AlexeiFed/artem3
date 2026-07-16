import { describe, expect, it } from "vitest";

import { serviceAnchorHref, serviceAnchorId } from "./service-anchors";

describe("serviceAnchorId", () => {
  it("maps uslugi to prochee to avoid section id collision", () => {
    expect(serviceAnchorId("uslugi")).toBe("prochee");
    expect(serviceAnchorHref("uslugi")).toBe("#prochee");
  });

  it("keeps other slugs unchanged", () => {
    expect(serviceAnchorId("razvod")).toBe("razvod");
    expect(serviceAnchorHref("razvod")).toBe("#razvod");
  });
});
