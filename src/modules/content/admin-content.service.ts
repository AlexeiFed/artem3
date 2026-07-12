import "server-only";

import { z } from "zod";

import {
  CreateCaseInputSchema,
  CreateCertificateInputSchema,
  CreateFaqInputSchema,
  CreateReviewInputSchema,
  ReorderableEntitySchema,
  ReorderInputSchema,
  UpdateCaseInputSchema,
  UpdateCertificateInputSchema,
  UpdateFaqInputSchema,
  UpdateReviewInputSchema,
  UpdateServiceInputSchema,
  UpdateSiteSettingsInputSchema,
  type ReorderableEntity,
  type UpdateSiteSettingsInput,
} from "./admin-content.schemas";
import type {
  CaseContent,
  CertificateContent,
  FaqContent,
  ReviewContent,
  ServiceContent,
} from "./content.types";
import type { SiteSettingsRow } from "./content.repository";

export type AdminContentErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PERSISTENCE";

export class AdminContentDomainError extends Error {
  constructor(
    readonly code: AdminContentErrorCode,
    readonly fields?: Record<string, string[]>,
    cause?: Error,
  ) {
    super(code, cause ? { cause } : undefined);
    this.name = "AdminContentDomainError";
  }
}

export interface PersistedService extends ServiceContent {
  id: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedCase extends CaseContent {
  id: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedFaq extends FaqContent {
  id: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedReview extends ReviewContent {
  id: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedCertificate extends CertificateContent {
  id: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminContentRepository {
  updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettingsRow>;
  updateService(id: string, input: ServiceContent): Promise<PersistedService>;
  createCase(input: CaseContent): Promise<PersistedCase>;
  updateCase(id: string, input: CaseContent): Promise<PersistedCase>;
  deleteCase(id: string): Promise<void>;
  createFaq(input: FaqContent): Promise<PersistedFaq>;
  updateFaq(id: string, input: FaqContent): Promise<PersistedFaq>;
  deleteFaq(id: string): Promise<void>;
  createReview(input: ReviewContent): Promise<PersistedReview>;
  updateReview(id: string, input: ReviewContent): Promise<PersistedReview>;
  deleteReview(id: string): Promise<void>;
  createCertificate(input: CertificateContent): Promise<PersistedCertificate>;
  updateCertificate(
    id: string,
    input: CertificateContent,
  ): Promise<PersistedCertificate>;
  deleteCertificate(id: string): Promise<void>;
  reorder(entity: ReorderableEntity, orderedIds: string[]): Promise<string[]>;
}

interface AdminContentServiceDependencies {
  repository: AdminContentRepository;
  revalidateLandingData(): void;
}

export interface AdminContentService {
  updateSettings(input: unknown): Promise<SiteSettingsRow>;
  updateService(id: string, input: unknown): Promise<PersistedService>;
  createCase(input: unknown): Promise<PersistedCase>;
  updateCase(id: string, input: unknown): Promise<PersistedCase>;
  deleteCase(id: string): Promise<void>;
  createFaq(input: unknown): Promise<PersistedFaq>;
  updateFaq(id: string, input: unknown): Promise<PersistedFaq>;
  deleteFaq(id: string): Promise<void>;
  createReview(input: unknown): Promise<PersistedReview>;
  updateReview(id: string, input: unknown): Promise<PersistedReview>;
  deleteReview(id: string): Promise<void>;
  createCertificate(input: unknown): Promise<PersistedCertificate>;
  updateCertificate(id: string, input: unknown): Promise<PersistedCertificate>;
  deleteCertificate(id: string): Promise<void>;
  reorder(entity: unknown, orderedIds: unknown): Promise<string[]>;
}

export function createAdminContentService({
  repository,
  revalidateLandingData,
}: AdminContentServiceDependencies): AdminContentService {
  return {
    async updateSettings(input: unknown): Promise<SiteSettingsRow> {
      const parsed = parseOrThrow(UpdateSiteSettingsInputSchema, input);
      const result = await runPersistence(() =>
        repository.updateSiteSettings(parsed),
      );
      revalidateLandingData();
      return result;
    },

    async updateService(id: string, input: unknown): Promise<PersistedService> {
      assertUuid(id);
      const parsed = parseOrThrow(UpdateServiceInputSchema, input);
      const result = await runPersistence(() =>
        repository.updateService(id, parsed),
      );
      revalidateLandingData();
      return result;
    },

    async createCase(input: unknown): Promise<PersistedCase> {
      const parsed = parseOrThrow(CreateCaseInputSchema, input);
      const result = await runPersistence(() => repository.createCase(parsed));
      revalidateLandingData();
      return result;
    },

    async updateCase(id: string, input: unknown): Promise<PersistedCase> {
      assertUuid(id);
      const parsed = parseOrThrow(UpdateCaseInputSchema, input);
      const result = await runPersistence(() =>
        repository.updateCase(id, parsed),
      );
      revalidateLandingData();
      return result;
    },

    async deleteCase(id: string): Promise<void> {
      assertUuid(id);
      await runPersistence(() => repository.deleteCase(id));
      revalidateLandingData();
    },

    async createFaq(input: unknown): Promise<PersistedFaq> {
      const parsed = parseOrThrow(CreateFaqInputSchema, input);
      const result = await runPersistence(() => repository.createFaq(parsed));
      revalidateLandingData();
      return result;
    },

    async updateFaq(id: string, input: unknown): Promise<PersistedFaq> {
      assertUuid(id);
      const parsed = parseOrThrow(UpdateFaqInputSchema, input);
      const result = await runPersistence(() => repository.updateFaq(id, parsed));
      revalidateLandingData();
      return result;
    },

    async deleteFaq(id: string): Promise<void> {
      assertUuid(id);
      await runPersistence(() => repository.deleteFaq(id));
      revalidateLandingData();
    },

    async createReview(input: unknown): Promise<PersistedReview> {
      const parsed = parseOrThrow(CreateReviewInputSchema, input);
      const result = await runPersistence(() =>
        repository.createReview(parsed),
      );
      revalidateLandingData();
      return result;
    },

    async updateReview(id: string, input: unknown): Promise<PersistedReview> {
      assertUuid(id);
      const parsed = parseOrThrow(UpdateReviewInputSchema, input);
      const result = await runPersistence(() =>
        repository.updateReview(id, parsed),
      );
      revalidateLandingData();
      return result;
    },

    async deleteReview(id: string): Promise<void> {
      assertUuid(id);
      await runPersistence(() => repository.deleteReview(id));
      revalidateLandingData();
    },

    async createCertificate(input: unknown): Promise<PersistedCertificate> {
      const parsed = parseOrThrow(CreateCertificateInputSchema, input);
      const result = await runPersistence(() =>
        repository.createCertificate(parsed),
      );
      revalidateLandingData();
      return result;
    },

    async updateCertificate(
      id: string,
      input: unknown,
    ): Promise<PersistedCertificate> {
      assertUuid(id);
      const parsed = parseOrThrow(UpdateCertificateInputSchema, input);
      const result = await runPersistence(() =>
        repository.updateCertificate(id, parsed),
      );
      revalidateLandingData();
      return result;
    },

    async deleteCertificate(id: string): Promise<void> {
      assertUuid(id);
      await runPersistence(() => repository.deleteCertificate(id));
      revalidateLandingData();
    },

    async reorder(entity: unknown, orderedIds: unknown): Promise<string[]> {
      const parsed = parseOrThrow(ReorderInputSchema, {
        entity,
        orderedIds,
      });
      if (!ReorderableEntitySchema.safeParse(parsed.entity).success) {
        throw new AdminContentDomainError("VALIDATION", {
          entity: ["Неизвестный тип сущности"],
        });
      }
      const result = await runPersistence(() =>
        repository.reorder(parsed.entity, parsed.orderedIds),
      );
      revalidateLandingData();
      return result;
    },
  };
}

function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  return parsed.data;
}

function validationError(error: z.ZodError): AdminContentDomainError {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_form";
    fields[path] ??= [];
    fields[path].push(issue.message);
  }
  return new AdminContentDomainError("VALIDATION", fields);
}

function assertUuid(id: string): void {
  if (!z.uuid().safeParse(id).success) {
    throw new AdminContentDomainError("VALIDATION", {
      id: ["Некорректный идентификатор"],
    });
  }
}

async function runPersistence<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AdminContentDomainError) {
      throw error;
    }
    throw new AdminContentDomainError(
      "PERSISTENCE",
      undefined,
      error instanceof Error ? error : undefined,
    );
  }
}

export type { ReorderableEntity };
