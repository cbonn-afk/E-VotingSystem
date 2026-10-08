"use client";

import Stack from "@mui/material/Stack";

import CustomKpiCard from "@components/app/CustomKPICard";

type PeriodsHeaderStatsProps = {
  fiscalYears: number;
  open: number;
  closed: number;
  locked: number;
  loading?: boolean;
};

const PeriodsHeaderStats = ({
  fiscalYears,
  open,
  closed,
  locked,
  loading,
}: PeriodsHeaderStatsProps) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={3}
    sx={{ width: "100%" }}
  >
    <CustomKpiCard
      icon={<i className="bx-calendar" style={{ fontSize: 24 }} />}
      iconColor="primary"
      label="Fiscal Years"
      value={fiscalYears}
      loading={loading}
    />
    <CustomKpiCard
      icon={<i className="bx-lock-open-alt" style={{ fontSize: 24 }} />}
      iconColor="success"
      label="Open Periods"
      value={open}
      loading={loading}
    />
    <CustomKpiCard
      icon={<i className="bx-folder" style={{ fontSize: 24 }} />}
      iconColor="secondary"
      label="Closed Periods"
      value={closed}
      loading={loading}
    />
    <CustomKpiCard
      icon={<i className="bx-lock-alt" style={{ fontSize: 24 }} />}
      iconColor="warning"
      label="Locked Periods"
      value={locked}
      loading={loading}
    />
  </Stack>
);

export default PeriodsHeaderStats;
