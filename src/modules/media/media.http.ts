import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { errorResponse, okResponse } from "@/lib/http/api-response";
import { isSameOrigin } from "@/lib/http/origin";
import {
  PayloadTooLargeError,
  readLimitedJson,
} from "@/lib/http/read-limited-json";
import { MediaDomainError, type MediaService } from "@/modules/media/media.service";

const MEDIA_BODY_MAXIMUM_BYTES = 16 * 1_024;

interface MediaRouteDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  service: MediaService;
}

async function guard(
  request: Request,
  dependencies: Pick<MediaRouteDependencies, "requireAdmin" | "siteUrl">,
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
    return errorResponse(500, "INTERNAL", "Не удалось проверить сессию.");
  }
}

function mapMediaError(error: unknown): Response {
  if (error instanceof MediaDomainError) {
    if (error.code === "VALIDATION") {
      return errorResponse(
        400,
        "VALIDATION",
        "Проверьте заполненные поля.",
        error.fields,
      );
    }
    if (error.code === "CONFLICT") {
      return errorResponse(409, "CONFLICT", "Конфликт данных.", error.fields);
    }
  }

  console.error({
    event: "admin_media_failed",
    category: "persistence",
    errorClass: error instanceof Error ? error.name : "UnknownError",
  });
  return errorResponse(
    500,
    "INTERNAL",
    "Не удалось обработать медиафайл. Попробуйте позже.",
  );
}

async function readBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    return {
      ok: true,
      value: await readLimitedJson(request, MEDIA_BODY_MAXIMUM_BYTES),
    };
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

export function createPresignHandler({
  requireAdmin,
  siteUrl,
  service,
}: MediaRouteDependencies): (request: Request) => Promise<Response> {
  return async function handlePresign(request: Request): Promise<Response> {
    const blocked = await guard(request, { requireAdmin, siteUrl });
    if (blocked) {
      return blocked;
    }

    const body = await readBody(request);
    if (!body.ok) {
      return body.response;
    }

    try {
      const data = await service.presign(body.value);
      return okResponse(data, 201);
    } catch (error) {
      return mapMediaError(error);
    }
  };
}

export function createCompleteHandler({
  requireAdmin,
  siteUrl,
  service,
}: MediaRouteDependencies): (request: Request) => Promise<Response> {
  return async function handleComplete(request: Request): Promise<Response> {
    const blocked = await guard(request, { requireAdmin, siteUrl });
    if (blocked) {
      return blocked;
    }

    const body = await readBody(request);
    if (!body.ok) {
      return body.response;
    }

    try {
      const data = await service.complete(body.value);
      return okResponse(data, 201);
    } catch (error) {
      return mapMediaError(error);
    }
  };
}

export function createListMediaHandler({
  requireAdmin,
  siteUrl,
  service,
}: MediaRouteDependencies): (request: Request) => Promise<Response> {
  return async function handleListMedia(request: Request): Promise<Response> {
    const blocked = await guard(request, { requireAdmin, siteUrl });
    if (blocked) {
      return blocked;
    }

    try {
      const data = await service.list();
      return okResponse({ items: data });
    } catch (error) {
      return mapMediaError(error);
    }
  };
}

export async function createDefaultMediaService(): Promise<MediaService> {
  const [
    { getServerEnv },
    { getPublicEnv },
    { createMediaService, DrizzleMediaRepository },
  ] = await Promise.all([
    import("@/lib/env/server"),
    import("@/lib/env/public"),
    import("./media.service"),
  ]);
  const env = getServerEnv();
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;

  if (env.MEDIA_DRIVER === "local") {
    const { buildLocalMediaPublicBaseUrl, createLocalObjectStorage } =
      await import("./local.storage");
    return createMediaService({
      storage: createLocalObjectStorage({
        uploadEndpoint: "/api/admin/media/local-upload",
        signSecret: env.SESSION_SECRET,
      }),
      repository: new DrizzleMediaRepository(),
      bucket: "local",
      publicBaseUrl: buildLocalMediaPublicBaseUrl(siteUrl),
    });
  }

  const { buildPublicMediaBaseUrl, createS3ObjectStorage } = await import(
    "./s3.client"
  );
  return createMediaService({
    storage: createS3ObjectStorage(),
    repository: new DrizzleMediaRepository(),
    bucket: env.S3_BUCKET,
    publicBaseUrl: buildPublicMediaBaseUrl(env.S3_ENDPOINT, env.S3_BUCKET),
  });
}
