"use client";

import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type ChartCardProps = {
  title: string;
  description: string;
  loading?: boolean;
  hasData?: boolean;
  emptyText?: string;
  children: ReactNode;
};

const ChartCard = ({
  title,
  description,
  loading = false,
  hasData = true,
  emptyText = "No data to chart yet.",
  children,
}: ChartCardProps) => (
  <Paper className="p-5" sx={{ height: "100%" }}>
    <Stack spacing={3} sx={{ height: "100%" }}>
      <Stack spacing={0.5}>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>

      {loading ? (
        <Skeleton variant="rounded" height={300} />
      ) : hasData ? (
        children
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 280,
            color: "text.disabled",
            gap: 1,
          }}
        >
          <i className="bx bx-bar-chart-alt-2" style={{ fontSize: 40 }} />
          <Typography variant="body2" color="text.secondary">
            {emptyText}
          </Typography>
        </Box>
      )}
    </Stack>
  </Paper>
);

export default ChartCard;
