import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";

import * as schema from "./schema";
import { getPostgresConnectionOptions } from "./connection-options";

type PostgresClient = ReturnType<typeof postgres>;
type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var __artemPostgresClient: PostgresClient | undefined;
  var __artemDatabase: Database | undefined;
}

export function getPostgresClient(): PostgresClient {
  if (!globalThis.__artemPostgresClient) {
    const { DATABASE_URL } = getServerEnv();

    globalThis.__artemPostgresClient = postgres(
      DATABASE_URL,
      getPostgresConnectionOptions(DATABASE_URL),
    );
  }

  return globalThis.__artemPostgresClient;
}

export function getDb(): Database {
  globalThis.__artemDatabase ??= drizzle(getPostgresClient(), { schema });
  return globalThis.__artemDatabase;
}
