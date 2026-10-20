"use client";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import LoanScheduleTable from "../components/LoanScheduleTable";
import LoanSummaryCards from "../components/LoanSummaryCards";
import PaymentHistory from "../components/PaymentHistory";
import { describePenalty, formatDate } from "../utils/applicationStatus";
import { usePortalLoan } from "./usePortalLoans";
import { portalErrorStatus } from "./usePortalMember";

/** A member's own loan: what is due, the schedule, and the payments the cooperative has recorded. */
export default function PortalLoanView({ loanId }: { loanId: number }) {
  const router = useRouter();
  const query = usePortalLoan(loanId);
  const loan = query.data?.data;
  const status = portalErrorStatus(query.error);

  if (status === 401) {
    router.replace("/loan-portal");

    return null;
  }

  if (query.isPending) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!loan) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center p-6">
        <Alert severity="error">{status === 404 ? "This loan was not found." : "The loan could not be loaded."}</Alert>
      </Box>
    );
  }

  return (
    <Box className="mx-auto is-full max-is-[820px] p-6">
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight="bold">
              {loan.product?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loan.loan_no} · {loan.installments_count} payments · final payment {formatDate(loan.maturity_date)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip size="small" variant="tonal" color={loan.status === "fully_paid" ? "success" : "info"} label={loan.status === "fully_paid" ? "Fully paid" : "Active"} />
            <Button color="secondary" onClick={() => router.push("/loan-portal/dashboard")}>
              Back
            </Button>
          </Stack>
        </Stack>

        {loan.status === "fully_paid" && <Alert severity="success">Congratulations, this loan is fully paid.</Alert>}
        {loan.summary.overdue_count > 0 && (
          <Alert severity="warning">You have overdue payments. Please pay at the cooperative to avoid more penalties.</Alert>
        )}

        <LoanSummaryCards summary={loan.summary} />

        <Typography variant="caption" color="text.secondary">
          Late penalty: {describePenalty(loan.penalty_rate_percent, loan.penalty_basis, loan.penalty_calculation, loan.grace_period_days)}. Payments are made at the cooperative; they appear here once recorded.
        </Typography>

        <Paper className="p-6">
          <Stack spacing={2}>
            <Typography variant="h6">Repayment schedule</Typography>
            <LoanScheduleTable rows={loan.schedule ?? []} />
          </Stack>
        </Paper>

        <Paper className="p-6">
          <Stack spacing={2}>
            <Typography variant="h6">Payments received</Typography>
            <PaymentHistory payments={loan.payments ?? []} />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
