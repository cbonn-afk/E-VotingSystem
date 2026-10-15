import type { ReactNode } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

const ElectionPageHeader = ({ title, description, children }: Props) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", sm: "center" }}
    spacing={3}
  >
    <Stack spacing={0.5}>
      <Typography variant="h4">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Stack>
    {children}
  </Stack>
);

export default ElectionPageHeader;
