import { describe, expect, it } from "vitest";

import type { LoanApplication } from "../types";
import { formatPeso } from "./applicationStatus";
import { describeChain, effectiveAmount } from "./approval";

const base = { amount: "100000.00" } as LoanApplication;

describe("effectiveAmount", () => {
  it("starts at the request", () => {
    expect(effectiveAmount(base)).toBe(100000);
  });

  it("uses the evaluator's recommendation, then the last approved amount", () => {
    const evaluated = {
      ...base,
      evaluation: { recommended_amount: "80000.00" },
    } as LoanApplication;

    expect(effectiveAmount(evaluated)).toBe(80000);

    const approved = {
      ...evaluated,
      approvals: [
        { decision: "approved", approved_amount: "70000.00" },
        { decision: "approved", approved_amount: "65000.00" },
      ],
    } as LoanApplication;

    expect(effectiveAmount(approved)).toBe(65000);
  });
});

describe("describeChain", () => {
  it("lists who must approve each amount band", () => {
    const chain = describeChain([
      { name: "Loan Officer", min_amount: "0" },
      { name: "Credit Committee", min_amount: "50000" },
      { name: "Board", min_amount: "200000" },
    ]);

    expect(chain[0]).toEqual({ range: `Up to ${formatPeso(49999.99)}`, steps: "Loan Officer" });
    expect(chain[1]).toEqual({ range: `${formatPeso(50000)} to ${formatPeso(199999.99)}`, steps: "Loan Officer, then Credit Committee" });
    expect(chain[2]).toEqual({ range: `${formatPeso(200000)} and above`, steps: "Loan Officer, then Credit Committee, then Board" });
  });

  it("handles a single level", () => {
    expect(describeChain([{ name: "Officer", min_amount: "0" }])).toEqual([{ range: `${formatPeso(0)} and above`, steps: "Officer" }]);
  });
});
