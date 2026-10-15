import type { ReactNode } from "react";

import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Props = {
  label: ReactNode;
  votes: number;
  /** Total the percentage is measured against (registered members). */
  total: number;
  color?: "primary" | "success" | "error" | "warning" | "info" | "secondary";
  extra?: ReactNode;
};

const VoteBar = ({ label, votes, total, color = "primary", extra }: Props) => {
  const percent = total > 0 ? (votes / total) * 100 : 0;

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
          {extra}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {votes} vote{votes === 1 ? "" : "s"} · {percent.toFixed(2)}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, percent)}
        color={color}
        sx={{ blockSize: 10, borderRadius: 5 }}
      />
    </Stack>
  );
};

export default VoteBar;
