"use client";

import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";

import type { AdvanceResource } from "../../api/types";
import { formatCurrency } from "../shared/statusUtils";

type AdvanceDecisionStatus = "Approved" | "Rejected" | "Cancelled";

export type AdvanceDecisionValues = {
  approvedAmount?: number;
  resolutionNotes: string;
};

type AdvanceDecisionDialogProps = {
  open: boolean;
  advance: AdvanceResource | null;
  status: AdvanceDecisionStatus | null;
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: (values: AdvanceDecisionValues) => void;
};

const decisionCopy: Record<
  AdvanceDecisionStatus,
  { title: string; action: string; color: "success" | "error" | "warning" }
> = {
  Approved: {
    title: "Approve cash advance",
    action: "Approve Advance",
    color: "success",
  },
  Rejected: {
    title: "Reject cash advance",
    action: "Reject Advance",
    color: "error",
  },
  Cancelled: {
    title: "Cancel cash advance",
    action: "Cancel Advance",
    color: "warning",
  },
};

const AdvanceDecisionDialog = ({
  open,
  advance,
  status,
  isSaving = false,
  onClose,
  onConfirm,
}: AdvanceDecisionDialogProps) => {
  const [approvedAmount, setApprovedAmount] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open || !advance || !status) return;

    setApprovedAmount(status === "Approved" ? String(advance.amount) : "");
    setResolutionNotes("");
    setSubmitted(false);
  }, [advance, open, status]);

  const validation = useMemo(() => {
    if (!advance || !status) return null;

    const notes = resolutionNotes.trim();

    if (status !== "Approved") {
      return notes ? null : "Decision reason is required.";
    }

    const amount = Number(approvedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Approved amount must be greater than zero.";
    }

    if (amount > advance.amount) {
      return "Approved amount cannot exceed the requested amount.";
    }

    if (amount !== advance.amount && !notes) {
      return "Explain why the approved amount differs from the request.";
    }

    return null;
  }, [advance, approvedAmount, resolutionNotes, status]);

  if (!advance || !status) return null;

  const copy = decisionCopy[status];
  const employeeName =
    advance.employee?.fullName ?? advance.employeeName ?? "Employee";
  const submit = () => {
    setSubmitted(true);

    if (validation) return;

    onConfirm({
      ...(status === "Approved"
        ? { approvedAmount: Number(approvedAmount) }
        : {}),
      resolutionNotes: resolutionNotes.trim(),
    });
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      disableEscapeKeyDown={isSaving}
      width="560px"
      title={copy.title}
      description="Review the employee request before recording your decision."
      icon={<i className="bx bx-check-shield" />}
      actions={
        <>
          <Button variant="outlined" disabled={isSaving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={copy.color}
            disabled={isSaving}
            onClick={submit}
          >
            {isSaving ? "Saving..." : copy.action}
          </Button>
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            p: 2.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Employee
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {employeeName}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Requested Amount
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatCurrency(advance.amount)}
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary">
            Employee Reason
          </Typography>
          <Typography variant="body2">
            {advance.reason || "No reason provided."}
          </Typography>
        </Stack>

        {status === "Approved" && (
          <CustomTextField
            fullWidth
            required
            type="number"
            label="Approved Amount"
            value={approvedAmount}
            disabled={isSaving}
            onChange={(event) => setApprovedAmount(event.target.value)}
            inputProps={{ min: 0.01, max: advance.amount, step: "0.01" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
            }}
            error={submitted && Boolean(validation)}
            helperText={`Maximum ${formatCurrency(advance.amount)}.`}
          />
        )}

        <CustomTextField
          fullWidth
          multiline
          required={
            status !== "Approved" ||
            (Number(approvedAmount) !== advance.amount &&
              approvedAmount.length > 0)
          }
          minRows={3}
          label="Decision Reason"
          value={resolutionNotes}
          disabled={isSaving}
          onChange={(event) => setResolutionNotes(event.target.value)}
          error={submitted && Boolean(validation)}
          helperText={
            status === "Approved"
              ? "Required when approving an amount different from the request."
              : "Required for this decision."
          }
        />

        {submitted && validation && (
          <Alert severity="error" sx={{ py: 0.5 }}>
            {validation}
          </Alert>
        )}
      </Stack>
    </CustomDialog>
  );
};

export default AdvanceDecisionDialog;
