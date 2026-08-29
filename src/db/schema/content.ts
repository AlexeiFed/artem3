import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

type ContentSection = Record<string, unknown>;

function createdAt() {
  return timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull();
}

function updatedAt() {
  return timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull();
}

export const siteSettings = pgTable(
  "site_settings",
  {
    id: text("id").primaryKey().default("default"),
    hero: jsonb("hero").$type<ContentSection>().default({}).notNull(),
    trustBanner: jsonb("trust_banner")
      .$type<ContentSection>()
      .default({})
      .notNull(),
    workflow: jsonb("workflow").$type<ContentSection>().default({}).notNull(),
    contacts: jsonb("contacts").$type<ContentSection>().default({}).notNull(),
    legal: jsonb("legal").$type<ContentSection>().default({}).notNull(),
    map: jsonb("map").$type<ContentSection>().default({}).notNull(),
    ratings: jsonb("ratings").$type<ContentSection>().default({}).notNull(),
    vkEmbed: jsonb("vk_embed").$type<ContentSection>().default({}).notNull(),
    analytics: jsonb("analytics").$type<ContentSection>().default({}).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check("site_settings_singleton_check", sql`${table.id} = 'default'`),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    situations: jsonb("situations")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    trustNote: text("trust_note").notNull(),
    priceFromKopecks: integer("price_from_kopecks").notNull(),
    isHighValue: boolean("is_high_value").default(false).notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    ctaLabel: text("cta_label")
      .default("Получить оценку ситуации")
      .notNull(),
    iconUrl: text("icon_url"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("services_sort_order_unique").on(table.sortOrder),
    check(
      "services_price_from_kopecks_nonnegative_check",
      sql`${table.priceFromKopecks} >= 0`,
    ),
    check("services_sort_order_nonnegative_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const cases = pgTable(
  "cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    situation: text("situation").notNull(),
    action: text("action").notNull(),
    result: text("result").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("cases_sort_order_unique").on(table.sortOrder),
    check("cases_sort_order_nonnegative_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("faqs_sort_order_unique").on(table.sortOrder),
    check("faqs_sort_order_nonnegative_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    author: text("author").notNull(),
    quote: text("quote").notNull(),
    imageUrl: text("image_url"),
    source: text("source").notNull(),
    sourceUrl: text("source_url").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("reviews_sort_order_unique").on(table.sortOrder),
    check("reviews_sort_order_nonnegative_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("certificates_sort_order_unique").on(table.sortOrder),
    check(
      "certificates_sort_order_nonnegative_check",
      sql`${table.sortOrder} >= 0`,
    ),
  ],
);
