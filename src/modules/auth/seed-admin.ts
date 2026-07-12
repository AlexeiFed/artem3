import "server-only";

import { z } from "zod";

import { hashPassword } from "./password";

const AdminSeedInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(14).max(200),
  })
  .strict();

export interface AdminSeedRepository {
  upsert(input: { email: string; passwordHash: string }): Promise<void>;
}

interface SeedAdminDependencies {
  upsert: AdminSeedRepository["upsert"];
  hashPassword?: (password: string) => Promise<string>;
}

export async function seedAdminUser(
  input: unknown,
  {
    upsert,
    hashPassword: createPasswordHash = hashPassword,
  }: SeedAdminDependencies,
): Promise<void> {
  const parsed = AdminSeedInputSchema.parse(input);
  const passwordHash = await createPasswordHash(parsed.password);
  await upsert({ email: parsed.email, passwordHash });
}
