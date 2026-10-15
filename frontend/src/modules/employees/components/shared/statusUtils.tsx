// React Imports
import type { ReactNode } from "react";

// MUI Imports
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";

// Type Imports
import type { ThemeColor } from "@core/types";
import type {
  ApprovalStatus,
  AttendanceStatus,
  EmployeeStatus,
  PayrollStatus,
  TimeLogStatus,
} from "../../types";

type KnownStatus =
  | EmployeeStatus
  | PayrollStatus
  | ApprovalStatus
  | AttendanceStatus
  | TimeLogStatus;

const statusColorMap: Record<KnownStatus, ThemeColor> = {
  Active: "success",
  Inactive: "secondary",
  Deactivated: "error",
  "On Leave": "warning",
  Probation: "info",
  Complete: "success",
  "Pending Correction": "warning",
  "Missing Time Out": "error",
  Approved: "success",
  "Payroll Included": "success",
  "With Issues": "error",
  "For Review": "info",
  Draft: "secondary",
  Prepared: "info",
  Released: "success",
  Voided: "error",
  Paid: "success",
  Cancelled: "error",
  Pending: "warning",
  Denied: "error",
  Rejected: "error",
};

export const renderStatusChip = (status: KnownStatus) => (
  <Chip
    label={status}
    color={statusColorMap[status]}
    variant="tonal"
    size="small"
  />
);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);

type TileColor = "primary" | "info" | "success" | "warning" | "error";

/**
 * Fills the whole DataGrid cell and centers its content vertically so every
 * column lines up on the same baseline regardless of row height. `justify`
 * sets the horizontal alignment per column.
 */
export const CellBox = ({
  children,
  justify = "flex-start",
}: {
  children: ReactNode;
  justify?: "flex-start" | "center" | "flex-end";
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: justify,
      inlineSize: "100%",
      blockSize: "100%",
    }}
  >
    {children}
  </Box>
);

const tileSx = (color: TileColor) =>
  ({
    inlineSize: 36,
    blockSize: 36,
    flexShrink: 0,
    borderRadius: 1.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: `${color}.main`,
    bgcolor: (theme: import("@mui/material/styles").Theme) =>
      alpha(theme.palette[color].main, 0.12),
  }) as const;

/** Small rounded icon tile used as a leading accent in table cells. */
export const TableIcon = ({
  icon,
  color = "primary",
}: {
  icon: string;
  color?: TileColor;
}) => (
  <Box sx={tileSx(color)}>
    <i className={`bx ${icon}`} style={{ fontSize: "1.25rem" }} />
  </Box>
);

/** Initials tile (e.g. "JT") derived from a person's name. */
export const TableAvatar = ({
  name,
  color = "primary",
}: {
  name: string;
  color?: TileColor;
}) => {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "—";

  return (
    <Box sx={{ ...tileSx(color), fontWeight: 700, fontSize: "0.8rem" }}>
      {initials}
    </Box>
  );
};
