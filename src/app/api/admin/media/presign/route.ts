import {
  createDefaultMediaService,
  createPresignHandler,
} from "@/modules/media/media.http";

export async function POST(request: Request): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }, service] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
    createDefaultMediaService(),
  ]);

  return createPresignHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    service,
  })(request);
}
