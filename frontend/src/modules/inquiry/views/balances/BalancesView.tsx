"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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

import type { BalanceResource } from "../../api/types";
import StatementImportDialog from "../../components/imports/StatementImportDialog";
import InquiryPageHeader from "../../components/shared/InquiryPageHeader";
import { useBalances } from "../../hooks/useInquiryApi";
import { formatDate, formatMoney, getInquiryErrorMessage } from "../../utils/inquiryFormat";

const money = (value: string) => formatMoney(value);

const columns: CustomTableColumn<BalanceResource>[] = [
  { id: "code", label: "Member Code", width: 130, render: (r) => <Typography fontWeight={600}>{r.member_code}</Typography> },
  { id: "name", label: "Member Name", minWidth: 220, flex: 1.2, render: (r) => r.member_name },
  { id: "share", label: "Share Capital", width: 140, align: "right", render: (r) => money(r.share_capital) },
  { id: "regular", label: "Regular Savings", width: 150, align: "right", render: (r) => money(r.regular_savings) },
  { id: "bonus", label: "Savings Bonus", width: 140, align: "right", render: (r) => money(r.savings_bonus) },
  { id: "td", label: "Time Deposit", width: 140, align: "right", render: (r) => money(r.time_deposit) },
  {
    id: "member",
    label: "Members list",
    width: 150,
    render: (r) =>
      r.member_status ? (
        <Chip size="small" variant="tonal" color={r.member_status === "active" ? "success" : "secondary"} label={r.member_status === "active" ? "Active" : "Inactive"} />
      ) : (
        <Chip size="small" variant="tonal" color="warning" label="Not in Members" />
      ),
  },
  { id: "asOf", label: "As of", width: 120, render: (r) => formatDate(r.as_of_date) },
];

export default function BalancesView() {
  const canImport = useAuthorization().can("inquiry.statements.import");
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({ page: 0, pageSize: 25 });
  const debounced = useDebouncedValue(search.trim(), 350);
  const query = useBalances({ search: debounced || undefined, page: pagination.page + 1, per_page: pagination.pageSize });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const tableColumns = useMemo(() => columns, []);

  useEffect(() => {
    setPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
  }, [debounced]);

  return (
    <Stack spacing={5}>
      <InquiryPageHeader
        title="Account Balances"
        description="Each member's share capital, savings and dividends as of the last import."
      >
        {canImport && (
          <Button variant="contained" startIcon={<i className="bx bx-upload" />} onClick={() => setImportOpen(true)}>
            Import Excel
          </Button>
        )}
      </InquiryPageHeader>

      <Paper sx={{ p: 3 }}>
        <CustomTextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          label="Search members"
          placeholder="Name or member code"
          sx={{ maxInlineSize: 520 }}
        />
      </Paper>

      {query.isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={() => void query.refetch()}>Retry</Button>}>
          {getInquiryErrorMessage(query.error, "Balances could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Balances</Typography>
          <Chip size="small" variant="tonal" color="primary" label={`${total} member${total === 1 ? "" : "s"}`} />
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
          emptyTitle={query.isError ? "Could not load balances" : "No balances found"}
          emptyDescription={query.isError ? "Retry or check your connection." : "Import the account balances Excel file to get started."}
          sx={{ minBlockSize: 520, p: 0 }}
        />
      </Paper>

      <StatementImportDialog open={importOpen} type="balances" onClose={() => setImportOpen(false)} />
    </Stack>
  );
}
