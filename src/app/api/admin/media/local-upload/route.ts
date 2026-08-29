import { createLocalUploadHandler } from "@/modules/media/local-upload.http";

export async function PUT(request: Request): Promise<Response> {
  const [{ requireAdmin }, { getPublicEnv }, { getServerEnv }] =
    await Promise.all([
      import("@/modules/auth/require-admin"),
      import("@/lib/env/public"),
      import("@/lib/env/server"),
    ]);

  return createLocalUploadHandler({
    requireAdmin,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    signSecret: getServerEnv().SESSION_SECRET,
  })(request);
}
