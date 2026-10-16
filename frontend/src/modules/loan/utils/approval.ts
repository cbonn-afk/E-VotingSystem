import type { ApprovalLevel, LoanApplication } from "../types";
import { formatPeso } from "./applicationStatus";

/** The amount currently on the table: last approved amount, else the evaluator's figure, else the request. */
export const effectiveAmount = (application: LoanApplication): number => {
  const lastApproved = [...(application.approvals ?? [])].reverse().find((a) => a.decision === "approved");

  return Number(lastApproved?.approved_amount ?? application.evaluation?.recommended_amount ?? application.amount);
};

/** "Loans up to 49,999.99 need: Loan Officer" for every band, to show what the chain does. */
export const describeChain = (levels: Pick<ApprovalLevel, "name" | "min_amount">[]): { range: string; steps: string }[] =>
  levels.map((level, index) => {
    const from = Number(level.min_amount);
    const next = levels[index + 1];
    const upTo = next ? Number(next.min_amount) - 0.01 : null;

    const range =
      index === 0 && upTo !== null
        ? `Up to ${formatPeso(upTo)}`
        : upTo === null
          ? `${formatPeso(from)} and above`
          : `${formatPeso(from)} to ${formatPeso(upTo)}`;

    return { range, steps: levels.slice(0, index + 1).map((l) => l.name || "(unnamed)").join(", then ") };
  });
