"use client";

import { useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { toDecisionPayload, validateDecision } from "../schemas/decisionSchema";
import type { DecisionPayload, LoanApplication } from "../types";
import { formatDateTime, formatPeso } from "../utils/applicationStatus";
import { effectiveAmount } from "../utils/approval";

type Props = {
  application: LoanApplication;
  pending: boolean;
  onDecide: (payload: DecisionPayload, onError: (error: unknown) => void) => void;
};

/** The approval chain: who has decided, who is next, and the decision form for the person whose turn it is. */
export default function ApprovalPanel({ application, pending, onDecide }: Props) {
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"amount" | "remarks", string>>>({});

  const chain = application.approval_chain ?? [];
  const approvals = application.approvals ?? [];
  const effective = effectiveAmount(application);
  const minimum = Number(application.product?.min_amount ?? 0);
  const waiting = application.status === "for_approval";
  const { can_decide: canDecide, denial_reason: denialReason, next_step: nextStep } = application.approval ?? {
    can_decide: false,
    denial_reason: null,
    next_step: null,
  };

  if (chain.length === 0 && approvals.length === 0) return null;

  const submit = () => {
    const input = { decision, amount, remarks, effective, productMinimum: minimum };
    const found = validateDecision(input);

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onDecide(toDecisionPayload(input), (error) => {
      if (error instanceof ApiError && error.status === 422) {
        setErrors({
          amount: error.errors.approved_amount?.[0],
          remarks: error.errors.remarks?.[0],
        });
        const general = error.errors.decision?.[0] ?? error.errors.status?.[0];

        if (general) toast.error(general);

        return;
      }
      toast.error(error instanceof ApiError ? error.message : "The decision could not be saved.");
    });
  };

  return (
    <Paper className="p-6">
      <Stack spacing={3}>
        <Typography variant="h6">Approval</Typography>

        {application.status === "approved" && application.approved_amount && (
          <Alert severity="success">Approved for {formatPeso(application.approved_amount)}.</Alert>
        )}
        {application.status === "rejected" && application.status_remarks && <Alert severity="error">Rejected: {application.status_remarks}</Alert>}

        <Stack spacing={2}>
          {chain.map((step, index) => {
            const record = approvals.find((a) => a.sequence === step.sequence);
            const isNext = waiting && nextStep?.sequence === step.sequence && !record;

            return (
              <Stack key={step.sequence} direction="row" spacing={2} alignItems="flex-start">
                <Chip
                  size="small"
                  variant="tonal"
                  label={index + 1}
                  color={record ? (record.decision === "approved" ? "success" : "error") : isNext ? "primary" : "default"}
                />
                <Stack spacing={0.25}>
                  <Typography variant="body2" fontWeight={600}>
                    {step.name}
                    {step.role_name ? ` (${step.role_name})` : ""}
                  </Typography>
                  {record ? (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        {record.decision === "approved" ? "Approved" : "Rejected"} by {record.approver_name} · {formatDateTime(record.decided_at)}
                        {record.approved_amount ? ` · ${formatPeso(record.approved_amount)}` : ""}
                      </Typography>
                      {record.remarks && <Typography variant="body2">{record.remarks}</Typography>}
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {isNext ? "Waiting for a decision" : "Not reached yet"}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Stack>

        {waiting && !canDecide && denialReason && <Alert severity="info">{denialReason}</Alert>}

        {waiting && canDecide && nextStep && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="subtitle1">Your decision: {nextStep.name}</Typography>
            <RadioGroup value={decision} onChange={(event) => setDecision(event.target.value as "approved" | "rejected")}>
              <FormControlLabel value="approved" control={<Radio />} label="Approve" />
              <FormControlLabel value="rejected" control={<Radio />} label="Reject" />
            </RadioGroup>

            {decision === "approved" && (
              <TextField
                label="Approved amount (leave empty to keep it)"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                error={Boolean(errors.amount)}
                helperText={errors.amount ?? `Currently ${formatPeso(effective)}. You may lower it, not raise it.`}
              />
            )}

            <TextField
              multiline
              minRows={2}
              label={decision === "rejected" ? "Reason (required)" : "Remarks (optional)"}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              error={Boolean(errors.remarks)}
              helperText={errors.remarks}
            />

            <Button
              variant="contained"
              color={decision === "rejected" ? "error" : "primary"}
              disabled={pending}
              sx={{ alignSelf: "flex-start" }}
              onClick={submit}
            >
              {decision === "rejected" ? "Reject application" : "Approve"}
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
