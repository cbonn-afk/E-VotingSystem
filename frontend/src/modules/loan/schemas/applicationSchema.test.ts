import { describe, expect, it } from "vitest";

import { applicationDetailsSchema, emptyDetails, parseCodes, toDetailsPayload } from "./applicationSchema";
import type { LoanProduct } from "../types";

const product = {
  id: 1, code: "REG", name: "Regular", description: null, min_amount: "5000.00", max_amount: "100000.00",
  interest_rate: "12.000", interest_method: "diminishing", term_min_months: 6, term_max_months: 36,
  payment_frequency: "monthly", processing_fee_percent: "0", service_fee_percent: "0", penalty_rate_percent: "0",
  grace_period_days: 0, requires_guarantor: false, guarantor_count: 0, requires_collateral: false,
  min_membership_months: 0, status: "active", documents: [],
} satisfies LoanProduct;

const valid = { ...emptyDetails, amount: "20000", term_months: "12", purpose: "School fees" };

describe("application details schema", () => {
  it("accepts details inside the product limits", () => {
    expect(applicationDetailsSchema(product).safeParse(valid).success).toBe(true);
  });

  it("rejects an amount or term outside the product limits", () => {
    expect(applicationDetailsSchema(product).safeParse({ ...valid, amount: "1000" }).success).toBe(false);
    expect(applicationDetailsSchema(product).safeParse({ ...valid, amount: "999999" }).success).toBe(false);
    expect(applicationDetailsSchema(product).safeParse({ ...valid, term_months: "60" }).success).toBe(false);
  });

  it("requires a purpose", () => {
    expect(applicationDetailsSchema(product).safeParse({ ...valid, purpose: "  " }).success).toBe(false);
  });

  it("requires collateral details only when the product needs collateral", () => {
    const secured = { ...product, requires_collateral: true };

    expect(applicationDetailsSchema(secured).safeParse(valid).success).toBe(false);
    expect(
      applicationDetailsSchema(secured).safeParse({ ...valid, collateral_description: "Lot title", collateral_value: "500000" }).success,
    ).toBe(true);
  });

  it("turns blanks into nulls for the server", () => {
    expect(toDetailsPayload(valid)).toMatchObject({ amount: "20000", term_months: 12, monthly_income: null, employer_business: null });
  });
});

describe("guarantor codes", () => {
  it("splits on commas and lines and removes duplicates", () => {
    expect(parseCodes("M-0002, M-0003\nM-0002\n")).toEqual(["M-0002", "M-0003"]);
  });
});
