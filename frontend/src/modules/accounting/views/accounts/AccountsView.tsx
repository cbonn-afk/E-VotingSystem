"use client";

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import CustomTable, {
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import AccountDetailsDialog from "@/modules/accounting/components/accounts/AccountDetailsDialog";
import AccountFormDrawer from "@/modules/accounting/components/accounts/AccountFormDrawer";
import AccountsHeaderStats from "@/modules/accounting/components/accounts/AccountsHeaderStats";
import AccountsToolbar, {
  type PostingFilter,
} from "@/modules/accounting/components/accounts/AccountsToolbar";
import AccountsTree from "@/modules/accounting/components/accounts/AccountsTree";
import { getAccountColumns } from "@/modules/accounting/components/accounts/accountColumns";
import { flattenAccountTree } from "@/modules/accounting/components/accounts/accountsShared";

import {
  useAccountStats,
  useAccounts,
  useAccountsTree,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/modules/accounting/hooks/useAccountingApi";
import type {
  AccountPayload,
  AccountResource,
  AccountTypeValue,
  RecordStatus,
} from "@/modules/accounting/api/types";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

type ViewMode = "table" | "tree";

const AccountsView = () => {
  const authorization = useAuthorization();
  const canManage = authorization.can("accounting.accounts.manage");
  const canDelete = authorization.isSuperAdmin;

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AccountTypeValue | "">("");
  const [status, setStatus] = useState<RecordStatus | "">("");
  const [posting, setPosting] = useState<PostingFilter>("");
  const [paginationModel, setPaginationModel] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AccountResource | null>(null);
  const [viewing, setViewing] = useState<AccountResource | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AccountResource | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search, 400);

  const filters = {
    search: debouncedSearch.trim() || undefined,
    type: type || undefined,
    status: status || undefined,
    is_posting: posting === "" ? undefined : Number(posting),
  };

  const statsQuery = useAccountStats();
  const accountsQuery = useAccounts({
    ...filters,
    page: paginationModel.page + 1,
    per_page: paginationModel.pageSize,
  });
  const treeQuery = useAccountsTree(filters, viewMode === "tree");
  const parentTreeQuery = useAccountsTree({}, drawerOpen);

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const isSaving = createAccount.isPending || updateAccount.isPending;

  const rows = accountsQuery.data?.data ?? [];
  const rowCount = accountsQuery.data?.meta.total ?? 0;
  const treeNodes = treeQuery.data?.data ?? [];

  const parentOptions = useMemo(
    () => flattenAccountTree(parentTreeQuery.data?.data ?? []),
    [parentTreeQuery.data],
  );

  const resetPage = () =>
    setPaginationModel((current) => ({ ...current, page: 0 }));

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (account: AccountResource) => {
    setEditing(account);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (isSaving) return;
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: AccountPayload) => {
    if (editing) {
      await updateAccount.mutateAsync({ id: editing.id, payload });
    } else {
      await createAccount.mutateAsync(payload);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await deleteAccount.mutateAsync(pendingDelete.id);
      toast.success(`${pendingDelete.code} deleted.`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The account could not be deleted."),
      );
    }
  };

  const columns = useMemo(
    () =>
      getAccountColumns({
        onView: (row) => setViewing(row),
        onEdit: (row) => openEdit(row),
        onDelete: (row) => setPendingDelete(row),
        canManage,
        canDelete,
      }),
    [canManage, canDelete],
  );

  return (
    <Stack spacing={5}>
      <CustomPageHeader
        title="Chart of Accounts"
        description="Manage your account structure."
      >
        <AccountsHeaderStats
          stats={statsQuery.data?.data}
          loading={statsQuery.isPending}
          error={statsQuery.isError ? "Could not load stats." : null}
        />
      </CustomPageHeader>

      {accountsQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => accountsQuery.refetch()}
            >
              Retry
            </Button>
          }
        >
          Accounts could not be loaded.
        </Alert>
      )}

      <AccountsToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          resetPage();
        }}
        type={type}
        onTypeChange={(value) => {
          setType(value);
          resetPage();
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          resetPage();
        }}
        posting={posting}
        onPostingChange={(value) => {
          setPosting(value);
          resetPage();
        }}
        onCreate={openCreate}
        canCreate={canManage}
      />

      <Paper>
        <Tabs
          value={viewMode}
          onChange={(_, value: ViewMode) => setViewMode(value)}
          sx={{ px: 4, pt: 2 }}
        >
          <Tab
            icon={<i className="bx-table" />}
            iconPosition="start"
            label="Table View"
            value="table"
          />
          <Tab
            icon={<i className="bx-sitemap" />}
            iconPosition="start"
            label="Tree View"
            value="tree"
          />
        </Tabs>

        {viewMode === "table" ? (
          <CustomTable
            rows={rows}
            loading={accountsQuery.isPending || accountsQuery.isFetching}
            columns={columns}
            getRowId={(row) => row.id}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
            emptyTitle="No accounts found"
            emptyDescription="Add an account or adjust your filters."
            sx={{ minBlockSize: 480 }}
          />
        ) : (
          <AccountsTree
            nodes={treeNodes}
            loading={treeQuery.isPending || treeQuery.isFetching}
            onView={(node) => setViewing(node)}
            onEdit={(node) => openEdit(node)}
            onDelete={(node) => setPendingDelete(node)}
            canManage={canManage}
            canDelete={canDelete}
          />
        )}
      </Paper>

      <AccountFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editing}
        parentOptions={parentOptions}
        isSubmitting={isSaving}
        onSubmit={handleSubmit}
      />

      <AccountDetailsDialog
        account={viewing}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
      />

      <CustomDialog
        open={Boolean(pendingDelete)}
        onClose={
          deleteAccount.isPending
            ? () => undefined
            : () => setPendingDelete(null)
        }
        closeAfterTransition
        width="460px"
        title="Delete Account"
        icon={<i className="bx bx-trash text-error" />}
        description={
          pendingDelete ? `${pendingDelete.code} — ${pendingDelete.name}` : ""
        }
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={deleteAccount.isPending}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleteAccount.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteAccount.isPending ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Alert severity="warning">
            <AlertTitle>Confirm deletion</AlertTitle>
            Accounts with posted journal lines cannot be deleted — deactivate
            them instead.
          </Alert>
        </Stack>
      </CustomDialog>
    </Stack>
  );
};

export default AccountsView;
