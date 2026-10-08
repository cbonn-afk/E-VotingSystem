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
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomKPICard from "@components/app/CustomKPICard";
import CustomTable, {
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import type { VendorResource } from "@/modules/accounting/api/types";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import VendorFormDrawer from "@/modules/accounting/components/vendors/VendorFormDrawer";
import { getVendorColumns } from "@/modules/accounting/components/vendors/vendorColumns";
import {
  useVendorMutations,
  useVendors,
} from "@/modules/accounting/hooks/useVendorsApi";
import type { VendorFormValues } from "@/modules/accounting/schemas/accountingSchemas";
import {
  formatPeso,
  getAccountingErrorMessage,
} from "@/modules/accounting/utils/accountingFormat";

const kpiGrid = {
  display: "grid",
  gap: 4,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
} as const;

export default function VendorsView() {
  const authorization = useAuthorization();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({
    page: 0,
    pageSize: 30,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<VendorResource | null>(null);
  const [statusTarget, setStatusTarget] = useState<VendorResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorResource | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const query = useVendors({
    search: debouncedSearch || undefined,
    status,
    page: pagination.page + 1,
    per_page: pagination.pageSize,
  });
  const mutations = useVendorMutations();
  const vendors = query.data?.data ?? [];

  useEffect(() => {
    setPagination((current) =>
      current.page === 0 ? current : { ...current, page: 0 },
    );
  }, [debouncedSearch, status]);
  const totals = useMemo(
    () => ({
      outstanding: vendors.reduce(
        (sum, vendor) => sum + vendor.totalOutstanding,
        0,
      ),
      open: vendors.reduce((sum, vendor) => sum + vendor.openBills, 0),
      paid: vendors.reduce((sum, vendor) => sum + vendor.totalPaid, 0),
    }),
    [vendors],
  );

  const columns = useMemo(
    () =>
      getVendorColumns({
        canDelete: authorization.can("accounting.vendors.deactivate"),
        canEdit: authorization.can("accounting.vendors.update"),
        canToggleStatus: authorization.canAll([
          "accounting.vendors.update",
          "accounting.vendors.deactivate",
        ]),
        onDelete: setDeleteTarget,
        onEdit: (vendor) => {
          setEditing(vendor);
          setDrawerOpen(true);
        },
        onToggleStatus: setStatusTarget,
      }),
    [authorization],
  );

  const save = async (values: VendorFormValues) => {
    const payload = {
      name: values.name,
      legal_name: values.legalName || null,
      tin: values.tin || null,
      contact_person: values.contactPerson || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      default_payable_account_id: values.defaultPayableAccountId || null,
      notes: values.notes || null,
      status: values.status,
    };
    try {
      if (editing)
        await mutations.update.mutateAsync({ id: editing.id, payload });
      else await mutations.create.mutateAsync(payload);
      toast.success(editing ? "Vendor updated." : "Vendor created.");
      setDrawerOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "Vendor could not be saved."),
      );
    }
  };

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title="Vendors"
        description="People and businesses Truant owes, with balances computed from posted bills and payments."
      >
        {authorization.can("accounting.vendors.create") && (
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            New Vendor
          </Button>
        )}
      </AccountingPageHeader>
      <Box sx={kpiGrid}>
        <CustomKPICard
          label="Vendors Found"
          value={String(query.data?.meta.total ?? 0)}
          loading={query.isLoading}
          iconString="bx bx-building-house"
          iconColor="primary"
        />
        <CustomKPICard
          label="Outstanding"
          value={formatPeso(totals.outstanding)}
          loading={query.isLoading}
          iconString="bx bx-wallet"
          iconColor="warning"
        />
        <CustomKPICard
          label="Open Bills"
          value={String(totals.open)}
          loading={query.isLoading}
          iconString="bx bx-receipt"
          iconColor="info"
        />
        <CustomKPICard
          label="Total Paid"
          value={formatPeso(totals.paid)}
          loading={query.isLoading}
          iconString="bx bx-check-circle"
          iconColor="success"
        />
      </Box>
      <Paper sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Filter Vendors</Typography>
            <Typography variant="caption" color="text.secondary">
              Find vendors by name, number, TIN, contact, or status.
            </Typography>
          </Stack>
          <Button
            color="secondary"
            startIcon={<i className="bx bx-reset" />}
            onClick={() => {
              setSearch("");
              setStatus("");
            }}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
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
              sm: "minmax(280px, 520px) minmax(160px, 220px)",
            },
            justifyContent: "flex-start",
          }}
        >
          <CustomTextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            label="Search vendors"
            placeholder="Name, number, TIN, contact"
          />
          <CustomTextField
            select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            size="small"
            label="Vendor status"
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="active">Active vendors</MenuItem>
            <MenuItem value="inactive">Inactive vendors</MenuItem>
          </CustomTextField>
        </Box>
      </Paper>

      {query.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        >
          {getAccountingErrorMessage(
            query.error,
            "Vendors could not be loaded. No accounting data was changed.",
          )}
        </Alert>
      )}

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Vendor Register</Typography>
            <Typography variant="caption" color="text.secondary">
              Vendor profiles, payable accounts, and payment activity.
            </Typography>
          </Stack>
          <Chip
            size="small"
            variant="tonal"
            color="primary"
            label={`${query.data?.meta.total ?? 0} vendor${(query.data?.meta.total ?? 0) === 1 ? "" : "s"}`}
          />
        </Stack>
        <CustomTable
          rows={vendors}
          columns={columns}
          getRowId={(row) => row.id}
          loading={query.isFetching}
          disableRowSelectionOnClick
          density="compact"
          paginationMode="server"
          rowCount={query.data?.meta.total ?? 0}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          emptyTitle={
            query.isError ? "Could not load vendors" : "No vendors found"
          }
          emptyDescription={
            query.isError
              ? "Retry or check your connection."
              : "Create a vendor or adjust the filters."
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
      <VendorFormDrawer
        open={drawerOpen}
        vendor={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
      <CustomDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        closeAfterTransition
        title={
          statusTarget?.status === "active"
            ? "Deactivate Vendor"
            : "Activate Vendor"
        }
        description={
          statusTarget
            ? `${statusTarget.status === "active" ? "Deactivate" : "Activate"} ${statusTarget.name}?`
            : undefined
        }
        actions={
          <>
            <Button onClick={() => setStatusTarget(null)}>Cancel</Button>
            <Button
              variant="contained"
              color={statusTarget?.status === "active" ? "warning" : "success"}
              onClick={() => {
                if (!statusTarget) return;
                void mutations.update
                  .mutateAsync({
                    id: statusTarget.id,
                    payload: {
                      status:
                        statusTarget.status === "active"
                          ? "inactive"
                          : "active",
                    },
                  })
                  .then(() => {
                    toast.success("Vendor status updated.");
                    setStatusTarget(null);
                  })
                  .catch((error) =>
                    toast.error(getAccountingErrorMessage(error)),
                  );
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          Inactive vendors remain visible on historical bills but cannot be
          selected for new ones.
        </Typography>
      </CustomDialog>
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Delete Vendor"
        description={
          deleteTarget?.canDelete
            ? `Permanently remove ${deleteTarget.name}?`
            : `${deleteTarget?.name} has bill history and cannot be deleted.`
        }
        actions={
          <>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            {deleteTarget?.canDelete && (
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  if (!deleteTarget) return;
                  void mutations.remove
                    .mutateAsync(deleteTarget.id)
                    .then(() => {
                      toast.success("Vendor deleted.");
                      setDeleteTarget(null);
                    })
                    .catch((error) =>
                      toast.error(getAccountingErrorMessage(error)),
                    );
                }}
              >
                Delete
              </Button>
            )}
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          {deleteTarget?.canDelete
            ? "This action cannot be undone."
            : "Deactivate the vendor instead to preserve the accounting trail."}
        </Typography>
      </CustomDialog>
    </Stack>
  );
}
