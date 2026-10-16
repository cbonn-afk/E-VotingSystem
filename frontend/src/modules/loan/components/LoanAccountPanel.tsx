import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { LoanAccount } from "../types";
import { formatDate, formatDateTime, formatPeso, releaseMethodLabel } from "../utils/applicationStatus";
import ScheduleTable from "./ScheduleTable";

type Props = { loan: LoanAccount; receiptHref?: string };

/** The released loan: balance, who paid it out and how, and the repayment schedule. */
export default function LoanAccountPanel({ loan, receiptHref }: Props) {
  const release = loan.release;

  return (
    <Paper className="p-6">
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h6">Loan {loan.loan_no}</Typography>
            <Typography variant="body2" color="text.secondary">
              Released {formatDateTime(loan.released_at)}
            </Typography>
          </Stack>
          {receiptHref && release && (
            <Button variant="outlined" href={receiptHref} target="_blank" rel="noopener">
              View or print receipt
            </Button>
          )}
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="body2">Outstanding balance: <strong>{formatPeso(loan.outstanding_balance)}</strong></Typography>
          <Typography variant="body2">
            Loan {formatPeso(loan.principal)} · interest {formatPeso(loan.total_interest)} · {loan.installments_count} payments
          </Typography>
          <Typography variant="body2">
            First payment {formatDate(loan.first_due_date)} · final payment {formatDate(loan.maturity_date)}
          </Typography>
          {release && (
            <Typography variant="body2">
              Released: {formatPeso(release.amount_released)} by {releaseMethodLabel[release.method].toLowerCase()}
              {release.reference_no ? ` (${release.reference_no})` : ""} · receipt {release.receipt_no}
            </Typography>
          )}
        </Stack>

        {loan.schedule && <ScheduleTable items={loan.schedule} />}
      </Stack>
    </Paper>
  );
}
