"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";

import type { TransactionResource } from "../../api/types";
import StatementImportDialog from "../../components/imports/StatementImportDialog";
import InquiryPageHeader from "../../components/shared/InquiryPageHeader";
import { useTransactions } from "../../hooks/useInquiryApi";
import {
  formatDate,
  formatMoney,
  getInquiryErrorMessage,
  transactionModeLabels,
  transactionTypeLabels,
} from "../../utils/inquiryFormat";

const columns: CustomTableColumn<TransactionResource>[] = [
  { id: "date", label: "Date", width: 130, render: (r) => formatDate(r.transacted_on) },
  { id: "code", label: "Member Code", width: 130, render: (r) => <Typography fontWeight={600}>{r.member_code}</Typography> },
  { id: "name", label: "Member Name", minWidth: 200, flex: 1, render: (r) => r.member_name ?? "—" },
  { id: "type", label: "Account", width: 160, render: (r) => transactionTypeLabels[r.account_type] ?? r.account_type },
  {
    id: "mode",
    label: "Transaction",
    width: 140,
    render: (r) => (
      <Chip size="small" variant="tonal" color={r.mode === "D" ? "success" : "warning"} label={transactionModeLabels[r.mode] ?? r.mode} />
    ),
  },
  { id: "amount", label: "Amount", width: 140, align: "right", render: (r) => formatMoney(r.amount) },
  { id: "balance", label: "Balance", width: 140, align: "right", render: (r) => formatMoney(r.running_balance) },
];

export default function TransactionsView() {
  const canImport = useAuthorization().can("inquiry.statements.import");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({ page: 0, pageSize: 25 });
  const debounced = useDebouncedValue(search.trim(), 350);
  const query = useTransactions({
    search: debounced || undefined,
    type: type || undefined,
    mode: mode || undefined,
    from: from || undefined,
    to: to || undefined,
    page: pagination.page + 1,
    per_page: pagination.pageSize,
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const tableColumns = useMemo(() => columns, []);

  useEffect(() => {
    setPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
  }, [debounced, type, mode, from, to]);

  return (
    <Stack spacing={5}>
      <InquiryPageHeader
        title="Savings Transactions"
        description="Deposits and withdrawals on regular savings, time deposits and share capital."
      >
        {canImport && (
          <Button variant="contained" startIcon={<i className="bx bx-upload" />} onClick={() => setImportOpen(true)}>
            Import Excel
          </Button>
        )}
      </InquiryPageHeader>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 1fr) 180px 160px 160px 160px auto" }, alignItems: "center" }}>
          <CustomTextField value={search} onChange={(e) => setSearch(e.target.value)} size="small" label="Search" placeholder="Name or member code" />
          <CustomTextField select value={type} onChange={(e) => setType(e.target.value)} size="small" label="Account">
            <MenuItem value="">All accounts</MenuItem>
            {Object.entries(transactionTypeLabels).map(([code, label]) => (
              <MenuItem key={code} value={code}>{label}</MenuItem>
            ))}
          </CustomTextField>
          <CustomTextField select value={mode} onChange={(e) => setMode(e.target.value)} size="small" label="Transaction">
            <MenuItem value="">All</MenuItem>
            {Object.entries(transactionModeLabels).map(([code, label]) => (
              <MenuItem key={code} value={code}>{label}</MenuItem>
            ))}
          </CustomTextField>
          <CustomTextField type="date" value={from} onChange={(e) => setFrom(e.target.value)} size="small" label="From" slotProps={{ inputLabel: { shrink: true } }} />
          <CustomTextField type="date" value={to} onChange={(e) => setTo(e.target.value)} size="small" label="To" slotProps={{ inputLabel: { shrink: true } }} />
          <Button color="secondary" startIcon={<i className="bx bx-reset" />} onClick={() => { setSearch(""); setType(""); setMode(""); setFrom(""); setTo(""); }}>
            Clear
          </Button>
        </Box>
      </Paper>

      {query.isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={() => void query.refetch()}>Retry</Button>}>
          {getInquiryErrorMessage(query.error, "Transactions could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Transactions</Typography>
          <Chip size="small" variant="tonal" color="primary" label={`${total} row${total === 1 ? "" : "s"}`} />
        </Stack>
        <CustomTable
          rows={rows}
          columns={tableColumns}
          getRowId={(row) => row.id}
          loading={query.isFetching}
          disableRowSelectionOnClick
          density="compact"
          paginationMode="server"
          rowCount={total}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          emptyTitle={query.isError ? "Could not load transactions" : "No transactions found"}
          emptyDescription={query.isError ? "Retry or check your connection." : "Import the savings transactions Excel file to get started."}
          sx={{ minBlockSize: 520, p: 0 }}
        />
      </Paper>

      <StatementImportDialog open={importOpen} type="transactions" onClose={() => setImportOpen(false)} />
    </Stack>
  );
}
