import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";

import * as schema from "./schema";

type PostgresClient = ReturnType<typeof postgres>;

let client: PostgresClient | undefined;
let database: PostgresJsDatabase<typeof schema> | undefined;

function usesLocalDatabase(databaseUrl: string): boolean {
  const hostname = new URL(databaseUrl).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getPostgresClient(): PostgresClient {
  if (!client) {
    const { DATABASE_URL } = getServerEnv();

    client = postgres(DATABASE_URL, {
      ssl: usesLocalDatabase(DATABASE_URL)
        ? false
        : { rejectUnauthorized: true },
    });
  }

  return client;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  database ??= drizzle(getPostgresClient(), { schema });
  return database;
}
