import { describe, expect, it } from "vitest";

import { PRODUCTION_SITE_HOST, PRODUCTION_SITE_URL } from "./production-site";

describe("production site origin", () => {
  it("is the apex HTTPS origin", () => {
    expect(PRODUCTION_SITE_HOST).toBe("artemsysuev.ru");
    expect(PRODUCTION_SITE_URL).toBe("https://artemsysuev.ru");
  });
});
