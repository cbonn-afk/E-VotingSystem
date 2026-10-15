"use client";

import dynamic from "next/dynamic";

// MUI Imports
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// Component Imports
import Link from "@components/Link";
import Can from "@/modules/auth/components/Can";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import ChartLegend from "@/modules/accounting/components/dashboard/ChartLegend";
import DashboardKpiCard from "@/modules/accounting/components/dashboard/DashboardKpiCard";
import FocusMetricCard from "@/modules/accounting/components/dashboard/FocusMetricCard";
import WatchlistPanel from "@/modules/accounting/components/dashboard/WatchlistPanel";

import { useAccountingDashboardData } from "@/modules/accounting/hooks/useAccountingDashboardData";

const AppReactApexCharts = dynamic(
  () => import("@/libs/styles/AppReactApexCharts"),
);

const AccountingDashboardView = () => {
  const data = useAccountingDashboardData();

  return (
    <Stack spacing={4}>
      <AccountingPageHeader
        title="Accounting Overview"
        description="Chart of accounts, journals, periods, and financial reporting."
      >
        <Can permission="accounting.journals.create">
          <Button
            component={Link}
            href="/accounting/journals/new"
            variant="contained"
            startIcon={<i className="bx-plus" />}
          >
            New Journal Entry
          </Button>
        </Can>
      </AccountingPageHeader>

      {data.isLoading && <LinearProgress sx={{ borderRadius: 1 }} />}

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            Financial Position Focus
          </Typography>
          <Typography variant="h4">The books at a glance</Typography>
        </Stack>

        <Grid container spacing={3}>
          {data.focusMetrics.map((metric) => (
            <Grid key={metric.title} size={{ xs: 12, xl: 6 }}>
              <FocusMetricCard {...metric} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Grid container spacing={3}>
        {data.kpis.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, xl: 3 }}>
            <DashboardKpiCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            Financial Picture
          </Typography>
          <Typography variant="h4">Core trends</Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, xl: 8 }}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                title="Posting Activity"
                subheader="Posted vs unposted (draft) journal value across the last six months."
              />
              <CardContent>
                <Stack spacing={3}>
                  <AppReactApexCharts
                    type="area"
                    height={330}
                    width="100%"
                    series={data.postingActivitySeries}
                    options={data.postingActivityOptions}
                  />
                  <ChartLegend items={data.postingActivityLegend} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, xl: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                title="Entry Status Mix"
                subheader="Share of journal entries sitting in each posting state."
              />
              <CardContent>
                <Stack spacing={3} alignItems="center">
                  <AppReactApexCharts
                    type="donut"
                    height={320}
                    width="100%"
                    series={data.statusMixSeries}
                    options={data.statusMixOptions}
                  />
                  <ChartLegend items={data.statusMixLegend} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title="Entries by Status"
              subheader="Monthly posting profile so teams can see how entries move from draft to posted."
            />
            <CardContent>
              <Stack spacing={3}>
                <AppReactApexCharts
                  type="bar"
                  height={300}
                  width="100%"
                  series={data.statusFlowSeries}
                  options={data.statusFlowOptions}
                />
                <ChartLegend items={data.statusFlowLegend} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <WatchlistPanel rows={data.attentionCards} />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default AccountingDashboardView;
