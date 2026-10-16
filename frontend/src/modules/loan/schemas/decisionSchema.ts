import type { DecisionPayload } from "../types";

export type DecisionInput = {
  decision: "approved" | "rejected";
  amount: string;
  remarks: string;
  /** What is on the table now: the approver may keep or lower it. */
  effective: number;
  productMinimum: number;
};

/** Returns field messages; an empty object means the decision can be sent. */
export const validateDecision = (input: DecisionInput): Partial<Record<"amount" | "remarks", string>> => {
  const errors: Partial<Record<"amount" | "remarks", string>> = {};

  if (input.decision === "rejected") {
    if (input.remarks.trim() === "") errors.remarks = "Give a reason so the member and the next reviewer know why.";

    return errors;
  }

  if (input.amount.trim() === "") return errors; // keeping the amount as it is

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(input.amount)) {
    errors.amount = "Enter an amount like 50000 or 50000.50.";
  } else if (Number(input.amount) > input.effective) {
    errors.amount = `The amount cannot be higher than ${input.effective.toLocaleString("en-PH")}.`;
  } else if (Number(input.amount) < input.productMinimum) {
    errors.amount = `The amount cannot be below the product minimum of ${input.productMinimum.toLocaleString("en-PH")}.`;
  }

  return errors;
};

export const toDecisionPayload = (input: DecisionInput): DecisionPayload => ({
  decision: input.decision,
  approved_amount: input.decision === "approved" && input.amount.trim() !== "" ? input.amount : null,
  remarks: input.remarks.trim() === "" ? null : input.remarks.trim(),
});
