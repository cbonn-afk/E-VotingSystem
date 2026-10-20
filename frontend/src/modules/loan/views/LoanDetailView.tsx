"use client";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import CollectionStatusChip from "../components/CollectionStatusChip";
import LoanScheduleTable from "../components/LoanScheduleTable";
import LoanSummaryCards from "../components/LoanSummaryCards";
import PaymentHistory from "../components/PaymentHistory";
import RecordPaymentForm from "../components/RecordPaymentForm";
import { useLoan, useLoanActions } from "../hooks/useLoans";
import { describePenalty, formatDate, formatPeso } from "../utils/applicationStatus";

export default function LoanDetailView({ loanId }: { loanId: number }) {
  const router = useRouter();
  const query = useLoan(loanId);
  const actions = useLoanActions(loanId);
  const loan = query.data?.data;

  if (query.isPending) return <CircularProgress size={32} />;
  if (!loan) return <Alert severity="error">The loan could not be loaded.</Alert>;

  return (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4">{loan.loan_no}</Typography>
          <Typography variant="body2" color="text.secondary">
            {loan.member?.name} ({loan.member?.member_code}) · {loan.product?.name} · {loan.installments_count} payments, final due {formatDate(loan.maturity_date)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <CollectionStatusChip status={loan.summary.collection_status} />
          <Button color="secondary" onClick={() => router.push("/loan/loans")}>
            Back to loans
          </Button>
        </Stack>
      </Stack>

      <LoanSummaryCards summary={loan.summary} />

      <Typography variant="caption" color="text.secondary">
        Late penalty: {describePenalty(loan.penalty_rate_percent, loan.penalty_basis, loan.penalty_calculation, loan.grace_period_days)}.
        Payments go to {loan.payment_allocation === "interest_penalty_principal" ? "interest, then penalty, then principal" : "penalty, then interest, then principal"}, oldest installment first.
      </Typography>

      {loan.status === "fully_paid" && <Alert severity="success">This loan is fully paid.</Alert>}
      {loan.summary.days_past_due > 0 && (
        <Alert severity={loan.summary.collection_status === "overdue" ? "warning" : "error"}>
          {loan.summary.days_past_due} days past due: {formatPeso(loan.summary.overdue_amount)} of principal and interest is late, plus penalties.
        </Alert>
      )}

      {loan.can_record && (
        <RecordPaymentForm
          key={`${loan.payments?.length ?? 0}-${loan.summary.due_now}`}
          loan={loan}
          pending={actions.record.isPending}
          onSubmit={(payload, onDone, onError) => actions.record.mutate(payload, { onSuccess: onDone, onError })}
        />
      )}

      <Paper className="p-6">
        <Stack spacing={2}>
          <Typography variant="h6">Payment history</Typography>
          <PaymentHistory
            payments={loan.payments ?? []}
            receiptHref={(payment) => `/loan/loans/${loan.id}/payments/${payment.id}/receipt`}
            canVoid={loan.can_void}
            voidPending={actions.voidPayment.isPending}
            onVoid={(payment, reason) =>
              actions.voidPayment.mutate(
                { paymentId: payment.id, reason },
                {
                  onSuccess: () => toast.success("Payment voided."),
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? (error.errors.payment?.[0] ?? error.errors.reason?.[0] ?? error.message) : "The payment could not be voided."),
                },
              )
            }
          />
        </Stack>
      </Paper>

      <Paper className="p-6">
        <Stack spacing={2}>
          <Typography variant="h6">Repayment schedule</Typography>
          <LoanScheduleTable rows={loan.schedule ?? []} />
        </Stack>
      </Paper>
    </Stack>
  );
}
