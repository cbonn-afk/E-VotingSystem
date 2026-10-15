"use client";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";

import type { AttentionCardData } from "./types";

const WatchlistPanel = ({ rows }: { rows: AttentionCardData[] }) => (
  <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, height: "100%" }}>
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Watchlist
        </Typography>
        <Typography variant="h5">What needs attention</Typography>
      </Stack>

      <Stack divider={<Divider flexItem />}>
        {rows.map((row) => (
          <Stack
            key={row.title}
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ py: 2 }}
          >
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <i
                  className={row.icon}
                  style={{
                    fontSize: 18,
                    color: "var(--mui-palette-text-secondary)",
                  }}
                />
                <Typography variant="subtitle2">{row.title}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {row.description}
              </Typography>
            </Stack>

            <Button component={Link} href={row.href} size="small" color={row.tone}>
              Open
            </Button>
          </Stack>
        ))}
      </Stack>
    </Stack>
  </Paper>
);

export default WatchlistPanel;
