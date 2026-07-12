import { describe, expect, it } from "vitest";

import { getPostgresConnectionOptions } from "./connection-options";

describe("PostgreSQL connection options", () => {
  it.each([
    "postgresql://user:password@localhost:5432/database",
    "postgresql://user:password@127.0.0.1:5432/database",
    "postgresql://user:password@[::1]:5432/database",
  ])("disables TLS for local database %s", (databaseUrl) => {
    expect(getPostgresConnectionOptions(databaseUrl).ssl).toBe(false);
  });

  it("requires certificate validation for a remote database", () => {
    expect(
      getPostgresConnectionOptions(
        "postgresql://user:password@db.example.com:5432/database",
      ).ssl,
    ).toEqual({ rejectUnauthorized: true });
  });

  it("bounds idle connections and connection attempts", () => {
    const options = getPostgresConnectionOptions(
      "postgresql://user:password@db.example.com:5432/database",
    );

    expect(options.idle_timeout).toBe(20);
    expect(options.connect_timeout).toBe(10);
  });
});
