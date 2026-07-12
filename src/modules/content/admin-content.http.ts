import { revalidateTag } from "next/cache";

import { errorResponse, okResponse } from "@/lib/http/api-response";
import { isSameOrigin } from "@/lib/http/origin";
import {
  PayloadTooLargeError,
  readLimitedJson,
} from "@/lib/http/read-limited-json";
import { AuthDomainError } from "@/modules/auth/auth.service";
import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import {
  AdminContentDomainError,
  type AdminContentService,
} from "@/modules/content/admin-content.service";

const ADMIN_BODY_MAXIMUM_BYTES = 64 * 1_024;
export const LANDING_DATA_CACHE_TAG = "landing-data";

export interface AdminMutationGuardDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
}

export async function guardAdminMutation(
  request: Request,
  dependencies: AdminMutationGuardDependencies,
): Promise<Response | null> {
  if (!isSameOrigin(request, dependencies.siteUrl)) {
    return errorResponse(403, "FORBIDDEN", "Запрос отклонён.");
  }

  try {
    await dependencies.requireAdmin();
    return null;
  } catch (error) {
    if (error instanceof AuthDomainError && error.code === "UNAUTHORIZED") {
      return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
    }
    console.error({
      event: "admin_mutation_auth_failed",
      category: "internal",
      errorClass: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(500, "INTERNAL", "Не удалось проверить сессию.");
  }
}

export async function readAdminJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    const value = await readLimitedJson(request, ADMIN_BODY_MAXIMUM_BYTES);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return {
        ok: false,
        response: errorResponse(
          413,
          "PAYLOAD_TOO_LARGE",
          "Размер запроса превышает допустимый.",
        ),
      };
    }
    return {
      ok: false,
      response: errorResponse(400, "VALIDATION", "Некорректный JSON.", {
        _form: ["Некорректный JSON"],
      }),
    };
  }
}

export function mapAdminContentError(error: unknown): Response {
  if (error instanceof AdminContentDomainError) {
    if (error.code === "VALIDATION") {
      return errorResponse(
        400,
        "VALIDATION",
        "Проверьте заполненные поля.",
        error.fields,
      );
    }
    if (error.code === "NOT_FOUND") {
      return errorResponse(
        404,
        "NOT_FOUND",
        "Запись не найдена.",
        error.fields,
      );
    }
    if (error.code === "CONFLICT") {
      return errorResponse(
        409,
        "CONFLICT",
        "Конфликт данных.",
        error.fields,
      );
    }
  }

  console.error({
    event: "admin_content_mutation_failed",
    category: "persistence",
    errorClass: error instanceof Error ? error.name : "UnknownError",
  });
  return errorResponse(
    500,
    "INTERNAL",
    "Не удалось сохранить изменения. Попробуйте позже.",
  );
}

export function revalidateLandingDataTag(): void {
  revalidateTag(LANDING_DATA_CACHE_TAG, "max");
}

export async function createDefaultAdminContentService(): Promise<AdminContentService> {
  const [
    { DrizzleAdminContentRepository },
    { createAdminContentService },
  ] = await Promise.all([
    import("./admin-content.repository"),
    import("./admin-content.service"),
  ]);

  return createAdminContentService({
    repository: new DrizzleAdminContentRepository(),
    revalidateLandingData: revalidateLandingDataTag,
  });
}

export { okResponse };
