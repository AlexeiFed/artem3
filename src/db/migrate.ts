import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";

function usesLocalDatabase(databaseUrl: string): boolean {
  const hostname = new URL(databaseUrl).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function runMigrations(): Promise<void> {
  const { DATABASE_URL } = getServerEnv();
  const client = postgres(DATABASE_URL, {
    max: 1,
    ssl: usesLocalDatabase(DATABASE_URL)
      ? false
      : { rejectUnauthorized: true },
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
