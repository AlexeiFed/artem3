import { createLocalUploadHandler } from "@/modules/media/local-upload.http";

export async function PUT(request: Request): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
  ]);

  return createLocalUploadHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
  })(request);
}
