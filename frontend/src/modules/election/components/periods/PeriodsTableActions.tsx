"use client";

import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";

import CustomTextField from "@core/components/mui/TextField";

import type {
  FiscalYearResource,
  FiscalYearStatus,
  PeriodStatus,
} from "../../api/types";

export type PeriodsViewMode = "period" | "fiscal_year";

type PeriodsTableActionsProps = {
  viewMode: PeriodsViewMode;
  search: string;
  onSearchChange: (value: string) => void;
  fiscalYearOptions: FiscalYearResource[];
  selectedFiscalYearId: string;
  onFiscalYearChange: (value: string) => void;
  periodStatus: PeriodStatus | "";
  onPeriodStatusChange: (value: PeriodStatus | "") => void;
  fiscalStatus: FiscalYearStatus | "";
  onFiscalStatusChange: (value: FiscalYearStatus | "") => void;
  onCreate: () => void;
  canCreate: boolean;
};

const PeriodsTableActions = ({
  viewMode,
  search,
  onSearchChange,
  fiscalYearOptions,
  selectedFiscalYearId,
  onFiscalYearChange,
  periodStatus,
  onPeriodStatusChange,
  fiscalStatus,
  onFiscalStatusChange,
  onCreate,
  canCreate,
}: PeriodsTableActionsProps) => (
  <Paper sx={{ p: 5 }}>
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <i className="bx-search" style={{ fontSize: 24 }} />
        <CustomTextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={
            viewMode === "period"
              ? "Search period or number"
              : "Search fiscal year code or name"
          }
          sx={{ width: { xs: "100%", md: 360 } }}
        />
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        {viewMode === "period" && (
          <>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Fiscal year</InputLabel>
              <Select
                label="Fiscal year"
                value={selectedFiscalYearId}
                disabled={fiscalYearOptions.length === 0}
                onChange={(event) => onFiscalYearChange(event.target.value)}
              >
                {fiscalYearOptions.map((fiscalYear) => (
                  <MenuItem key={fiscalYear.id} value={fiscalYear.id}>
                    {fiscalYear.code} — {fiscalYear.name}
                    {fiscalYear.isCurrent ? " (Current)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={periodStatus}
                onChange={(event) =>
                  onPeriodStatusChange(event.target.value as PeriodStatus | "")
                }
              >
                <MenuItem value="">All status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="locked">Locked</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {viewMode === "fiscal_year" && (
          <>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={fiscalStatus}
                onChange={(event) =>
                  onFiscalStatusChange(event.target.value as FiscalYearStatus | "")
                }
              >
                <MenuItem value="">All status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
            {canCreate && (
              <Button
                variant="contained"
                onClick={onCreate}
                startIcon={<i className="bx-plus" />}
              >
                New Fiscal Year
              </Button>
            )}
          </>
        )}
      </Stack>
    </Stack>
  </Paper>
);

export default PeriodsTableActions;
