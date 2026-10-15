"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomKPICard from "@components/app/CustomKPICard";
import CustomTable, {
  type CustomTablePaginationModel,
  type CustomTableSortModel,
} from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import type { ExpenseResource } from "@/modules/accounting/api/types";
import { useBillCategories } from "@/modules/accounting/hooks/useBillEntryApi";
import {
  useBillMutations,
  useBills,
} from "@/modules/accounting/hooks/useBillsApi";
import { useVendors } from "@/modules/accounting/hooks/useVendorsApi";
import {
  formatPeso,
  getAccountingErrorMessage,
} from "@/modules/accounting/utils/accountingFormat";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import { getBillColumns } from "@/modules/accounting/components/bills/billColumns";
import RecordPaymentDialog from "@/modules/accounting/components/bills/RecordPaymentDialog";
import ReceiptViewerDialog from "@/modules/accounting/components/bills/ReceiptViewerDialog";
import NewExpenseCategoryDialog from "@/modules/accounting/components/expenses/NewExpenseCategoryDialog";

const kpiGrid = {
  display: "grid",
  gap: 4,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
} as const;

export default function BillsView() {
  const authorization = useAuthorization();
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [lifecycleStatus, setLifecycleStatus] = useState("all");
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({
    page: 0,
    pageSize: 30,
  });
  const [sort, setSort] = useState<CustomTableSortModel>({
    field: "bill_date",
    direction: "desc",
  });
  const [paymentTarget, setPaymentTarget] = useState<ExpenseResource | null>(
    null,
  );
  const [voidTarget, setVoidTarget] = useState<ExpenseResource | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ExpenseResource | null>(
    null,
  );
  const [receiptTarget, setReceiptTarget] = useState<ExpenseResource | null>(
    null,
  );
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);

  const params = {
    search,
    vendor_id: vendorId,
    expense_category_id: categoryId,
    payment_status: ["unpaid", "partially_paid", "paid"].includes(paymentStatus)
      ? paymentStatus
      : undefined,
    include_closed: paymentStatus === "all" ? 1 : undefined,
    lifecycle_status: lifecycleStatus,
    page: pagination.page + 1,
    per_page: pagination.pageSize,
    sort: sort.field,
    direction: sort.direction,
  };
  const billsQuery = useBills(params);
  const vendorsQuery = useVendors({ status: "active", per_page: 100 });
  const categoriesQuery = useBillCategories();
  const mutations = useBillMutations();
  const bills = billsQuery.data?.data ?? [];
  const summary = billsQuery.data?.summary;

  const columns = useMemo(
    () =>
      getBillColumns({
        canEdit: authorization.can("accounting.expenses.update"),
        canPost: authorization.can("accounting.expenses.post"),
        canRecordPayment: authorization.can(
          "accounting.expenses.payments.create",
        ),
        canVoid: authorization.can("accounting.expenses.void"),
        canDelete: authorization.can("accounting.expenses.update"),
        onPost: (bill) => {
          void mutations.postBill
            .mutateAsync(bill.id)
            .then(() => toast.success("Expense posted."))
            .catch((error) => toast.error(getAccountingErrorMessage(error)));
        },
        onRecordPayment: setPaymentTarget,
        onVoid: setVoidTarget,
        onDelete: setDeleteTarget,
        onViewReceipt: setReceiptTarget,
      }),
    [authorization, mutations.postBill],
  );

  const removeDraft = async (bill: ExpenseResource) => {
    try {
      await mutations.deleteBill.mutateAsync(bill.id);
      toast.success("Draft expense deleted.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The expense could not be deleted."),
      );
    }
  };

  const recordPayment = async (
    values: {
      paymentDate: string;
      amount: number;
      paidFromAccountId: string;
      reference?: string;
      notes?: string;
    },
    postNow: boolean,
  ) => {
    if (!paymentTarget) return;
    try {
      await mutations.recordPayment.mutateAsync({
        expenseId: paymentTarget.id,
        payload: {
          payment_date: values.paymentDate,
          amount: values.amount,
          paid_from_account_id: values.paidFromAccountId,
          reference: values.reference || null,
          notes: values.notes || null,
          post_now: postNow,
        },
      });
      toast.success(postNow ? "Payment posted." : "Payment saved as draft.");
      setPaymentTarget(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "Payment could not be recorded."),
      );
    }
  };

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title="Expenses"
        description="Track supplier expenses, outstanding balances, and partial or completed payments."
      >
        {authorization.can("accounting.expenses.create") && (
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={() => setNewExpenseOpen(true)}
          >
            New Expense
          </Button>
        )}
      </AccountingPageHeader>

      <Box sx={kpiGrid}>
        <CustomKPICard
          label="Total Outstanding"
          value={formatPeso(summary?.totalOutstanding)}
          loading={billsQuery.isLoading}
          iconString="bx bx-wallet"
          iconColor="primary"
        />
        <CustomKPICard
          label="Unpaid"
          value={formatPeso(summary?.unpaidTotal)}
          loading={billsQuery.isLoading}
          iconString="bx bx-receipt"
          iconColor="warning"
        />
        <CustomKPICard
          label="Partially Paid"
          value={formatPeso(summary?.partiallyPaidTotal)}
          loading={billsQuery.isLoading}
          iconString="bx bx-adjust"
          iconColor="info"
        />
        <CustomKPICard
          label="Open Expenses"
          value={String(summary?.openBills ?? 0)}
          loading={billsQuery.isLoading}
          iconString="bx bx-file"
          iconColor="success"
        />
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Filter Expenses</Typography>
            <Typography variant="caption" color="text.secondary">
              Find expenses by vendor, payment state, category, or status.
            </Typography>
          </Stack>
          <Button
            color="secondary"
            startIcon={<i className="bx bx-reset" />}
            onClick={() => {
              setSearch("");
              setVendorId("");
              setCategoryId("");
              setPaymentStatus("all");
              setLifecycleStatus("posted");
            }}
          >
            Clear filters
          </Button>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "minmax(0, 1.35fr) repeat(4, minmax(0, 1fr))",
            },
            alignItems: "center",
          }}
        >
          <CustomTextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            label="Search expenses"
            placeholder="Reference, expense, vendor"
            sx={{ gridColumn: { sm: "span 2", lg: "span 1" } }}
          />
          <CustomTextField
            select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            size="small"
            label="Vendor"
          >
            <MenuItem value="">All vendors</MenuItem>
            {(vendorsQuery.data?.data ?? []).map((vendor) => (
              <MenuItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </MenuItem>
            ))}
          </CustomTextField>
          <CustomTextField
            select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            size="small"
            label="Payment status"
          >
            <MenuItem value="all">All expenses</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="partially_paid">Partially paid</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </CustomTextField>
          <Autocomplete
            openOnFocus
            fullWidth
            size="small"
            loading={categoriesQuery.isPending}
            options={categoriesQuery.data?.data ?? []}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              (categoriesQuery.data?.data ?? []).find(
                (category) => category.id === categoryId,
              ) ?? null
            }
            onChange={(_, option) => setCategoryId(option?.id ?? "")}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Stack>
                  <Typography variant="body2">{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.expenseAccount.name}
                  </Typography>
                </Stack>
              </li>
            )}
            renderInput={(params) => (
              <CustomTextField
                {...params}
                label="Category"
                placeholder="All categories"
              />
            )}
          />
          <CustomTextField
            select
            value={lifecycleStatus}
            onChange={(e) => setLifecycleStatus(e.target.value)}
            size="small"
            label="Expense status"
          >
            <MenuItem value="posted">Posted</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="void">Voided</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </CustomTextField>
        </Box>
      </Paper>

      {billsQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void billsQuery.refetch()}>
              Retry
            </Button>
          }
        >
          {getAccountingErrorMessage(
            billsQuery.error,
            "Expenses could not be loaded. No accounting data was changed.",
          )}
        </Alert>
      )}

      <Paper sx={{ overflow: "hidden" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Expense Register</Typography>
            <Typography variant="caption" color="text.secondary">
              Supplier expenses and the amounts still to pay.
            </Typography>
          </Stack>
          <Chip
            size="small"
            variant="tonal"
            color="primary"
            label={`${billsQuery.data?.meta.total ?? 0} expense${(billsQuery.data?.meta.total ?? 0) === 1 ? "" : "s"}`}
          />
        </Stack>
        <CustomTable
          rows={bills}
          columns={columns}
          loading={billsQuery.isFetching}
          getRowId={(row) => row.id}
          density="compact"
          disableRowSelectionOnClick
          paginationMode="server"
          sortingMode="server"
          rowCount={billsQuery.data?.meta.total ?? 0}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          sortModel={sort}
          onSortModelChange={setSort}
          emptyTitle={
            billsQuery.isError ? "Could not load expenses" : "No expenses found"
          }
          emptyDescription={
            billsQuery.isError
              ? "Retry or check your connection."
              : "No expenses match the current filters."
          }
          getRowHeight={() => 64}
          sx={{
            minBlockSize: 520,
            p: 0,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "action.hover",
              borderBottom: 1,
              borderColor: "divider",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.045em",
              textTransform: "uppercase",
            },
            "& .MuiDataGrid-cell": {
              borderColor: "divider",
              display: "flex",
              alignItems: "center !important",
              py: "0 !important",
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: "action.hover",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: 1,
              borderColor: "divider",
              px: 2,
            },
          }}
        />
      </Paper>

      <RecordPaymentDialog
        open={Boolean(paymentTarget)}
        outstanding={paymentTarget?.outstandingAmount ?? 0}
        saving={mutations.recordPayment.isPending}
        onClose={() => setPaymentTarget(null)}
        onSubmit={recordPayment}
      />
      <ReceiptViewerDialog
        open={Boolean(receiptTarget)}
        bill={receiptTarget}
        onClose={() => setReceiptTarget(null)}
      />
      <NewExpenseCategoryDialog
        open={newExpenseOpen}
        onClose={() => setNewExpenseOpen(false)}
      />
      <CustomDialog
        open={Boolean(voidTarget)}
        onClose={() => {
          setVoidTarget(null);
          setVoidReason("");
        }}
        closeAfterTransition
        title="Void Expense"
        description="This reverses the recognition journal. Posted payments must be voided first."
        icon={<i className="bx bx-block" />}
        actions={
          <>
            <Button onClick={() => setVoidTarget(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={
                voidReason.trim().length < 3 || mutations.voidBill.isPending
              }
              onClick={() => {
                if (!voidTarget) return;
                void mutations.voidBill
                  .mutateAsync({ id: voidTarget.id, reason: voidReason })
                  .then(() => {
                    toast.success("Expense voided.");
                    setVoidTarget(null);
                    setVoidReason("");
                  })
                  .catch((error) =>
                    toast.error(getAccountingErrorMessage(error)),
                  );
              }}
            >
              Void Expense
            </Button>
          </>
        }
      >
        <CustomTextField
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          label="Reason"
          sx={{ mt: 3 }}
        />
      </CustomDialog>
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Delete Draft Expense"
        description={
          deleteTarget
            ? `This permanently deletes "${deleteTarget.billReference}" — ${deleteTarget.expenseName}. This cannot be undone.`
            : undefined
        }
        icon={<i className="bx bx-trash" />}
        actions={
          <>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={mutations.deleteBill.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                void removeDraft(deleteTarget);
              }}
            >
              Delete Draft
            </Button>
          </>
        }
      >
        <Box />
      </CustomDialog>
    </Stack>
  );
}
