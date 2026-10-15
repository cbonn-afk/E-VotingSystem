import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import type { TransactionSeriesResource } from "../../api/types";
import { centerColumns } from "../shared/centerColumns";
import Box from "@mui/material/Box";

const preview = (row: TransactionSeriesResource) =>
  `${row.prefix}-${String(row.nextNumber).padStart(row.padding, "0")}`;

type ColumnOptions = {
  onEdit: (row: TransactionSeriesResource) => void;
  onDelete: (row: TransactionSeriesResource) => void;
  canManage: boolean;
};

export const getTransactionSeriesColumns = ({
  onEdit,
  onDelete,
  canManage,
}: ColumnOptions): GridColDef<TransactionSeriesResource>[] =>
  centerColumns([
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    {
      field: "prefix",
      headerName: "Prefix",
      width: 120,
      renderCell: ({ row }) => (
        <Box display="inline-flex" alignItems="center" gap={2}>
          <Typography variant="body2" fontWeight={600}>
            {row.prefix}-
          </Typography>
        </Box>
      ),
    },
    {
      field: "nextNumber",
      headerName: "Next #",
      width: 110,
      renderCell: ({ row }) =>
        String(row.nextNumber).padStart(row.padding, "0"),
    },
    {
      field: "preview",
      headerName: "Preview",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Chip
          label={preview(row)}
          variant="tonal"
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: "resetInterval",
      headerName: "Reset",
      width: 120,
      renderCell: ({ row }) => (
        <Box display="inline-flex" alignItems="center" gap={2}>
          <Typography variant="body2" className="capitalize">
            {row.resetInterval}
          </Typography>
        </Box>
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
