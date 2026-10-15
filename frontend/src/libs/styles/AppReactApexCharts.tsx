"use client";

import { useEffect, useMemo, useState } from "react";

// MUI Imports
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import type { BoxProps } from "@mui/material/Box";

// Third-party Imports
import type { Props } from "react-apexcharts";

// Component Imports
import ReactApexcharts from "@/libs/ApexCharts";

type ApexChartWrapperProps = Props & {
  boxProps?: BoxProps;
};

// Themed wrapper that re-skins ApexCharts to the Sneat/MUI theme tokens —
// same convention as AppReactToastify / AppReactDatepicker.
const ApexChartWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  "& .apexcharts-canvas": {
    "& line[stroke='transparent']": {
      display: "none",
    },
    "& .apexcharts-tooltip": {
      boxShadow: "var(--mui-customShadows-xs)",
      borderColor: "var(--mui-palette-divider)",
      background: "var(--mui-palette-background-paper)",
      "& .apexcharts-tooltip-title": {
        fontWeight: 600,
        borderColor: "var(--mui-palette-divider)",
        background: "var(--mui-palette-background-paper)",
      },
      "&.apexcharts-theme-light": {
        color: "var(--mui-palette-text-primary)",
      },
      "&.apexcharts-theme-dark": {
        color: "var(--mui-palette-common-white)",
      },
      "& .apexcharts-tooltip-series-group:first-of-type": {
        paddingBottom: 0,
      },
    },
    "& .apexcharts-xaxistooltip": {
      borderColor: "var(--mui-palette-divider)",
      background: "var(--mui-palette-grey-50)",
      "&:after": {
        borderBottomColor: "var(--mui-palette-grey-50)",
      },
      "&:before": {
        borderBottomColor: "var(--mui-palette-divider)",
      },
    },
    "& .apexcharts-xaxistooltip-text, & .apexcharts-yaxistooltip-text": {
      color: "var(--mui-palette-text-primary)",
    },
    "& .apexcharts-text, & .apexcharts-tooltip-text, & .apexcharts-datalabel-label, & .apexcharts-datalabel, & .apexcharts-legend-text":
      {
        fontFamily: `${theme.typography.fontFamily} !important`,
      },
    "& .apexcharts-pie-label": {
      filter: "none",
    },
    "& .apexcharts-marker": {
      boxShadow: "none",
    },
  },
})) as typeof Box;

const AppReactApexCharts = (props: ApexChartWrapperProps) => {
  const { boxProps, height, options, series, ...rest } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeOptions = useMemo(
    () => ({
      ...options,
      chart: {
        ...options?.chart,
        animations: {
          ...options?.chart?.animations,
          enabled: false,
        },
      },
    }),
    [options],
  );

  const safeSeries = useMemo(
    () => (Array.isArray(series) ? series : []),
    [series],
  );

  if (!mounted) {
    return (
      <ApexChartWrapper
        {...boxProps}
        sx={{
          minBlockSize: height,
          ...boxProps?.sx,
        }}
      />
    );
  }

  return (
    <ApexChartWrapper {...boxProps}>
      <ReactApexcharts
        {...rest}
        height={height}
        options={safeOptions}
        series={safeSeries}
      />
    </ApexChartWrapper>
  );
};

export default AppReactApexCharts;
