import { describe, expect, it } from "vitest";

import { emptyProductForm, loanProductSchema, toProductForm, toProductPayload } from "./loanProductSchema";

const valid = {
  ...emptyProductForm,
  code: "reg-01",
  name: "Regular Loan",
  min_amount: "5000",
  max_amount: "100000",
  interest_rate: "12",
  term_min_months: "6",
  term_max_months: "36",
};

describe("loan product schema", () => {
  it("accepts a complete product", () => {
    expect(loanProductSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a maximum below the minimum", () => {
    const result = loanProductSchema.safeParse({ ...valid, min_amount: "9000", max_amount: "1000" });

    expect(result.success).toBe(false);
  });

  it("rejects a maximum term below the minimum term", () => {
    expect(loanProductSchema.safeParse({ ...valid, term_min_months: "12", term_max_months: "6" }).success).toBe(false);
  });

  it("requires a guarantor count when guarantors are required", () => {
    expect(loanProductSchema.safeParse({ ...valid, requires_guarantor: true, guarantor_count: "0" }).success).toBe(false);
    expect(loanProductSchema.safeParse({ ...valid, requires_guarantor: true, guarantor_count: "2" }).success).toBe(true);
  });

  it("rejects badly formatted money and percentages", () => {
    expect(loanProductSchema.safeParse({ ...valid, min_amount: "5,000" }).success).toBe(false);
    expect(loanProductSchema.safeParse({ ...valid, interest_rate: "120" }).success).toBe(false);
  });

  it("requires a name for every document", () => {
    expect(loanProductSchema.safeParse({ ...valid, documents: [{ name: " ", is_required: true }] }).success).toBe(false);
  });
});

describe("form mapping", () => {
  it("builds the request with numbers, an upper-case code and no guarantors when not required", () => {
    const payload = toProductPayload({ ...valid, guarantor_count: "3", requires_guarantor: false });

    expect(payload.code).toBe("REG-01");
    expect(payload.term_max_months).toBe(36);
    expect(payload.guarantor_count).toBe(0);
    expect(payload.description).toBeNull();
  });

  it("shows server decimals the way a person would type them", () => {
    const form = toProductForm({
      ...toProductPayload(valid),
      id: 1,
      min_amount: "5000.00",
      max_amount: "100000.50",
      interest_rate: "12.000",
      processing_fee_percent: "0.000",
      service_fee_percent: "0.500",
      penalty_rate_percent: "2.000",
    });

    expect(form.min_amount).toBe("5000");
    expect(form.max_amount).toBe("100000.5");
    expect(form.interest_rate).toBe("12");
    expect(form.processing_fee_percent).toBe("0");
    expect(form.service_fee_percent).toBe("0.5");
  });
});
