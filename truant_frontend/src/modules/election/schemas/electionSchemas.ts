import { z } from "zod";

export const assemblySchema = z.object({
  year: z.string().regex(/^\d{4}$/, "Enter a 4-digit year."),
  name: z.string().trim().min(1, "Name is required.").max(255),
});
export type AssemblyFormValues = z.infer<typeof assemblySchema>;

export const memberSchema = z.object({
  memberCode: z
    .string()
    .trim()
    .min(1, "Member code is required.")
    .max(50)
    .regex(/^\S+$/, "The member code cannot contain spaces."),
  name: z.string().trim().min(1, "Name is required.").max(255),
  birthDate: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  isDelinquent: z.boolean(),
});
export type MemberFormValues = z.infer<typeof memberSchema>;

export const positionSchema = z.object({
  title: z.string().trim().min(1, "Position title is required.").max(255),
  seats: z
    .number({ message: "Enter the number of seats." })
    .int("Seats must be a whole number.")
    .min(1, "At least 1 seat.")
    .max(50, "At most 50 seats."),
});
export type PositionFormValues = z.infer<typeof positionSchema>;

export const candidateSchema = z.object({
  name: z.string().trim().min(1, "Candidate name is required.").max(255),
});
export type CandidateFormValues = z.infer<typeof candidateSchema>;

export const amendmentSchema = z.object({
  proposedBy: z.string().trim().min(1, "Proposed by is required.").max(255),
  title: z.string().trim().min(1, "Proposal title is required.").max(255),
  originalContent: z.string().trim().min(1, "Original content is required."),
  proposedContent: z.string().trim().min(1, "Proposed content is required."),
  effect: z.string().trim().min(1, "Effect is required."),
});
export type AmendmentFormValues = z.infer<typeof amendmentSchema>;

export const settingsSchema = z.object({
  companyTitle: z.string().trim().max(255).optional().or(z.literal("")),
  documentTitle: z.string().trim().max(255).optional().or(z.literal("")),
  documentSubTitle: z.string().trim().max(255).optional().or(z.literal("")),
  registrationAutoSearch: z.boolean(),
  registrationShowMemberInfo: z.boolean(),
  voteAutoSearch: z.boolean(),
  voteShowMemberInfo: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;
