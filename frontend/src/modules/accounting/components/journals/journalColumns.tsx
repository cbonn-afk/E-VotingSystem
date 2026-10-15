import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import type {
  JournalEntryResource,
  JournalEntryStatus,
  JournalEntryType,
} from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";
import { centerColumns } from "../shared/centerColumns";
import { Box } from "@mui/material";

export const journalStatusColor: Record<
  JournalEntryStatus,
  "secondary" | "info" | "error" | "warning"
> = {
  draft: "secondary",
  posted: "info",
  void: "error",
  reversed: "warning",
};

const typeColor: Record<
  JournalEntryType,
  "primary" | "warning" | "success" | "info"
> = {
  general: "primary",
  adjusting: "warning",
  closing: "success",
  reversal: "info",
};

const actionIconSx = {
  "& i": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    lineHeight: 1,
  },
};

type ColumnOptions = {
  onView: (row: JournalEntryResource) => void;
  onEdit: (row: JournalEntryResource) => void;
  onPost: (row: JournalEntryResource) => void;
  onVoid: (row: JournalEntryResource) => void;
  onDelete: (row: JournalEntryResource) => void;
  busy: boolean;
  canUpdate: boolean;
  canPost: boolean;
  canVoid: boolean;
};

export const getJournalColumns = ({
  onView,
  onEdit,
  onPost,
  onVoid,
  onDelete,
  busy,
  canUpdate,
  canPost,
  canVoid,
}: ColumnOptions): GridColDef<JournalEntryResource>[] =>
  centerColumns([
    {
      field: "entryDate",
      headerName: "Date",
      width: 130,
      renderCell: ({ row }) => formatDate(row.entryDate),
    },
    {
      field: "entryNo",
      headerName: "Journal #",
      width: 140,
      renderCell: ({ row }) => (
        <Box display="inline-flex" alignItems="center" gap={2}>
          <Typography variant="body2" fontWeight={600}>
            {row.entryNo ?? "Draft"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "reference",
      headerName: "Reference #",
      width: 140,
      renderCell: ({ row }) => row.reference || "-",
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: ({ row }) => (
        <Chip
          label={row.type.toUpperCase()}
          color={typeColor[row.type]}
          variant="tonal"
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: ({ row }) => (
        <Chip
          label={row.status.toUpperCase()}
          color={journalStatusColor[row.status]}
          variant="tonal"
          size="small"
        />
      ),
    },
    {
      field: "fundSource",
      headerName: "Fund Source",
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => row.fundSource?.name ?? "-",
    },
    {
      field: "memo",
      headerName: "Note",
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => row.memo || "-",
    },
    {
      field: "totalDebit",
      headerName: "Amount",
      width: 150,
      renderCell: ({ row }) => (
        <Box display="inline-flex" alignItems="center" gap={2}>
          <Typography variant="body2" fontWeight={600}>
            {formatPeso(row.totalDebit)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent="center"
          sx={{ width: "100%" }}
        >
          <Tooltip title="View entry">
            <IconButton
              size="small"
              color="secondary"
              sx={actionIconSx}
              onClick={() => onView(row)}
            >
              <i className="bx bx-show" />
            </IconButton>
          </Tooltip>
          {row.status === "draft" && canUpdate && (
            <Tooltip title="Edit draft">
              <IconButton
                size="small"
                color="secondary"
                sx={actionIconSx}
                onClick={() => onEdit(row)}
              >
                <i className="bx bx-edit" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === "draft" && canPost && (
            <Tooltip title="Post entry">
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={busy}
                  sx={actionIconSx}
                  onClick={() => onPost(row)}
                >
                  <i className="bx bx-check-double" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {row.status === "posted" && canVoid && (
            <Tooltip title="Void entry">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={busy}
                  sx={actionIconSx}
                  onClick={() => onVoid(row)}
                >
                  <i className="bx bx-block" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {row.status === "draft" && canUpdate && (
            <Tooltip title="Delete draft">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={busy}
                  sx={actionIconSx}
                  onClick={() => onDelete(row)}
                >
                  <i className="bx bx-trash" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]);
