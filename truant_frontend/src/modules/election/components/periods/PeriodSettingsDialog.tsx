"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";

import type { AccountingPeriodResource, PeriodStatus } from "../../api/types";
import { formatDate } from "../../utils/accountingFormat";

type PeriodSettingsDialogProps = {
  period: AccountingPeriodResource | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (status: PeriodStatus) => Promise<unknown>;
  submitting: boolean;
};

const statusNote: Record<
  PeriodStatus,
  { color: "success" | "warning" | "error"; icon: string; text: string }
> = {
  open: {
    color: "success",
    icon: "bx-check-circle",
    text: "Open — all postings to this period are allowed.",
  },
  closed: {
    color: "warning",
    icon: "bx-error-circle",
    text: "Closed — postings are blocked. Reopen to make changes.",
  },
  locked: {
    color: "error",
    icon: "bx-lock-alt",
    text: "Locked — permanently read-only. Contact an administrator to reopen.",
  },
};

const PeriodSettingsDialog = ({
  period,
  open,
  onClose,
  onSubmit,
  submitting,
}: PeriodSettingsDialogProps) => {
  const [status, setStatus] = useState<PeriodStatus>("open");

  useEffect(() => {
    if (open && period) setStatus(period.status);
  }, [open, period]);

  const note = statusNote[status];
  const dirty = period ? status !== period.status : false;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      width="560px"
      title={period ? `Accounting Period ${period.periodNumber}` : "Period Settings"}
      icon={<i className="bx bx-cog text-primary" />}
      description="Review the period and change its posting status."
      actions={
        <>
          <Button variant="outlined" color="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!dirty || submitting}
            onClick={() => void onSubmit(status)}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      {period && (
        <Stack spacing={4} sx={{ mt: 2 }}>
          <CustomTextField label="Period" fullWidth value={period.name} disabled />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <CustomTextField
              label="Start date"
              fullWidth
              value={formatDate(period.startDate)}
              disabled
            />
            <CustomTextField
              label="End date"
              fullWidth
              value={formatDate(period.endDate)}
              disabled
            />
          </Stack>

          <Divider />

          <Box>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Period status</InputLabel>
              <Select
                label="Period status"
                value={status}
                onChange={(event) => setStatus(event.target.value as PeriodStatus)}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="locked">Locked</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Chip
            icon={<i className={note.icon} />}
            label={note.text}
            color={note.color}
            variant="tonal"
            sx={{
              height: "auto",
              justifyContent: "flex-start",
              "& .MuiChip-label": { whiteSpace: "normal", py: 1, textAlign: "left" },
            }}
          />

          {period.closedAt && (
            <Typography variant="caption" color="text.secondary">
              Closed at {formatDate(period.closedAt)}
            </Typography>
          )}
        </Stack>
      )}
    </CustomDialog>
  );
};

export default PeriodSettingsDialog;
