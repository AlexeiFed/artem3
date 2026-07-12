import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

function timestampWithTimezone(name: string) {
  return timestamp(name, { withTimezone: true, mode: "date" });
}

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestampWithTimezone("created_at").defaultNow().notNull(),
    updatedAt: timestampWithTimezone("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "admin_users_email_normalized_check",
      sql`${table.email} = lower(trim(${table.email}))`,
    ),
    check(
      "admin_users_password_hash_nonempty_check",
      sql`length(${table.passwordHash}) > 0`,
    ),
  ],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestampWithTimezone("expires_at").notNull(),
    lastActivityAt: timestampWithTimezone("last_activity_at")
      .defaultNow()
      .notNull(),
    createdAt: timestampWithTimezone("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("admin_sessions_token_hash_unique").on(table.tokenHash),
    index("admin_sessions_user_id_idx").on(table.userId),
    index("admin_sessions_expires_at_idx").on(table.expiresAt),
    check(
      "admin_sessions_token_hash_sha256_check",
      sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "admin_sessions_expiry_after_creation_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);
