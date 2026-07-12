import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";

import { getPostgresConnectionOptions } from "./connection-options";

async function runMigrations(): Promise<void> {
  const { DATABASE_URL } = getServerEnv();
  const client = postgres(DATABASE_URL, {
    ...getPostgresConnectionOptions(DATABASE_URL),
    max: 1,
  });

  try {
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  } finally {
    await client.end({ timeout: 5 });
  }
}

void runMigrations().catch((error: unknown) => {
  console.error("Database migration failed", error);
  process.exitCode = 1;
});
