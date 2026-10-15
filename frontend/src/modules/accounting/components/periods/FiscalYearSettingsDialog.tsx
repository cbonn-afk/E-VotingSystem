"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";

import { usePeriods } from "../../hooks/useAccountingApi";
import type {
  FiscalYearResource,
  FiscalYearStatus,
  FiscalYearUpdatePayload,
} from "../../api/types";
import { formatDate } from "../../utils/accountingFormat";

type FiscalYearSettingsDialogProps = {
  fiscalYear: FiscalYearResource | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: FiscalYearUpdatePayload) => Promise<unknown>;
  submitting: boolean;
};

const FiscalYearSettingsDialog = ({
  fiscalYear,
  open,
  onClose,
  onSubmit,
  submitting,
}: FiscalYearSettingsDialogProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<FiscalYearStatus>("open");

  const periodsQuery = usePeriods(
    fiscalYear ? { fiscal_year_id: fiscalYear.id } : {},
  );
  const periods = open && fiscalYear ? (periodsQuery.data?.data ?? []) : [];
  const total = periods.length;
  const closed = periods.filter((period) => period.status !== "open").length;
  const percentage = total > 0 ? (closed / total) * 100 : 0;

  useEffect(() => {
    if (open && fiscalYear) {
      setCode(fiscalYear.code);
      setName(fiscalYear.name);
      setStatus(fiscalYear.status);
    }
  }, [open, fiscalYear]);

  const dirty =
    fiscalYear !== null &&
    (code !== fiscalYear.code ||
      name !== fiscalYear.name ||
      status !== fiscalYear.status);

  const valid = code.trim().length > 0 && name.trim().length > 0;

  const lockMeta =
    status === "closed"
      ? {
          color: "error" as const,
          icon: "bx-lock-alt",
          text: "Closed & locked — closing requires all periods to be closed.",
        }
      : {
          color: "success" as const,
          icon: "bx-lock-open-alt",
          text: "Open & active — reopening keeps period statuses unchanged.",
        };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      width="580px"
      title={fiscalYear ? `Fiscal Year ${fiscalYear.code}` : "Fiscal Year Settings"}
      icon={<i className="bx bx-cog text-primary" />}
      description="Update the fiscal year details and status."
      actions={
        <>
          <Button variant="outlined" color="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!dirty || !valid || submitting}
            onClick={() => void onSubmit({ code, name, status })}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      {fiscalYear && (
        <Stack spacing={4} sx={{ mt: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <CustomTextField
              label="Code"
              fullWidth
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <CustomTextField
              label="Name"
              fullWidth
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <CustomTextField
              label="Year start"
              fullWidth
              value={formatDate(fiscalYear.startDate)}
              disabled
            />
            <CustomTextField
              label="Year end"
              fullWidth
              value={formatDate(fiscalYear.endDate)}
              disabled
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Chip
              icon={<i className={fiscalYear.isCurrent ? "bx-check-circle" : "bx-minus-circle"} />}
              label={fiscalYear.isCurrent ? "Current Fiscal Year" : "Not Current"}
              color={fiscalYear.isCurrent ? "primary" : "secondary"}
              variant="tonal"
            />
            <Chip
              icon={<i className="bx-layer" />}
              label={`${total} Periods`}
              color="info"
              variant="tonal"
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Period closure progress</Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color="success"
              sx={{ borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {Math.round(percentage)}% complete ({closed}/{total})
            </Typography>
          </Stack>

          <Divider />

          <Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Fiscal year status</InputLabel>
              <Select
                label="Fiscal year status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as FiscalYearStatus)
                }
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Chip
            icon={<i className={lockMeta.icon} />}
            label={lockMeta.text}
            color={lockMeta.color}
            variant="tonal"
            sx={{
              height: "auto",
              justifyContent: "flex-start",
              "& .MuiChip-label": { whiteSpace: "normal", py: 1, textAlign: "left" },
            }}
          />
        </Stack>
      )}
    </CustomDialog>
  );
};

export default FiscalYearSettingsDialog;
