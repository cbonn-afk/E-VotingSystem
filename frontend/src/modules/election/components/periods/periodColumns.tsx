import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import type { AccountingPeriodResource, PeriodStatus } from "../../api/types";
import { formatDate } from "../../utils/accountingFormat";
import { centerColumns } from "../shared/centerColumns";

const statusMeta: Record<
  PeriodStatus,
  { color: "success" | "warning" | "error"; icon: string }
> = {
  open: { color: "success", icon: "bx-lock-open-alt" },
  closed: { color: "warning", icon: "bx-lock-alt" },
  locked: { color: "error", icon: "bx-lock-alt" },
};

type ColumnOptions = {
  onSettings: (row: AccountingPeriodResource) => void;
  canManage: boolean;
};

export const getPeriodColumns = ({
  onSettings,
  canManage,
}: ColumnOptions): GridColDef<AccountingPeriodResource>[] =>
  centerColumns([
    {
      field: "periodNumber",
      headerName: "Period",
      width: 110,
      renderCell: ({ row }) => (
        <Box display="inline-flex" alignItems="center" gap={2}>
          <Typography variant="body2" fontWeight={600}>
            {row.periodNumber}
          </Typography>
        </Box>
      ),
    },
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    {
      field: "startDate",
      headerName: "Start Date",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => formatDate(row.startDate),
    },
    {
      field: "endDate",
      headerName: "End Date",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => formatDate(row.endDate),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: ({ row }) => (
        <Chip
          icon={<i className={statusMeta[row.status].icon} />}
          label={row.status.toUpperCase()}
          color={statusMeta[row.status].color}
          variant="tonal"
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Settings",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        canManage ? (
          <Box>
            <Tooltip title="Period settings">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => onSettings(row)}
              >
                <i className="bx-cog" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null,
    },
  ]);
