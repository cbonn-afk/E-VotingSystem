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
import FundSourceFormDrawer from "@/modules/accounting/components/fund-sources/FundSourceFormDrawer";
import { getFundSourceColumns } from "@/modules/accounting/components/fund-sources/fundSourceColumns";

import {
  useCreateFundSource,
  useDeleteFundSource,
  useFundSources,
  useUpdateFundSource,
} from "@/modules/accounting/hooks/useAccountingApi";
import type {
  FundSourcePayload,
  FundSourceResource,
  RecordStatus,
} from "@/modules/accounting/api/types";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

const FundSourcesView = () => {
  const authorization = useAuthorization();
  const canManage = authorization.can("accounting.settings.manage");

  const fundSourcesQuery = useFundSources({ per_page: 100 });
  const createFundSource = useCreateFundSource();
  const updateFundSource = useUpdateFundSource();
  const deleteFundSource = useDeleteFundSource();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecordStatus | "">("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FundSourceResource | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FundSourceResource | null>(
    null,
  );

  const rows = fundSourcesQuery.data?.data ?? [];
  const isSaving = createFundSource.isPending || updateFundSource.isPending;

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

  const openEdit = (fundSource: FundSourceResource) => {
    setEditing(fundSource);
    setDrawerOpen(true);
  };

  const requestDelete = (fundSource: FundSourceResource) => {
    if (fundSource.isUsed) {
      toast.info(
        "This fund source is already used on journal entries. Deactivate it instead.",
      );

      return;
    }

    setPendingDelete(fundSource);
  };

  const closeDrawer = () => {
    if (isSaving) return;
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: FundSourcePayload) => {
    if (editing) {
      await updateFundSource.mutateAsync({ id: editing.id, payload });
    } else {
      await createFundSource.mutateAsync(payload);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.isUsed) {
      toast.info(
        "This fund source is already used on journal entries. Deactivate it instead.",
      );
      setPendingDelete(null);

      return;
    }

    try {
      await deleteFundSource.mutateAsync(pendingDelete.id);
      toast.success("Fund source deleted.");
      setPendingDelete(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(
          error,
          "The fund source could not be deleted.",
        ),
      );
    }
  };

  const columns = useMemo(
    () =>
      getFundSourceColumns({
        onEdit: (row) => openEdit(row),
        onDelete: (row) => requestDelete(row),
        canManage,
      }),
    [canManage],
  );

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title="Fund Sources"
        description="Sources of funds that can be tagged on journal entries."
      >
        <Can permission="accounting.settings.manage">
          <Button
            variant="contained"
            startIcon={<i className="bx-plus" />}
            onClick={openCreate}
          >
            Add Fund Source
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
          loading={fundSourcesQuery.isPending}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          emptyTitle="No fund sources"
          emptyDescription="Add a fund source to tag on journal entries."
          sx={{ minBlockSize: 420 }}
        />
      </Paper>

      <FundSourceFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editing}
        isSubmitting={isSaving}
        onSubmit={handleSubmit}
      />

      <CustomDialog
        open={Boolean(pendingDelete)}
        onClose={
          deleteFundSource.isPending
            ? () => undefined
            : () => setPendingDelete(null)
        }
        closeAfterTransition
        width="440px"
        title="Delete Fund Source"
        icon={<i className="bx bx-trash text-error" />}
        description={pendingDelete ? pendingDelete.name : ""}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={deleteFundSource.isPending}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleteFundSource.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteFundSource.isPending ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Alert severity="warning">
            <AlertTitle>Confirm deletion</AlertTitle>
            Fund sources already used on entries cannot be deleted — deactivate
            them instead.
          </Alert>
        </Stack>
      </CustomDialog>
    </Stack>
  );
};

export default FundSourcesView;
