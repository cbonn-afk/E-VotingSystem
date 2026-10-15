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
  };

  it("accepts valid settings", () => {
    expect(loanSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an idle timeout outside 5 to 120 minutes", () => {
    expect(loanSettingsSchema.safeParse({ ...valid, session_idle_minutes: "3" }).success).toBe(false);
    expect(loanSettingsSchema.safeParse({ ...valid, session_idle_minutes: "500" }).success).toBe(false);
  });

  it("rejects a bad network entry", () => {
    expect(loanSettingsSchema.safeParse({ ...valid, networksText: "nope" }).success).toBe(false);
  });
});
