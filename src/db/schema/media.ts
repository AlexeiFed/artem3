import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objectKey: text("object_key").notNull().unique(),
    url: text("url").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size_bytes", { mode: "number" }).notNull(),
    altText: text("alt_text").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "media_assets_object_key_nonempty_check",
      sql`length(${table.objectKey}) > 0`,
    ),
    check(
      "media_assets_mime_type_nonempty_check",
      sql`length(${table.mimeType}) > 0`,
    ),
    check("media_assets_size_nonnegative_check", sql`${table.size} >= 0`),
  ],
);
