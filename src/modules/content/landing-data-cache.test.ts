import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag,
  revalidatePath,
}));

describe("revalidateLandingDataTag", () => {
  beforeEach(() => {
    revalidateTag.mockClear();
    revalidatePath.mockClear();
  });

  it("invalidates the landing-data tag and all public CMS pages", async () => {
    const { LANDING_DATA_CACHE_TAG, revalidateLandingDataTag } = await import(
      "./landing-data-cache"
    );

    revalidateLandingDataTag();

    expect(revalidateTag).toHaveBeenCalledWith(LANDING_DATA_CACHE_TAG, "max");
    expect(revalidatePath).toHaveBeenCalledWith("/", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/privacy", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/cookies", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/personal-data", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/usloviya", "page");
    expect(revalidatePath).toHaveBeenCalledTimes(5);
  });
});
