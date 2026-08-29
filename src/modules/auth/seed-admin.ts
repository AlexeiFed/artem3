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
  findByEmail(email: string): Promise<{
    id: string;
    passwordHash: string;
    active: boolean;
  } | null>;
  create(input: {
    email: string;
    passwordHash: string;
    active: true;
  }): Promise<void>;
}

interface SeedAdminDependencies {
  repository: AdminSeedRepository;
  hashPassword?: (password: string) => Promise<string>;
}

export async function seedAdminUser(
  input: unknown,
  {
    repository,
    hashPassword: createPasswordHash = hashPassword,
  }: SeedAdminDependencies,
): Promise<void> {
  const parsed = AdminSeedInputSchema.parse(input);
  const existing = await repository.findByEmail(parsed.email);

  if (existing) {
    return;
  }

  const passwordHash = await createPasswordHash(parsed.password);
  await repository.create({
    email: parsed.email,
    passwordHash,
    active: true,
  });
}
