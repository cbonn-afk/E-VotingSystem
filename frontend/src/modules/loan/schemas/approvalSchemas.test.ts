import { describe, expect, it } from "vitest";

import type { LoanApplication } from "../types";
import { approvalLevelsSchema, toLevelsForm, toLevelsRequest } from "./approvalLevelsSchema";
import { validateDecision, toDecisionPayload } from "./decisionSchema";
import { evaluationSchema, emptyEvaluation, toEvaluationPayload } from "./evaluationSchema";

const application = { amount: "100000.00", product: { min_amount: "5000.00" } } as LoanApplication;
const evaluate = (values: object) => evaluationSchema(application).safeParse({ ...emptyEvaluation, notes: "Looks fine.", ...values });

describe("evaluation form", () => {
  it("accepts an approval recommendation with notes", () => {
    expect(evaluate({}).success).toBe(true);
  });

  it("requires notes", () => {
    expect(evaluate({ notes: "  " }).success).toBe(false);
  });

  it("needs a lower amount, above the product minimum, when recommending a lower amount", () => {
    expect(evaluate({ recommendation: "approve_lower" }).success).toBe(false);
    expect(evaluate({ recommendation: "approve_lower", recommended_amount: "100000" }).success).toBe(false);
    expect(evaluate({ recommendation: "approve_lower", recommended_amount: "1000" }).success).toBe(false);
    expect(evaluate({ recommendation: "approve_lower", recommended_amount: "60000" }).success).toBe(true);
  });

  it("sends the recommended amount only for a lower recommendation", () => {
    expect(toEvaluationPayload({ ...emptyEvaluation, notes: "ok", recommended_amount: "5000" }).recommended_amount).toBeNull();
    expect(toEvaluationPayload({ ...emptyEvaluation, notes: "ok", recommendation: "approve_lower", recommended_amount: "5000" }).recommended_amount).toBe("5000");
  });
});

describe("approver decision", () => {
  const base = { decision: "approved" as const, amount: "", remarks: "", effective: 80000, productMinimum: 5000 };

  it("lets an approver keep the amount", () => {
    expect(validateDecision(base)).toEqual({});
    expect(toDecisionPayload(base).approved_amount).toBeNull();
  });

  it("allows lowering but not raising or going below the minimum", () => {
    expect(validateDecision({ ...base, amount: "70000" })).toEqual({});
    expect(validateDecision({ ...base, amount: "90000" }).amount).toBeDefined();
    expect(validateDecision({ ...base, amount: "1000" }).amount).toBeDefined();
    expect(validateDecision({ ...base, amount: "7,000" }).amount).toBeDefined();
  });

  it("requires a reason to reject", () => {
    expect(validateDecision({ ...base, decision: "rejected" }).remarks).toBeDefined();
    expect(validateDecision({ ...base, decision: "rejected", remarks: "Income too low" })).toEqual({});
    expect(toDecisionPayload({ ...base, decision: "rejected", amount: "5000", remarks: "No" }).approved_amount).toBeNull();
  });
});

describe("approval levels form", () => {
  const level = (name: string, min: string) => ({ name, role_id: "", min_amount: min });

  it("accepts increasing levels that start at 0", () => {
    expect(approvalLevelsSchema.safeParse({ levels: [level("Officer", "0"), level("Board", "100000")] }).success).toBe(true);
  });

  it("rejects a first level above 0, a level that does not increase, and repeated names", () => {
    expect(approvalLevelsSchema.safeParse({ levels: [level("Officer", "100")] }).success).toBe(false);
    expect(approvalLevelsSchema.safeParse({ levels: [level("A", "0"), level("B", "0")] }).success).toBe(false);
    expect(approvalLevelsSchema.safeParse({ levels: [level("A", "0"), level("a", "500")] }).success).toBe(false);
  });

  it("converts to and from the server shape", () => {
    const form = toLevelsForm([
      { name: "Officer", role_id: null, min_amount: "0.00" },
      { name: "Board", role_id: 7, min_amount: "200000.00" },
    ]);

    expect(form.levels[1]).toEqual({ name: "Board", role_id: "7", min_amount: "200000" });
    expect(toLevelsRequest(form)).toEqual([
      { name: "Officer", role_id: null, min_amount: "0" },
      { name: "Board", role_id: 7, min_amount: "200000" },
    ]);
  });
});
