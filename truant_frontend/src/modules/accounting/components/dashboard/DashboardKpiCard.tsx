"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ApexOptions } from "apexcharts";

import AppReactApexCharts from "@/libs/styles/AppReactApexCharts";

import { toneToColor, type KpiCardData } from "./types";

const DashboardKpiCard = ({ title, value, tone, caption, trend }: KpiCardData) => {
  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, toolbar: { show: false } },
    stroke: { width: 3, curve: "smooth" },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.18,
        opacityFrom: 0.26,
        opacityTo: 0.04,
        stops: [0, 100],
      },
    },
    colors: [`var(--mui-palette-${tone}-main)`],
    tooltip: { enabled: false },
    grid: { show: false },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { labels: { show: false } },
    states: {
      hover: { filter: { type: "none" } },
      active: { filter: { type: "none" } },
    },
  };

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", borderRadius: 4, borderColor: "divider" }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack spacing={1.25}>
              <Typography variant="overline" color="text.secondary">
                {title}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: toneToColor(tone) }}
              >
                {value}
              </Typography>
            </Stack>

            <Box sx={{ minWidth: 108 }}>
              <AppReactApexCharts
                type="area"
                height={72}
                width="100%"
                series={[{ name: title, data: trend }]}
                options={options}
              />
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DashboardKpiCard;
