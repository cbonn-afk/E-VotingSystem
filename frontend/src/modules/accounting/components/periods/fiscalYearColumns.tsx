import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import type { GridColDef } from "@mui/x-data-grid";

import type { FiscalYearResource } from "../../api/types";
import { formatDate } from "../../utils/accountingFormat";
import { centerColumns } from "../shared/centerColumns";

const relativeTime = (iso: string | null): string => {
  if (!iso) return "—";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} min ago`;

  return "just now";
};

type ColumnOptions = {
  onEdit: (row: FiscalYearResource) => void;
  onDelete: (row: FiscalYearResource) => void;
  canManage: boolean;
  canDelete: boolean;
};

export const getFiscalYearColumns = ({
  onEdit,
  onDelete,
  canManage,
  canDelete,
}: ColumnOptions): GridColDef<FiscalYearResource>[] =>
  centerColumns([
    { field: "code", headerName: "Code", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          label={row.status.toUpperCase()}
          color={row.status === "open" ? "success" : "error"}
          variant="tonal"
          size="small"
        />
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
          <span>{row.name}</span>
          {row.isCurrent && (
            <Chip
              icon={<i className="bx-check" />}
              label="Current"
              color="primary"
              variant="tonal"
              size="small"
            />
          )}
        </Stack>
      ),
    },
    {
      field: "startDate",
      headerName: "Year Start",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => formatDate(row.startDate),
    },
    {
      field: "endDate",
      headerName: "Year End",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => formatDate(row.endDate),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 140,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <i className="bx-time-five" />
          <span>{relativeTime(row.createdAt)}</span>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          {canManage && (
            <Tooltip title="Fiscal year settings">
              <IconButton size="small" color="secondary" onClick={() => onEdit(row)}>
                <i className="bx-cog" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title={row.isCurrent ? "Current year cannot be deleted" : "Delete"}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={row.isCurrent}
                  onClick={() => onDelete(row)}
                >
                  <i className="bx-trash" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]);
