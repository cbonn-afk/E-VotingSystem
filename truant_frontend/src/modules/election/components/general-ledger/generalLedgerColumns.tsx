import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import type { GeneralLedgerAccount } from "../../api/types";
import { formatPeso } from "../../utils/accountingFormat";
import { ACCOUNT_TYPE_COLOR } from "../accounts/accountsShared";

export type GeneralLedgerRow = GeneralLedgerAccount & {
  debitTotal: number;
  creditTotal: number;
};

type ColumnOptions = {
  onView: (row: GeneralLedgerRow) => void;
};

export const getGeneralLedgerColumns = ({
  onView,
}: ColumnOptions): GridColDef<GeneralLedgerRow>[] => [
  {
    field: "account",
    headerName: "Account",
    flex: 1.6,
    minWidth: 340,
    valueGetter: (_value, row) => `${row.code} ${row.name}`,
    renderCell: ({ row }) => (
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: "100%",
          alignItems: "center",
          minWidth: 0,
          py: 1,
          pr: 2,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            bgcolor: `${ACCOUNT_TYPE_COLOR[row.type]}.lighterOpacity`,
            color: `${ACCOUNT_TYPE_COLOR[row.type]}.main`,
            flexShrink: 0,
            fontSize: 18,
          }}
        >
          <i className="bx bx-book" />
        </Box>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.code} · {row.normal_balance.toUpperCase()} normal
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    field: "type",
    headerName: "Type",
    minWidth: 130,
    align: "center",
    headerAlign: "center",
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
    field: "transactions",
    headerName: "Entries",
    minWidth: 110,
    align: "center",
    headerAlign: "center",
    valueGetter: (_value, row) => row.transactions.length,
    renderCell: ({ row }) => (
      <Chip
        label={row.transactions.length}
        color={row.transactions.length > 0 ? "info" : "secondary"}
        variant="tonal"
        size="small"
      />
    ),
  },
  {
    field: "opening_balance",
    headerName: "Opening",
    flex: 1,
    minWidth: 130,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => (
      <Typography variant="body2" sx={{ width: "100%", textAlign: "right" }}>
        {formatPeso(row.opening_balance)}
      </Typography>
    ),
  },
  {
    field: "debitTotal",
    headerName: "Debit",
    flex: 1,
    minWidth: 130,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => (
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ width: "100%", textAlign: "right" }}
      >
        {formatPeso(row.debitTotal)}
      </Typography>
    ),
  },
  {
    field: "creditTotal",
    headerName: "Credit",
    flex: 1,
    minWidth: 130,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => (
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ width: "100%", textAlign: "right" }}
      >
        {formatPeso(row.creditTotal)}
      </Typography>
    ),
  },
  {
    field: "closing_balance",
    headerName: "Ending Balance",
    flex: 1,
    minWidth: 140,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => {
      const value = Number(row.closing_balance);
      const color =
        value > 0 ? "success.main" : value < 0 ? "error.main" : "text.primary";

      return (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ width: "100%", color, textAlign: "right" }}
        >
          {formatPeso(row.closing_balance)}
        </Typography>
      );
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 110,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: ({ row }) => (
      <Tooltip title="View transactions">
        <IconButton size="small" color="secondary" onClick={() => onView(row)}>
          <i className="bx-show" />
        </IconButton>
      </Tooltip>
    ),
  },
];
