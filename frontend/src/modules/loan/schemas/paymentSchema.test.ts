import { describe, expect, it } from "vitest";

import { paymentSchema, toPaymentPayload } from "./paymentSchema";

const limits = { payoff: 10000, today: "2026-06-20", earliest: "2026-06-01" };
const valid = { amount: "1500", paid_on: "2026-06-20", method: "cash" as const, reference_no: "", remarks: "" };
const check = (values: object) => paymentSchema(limits).safeParse({ ...valid, ...values });

describe("payment form", () => {
  it("accepts a normal cash payment", () => {
    expect(check({}).success).toBe(true);
  });

  it("rejects zero, bad formats and more than the whole balance", () => {
    expect(check({ amount: "0" }).success).toBe(false);
    expect(check({ amount: "1,500" }).success).toBe(false);
    expect(check({ amount: "10000.01" }).success).toBe(false);
    expect(check({ amount: "10000" }).success).toBe(true);
  });

  it("keeps the payment date between the last payment and today", () => {
    expect(check({ paid_on: "2026-06-21" }).success).toBe(false);
    expect(check({ paid_on: "2026-05-31" }).success).toBe(false);
    expect(check({ paid_on: "2026-06-01" }).success).toBe(true);
  });

  it("needs a reference unless the payment is cash", () => {
    expect(check({ method: "check" }).success).toBe(false);
    expect(check({ method: "check", reference_no: "CHK-1" }).success).toBe(true);
    expect(check({ method: "cash", reference_no: "" }).success).toBe(true);
  });

  it("turns blanks into nulls for the server", () => {
    expect(toPaymentPayload({ ...valid, reference_no: "  ", remarks: "" })).toMatchObject({ reference_no: null, remarks: null });
  });
});
