import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { LoanSummary } from "../types";
import { formatDate, formatPeso } from "../utils/applicationStatus";

const Card = ({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "error" | "success" }) => (
  <Paper className="p-4" variant="outlined">
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" color={tone === "error" ? "error.main" : tone === "success" ? "success.main" : undefined}>
        {value}
      </Typography>
      {note && (
        <Typography variant="caption" color="text.secondary">
          {note}
        </Typography>
      )}
    </Stack>
  </Paper>
);

/** What the borrower owes today, at a glance. */
export default function LoanSummaryCards({ summary }: { summary: LoanSummary }) {
  const overdue = summary.overdue_count > 0;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card
          label="Due now"
          value={formatPeso(summary.due_now)}
          tone={overdue ? "error" : undefined}
          note={overdue ? `${summary.overdue_count} installment${summary.overdue_count === 1 ? "" : "s"} overdue` : "Nothing overdue"}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card label="Penalty owed" value={formatPeso(summary.penalty_owed)} tone={Number(summary.penalty_owed) > 0 ? "error" : undefined} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card label="Balance (principal + interest)" value={formatPeso(summary.outstanding)} note={`Pay-off today ${formatPeso(summary.payoff)}`} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card
          label="Next payment"
          value={summary.next_due ? formatPeso(summary.next_due.amount) : "None left"}
          note={summary.next_due ? `Due ${formatDate(summary.next_due.due_date)}` : undefined}
          tone={summary.next_due ? undefined : "success"}
        />
      </Grid>
    </Grid>
  );
}
