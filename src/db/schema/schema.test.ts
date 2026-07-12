import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { adminSessions, adminUsers } from "./auth";
import {
  cases,
  certificates,
  faqs,
  reviews,
  services,
  siteSettings,
} from "./content";
import { leadStatus, leads, rateLimits } from "./leads";
import { mediaAssets } from "./media";

const sortableTables = [services, cases, faqs, reviews, certificates] as const;

describe("database schema contracts", () => {
  it("exports every Task 2 table", () => {
    expect(
      [
        siteSettings,
        services,
        cases,
        faqs,
        reviews,
        certificates,
        adminUsers,
        adminSessions,
        leads,
        mediaAssets,
        rateLimits,
      ].map(getTableName),
    ).toEqual([
      "site_settings",
      "services",
      "cases",
      "faqs",
      "reviews",
      "certificates",
      "admin_users",
      "admin_sessions",
      "leads",
      "media_assets",
      "rate_limits",
    ]);
  });

  it("keeps trust banner and workflow independently editable", () => {
    const columns = getTableColumns(siteSettings);

    expect(columns.trustBanner?.name).toBe("trust_banner");
    expect(columns.trustBanner?.notNull).toBe(true);
    expect(columns.workflow?.name).toBe("workflow");
    expect(columns.workflow?.notNull).toBe(true);
    expect(columns).not.toHaveProperty("trustWorkflow");
  });

  it.each(sortableTables)(
    "$_.sortOrder is required and globally unique",
    (table) => {
      const columns = getTableColumns(table);
      const config = getTableConfig(table);

      expect(columns.sortOrder?.notNull).toBe(true);
      expect(
        config.uniqueConstraints.some((constraint) =>
          constraint.columns.some((column) => column.name === "sort_order"),
        ),
      ).toBe(true);
    },
  );

  it("stores only a unique session token hash", () => {
    const columns = getTableColumns(adminSessions);
    const config = getTableConfig(adminSessions);

    expect(columns).not.toHaveProperty("token");
    expect(columns.tokenHash?.notNull).toBe(true);
    expect(
      config.uniqueConstraints.some((constraint) =>
        constraint.columns.some((column) => column.name === "token_hash"),
      ),
    ).toBe(true);
  });

  it("defines stable lead status values", () => {
    expect(leadStatus.enumValues).toEqual(["NEW", "IN_PROGRESS", "CLOSED"]);
  });
});
