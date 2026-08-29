import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { adminSessions, adminUsers, auditEvents } from "./auth";
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
        auditEvents,
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
      "audit_events",
    ]);
  });

  it("keeps trust banner and workflow independently editable", () => {
    const columns = getTableColumns(siteSettings);

    expect(columns.trustBanner?.name).toBe("trust_banner");
    expect(columns.trustBanner?.notNull).toBe(true);
    expect(columns.workflow?.name).toBe("workflow");
    expect(columns.workflow?.notNull).toBe(true);
    expect(columns.analytics?.name).toBe("analytics");
    expect(columns.analytics?.notNull).toBe(true);
    expect(columns).not.toHaveProperty("trustWorkflow");
  });

  it("stores services.is_hidden as required boolean with default false", () => {
    const columns = getTableColumns(services);

    expect(columns.isHidden?.name).toBe("is_hidden");
    expect(columns.isHidden?.notNull).toBe(true);
    expect(columns.isHidden?.hasDefault).toBe(true);
  });

  it("stores services.cta_label as required text with default", () => {
    const columns = getTableColumns(services);

    expect(columns.ctaLabel?.name).toBe("cta_label");
    expect(columns.ctaLabel?.notNull).toBe(true);
    expect(columns.ctaLabel?.hasDefault).toBe(true);
  });

  it("stores services.icon_url as optional text", () => {
    const columns = getTableColumns(services);

    expect(columns.iconUrl?.name).toBe("icon_url");
    expect(columns.iconUrl?.notNull).toBe(false);
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

  it("indexes the optional lead service foreign key", () => {
    const config = getTableConfig(leads);

    expect(config.indexes.map((tableIndex) => tableIndex.config.name)).toContain(
      "leads_service_id_idx",
    );
  });

  it("preserves a submitted dynamic service name independently of service FK", () => {
    const columns = getTableColumns(leads);

    expect(columns.serviceName?.name).toBe("service_name");
    expect(columns.serviceName?.notNull).toBe(false);
    expect(columns.serviceId?.name).toBe("service_id");
  });

  it("stores consent document version and checkbox text on the lead", () => {
    const columns = getTableColumns(leads);

    expect(columns.consentDocumentVersion?.name).toBe(
      "consent_document_version",
    );
    expect(columns.consentDocumentVersion?.notNull).toBe(true);
    expect(columns.consentCheckboxText?.name).toBe("consent_checkbox_text");
    expect(columns.consentCheckboxText?.notNull).toBe(true);
  });
});
