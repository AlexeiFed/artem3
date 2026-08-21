import "server-only";

import { getDb } from "@/db/client";
import { leads } from "@/db/schema";

type Database = ReturnType<typeof getDb>;

export interface CreateLeadRecord {
  name: string;
  phone: string;
  situation?: string;
  serviceName?: string;
  isDataAgreed: true;
  isMarketingAgreed: boolean;
  consentAt: Date;
  consentDocumentVersion: string;
  consentCheckboxText: string;
}

export interface LeadRepository {
  create(input: CreateLeadRecord): Promise<string>;
}

export class DrizzleLeadRepository implements LeadRepository {
  constructor(private readonly db: Database = getDb()) {}

  async create(input: CreateLeadRecord): Promise<string> {
    const [created] = await this.db
      .insert(leads)
      .values({
        name: input.name,
        phone: input.phone,
        isDataAgreed: input.isDataAgreed,
        isMarketingAgreed: input.isMarketingAgreed,
        consentAt: input.consentAt,
        consentDocumentVersion: input.consentDocumentVersion,
        consentCheckboxText: input.consentCheckboxText,
        ...(input.situation === undefined
          ? {}
          : { situation: input.situation }),
        ...(input.serviceName === undefined
          ? {}
          : { serviceName: input.serviceName }),
      })
      .returning({ id: leads.id });

    if (!created) {
      throw new Error("Lead insert returned no row");
    }

    return created.id;
  }
}
