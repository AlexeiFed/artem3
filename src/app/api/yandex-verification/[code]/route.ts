import { createYandexVerificationFileHandler } from "@/modules/content/yandex-verification.http";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { getPublicAnalytics } = await import(
    "@/modules/content/public-analytics"
  );

  return createYandexVerificationFileHandler({
    loadVerificationContent: async () => {
      const analytics = await getPublicAnalytics();
      return analytics.yandexVerificationContent;
    },
  })(request, context);
}
