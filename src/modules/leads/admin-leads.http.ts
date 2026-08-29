import type { SafeAdminUser } from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { errorResponse, okResponse } from "@/lib/http/api-response";
import { isSameOrigin } from "@/lib/http/origin";
import {
  PayloadTooLargeError,
  readLimitedJson,
} from "@/lib/http/read-limited-json";
import {
  AdminLeadsDomainError,
  LEADS_EXPORT_MAX_ROWS,
  LEADS_PAGE_DEFAULT,
  LEADS_PAGE_MAX,
  type AdminLeadsService,
} from "@/modules/leads/admin-leads.service";
import { recordAuditEvent } from "@/modules/audit/audit";

const BODY_LIMIT = 8 * 1_024;

interface ListDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  service: Pick<AdminLeadsService, "listPage">;
}

interface MutationDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  siteUrl: string;
  service: Pick<AdminLeadsService, "updateStatus">;
}

interface ExportDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  service: AdminLeadsService;
}

async function requireAdminOrResponse(
  requireAdmin: () => Promise<SafeAdminUser>,
): Promise<Response | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (error instanceof AuthDomainError && error.code === "UNAUTHORIZED") {
      return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
    }
    return errorResponse(500, "INTERNAL", "Не удалось проверить сессию.");
  }
}

function mapLeadsError(error: unknown): Response {
  if (error instanceof AdminLeadsDomainError) {
    if (error.code === "VALIDATION") {
      return errorResponse(
        400,
        "VALIDATION",
        "Проверьте заполненные поля.",
        error.fields,
      );
    }
    if (error.code === "NOT_FOUND") {
      return errorResponse(404, "NOT_FOUND", "Заявка не найдена.", error.fields);
    }
  }
  return errorResponse(500, "INTERNAL", "Не удалось обработать заявки.");
}

export function createListLeadsHandler({
  requireAdmin,
  service,
}: ListDependencies): (request: Request) => Promise<Response> {
  return async function handleListLeads(request: Request): Promise<Response> {
    const blocked = await requireAdminOrResponse(requireAdmin);
    if (blocked) {
      return blocked;
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : LEADS_PAGE_DEFAULT;

    try {
      const page = await service.listPage({
        limit,
        ...(cursor === undefined ? {} : { cursor }),
      });
      return okResponse({
        items: page.items.map((item) => ({
          ...item,
          consentAt: item.consentAt.toISOString(),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        nextCursor: page.nextCursor,
      });
    } catch (error) {
      return mapLeadsError(error);
    }
  };
}

export function createUpdateLeadStatusHandler({
  requireAdmin,
  siteUrl,
  service,
}: MutationDependencies): (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response> {
  return async function handleUpdateLeadStatus(request, context) {
    if (!isSameOrigin(request, siteUrl)) {
      return errorResponse(403, "FORBIDDEN", "Запрос отклонён.");
    }

    const blocked = await requireAdminOrResponse(requireAdmin);
    if (blocked) {
      return blocked;
    }

    let body: unknown;
    try {
      body = await readLimitedJson(request, BODY_LIMIT);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        return errorResponse(
          413,
          "PAYLOAD_TOO_LARGE",
          "Размер запроса превышает допустимый.",
        );
      }
      return errorResponse(400, "VALIDATION", "Некорректный JSON.");
    }

    try {
      const { id } = await context.params;
      const data = await service.updateStatus(id, body);
      return okResponse({
        ...data,
        consentAt: data.consentAt.toISOString(),
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      });
    } catch (error) {
      return mapLeadsError(error);
    }
  };
}

export function createExportLeadsHandler({
  requireAdmin,
  service,
}: ExportDependencies): () => Promise<Response> {
  return async function handleExportLeads(): Promise<Response> {
    const blocked = await requireAdminOrResponse(requireAdmin);
    if (blocked) {
      return blocked;
    }

    try {
      const items = [];
      let cursor: string | undefined;
      while (items.length < LEADS_EXPORT_MAX_ROWS) {
        const page = await service.listPage({
          limit: LEADS_PAGE_MAX,
          ...(cursor === undefined ? {} : { cursor }),
        });
        items.push(...page.items);
        if (!page.nextCursor) {
          break;
        }
        cursor = page.nextCursor;
      }
      const csv = service.toCsv(items.slice(0, LEADS_EXPORT_MAX_ROWS));
      await recordAuditEvent({ action: "admin.leads_export" });
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="leads.csv"',
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      return mapLeadsError(error);
    }
  };
}
