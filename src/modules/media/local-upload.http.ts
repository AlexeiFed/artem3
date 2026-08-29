import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { errorResponse } from "@/lib/http/api-response";
import { isSameOrigin } from "@/lib/http/origin";

import { writeLocalMediaStream } from "./local.storage";
import { VIDEO_MAX_BYTES } from "./media.schemas";
import { verifyUploadSignature } from "./upload-signature";

const BODY_LIMIT = VIDEO_MAX_BYTES;

interface LocalUploadDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  signSecret: string;
  now?: () => Date;
}

export function createLocalUploadHandler({
  requireAdmin,
  siteUrl,
  signSecret,
  now = () => new Date(),
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

    const params = new URL(request.url).searchParams;
    const objectKey = params.get("objectKey");
    const mimeType = params.get("mime");
    const size = Number(params.get("size"));
    const expiresAtUnix = Number(params.get("exp"));
    const signature = params.get("sig");
    if (
      !objectKey ||
      !mimeType ||
      !signature ||
      !Number.isInteger(size) ||
      !Number.isInteger(expiresAtUnix)
    ) {
      return errorResponse(400, "VALIDATION", "Некорректные параметры загрузки.");
    }
    if (expiresAtUnix * 1000 < now().getTime()) {
      return errorResponse(400, "VALIDATION", "Ссылка загрузки истекла.");
    }
    if (
      !verifyUploadSignature({
        objectKey,
        mimeType,
        size,
        expiresAtUnix,
        secret: signSecret,
        signature,
      })
    ) {
      return errorResponse(403, "FORBIDDEN", "Запрос отклонён.");
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
      await writeLocalMediaStream({
        objectKey,
        body: request.body,
        maxBytes: BODY_LIMIT,
      });
      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
        return errorResponse(
          413,
          "PAYLOAD_TOO_LARGE",
          "Размер файла превышает допустимый.",
        );
      }
      if (error instanceof Error && error.message === "MEDIA_MAGIC_MISMATCH") {
        return errorResponse(400, "VALIDATION", "Тип файла не совпадает с расширением.");
      }
      return errorResponse(500, "INTERNAL", "Не удалось сохранить файл.");
    }
  };
}
