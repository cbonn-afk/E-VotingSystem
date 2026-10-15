"use client";

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";

import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomTable from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import TransactionSeriesFormDrawer from "@/modules/accounting/components/transaction-series/TransactionSeriesFormDrawer";
import { getTransactionSeriesColumns } from "@/modules/accounting/components/transaction-series/transactionSeriesColumns";

import {
  useCreateTransactionSeries,
  useDeleteTransactionSeries,
  useTransactionSeries,
  useUpdateTransactionSeries,
} from "@/modules/accounting/hooks/useAccountingApi";
import type {
  RecordStatus,
  TransactionSeriesPayload,
  TransactionSeriesResource,
} from "@/modules/accounting/api/types";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

const TransactionSeriesView = () => {
  const authorization = useAuthorization();
  const canManage = authorization.can("accounting.settings.manage");

  const query = useTransactionSeries({ per_page: 100 });
  const createSeries = useCreateTransactionSeries();
  const updateSeries = useUpdateTransactionSeries();
  const deleteSeries = useDeleteTransactionSeries();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecordStatus | "">("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionSeriesResource | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] =
    useState<TransactionSeriesResource | null>(null);

  const rows = query.data?.data ?? [];
  const isSaving = createSeries.isPending || updateSeries.isPending;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.prefix.toLowerCase().includes(term);
      const matchesStatus = !status || row.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, status]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: TransactionSeriesResource) => {
    setEditing(record);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (isSaving) return;
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: TransactionSeriesPayload) => {
    if (editing) {
      await updateSeries.mutateAsync({ id: editing.id, payload });
    } else {
      await createSeries.mutateAsync(payload);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await deleteSeries.mutateAsync(pendingDelete.id);
      toast.success("Series deleted.");
      setPendingDelete(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The series could not be deleted."),
      );
    }
  };

  const columns = useMemo(
    () =>
      getTransactionSeriesColumns({
        onEdit: (row) => openEdit(row),
        onDelete: (row) => setPendingDelete(row),
        canManage,
      }),
    [canManage],
  );

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title="Transaction Series"
        description="Numbering series used to allocate journal entry numbers."
      >
        <Can permission="accounting.settings.manage">
          <Button
            variant="contained"
            startIcon={<i className="bx-plus" />}
            onClick={openCreate}
          >
            Add Series
          </Button>
        </Can>
      </AccountingPageHeader>

      <Paper className="p-5">
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <CustomTextField
            fullWidth
            placeholder="Search name or prefix"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="bx-search" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as RecordStatus | "")
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper>
        <CustomTable
          rows={filtered}
          loading={query.isPending}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          emptyTitle="No transaction series"
          emptyDescription="Add a numbering series to get started."
          sx={{ minBlockSize: 420 }}
        />
      </Paper>

      <TransactionSeriesFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editing}
        isSubmitting={isSaving}
        onSubmit={handleSubmit}
      />

      <CustomDialog
        open={Boolean(pendingDelete)}
        onClose={
          deleteSeries.isPending
            ? () => undefined
            : () => setPendingDelete(null)
        }
        closeAfterTransition
        width="440px"
        title="Delete Series"
        icon={<i className="bx bx-trash text-error" />}
        description={pendingDelete ? pendingDelete.name : ""}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={deleteSeries.isPending}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleteSeries.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteSeries.isPending ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Alert severity="warning">
            <AlertTitle>Confirm deletion</AlertTitle>
            Series already used by journal entries cannot be deleted —
            deactivate them instead.
          </Alert>
        </Stack>
      </CustomDialog>
    </Stack>
  );
};

export default TransactionSeriesView;
