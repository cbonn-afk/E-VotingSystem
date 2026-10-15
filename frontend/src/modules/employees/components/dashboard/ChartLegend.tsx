"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import type { ThemeColor } from "@core/types";

export type LegendItem = {
  label: string;
  value: number | string;
  tone: ThemeColor;
};

const ChartLegend = ({ items }: { items: LegendItem[] }) => (
  <Stack
    direction="row"
    spacing={1}
    useFlexGap
    flexWrap="wrap"
    justifyContent="center"
  >
    {items.map((item) => (
      <Chip
        key={item.label}
        size="small"
        variant="tonal"
        color={item.tone}
        label={`${item.label}: ${item.value}`}
        sx={{ fontWeight: 600 }}
      />
    ))}
  </Stack>
);

export default ChartLegend;
