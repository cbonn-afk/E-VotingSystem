"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import type { LegendItemData } from "./types";

const ChartLegend = ({ items }: { items: LegendItemData[] }) => (
  <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
    {items.map((item) => (
      <Chip
        key={item.label}
        variant="tonal"
        color={item.tone}
        label={`${item.label} · ${item.value}`}
        sx={{ fontWeight: 600 }}
      />
    ))}
  </Stack>
);

export default ChartLegend;
