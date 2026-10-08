import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import type { AccountResource } from "../../api/types";
import { ACCOUNT_TYPE_COLOR } from "./accountsShared";
import { Box } from "@mui/material";

type ColumnOptions = {
  onView: (row: AccountResource) => void;
  onEdit: (row: AccountResource) => void;
  onDelete: (row: AccountResource) => void;
  canManage: boolean;
  canDelete: boolean;
};

export const getAccountColumns = ({
  onView,
  onEdit,
  onDelete,
  canManage,
  canDelete,
}: ColumnOptions): GridColDef<AccountResource>[] => [
  {
    field: "code",
    headerName: "Code",
    width: 120,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box display="inline-flex" alignItems="center" gap={2}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ fontFamily: "monospace" }}
        >
          {row.code}
        </Typography>
      </Box>
    ),
  },
  {
    field: "name",
    headerName: "Account",
    flex: 1,
    minWidth: 240,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box display="inline-flex" alignItems="center" gap={2}>
        <Typography variant="body2" fontWeight={500} noWrap>
          {row.name}
        </Typography>
      </Box>
    ),
  },
  {
    field: "type",
    headerName: "Type",
    width: 130,
    renderCell: ({ row }) => (
      <Chip
        label={row.type}
        color={ACCOUNT_TYPE_COLOR[row.type]}
        variant="tonal"
        size="small"
        className="capitalize"
      />
    ),
  },
  {
    field: "normalBalance",
    headerName: "Normal Balance",
    width: 140,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box display="inline-flex" alignItems="center" gap={2}>
        <Typography
          variant="body2"
          color="text.secondary"
          className="capitalize"
        >
          {row.normalBalance}
        </Typography>
      </Box>
    ),
  },
  {
    field: "isPosting",
    headerName: "Role",
    width: 120,
    renderCell: ({ row }) => (
      <Chip
        label={row.isPosting ? "Posting" : "Folder"}
        color={row.isPosting ? "info" : "secondary"}
        variant="tonal"
        size="small"
        icon={<i className={row.isPosting ? "bx-pencil" : "bx-folder"} />}
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
    field: "isSystem",
    headerName: "Source",
    width: 130,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) =>
      row.isSystem ? (
        <Tooltip title="Built-in account — part of the standard chart and can't be deleted">
          <Chip
            label="Built-in"
            color="secondary"
            variant="tonal"
            size="small"
            icon={<i className="bx-lock-alt" />}
          />
        </Tooltip>
      ) : (
        <Tooltip title="Custom account you added">
          <Chip
            label="Custom"
            color="info"
            variant="tonal"
            size="small"
            icon={<i className="bx-user" />}
          />
        </Tooltip>
      ),
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 140,
    sortable: false,
    filterable: false,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={0.5} className="items-center justify-end">
        <Tooltip title="View">
          <IconButton
            size="small"
            color="secondary"
            onClick={() => onView(row)}
          >
            <i className="bx-show" />
          </IconButton>
        </Tooltip>
        {canManage && (
          <Tooltip title="Edit account">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => onEdit(row)}
            >
              <i className="bx-edit" />
            </IconButton>
          </Tooltip>
        )}
        {canDelete &&
          (row.isSystem ? (
            <Tooltip title="System accounts can't be deleted">
              <span>
                <IconButton size="small" color="error" disabled>
                  <i className="bx-trash" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Delete account">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(row)}
              >
                <i className="bx-trash" />
              </IconButton>
            </Tooltip>
          ))}
      </Stack>
    ),
  },
];
