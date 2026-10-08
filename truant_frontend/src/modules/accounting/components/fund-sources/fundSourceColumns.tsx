import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import type { GridColDef } from "@mui/x-data-grid";

import type { FundSourceResource } from "../../api/types";
import { centerColumns } from "../shared/centerColumns";

type ColumnOptions = {
  onEdit: (row: FundSourceResource) => void;
  onDelete: (row: FundSourceResource) => void;
  canManage: boolean;
};

export const getFundSourceColumns = ({
  onEdit,
  onDelete,
  canManage,
}: ColumnOptions): GridColDef<FundSourceResource>[] =>
  centerColumns([
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    {
      field: "code",
      headerName: "Code",
      width: 160,
      renderCell: ({ row }) => row.code || "—",
    },
    {
      field: "isUsed",
      headerName: "Used",
      width: 100,
      renderCell: ({ row }) => (
        <Chip
          label={row.isUsed ? "Yes" : "No"}
          color={row.isUsed ? "warning" : "secondary"}
          variant="tonal"
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          label={row.status}
          color={row.status === "active" ? "success" : "secondary"}
          variant="tonal"
          size="small"
          className="capitalize"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        canManage ? (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Tooltip
              title={
                row.isUsed ? "Edit status only — name/code are locked" : "Edit"
              }
            >
              <IconButton
                size="small"
                color="secondary"
                onClick={() => onEdit(row)}
              >
                <i className="bx bx-edit" />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.isUsed ? "In use — cannot delete" : "Delete"}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={row.isUsed}
                  onClick={() => onDelete(row)}
                >
                  <i className="bx bx-trash" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ) : null,
    },
  ]);
