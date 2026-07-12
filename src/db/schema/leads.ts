import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { services } from "./content";

function timestampWithTimezone(name: string) {
  return timestamp(name, { withTimezone: true, mode: "date" });
}

export const leadStatus = pgEnum("lead_status", [
  "NEW",
  "IN_PROGRESS",
  "CLOSED",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    situation: text("situation"),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    status: leadStatus("status").default("NEW").notNull(),
    createdAt: timestampWithTimezone("created_at").defaultNow().notNull(),
    updatedAt: timestampWithTimezone("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("leads_service_id_idx").on(table.serviceId),
    index("leads_status_idx").on(table.status),
    index("leads_created_at_idx").on(table.createdAt),
    check("leads_name_nonempty_check", sql`length(trim(${table.name})) > 0`),
    check(
      "leads_phone_normalized_check",
      sql`${table.phone} ~ '^\\+[1-9][0-9]{7,14}$'`,
    ),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    hashedKey: text("hashed_key").notNull(),
    action: text("action").notNull(),
    windowStart: timestampWithTimezone("window_start").notNull(),
    count: integer("count").default(1).notNull(),
  },
  (table) => [
    primaryKey({
      name: "rate_limits_key_action_window_pk",
      columns: [table.hashedKey, table.action, table.windowStart],
    }),
    index("rate_limits_window_start_idx").on(table.windowStart),
    check(
      "rate_limits_hashed_key_sha256_check",
      sql`${table.hashedKey} ~ '^[0-9a-f]{64}$'`,
    ),
    check("rate_limits_action_nonempty_check", sql`length(${table.action}) > 0`),
    check("rate_limits_count_positive_check", sql`${table.count} > 0`),
  ],
);
