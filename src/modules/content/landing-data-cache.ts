import { revalidatePath, revalidateTag } from "next/cache";

export const LANDING_DATA_CACHE_TAG = "landing-data";

const PUBLIC_LANDING_PATHS = [
  "/",
  "/privacy",
  "/cookies",
  "/personal-data",
] as const;

/** Invalidates tagged landing data and public pages after CMS mutations. */
export function revalidateLandingDataTag(): void {
  revalidateTag(LANDING_DATA_CACHE_TAG, "max");
  for (const path of PUBLIC_LANDING_PATHS) {
    revalidatePath(path, "page");
  }
}
