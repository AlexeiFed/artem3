import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { errorResponse } from "@/lib/http/api-response";
import { isSameOrigin } from "@/lib/http/origin";

import { writeLocalMediaObject } from "./local.storage";
import { VIDEO_MAX_BYTES } from "./media.schemas";

/** Must cover the largest allowed media (MP4). Nginx must allow the same. */
const BODY_LIMIT = VIDEO_MAX_BYTES;

interface LocalUploadDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
}

export function createLocalUploadHandler({
  requireAdmin,
  siteUrl,
}: LocalUploadDependencies): (request: Request) => Promise<Response> {
  return async function handleLocalUpload(request: Request): Promise<Response> {
    if (!isSameOrigin(request, siteUrl)) {
      return errorResponse(403, "FORBIDDEN", "Запрос отклонён.");
    }

    try {
      await requireAdmin();
    } catch (error) {
      if (error instanceof AuthDomainError && error.code === "UNAUTHORIZED") {
        return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
      }
      return errorResponse(500, "INTERNAL", "Не удалось проверить сессию.");
    }

    const objectKey = new URL(request.url).searchParams.get("objectKey");
    if (!objectKey) {
      return errorResponse(400, "VALIDATION", "Не указан objectKey.");
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? Number(contentLengthHeader)
      : NaN;
    if (Number.isFinite(contentLength) && contentLength > BODY_LIMIT) {
      return errorResponse(
        413,
        "PAYLOAD_TOO_LARGE",
        "Размер файла превышает допустимый.",
      );
    }

    try {
      const buffer = Buffer.from(await request.arrayBuffer());
      if (buffer.byteLength > BODY_LIMIT) {
        return errorResponse(
          413,
          "PAYLOAD_TOO_LARGE",
          "Размер файла превышает допустимый.",
        );
      }
      await writeLocalMediaObject({ objectKey, body: buffer });
      return new Response(null, { status: 204 });
    } catch {
      return errorResponse(500, "INTERNAL", "Не удалось сохранить файл.");
    }
  };
}
