import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import type { TaxResource } from "../../api/types";
import { centerColumns } from "../shared/centerColumns";
import Box from "@mui/material/Box";

type ColumnOptions = {
  onEdit: (row: TaxResource) => void;
  onDelete: (row: TaxResource) => void;
  canManage: boolean;
};

export const getTaxColumns = ({
  onEdit,
  onDelete,
  canManage,
}: ColumnOptions): GridColDef<TaxResource>[] =>
  centerColumns([
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
      align: "left",
      headerAlign: "left",
    },
    {
      field: "rate",
      headerName: "Rate",
      width: 120,
      renderCell: ({ row }) => (
        <Box display="inline-flex" alignItems="center" gap={2}>
          <Typography variant="body2" fontWeight={600}>
            {row.rate}%
          </Typography>
        </Box>
      ),
    },
    {
      field: "code",
      headerName: "Code",
      width: 140,
      renderCell: ({ row }) => row.code || "—",
    },
    {
      field: "isUsed",
      headerName: "Used",
      width: 100,
      renderCell: ({ row }) => (row.isUsed ? "Yes" : "No"),
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
      width: 120,
      sortable: false,
      filterable: false,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) =>
        canManage ? (
          <Stack
            direction="row"
            spacing={0.5}
            className="items-center justify-end"
          >
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => onEdit(row)}
              >
                <i className="bx-edit" />
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
                  <i className="bx-trash" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ) : null,
    },
  ]);
