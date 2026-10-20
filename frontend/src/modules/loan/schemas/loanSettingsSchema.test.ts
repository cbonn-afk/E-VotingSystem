import { describe, expect, it } from "vitest";

import { isValidNetwork, loanSettingsSchema, parseNetworks } from "./loanSettingsSchema";

describe("network validation", () => {
  it.each(["192.168.1.10", "10.0.0.0/8", "2001:db8::/32", "::1"])("accepts %s", (value) => {
    expect(isValidNetwork(value)).toBe(true);
  });

  it.each(["", "256.1.1.1", "10.0.0.0/33", "10.0.0.0/8/1", "office"])("rejects %s", (value) => {
    expect(isValidNetwork(value)).toBe(false);
  });

  it("splits lines and commas and removes duplicates", () => {
    expect(parseNetworks("10.0.0.1\n10.0.0.1, 192.168.0.0/16\n\n")).toEqual(["10.0.0.1", "192.168.0.0/16"]);
  });
});

describe("loan settings schema", () => {
  const valid = {
    portal_access_mode: "network_only" as const,
    networksText: "192.168.1.0/24",
    session_idle_minutes: "20",
    signature_required: false,
    diminishing_method: "equal_installment" as const,
    fee_handling: "deduct_from_proceeds" as const,
    payment_allocation: "penalty_interest_principal" as const,
    penalty_basis: "installment" as const,
    penalty_rate_source: "coop_default" as const,
    default_penalty_rate_percent: "2",
    penalty_calculation: "per_month_or_fraction" as const,
    agreement_terms: "1. The Borrower promises to repay.",
  };

  it("accepts valid settings", () => {
    expect(loanSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an idle timeout outside 5 to 120 minutes", () => {
    expect(loanSettingsSchema.safeParse({ ...valid, session_idle_minutes: "3" }).success).toBe(false);
    expect(loanSettingsSchema.safeParse({ ...valid, session_idle_minutes: "500" }).success).toBe(false);
  });

  it("rejects an unknown money rule and empty agreement terms", () => {
    expect(loanSettingsSchema.safeParse({ ...valid, fee_handling: "whatever" }).success).toBe(false);
    expect(loanSettingsSchema.safeParse({ ...valid, agreement_terms: "  " }).success).toBe(false);
  });

  it("checks the penalty rate", () => {
    expect(loanSettingsSchema.safeParse({ ...valid, default_penalty_rate_percent: "0" }).success).toBe(true);
    expect(loanSettingsSchema.safeParse({ ...valid, default_penalty_rate_percent: "1.5" }).success).toBe(true);
    expect(loanSettingsSchema.safeParse({ ...valid, default_penalty_rate_percent: "150" }).success).toBe(false);
    expect(loanSettingsSchema.safeParse({ ...valid, default_penalty_rate_percent: "two" }).success).toBe(false);
    expect(loanSettingsSchema.safeParse({ ...valid, penalty_calculation: "weekly" }).success).toBe(false);
  });

  it("rejects a bad network entry", () => {
    expect(loanSettingsSchema.safeParse({ ...valid, networksText: "nope" }).success).toBe(false);
  });
});
