import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";

type Database = ReturnType<typeof getDb>;

export interface IncrementRateLimitInput {
  hashedKey: string;
  action: string;
  windowStart: Date;
}

export interface RateLimitRepository {
  increment(input: IncrementRateLimitInput): Promise<number>;
}

export class DrizzleRateLimitRepository implements RateLimitRepository {
  constructor(private readonly db: Database = getDb()) {}

  async increment(input: IncrementRateLimitInput): Promise<number> {
    const [row] = await this.db
      .insert(rateLimits)
      .values(input)
      .onConflictDoUpdate({
        target: [
          rateLimits.hashedKey,
          rateLimits.action,
          rateLimits.windowStart,
        ],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count });

    if (!row) {
      throw new Error("Rate limit increment returned no row");
    }

    return row.count;
  }
}
