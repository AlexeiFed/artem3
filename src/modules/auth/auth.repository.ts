import "server-only";

import { and, eq, lte, ne } from "drizzle-orm";

import { getDb } from "@/db/client";
import { adminSessions, adminUsers } from "@/db/schema";

import { SESSION_ACTIVITY_INTERVAL_MS } from "./session";

type Database = ReturnType<typeof getDb>;

export interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  active: boolean;
}

export interface AdminSessionRecord {
  tokenHash: string;
  expiresAt: Date;
  lastActivityAt: Date;
  user: {
    id: string;
    email: string;
    active: boolean;
  };
}

export interface InsertSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AdminUserRecord | null>;
  findUserById(id: string): Promise<AdminUserRecord | null>;
  insertSession(input: InsertSessionInput): Promise<void>;
  findSessionByTokenHash(
    tokenHash: string,
  ): Promise<AdminSessionRecord | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  touchSessionActivity(tokenHash: string, now: Date): Promise<void>;
  updatePasswordAndRevokeOtherSessions(input: {
    userId: string;
    passwordHash: string;
    keepTokenHash: string;
  }): Promise<void>;
}

export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly db: Database = getDb()) {}

  async findUserByEmail(email: string): Promise<AdminUserRecord | null> {
    const [user] = await this.db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        passwordHash: adminUsers.passwordHash,
        active: adminUsers.active,
      })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    return user ?? null;
  }

  async findUserById(id: string): Promise<AdminUserRecord | null> {
    const [user] = await this.db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        passwordHash: adminUsers.passwordHash,
        active: adminUsers.active,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    return user ?? null;
  }

  async insertSession(input: InsertSessionInput): Promise<void> {
    await this.db.insert(adminSessions).values({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: input.now,
      lastActivityAt: input.now,
    });
  }

  async findSessionByTokenHash(
    tokenHash: string,
  ): Promise<AdminSessionRecord | null> {
    const [session] = await this.db
      .select({
        tokenHash: adminSessions.tokenHash,
        expiresAt: adminSessions.expiresAt,
        lastActivityAt: adminSessions.lastActivityAt,
        user: {
          id: adminUsers.id,
          email: adminUsers.email,
          active: adminUsers.active,
        },
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          eq(adminUsers.active, true),
        ),
      )
      .limit(1);

    return session ?? null;
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    await this.db
      .delete(adminSessions)
      .where(eq(adminSessions.tokenHash, tokenHash));
  }

  async touchSessionActivity(tokenHash: string, now: Date): Promise<void> {
    const activityCutoff = new Date(
      now.getTime() - SESSION_ACTIVITY_INTERVAL_MS,
    );
    await this.db
      .update(adminSessions)
      .set({ lastActivityAt: now })
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          lte(adminSessions.lastActivityAt, activityCutoff),
        ),
      );
  }

  async updatePasswordAndRevokeOtherSessions(input: {
    userId: string;
    passwordHash: string;
    keepTokenHash: string;
  }): Promise<void> {
    await this.db.transaction(async (transaction) => {
      await transaction
        .update(adminUsers)
        .set({ passwordHash: input.passwordHash, updatedAt: new Date() })
        .where(eq(adminUsers.id, input.userId));
      await transaction
        .delete(adminSessions)
        .where(
          and(
            eq(adminSessions.userId, input.userId),
            ne(adminSessions.tokenHash, input.keepTokenHash),
          ),
        );
    });
  }
}
