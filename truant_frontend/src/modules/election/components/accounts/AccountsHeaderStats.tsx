"use client";

import Stack from "@mui/material/Stack";

import CustomKpiCard from "@components/app/CustomKPICard";

import type { AccountStats } from "../../api/types";

type AccountsHeaderStatsProps = {
  stats?: AccountStats;
  loading?: boolean;
  error?: string | null;
};

// Mirrors partner AccountsHeaderStats: Total Accounts + Active (with %) shown
// inside the page header.
const AccountsHeaderStats = ({
  stats,
  loading,
  error,
}: AccountsHeaderStatsProps) => {
  const activePercentage =
    stats?.active && stats?.total
      ? `${Math.round((stats.active / stats.total) * 100)}%`
      : "—";

  return (
    <Stack direction="row" spacing={3}>
      <CustomKpiCard
        icon={<i className="bx-briefcase" style={{ fontSize: 24 }} />}
        label="Total Accounts"
        value={stats?.total}
        loading={loading}
        error={error}
      />
      <CustomKpiCard
        icon={<i className="bx-check-circle" style={{ fontSize: 24 }} />}
        label={`Active | ${activePercentage}`}
        value={stats?.active}
        loading={loading}
        error={error}
      />
    </Stack>
  );
};

export default AccountsHeaderStats;
