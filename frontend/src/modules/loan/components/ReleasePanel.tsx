"use client";

import { useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { useLoanApplicationActions } from "../hooks/useLoanApplications";
import type { LoanApplication, ReleaseMethod } from "../types";
import { formatPeso, releaseMethodLabel } from "../utils/applicationStatus";

/** The cashier pays the loan out. This creates the loan account and its schedule. */
export default function ReleasePanel({ application }: { application: LoanApplication }) {
  const actions = useLoanApplicationActions(application.id);
  const agreement = application.agreement;

  const [method, setMethod] = useState<ReleaseMethod>("cash");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [feesCollected, setFeesCollected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!application.can_release || !agreement) return null;

  const fees = Number(agreement.processing_fee) + Number(agreement.service_fee);
  const separately = agreement.fee_handling === "collect_separately" && fees > 0;

  const submit = () => {
    const found: Record<string, string> = {};

    if (method !== "cash" && reference.trim() === "") found.reference_no = "Enter the check, transfer or account reference.";
    if (separately && !feesCollected) found.fees_collected = "Confirm that the fees were collected from the member.";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (!window.confirm(`Release ${formatPeso(agreement.net_proceeds)} to the member?`)) return;

    actions.release.mutate(
      { method, reference_no: reference.trim() || null, remarks: remarks.trim() || null, fees_collected: feesCollected },
      {
        onSuccess: () => toast.success("Loan released."),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 422) {
            setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, messages]) => [key, messages[0]])));
            if (error.errors.status?.[0]) toast.error(error.errors.status[0]);

            return;
          }
          toast.error(error instanceof ApiError ? error.message : "The loan could not be released.");
        },
      },
    );
  };

  return (
    <Paper className="p-6">
      <Stack spacing={3}>
        <Typography variant="h6">Release the loan</Typography>
        <Alert severity="info">
          Pay the member <strong>{formatPeso(agreement.net_proceeds)}</strong>
          {agreement.fee_handling === "deduct_from_proceeds" && fees > 0 ? ` (loan ${formatPeso(agreement.principal)} less fees ${formatPeso(fees)})` : ""}. The agreement is ready.
        </Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField select label="Paid by" value={method} onChange={(e) => setMethod(e.target.value as ReleaseMethod)} sx={{ minWidth: 240 }}>
            {(Object.keys(releaseMethodLabel) as ReleaseMethod[]).map((value) => (
              <MenuItem key={value} value={value}>
                {releaseMethodLabel[value]}
              </MenuItem>
            ))}
          </TextField>
          {method !== "cash" && (
            <TextField
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              error={Boolean(errors.reference_no)}
              helperText={errors.reference_no ?? "Check number, transfer reference or account"}
              fullWidth
            />
          )}
        </Stack>

        <TextField label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} multiline minRows={2} />

        {separately && (
          <Stack>
            <FormControlLabel
              label={`I collected the fees (${formatPeso(fees)}) from the member`}
              control={<Checkbox checked={feesCollected} onChange={(e) => setFeesCollected(e.target.checked)} />}
            />
            {errors.fees_collected && <Typography variant="caption" color="error">{errors.fees_collected}</Typography>}
          </Stack>
        )}

        <Button variant="contained" disabled={actions.release.isPending} sx={{ alignSelf: "flex-start" }} onClick={submit}>
          Release loan
        </Button>
      </Stack>
    </Paper>
  );
}
