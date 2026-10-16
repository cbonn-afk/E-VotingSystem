import { z } from "zod";

import type { ApprovalLevel } from "../types";

export const approvalLevelsSchema = z
  .object({
    levels: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Name the level.").max(80),
          role_id: z.string(), // "" = anyone who has the approve permission
          min_amount: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter an amount like 50000."),
        }),
      )
      .min(1, "Add at least one level.")
      .max(6, "Use at most six levels."),
  })
  .superRefine((values, context) => {
    values.levels.forEach((level, index) => {
      if (index === 0 && Number(level.min_amount) !== 0) {
        context.addIssue({ code: "custom", path: ["levels", 0, "min_amount"], message: "The first level must start at 0 so every loan has an approver." });
      }

      if (index > 0 && Number(level.min_amount) <= Number(values.levels[index - 1].min_amount)) {
        context.addIssue({ code: "custom", path: ["levels", index, "min_amount"], message: "Each level must start higher than the one before it." });
      }

      if (values.levels.findIndex((other) => other.name.trim().toLowerCase() === level.name.trim().toLowerCase()) !== index) {
        context.addIssue({ code: "custom", path: ["levels", index, "name"], message: "Each level needs a different name." });
      }
    });
  });

export type ApprovalLevelsFormValues = z.infer<typeof approvalLevelsSchema>;

const trimDecimal = (value: string): string => (value.includes(".") ? value.replace(/\.?0+$/, "") : value);

export const toLevelsForm = (levels: ApprovalLevel[]): ApprovalLevelsFormValues => ({
  levels: levels.map((l) => ({ name: l.name, role_id: l.role_id === null ? "" : String(l.role_id), min_amount: trimDecimal(l.min_amount) || "0" })),
});

export const toLevelsRequest = (values: ApprovalLevelsFormValues): ApprovalLevel[] =>
  values.levels.map((l) => ({ name: l.name.trim(), role_id: l.role_id === "" ? null : Number(l.role_id), min_amount: l.min_amount }));
