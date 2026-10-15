"use client";

import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomKpiCard from "@components/app/CustomKPICard";

import type {
  AccountingPeriodResource,
  FiscalYearResource,
} from "../../api/types";
import { formatDate } from "../../utils/accountingFormat";

type PeriodsKpiProps = {
  currentFiscalYear: FiscalYearResource | null;
  periods: AccountingPeriodResource[];
  loading?: boolean;
};

const daysLeft = (endDate: string | null): number => {
  if (!endDate) return 0;

  const diff = new Date(`${endDate}T23:59:59`).getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / 86_400_000));
};

const PeriodsKpi = ({ currentFiscalYear, periods, loading }: PeriodsKpiProps) => {
  const total = periods.length;
  const closed = periods.filter((period) => period.status !== "open").length;
  const locked = periods.filter((period) => period.status === "locked").length;
  const percentage = total > 0 ? (closed / total) * 100 : 0;

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={6} sx={{ width: "100%" }}>
      <CustomKpiCard
        iconString="bx-tachometer"
        iconColor={currentFiscalYear?.status === "closed" ? "error" : "success"}
        label="Current Year Period"
        value={
          currentFiscalYear
            ? currentFiscalYear.status.charAt(0).toUpperCase() +
              currentFiscalYear.status.slice(1)
            : "—"
        }
        loading={loading}
      >
        <Typography variant="body2" color="text.secondary">
          {currentFiscalYear ? `${daysLeft(currentFiscalYear.endDate)} days left` : "No current year"}
        </Typography>
        {currentFiscalYear && (
          <Typography variant="caption" color="text.secondary">
            {formatDate(currentFiscalYear.startDate)} to {formatDate(currentFiscalYear.endDate)}
          </Typography>
        )}
      </CustomKpiCard>

      <CustomKpiCard
        iconString="bx-pie-chart"
        iconColor="primary"
        label="Closing Progress"
        value={`${closed}/${total} Periods`}
        loading={loading}
      >
        <LinearProgress
          variant="determinate"
          value={percentage}
          color="success"
          sx={{ mt: 1, mb: 0.5, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {Math.round(percentage)}% closed
        </Typography>
      </CustomKpiCard>

      <CustomKpiCard
        iconString="bx-lock-alt"
        iconColor="secondary"
        label="Locked Periods"
        value={locked}
        loading={loading}
      >
        <Typography variant="caption" color="text.secondary">
          Locked periods are read-only.
        </Typography>
      </CustomKpiCard>
    </Stack>
  );
};

export default PeriodsKpi;
