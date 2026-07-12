import { z } from "zod";

export const LeadStatusSchema = z.enum(["NEW", "IN_PROGRESS", "CLOSED"]);

export const UpdateLeadStatusSchema = z
  .object({
    status: LeadStatusSchema,
  })
  .strict();

export type LeadStatus = z.infer<typeof LeadStatusSchema>;
