"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { GridColDef } from "@mui/x-data-grid";

import CustomDialog from "@components/app/CustomDialog";
import CustomTable from "@components/app/CustomTable";

import type { GeneralLedgerTransaction } from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";
import { ACCOUNT_TYPE_COLOR } from "../accounts/accountsShared";
import type { GeneralLedgerRow } from "./generalLedgerColumns";

type Props = {
  account: GeneralLedgerRow | null;
  open: boolean;
  onClose: () => void;
};

type TransactionRow = GeneralLedgerTransaction & {
  id: string;
};

const transactionColumns: GridColDef<TransactionRow>[] = [
  {
    field: "entry_date",
    headerName: "Date",
    minWidth: 130,
    valueGetter: (_value, row) => row.entry_date,
    renderCell: ({ row }) => (
      <Typography variant="body2">{formatDate(row.entry_date)}</Typography>
    ),
  },
  {
    field: "entry_no",
    headerName: "Journal #",
    minWidth: 150,
    renderCell: ({ row }) => (
      <Typography variant="body2" fontWeight={700}>
        {row.entry_no ?? "Draft"}
      </Typography>
    ),
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1.4,
    minWidth: 260,
    renderCell: ({ row }) => (
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {row.description ?? row.memo ?? "No description"}
        </Typography>
        {row.description && row.memo && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.memo}
          </Typography>
        )}
      </Stack>
    ),
  },
  {
    field: "debit",
    headerName: "Debit",
    minWidth: 140,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => (
      <Typography
        variant="body2"
        sx={{
          width: "100%",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Number(row.debit) ? formatPeso(row.debit) : "—"}
      </Typography>
    ),
  },
  {
    field: "credit",
    headerName: "Credit",
    minWidth: 140,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => (
      <Typography
        variant="body2"
        sx={{
          width: "100%",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Number(row.credit) ? formatPeso(row.credit) : "—"}
      </Typography>
    ),
  },
  {
    field: "balance",
    headerName: "Running Balance",
    minWidth: 170,
    align: "right",
    headerAlign: "right",
    renderCell: ({ row }) => {
      const balance = Number(row.balance);

      return (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            width: "100%",
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
            color:
              balance > 0
                ? "success.main"
                : balance < 0
                  ? "error.main"
                  : "text.primary",
          }}
        >
          {formatPeso(row.balance)}
        </Typography>
      );
    },
  },
];

const SummaryTile = ({
  label,
  value,
  tone = "text.primary",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 3,
      minWidth: 0,
      bgcolor: "background.default",
      borderRadius: 1,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="subtitle1"
      fontWeight={800}
      sx={{
        color: tone,
        fontVariantNumeric: "tabular-nums",
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </Typography>
  </Paper>
);

const AccountTransactionsModal = ({ account, open, onClose }: Props) => {
  const rows: TransactionRow[] =
    account?.transactions.map((transaction, index) => ({
      ...transaction,
      id: `${transaction.journal_entry_id}-${index}`,
    })) ?? [];

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      width="1180px"
      title={
        account ? `${account.code} · ${account.name}` : "Account Transactions"
      }
      icon={<i className="bx bx-book text-primary" />}
      description={
        account
          ? "Review posted movement, running balance, and account totals."
          : ""
      }
      actions={
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      }
    >
      {account && (
        <Stack spacing={4} sx={{ mt: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "flex-start", md: "center" } }}
          >
            <Chip
              label={account.type}
              color={ACCOUNT_TYPE_COLOR[account.type]}
              variant="tonal"
              size="small"
              className="capitalize"
            />
            <Typography variant="body2" color="text.secondary">
              {account.normal_balance.toUpperCase()} normal balance
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
            }}
          >
            <SummaryTile
              label="Opening"
              value={formatPeso(account.opening_balance)}
            />
            <SummaryTile
              label="Debits"
              value={formatPeso(account.debitTotal)}
            />
            <SummaryTile
              label="Credits"
              value={formatPeso(account.creditTotal)}
            />
            <SummaryTile
              label="Closing"
              value={formatPeso(account.closing_balance)}
              tone={
                Number(account.closing_balance) > 0
                  ? "success.main"
                  : Number(account.closing_balance) < 0
                    ? "error.main"
                    : "text.primary"
              }
            />
            <SummaryTile label="Entries" value={rows.length} />
          </Box>

          <Paper
            variant="outlined"
            sx={{ overflow: "hidden", borderRadius: 1 }}
          >
            <CustomTable
              rows={rows}
              columns={transactionColumns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              density="standard"
              emptyTitle="No transactions"
              emptyDescription="This account has no posted movement in the selected period."
              sx={{
                minBlockSize: 420,
                p: 3,
                "& .MuiDataGrid-cell": {
                  alignItems: "center",
                  display: "flex",
                },
              }}
            />
          </Paper>
        </Stack>
      )}
    </CustomDialog>
  );
};

export default AccountTransactionsModal;
