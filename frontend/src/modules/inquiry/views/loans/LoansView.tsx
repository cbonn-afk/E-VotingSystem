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

import type { LoanResource } from "../../api/types";
import StatementImportDialog from "../../components/imports/StatementImportDialog";
import InquiryPageHeader from "../../components/shared/InquiryPageHeader";
import { useLoans } from "../../hooks/useInquiryApi";
import { formatDate, formatMoney, getInquiryErrorMessage } from "../../utils/inquiryFormat";

const columns: CustomTableColumn<LoanResource>[] = [
  { id: "code", label: "Member Code", width: 130, render: (r) => <Typography fontWeight={600}>{r.member_code}</Typography> },
  { id: "name", label: "Member Name", minWidth: 200, flex: 1, render: (r) => r.member_name ?? "—" },
  { id: "number", label: "Loan No.", width: 140, render: (r) => r.loan_number },
  { id: "type", label: "Type", width: 170, render: (r) => r.loan_type },
  { id: "principal", label: "Principal", width: 130, align: "right", render: (r) => formatMoney(r.principal) },
  { id: "paid", label: "Principal Paid", width: 140, align: "right", render: (r) => formatMoney(r.principal_paid) },
  { id: "pbal", label: "Principal Balance", width: 160, align: "right", render: (r) => formatMoney(r.principal_balance) },
  { id: "ibal", label: "Interest Balance", width: 150, align: "right", render: (r) => formatMoney(r.interest_balance) },
  { id: "released", label: "Released", width: 120, render: (r) => formatDate(r.released_on) },
  { id: "maturity", label: "Maturity", width: 120, render: (r) => formatDate(r.maturity_on) },
];

export default function LoansView() {
  const canImport = useAuthorization().can("inquiry.statements.import");
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({ page: 0, pageSize: 25 });
  const debounced = useDebouncedValue(search.trim(), 350);
  const query = useLoans({ search: debounced || undefined, page: pagination.page + 1, per_page: pagination.pageSize });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const tableColumns = useMemo(() => columns, []);

  useEffect(() => {
    setPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
  }, [debounced]);

  return (
    <Stack spacing={5}>
      <InquiryPageHeader title="Loan Balances" description="Outstanding loans per member as of the last import.">
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
          label="Search loans"
          placeholder="Name, member code or loan number"
          sx={{ maxInlineSize: 520 }}
        />
      </Paper>

      {query.isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={() => void query.refetch()}>Retry</Button>}>
          {getInquiryErrorMessage(query.error, "Loans could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Loans</Typography>
          <Chip size="small" variant="tonal" color="primary" label={`${total} loan${total === 1 ? "" : "s"}`} />
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
          emptyTitle={query.isError ? "Could not load loans" : "No loans found"}
          emptyDescription={query.isError ? "Retry or check your connection." : "Import the loan balances Excel file to get started."}
          sx={{ minBlockSize: 520, p: 0 }}
        />
      </Paper>

      <StatementImportDialog open={importOpen} type="loans" onClose={() => setImportOpen(false)} />
    </Stack>
  );
}
