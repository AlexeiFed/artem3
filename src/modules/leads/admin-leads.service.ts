import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { leads } from "@/db/schema";

import {
  UpdateLeadStatusSchema,
  type LeadStatus,
} from "./admin-leads.schemas";

export interface AdminLeadRecord {
  id: string;
  name: string;
  phone: string;
  situation: string | null;
  serviceName: string | null;
  status: LeadStatus;
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
  list(): Promise<AdminLeadRecord[]>;
  updateStatus(id: string, status: LeadStatus): Promise<AdminLeadRecord>;
}

export class DrizzleAdminLeadsRepository implements AdminLeadsRepository {
  constructor(private readonly db = getDb()) {}

  list(): Promise<AdminLeadRecord[]> {
    return this.db.select().from(leads).orderBy(desc(leads.createdAt));
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
  list(): Promise<AdminLeadRecord[]>;
  updateStatus(id: string, input: unknown): Promise<AdminLeadRecord>;
  toCsv(rows: AdminLeadRecord[]): string;
}

export function createAdminLeadsService(
  repository: AdminLeadsRepository,
): AdminLeadsService {
  return {
    async list(): Promise<AdminLeadRecord[]> {
      try {
        return await repository.list();
      } catch (error) {
        throw new AdminLeadsDomainError(
          "PERSISTENCE",
          undefined,
          error instanceof Error ? error : undefined,
        );
      }
    },

    async updateStatus(id: string, input: unknown): Promise<AdminLeadRecord> {
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
      ];
      const lines = rows.map((row) =>
        [
          row.createdAt.toISOString(),
          row.name,
          row.phone,
          row.serviceName ?? "",
          row.situation ?? "",
          row.status,
        ]
          .map(csvEscape)
          .join(","),
      );
      return `\uFEFF${[header.join(","), ...lines].join("\n")}\n`;
    },
  };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
