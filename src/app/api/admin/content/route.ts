import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { errorResponse, okResponse } from "@/lib/http/api-response";
import type { ContentRepository } from "@/modules/content/content.repository";

interface HandlerDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  repository: ContentRepository;
}

export function createAdminContentBootstrapHandler({
  requireAdmin,
  repository,
}: HandlerDependencies): () => Promise<Response> {
  return async function handleBootstrap(): Promise<Response> {
    try {
      await requireAdmin();
    } catch (error) {
      if (error instanceof AuthDomainError && error.code === "UNAUTHORIZED") {
        return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
      }
      return errorResponse(500, "INTERNAL", "Не удалось проверить сессию.");
    }

    try {
      const [settings, services, cases, faqs, reviews, certificates] =
        await Promise.all([
          repository.getSiteSettings(),
          repository.listServices(),
          repository.listCases(),
          repository.listFaqs(),
          repository.listReviews(),
          repository.listCertificates(),
        ]);

      if (!settings) {
        return errorResponse(404, "NOT_FOUND", "Настройки сайта не найдены.");
      }

      return okResponse({
        settings,
        services,
        cases,
        faqs,
        reviews,
        certificates,
      });
    } catch {
      return errorResponse(
        500,
        "INTERNAL",
        "Не удалось загрузить контент админки.",
      );
    }
  };
}

export async function GET(): Promise<Response> {
  const [{ requireAdmin }, { DrizzleContentRepository }] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/modules/content/content.repository"),
  ]);

  return createAdminContentBootstrapHandler({
    requireAdmin,
    repository: new DrizzleContentRepository(),
  })();
}
