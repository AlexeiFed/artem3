import { z } from "zod";

import { AdminApiErrorSchema, AdminApiSuccessSchema } from "@/modules/content/admin-content.schemas";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export function okResponse<T>(data: T, status = 200): Response {
  const body = AdminApiSuccessSchema.parse({ ok: true, data });
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

export function errorResponse(
  status: number,
  code: z.infer<typeof AdminApiErrorSchema>["error"]["code"],
  message: string,
  fields?: Record<string, string[]>,
): Response {
  const body = AdminApiErrorSchema.parse({
    ok: false,
    error: {
      code,
      message,
      ...(fields === undefined ? {} : { fields }),
    },
  });
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}
