import "server-only";

import { and, desc, eq, lt, or } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { leads } from "@/db/schema";

import {
  UpdateLeadStatusSchema,
  type LeadStatus,
} from "./admin-leads.schemas";

export const LEADS_PAGE_DEFAULT = 50;
export const LEADS_PAGE_MAX = 100;
export const LEADS_EXPORT_MAX_ROWS = 5_000;

const LeadListQuerySchema = z.object({
  limit: z.number().int().min(1).max(LEADS_PAGE_MAX).default(LEADS_PAGE_DEFAULT),
  cursor: z
    .string()
    .transform((value, context) => {
      const [iso, id] = value.split("|");
      if (!iso || !id || !z.uuid().safeParse(id).success) {
        context.addIssue({ code: "custom", message: "Некорректный курсор" });
        return z.NEVER;
      }
      const createdAt = new Date(iso);
      if (Number.isNaN(createdAt.getTime())) {
        context.addIssue({ code: "custom", message: "Некорректный курсор" });
        return z.NEVER;
      }
      return { createdAt, id };
    })
    .optional(),
});

export interface AdminLeadRecord {
  id: string;
  name: string;
  phone: string;
  situation: string | null;
  serviceName: string | null;
  status: LeadStatus;
  isDataAgreed: boolean;
  isMarketingAgreed: boolean;
  consentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminLeadsErrorCode = "VALIDATION" | "NOT_FOUND" | "PERSISTENCE";

export class AdminLeadsDomainError extends Error {
  constructor(
    readonly code: AdminLeadsErrorCode,
    readonly fields?: Record<string, string[]>,
    cause?: Error,
  ) {
    super(code, cause ? { cause } : undefined);
    this.name = "AdminLeadsDomainError";
  }
}

export interface AdminLeadsRepository {
  listPage(input: {
    limit: number;
    cursorCreatedAt?: Date;
    cursorId?: string;
  }): Promise<AdminLeadRecord[]>;
  updateStatus(id: string, status: LeadStatus): Promise<AdminLeadRecord>;
}

export class DrizzleAdminLeadsRepository implements AdminLeadsRepository {
  constructor(private readonly db = getDb()) {}

  listPage(input: {
    limit: number;
    cursorCreatedAt?: Date;
    cursorId?: string;
  }): Promise<AdminLeadRecord[]> {
    const cursor =
      input.cursorCreatedAt && input.cursorId
        ? or(
            lt(leads.createdAt, input.cursorCreatedAt),
            and(
              eq(leads.createdAt, input.cursorCreatedAt),
              lt(leads.id, input.cursorId),
            ),
          )
        : undefined;
    return this.db
      .select()
      .from(leads)
      .where(cursor)
      .orderBy(desc(leads.createdAt), desc(leads.id))
      .limit(input.limit);
  }

  async updateStatus(
    id: string,
    status: LeadStatus,
  ): Promise<AdminLeadRecord> {
    const [updated] = await this.db
      .update(leads)
      .set({ status, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    if (!updated) {
      throw new AdminLeadsDomainError("NOT_FOUND", {
        id: ["Заявка не найдена"],
      });
    }

    return updated;
  }
}

export interface AdminLeadsService {
  listPage(input: unknown): Promise<{
    items: AdminLeadRecord[];
    nextCursor: string | null;
  }>;
  updateStatus(id: string, input: unknown): Promise<AdminLeadRecord>;
  toCsv(rows: AdminLeadRecord[]): string;
}

export function createAdminLeadsService(
  repository: AdminLeadsRepository,
): AdminLeadsService {
  return {
    async listPage(input: unknown): Promise<{
      items: AdminLeadRecord[];
      nextCursor: string | null;
    }> {
      const parsed = LeadListQuerySchema.safeParse(input ?? {});
      if (!parsed.success) {
        throw new AdminLeadsDomainError("VALIDATION", {
          cursor: ["Некорректный курсор"],
        });
      }
      try {
        const rows = await repository.listPage({
          limit: parsed.data.limit + 1,
          ...(parsed.data.cursor === undefined
            ? {}
            : {
                cursorCreatedAt: parsed.data.cursor.createdAt,
                cursorId: parsed.data.cursor.id,
              }),
        });
        const hasMore = rows.length > parsed.data.limit;
        const items = hasMore ? rows.slice(0, parsed.data.limit) : rows;
        const last = items[items.length - 1];
        return {
          items,
          nextCursor:
            hasMore && last
              ? `${last.createdAt.toISOString()}|${last.id}`
              : null,
        };
      } catch (error) {
        throw new AdminLeadsDomainError(
          "PERSISTENCE",
          undefined,
          error instanceof Error ? error : undefined,
        );
      }
    },

    async updateStatus(id: string, input: unknown): Promise<AdminLeadRecord> {
      if (!z.uuid().safeParse(id).success) {
        throw new AdminLeadsDomainError("VALIDATION", {
          id: ["Некорректный идентификатор"],
        });
      }
      const parsed = UpdateLeadStatusSchema.safeParse(input);
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path.length > 0 ? issue.path.join(".") : "_form";
          fields[path] ??= [];
          fields[path].push(issue.message);
        }
        throw new AdminLeadsDomainError("VALIDATION", fields);
      }

      try {
        return await repository.updateStatus(id, parsed.data.status);
      } catch (error) {
        if (error instanceof AdminLeadsDomainError) {
          throw error;
        }
        throw new AdminLeadsDomainError(
          "PERSISTENCE",
          undefined,
          error instanceof Error ? error : undefined,
        );
      }
    },

    toCsv(rows: AdminLeadRecord[]): string {
      const header = [
        "date",
        "name",
        "phone",
        "service",
        "situation",
        "status",
        "data_agreed",
        "marketing_agreed",
        "consent_at",
      ];
      const lines = rows.map((row) =>
        [
          row.createdAt.toISOString(),
          row.name,
          row.phone,
          row.serviceName ?? "",
          row.situation ?? "",
          row.status,
          row.isDataAgreed ? "yes" : "no",
          row.isMarketingAgreed ? "yes" : "no",
          row.consentAt.toISOString(),
        ]
          .map(csvEscape)
          .join(","),
      );
      return `\uFEFF${[header.join(","), ...lines].join("\n")}\n`;
    },
  };
}

function csvEscape(value: string): string {
  const formulaPrefix = /^[=+\-@\t\r]/u.test(value);
  const safe = formulaPrefix ? `'${value}` : value;
  if (/[",\n\r]/u.test(safe) || formulaPrefix) {
    return `"${safe.replaceAll('"', '""')}"`;
  }
  return safe;
}
