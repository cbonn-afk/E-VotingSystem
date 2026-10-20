import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { AgingBucket, CollectionSummary } from "../types";
import { formatPeso } from "../utils/applicationStatus";

const Card = ({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "error" | "warning" | "success" }) => (
  <Paper className="p-4" variant="outlined">
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" color={tone ? `${tone}.main` : undefined}>
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

const bucketLabel: Record<AgingBucket, string> = { "1-30": "1 to 30 days", "31-60": "31 to 60 days", "61-90": "61 to 90 days", "91+": "Over 90 days" };

/** The portfolio at a glance: how many loans are late, how late, and the share of the portfolio at risk. */
export default function CollectionSummaryCards({ summary, showAging = true }: { summary: CollectionSummary; showAging?: boolean }) {
  const { statuses } = summary;

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card label="Active loans" value={String(summary.active_loans)} note={`Balance ${formatPeso(summary.outstanding_balance)}`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card label="Overdue" value={String(statuses.overdue.loans)} tone={statuses.overdue.loans > 0 ? "warning" : undefined} note={`${formatPeso(statuses.overdue.overdue)} late`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card label="Delinquent" value={String(statuses.delinquent.loans)} tone={statuses.delinquent.loans > 0 ? "error" : undefined} note={`${formatPeso(statuses.delinquent.overdue)} late`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card label="Default" value={String(statuses.default.loans)} tone={statuses.default.loans > 0 ? "error" : undefined} note={`${formatPeso(statuses.default.overdue)} late`} />
        </Grid>
      </Grid>

      {showAging && (
        <Grid container spacing={2}>
          {(Object.keys(bucketLabel) as AgingBucket[]).map((bucket) => (
            <Grid key={bucket} size={{ xs: 6, md: 2.4 }}>
              <Card label={bucketLabel[bucket]} value={String(summary.buckets[bucket].loans)} note={formatPeso(summary.buckets[bucket].overdue)} />
            </Grid>
          ))}
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card
              label="Portfolio at risk"
              value={`${summary.portfolio_at_risk_percent}%`}
              note="Balance more than 30 days late"
              tone={summary.portfolio_at_risk_percent > 10 ? "error" : summary.portfolio_at_risk_percent > 0 ? "warning" : "success"}
            />
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
