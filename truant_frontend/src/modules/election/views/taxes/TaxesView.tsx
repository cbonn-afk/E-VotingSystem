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
import TaxFormDrawer from "@/modules/accounting/components/taxes/TaxFormDrawer";
import { getTaxColumns } from "@/modules/accounting/components/taxes/taxColumns";

import {
  useCreateTax,
  useDeleteTax,
  useTaxes,
  useUpdateTax,
} from "@/modules/accounting/hooks/useAccountingApi";
import type {
  RecordStatus,
  TaxPayload,
  TaxResource,
} from "@/modules/accounting/api/types";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

const TaxesView = () => {
  const authorization = useAuthorization();
  const canManage = authorization.can("accounting.settings.manage");

  const taxesQuery = useTaxes({ per_page: 100 });
  const createTax = useCreateTax();
  const updateTax = useUpdateTax();
  const deleteTax = useDeleteTax();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecordStatus | "">("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TaxResource | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaxResource | null>(null);

  const rows = taxesQuery.data?.data ?? [];
  const isSaving = createTax.isPending || updateTax.isPending;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        (row.code ?? "").toLowerCase().includes(term);
      const matchesStatus = !status || row.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, status]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (tax: TaxResource) => {
    setEditing(tax);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (isSaving) return;
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: TaxPayload) => {
    if (editing) {
      await updateTax.mutateAsync({ id: editing.id, payload });
    } else {
      await createTax.mutateAsync(payload);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await deleteTax.mutateAsync(pendingDelete.id);
      toast.success("Tax deleted.");
      setPendingDelete(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The tax could not be deleted."),
      );
    }
  };

  const columns = useMemo(
    () =>
      getTaxColumns({
        onEdit: (row) => openEdit(row),
        onDelete: (row) => setPendingDelete(row),
        canManage,
      }),
    [canManage],
  );

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title="Taxes"
        description="Tax rates available for journal lines."
      >
        <Can permission="accounting.settings.manage">
          <Button
            variant="contained"
            startIcon={<i className="bx-plus" />}
            onClick={openCreate}
          >
            Add Tax
          </Button>
        </Can>
      </AccountingPageHeader>

      <Paper className="p-5">
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <CustomTextField
            fullWidth
            placeholder="Search name or code"
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
          loading={taxesQuery.isPending}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          emptyTitle="No taxes"
          emptyDescription="Add a tax rate to use on journal lines."
          sx={{ minBlockSize: 420 }}
        />
      </Paper>

      <TaxFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editing}
        isSubmitting={isSaving}
        onSubmit={handleSubmit}
      />

      <CustomDialog
        open={Boolean(pendingDelete)}
        onClose={
          deleteTax.isPending ? () => undefined : () => setPendingDelete(null)
        }
        closeAfterTransition
        width="440px"
        title="Delete Tax"
        icon={<i className="bx bx-trash text-error" />}
        description={pendingDelete ? pendingDelete.name : ""}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={deleteTax.isPending}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleteTax.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteTax.isPending ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Alert severity="warning">
            <AlertTitle>Confirm deletion</AlertTitle>
            Taxes already used on entries cannot be deleted — deactivate them
            instead.
          </Alert>
        </Stack>
      </CustomDialog>
    </Stack>
  );
};

export default TaxesView;
