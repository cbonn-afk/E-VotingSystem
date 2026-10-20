"use client";

import { useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { useLoanApplicationActions } from "../hooks/useLoanApplications";
import type { AgreementPreview, LoanApplication, PaymentFrequency } from "../types";
import { formatDate, formatPeso, frequencyLabel } from "../utils/applicationStatus";
import { firstDueProblem, suggestFirstDue } from "../utils/firstDue";

const messageOf = (error: unknown): string =>
  error instanceof ApiError ? (error.errors.first_due_date?.[0] ?? error.errors.status?.[0] ?? error.errors.file?.[0] ?? error.message) : "Something went wrong. Try again.";

/** Staff: create the agreement from the approved terms. The loan is then ready for release. */
export default function AgreementPanel({ application }: { application: LoanApplication }) {
  const actions = useLoanApplicationActions(application.id);
  const agreement = application.agreement ?? null;
  const frequency = ((application.product_snapshot?.payment_frequency as PaymentFrequency | undefined) ?? application.product?.payment_frequency ?? "monthly") as PaymentFrequency;

  const [date, setDate] = useState(() => agreement?.first_due_date ?? suggestFirstDue(frequency, new Date()));
  const [preview, setPreview] = useState<AgreementPreview | null>(null);
  const [editing, setEditing] = useState(false);

  const problem = firstDueProblem(date, frequency, new Date());
  const canManage = Boolean(application.can_generate_agreement);
  const showForm = canManage && (agreement === null || editing);

  if (!agreement && !canManage) return null;

  const loadPreview = () =>
    actions.previewAgreement.mutate(date, { onSuccess: (r) => setPreview(r.data), onError: (e) => toast.error(messageOf(e)) });

  const generate = () =>
    actions.generateAgreement.mutate(date, {
      onSuccess: () => {
        setPreview(null);
        setEditing(false);
        toast.success(agreement ? "Agreement regenerated." : "Agreement created.");
      },
      onError: (e) => toast.error(messageOf(e)),
    });

  return (
    <Paper className="p-6">
      <Stack spacing={3}>
        <Typography variant="h6">Loan agreement</Typography>

        {agreement && (
          <Stack spacing={1}>
            <Typography variant="body2">
              {agreement.agreement_no} · {formatPeso(agreement.principal)} · {agreement.installments_count} {frequencyLabel[agreement.payment_frequency].toLowerCase()} payments of{" "}
              {formatPeso(agreement.installment_amount)} · first due {formatDate(agreement.first_due_date)}
            </Typography>
            <Typography variant="body2">
              Release amount: <strong>{formatPeso(agreement.net_proceeds)}</strong>
              {agreement.fee_handling === "deduct_from_proceeds" ? " (after fees)" : " (fees collected separately)"}
            </Typography>
            <Alert severity="success">The agreement is ready. print it if the cooperative keeps a paper copy.</Alert>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" href={`/loan/applications/${application.id}/agreement`} target="_blank" rel="noopener">
                View or print agreement
              </Button>
              {canManage && !editing && (
                <Button color="warning" onClick={() => setEditing(true)}>
                  Change first due date
                </Button>
              )}
            </Stack>
          </Stack>
        )}

        {showForm && (
          <Stack spacing={2}>
            {agreement && <Alert severity="warning">Making a new agreement replaces the current one.</Alert>}
            <TextField
              type="date"
              label="First payment due"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPreview(null);
              }}
              error={Boolean(problem)}
              helperText={problem ?? `${frequencyLabel[frequency]} payments. Suggested: one period after release.`}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ maxWidth: 280 }}
            />

            {preview && (
              <Alert severity="info">
                Approved {formatPeso(preview.principal)} · {preview.installments_count} payments of {formatPeso(preview.installment_amount)} · interest {formatPeso(preview.total_interest)} · fees{" "}
                {formatPeso(Number(preview.processing_fee) + Number(preview.service_fee))} · released {formatPeso(preview.net_proceeds)} · final payment {formatDate(preview.maturity_date)}
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" disabled={Boolean(problem) || actions.previewAgreement.isPending} onClick={loadPreview}>
                Preview figures
              </Button>
              <Button variant="contained" disabled={Boolean(problem) || actions.generateAgreement.isPending} onClick={generate}>
                {agreement ? "Regenerate agreement" : "Create agreement"}
              </Button>
              {editing && <Button onClick={() => setEditing(false)}>Cancel</Button>}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
