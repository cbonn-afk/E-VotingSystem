"use client";

import dynamic from "next/dynamic";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import Link from "@components/Link";
import type { EmployeesOverview, EmployeesStat } from "../../api/types";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import EmployeesStatsCards from "../../components/shared/EmployeesStatsCards";
import ChartCard from "../../components/dashboard/ChartCard";
import ChartLegend from "../../components/dashboard/ChartLegend";
import {
  buildDonutOptions,
  buildPayrollBarOptions,
} from "../../components/dashboard/employeeChartOptions";
import { formatCurrency } from "../../components/shared/statusUtils";
import { useEmployeesOverview } from "../../hooks/useEmployeesApi";

const AppReactApexCharts = dynamic(
  () => import("@/libs/styles/AppReactApexCharts"),
);

const sum = (values: number[]) => values.reduce((total, n) => total + n, 0);

const buildStats = (overview?: EmployeesOverview): EmployeesStat[] => [
  {
    label: "Total Employees",
    value: String(overview?.totalEmployees ?? 0),
    helper: "Registered employee records",
    icon: "bx-user",
    color: "primary",
  },
  {
    label: "Active Employees",
    value: String(overview?.activeEmployees ?? 0),
    helper: "Available for attendance and payroll",
    icon: "bx-user-check",
    color: "success",
  },
  {
    label: "Pending Actions",
    value: String(
      (overview?.attendanceExceptions ?? 0) +
        (overview?.pendingAdvances ?? 0) +
        (overview?.pendingOvertimes ?? 0),
    ),
    helper: "Attendance exceptions, advances, and overtime",
    icon: "bx-check-shield",
    color: "warning",
  },
  {
    label: "Payroll Net Total",
    value: formatCurrency(overview?.payrollNetTotal ?? 0),
    helper: `${overview?.openPayrollRuns ?? 0} open payroll run${
      overview?.openPayrollRuns === 1 ? "" : "s"
    }`,
    icon: "bx-money",
    color: "info",
  },
];

const EmployeesDashboardView = () => {
  const theme = useTheme();
  const overviewQuery = useEmployeesOverview();
  const overview = overviewQuery.data?.data;
  const loading = overviewQuery.isPending;

  // ── Workforce status (donut) ────────────────────────────────────────
  const workforce = [
    overview?.employeesByStatus?.Active ?? 0,
    overview?.employeesByStatus?.Inactive ?? 0,
    overview?.employeesByStatus?.Deactivated ?? 0,
  ];
  const workforceTotal = sum(workforce);

  // ── Pending actions (donut) ─────────────────────────────────────────
  const approvals = [
    overview?.attendanceExceptions ?? 0,
    overview?.pendingAdvances ?? 0,
    overview?.pendingOvertimes ?? 0,
  ];
  const approvalsTotal = sum(approvals);

  // ── Payroll runs by status (bar) ────────────────────────────────────
  const payrollStatuses = [
    "Draft",
    "Prepared",
    "Approved",
    "Released",
    "Voided",
  ] as const;
  const payrollSeries = payrollStatuses.map(
    (status) => overview?.payrollByStatus?.[status] ?? 0,
  );
  const payrollTotal = sum(payrollSeries);

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title="Employees Overview"
        description="Payroll, attendance, and approval snapshot for the active pay period."
      >
        <Button
          component={Link}
          href="/employees/payrolls"
          variant="contained"
          startIcon={<i className="bx bx-money" />}
        >
          Open Payroll
        </Button>
      </EmployeesPageHeader>

      {overviewQuery.isError && (
        <Alert severity="error">
          Employees overview could not be loaded. Confirm the Employees API
          endpoint is available and your user has permission.
        </Alert>
      )}

      {loading ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={118}
              sx={{ flex: 1 }}
            />
          ))}
        </Stack>
      ) : (
        <EmployeesStatsCards stats={buildStats(overview)} />
      )}

      {/* Workforce + pending actions donuts */}
      <Box
        sx={{
          display: "grid",
          gap: 5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <ChartCard
          title="Workforce Status"
          description="Headcount split across active, inactive, and removed records."
          loading={loading}
          hasData={workforceTotal > 0}
          emptyText="No employees recorded yet."
        >
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <AppReactApexCharts
              type="donut"
              height={300}
              width="100%"
              series={workforce}
              options={buildDonutOptions(
                theme,
                ["Active", "Inactive", "Deactivated"],
                [
                  "var(--mui-palette-success-main)",
                  "var(--mui-palette-secondary-main)",
                  "var(--mui-palette-error-main)",
                ],
                "Employees",
                workforceTotal,
              )}
            />
            <ChartLegend
              items={[
                { label: "Active", value: workforce[0], tone: "success" },
                { label: "Inactive", value: workforce[1], tone: "secondary" },
                { label: "Deactivated", value: workforce[2], tone: "error" },
              ]}
            />
          </Stack>
        </ChartCard>

        <ChartCard
          title="Pending Actions"
          description="Attendance exceptions and requests waiting on a manager decision."
          loading={loading}
          hasData={approvalsTotal > 0}
          emptyText="Nothing is waiting for approval."
        >
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <AppReactApexCharts
              type="donut"
              height={300}
              width="100%"
              series={approvals}
              options={buildDonutOptions(
                theme,
                ["Attendance Exceptions", "Advances", "Overtime"],
                [
                  "var(--mui-palette-warning-main)",
                  "var(--mui-palette-info-main)",
                  "var(--mui-palette-primary-main)",
                ],
                "Actions",
                approvalsTotal,
              )}
            />
            <ChartLegend
              items={[
                {
                  label: "Attendance Exceptions",
                  value: approvals[0],
                  tone: "warning",
                },
                { label: "Advances", value: approvals[1], tone: "info" },
                { label: "Overtime", value: approvals[2], tone: "primary" },
              ]}
            />
          </Stack>
        </ChartCard>
      </Box>

      {/* Payroll workflow bar */}
      <ChartCard
        title="Payroll Runs by Status"
        description="Where payroll runs sit in the prepare → approve → release workflow."
        loading={loading}
        hasData={payrollTotal > 0}
        emptyText="No payroll runs created yet."
      >
        <AppReactApexCharts
          type="bar"
          height={320}
          width="100%"
          series={[{ name: "Payroll Runs", data: payrollSeries }]}
          options={buildPayrollBarOptions(
            theme,
            [...payrollStatuses],
            [
              "var(--mui-palette-secondary-main)",
              "var(--mui-palette-info-main)",
              "var(--mui-palette-primary-main)",
              "var(--mui-palette-success-main)",
              "var(--mui-palette-error-main)",
            ],
          )}
        />
      </ChartCard>
    </Stack>
  );
};

export default EmployeesDashboardView;
