"use client";

import { useEffect, useMemo, useState } from "react";

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import CustomTable from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import FiscalYearFormDrawer from "@/modules/accounting/components/periods/FiscalYearFormDrawer";
import FiscalYearSettingsDialog from "@/modules/accounting/components/periods/FiscalYearSettingsDialog";
import PeriodSettingsDialog from "@/modules/accounting/components/periods/PeriodSettingsDialog";
import PeriodsKpi from "@/modules/accounting/components/periods/PeriodsKpi";
import PeriodsTableActions, {
  type PeriodsViewMode,
} from "@/modules/accounting/components/periods/PeriodsTableActions";
import { getFiscalYearColumns } from "@/modules/accounting/components/periods/fiscalYearColumns";
import { getPeriodColumns } from "@/modules/accounting/components/periods/periodColumns";

import {
  useCreateFiscalYear,
  useDeleteFiscalYear,
  useFiscalYears,
  usePeriods,
  useUpdateFiscalYear,
  useUpdatePeriodStatus,
} from "@/modules/accounting/hooks/useAccountingApi";
import type {
  AccountingPeriodResource,
  FiscalYearPayload,
  FiscalYearResource,
  FiscalYearStatus,
  FiscalYearUpdatePayload,
  PeriodStatus,
} from "@/modules/accounting/api/types";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

const PeriodsView = () => {
  const authorization = useAuthorization();
  const canManage = authorization.can("accounting.periods.manage");

  const [viewMode, setViewMode] = useState<PeriodsViewMode>("period");
  const [search, setSearch] = useState("");
  const [periodStatus, setPeriodStatus] = useState<PeriodStatus | "">("");
  const [fiscalStatus, setFiscalStatus] = useState<FiscalYearStatus | "">("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [periodSettings, setPeriodSettings] =
    useState<AccountingPeriodResource | null>(null);
  const [fiscalYearSettings, setFiscalYearSettings] =
    useState<FiscalYearResource | null>(null);
  const [fiscalYearToDelete, setFiscalYearToDelete] =
    useState<FiscalYearResource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const fiscalYearsQuery = useFiscalYears({ per_page: 100 });
  const periodsQuery = usePeriods(
    selectedFiscalYearId ? { fiscal_year_id: selectedFiscalYearId } : {},
  );

  const createFiscalYear = useCreateFiscalYear();
  const updateFiscalYear = useUpdateFiscalYear();
  const deleteFiscalYear = useDeleteFiscalYear();
  const updatePeriodStatus = useUpdatePeriodStatus();

  const fiscalYears = fiscalYearsQuery.data?.data ?? [];
  const periods = periodsQuery.data?.data ?? [];
  const currentFiscalYear = fiscalYears.find((year) => year.isCurrent) ?? null;

  // Default the period-tab selector to the current fiscal year once loaded.
  useEffect(() => {
    if (fiscalYears.length === 0) return;
    if (fiscalYears.some((year) => year.id === selectedFiscalYearId)) return;

    setSelectedFiscalYearId(currentFiscalYear?.id ?? fiscalYears[0]?.id ?? "");
  }, [fiscalYears, currentFiscalYear, selectedFiscalYearId]);

  const filteredPeriods = useMemo(() => {
    const term = search.trim().toLowerCase();

    return periods.filter((period) => {
      const matchesSearch =
        !term ||
        period.name.toLowerCase().includes(term) ||
        String(period.periodNumber).includes(term);
      const matchesStatus = !periodStatus || period.status === periodStatus;

      return matchesSearch && matchesStatus;
    });
  }, [periods, search, periodStatus]);

  const filteredFiscalYears = useMemo(() => {
    const term = search.trim().toLowerCase();

    return fiscalYears.filter((year) => {
      const matchesSearch =
        !term ||
        year.code.toLowerCase().includes(term) ||
        year.name.toLowerCase().includes(term);
      const matchesStatus = !fiscalStatus || year.status === fiscalStatus;

      return matchesSearch && matchesStatus;
    });
  }, [fiscalYears, search, fiscalStatus]);

  const periodColumns = useMemo(
    () =>
      getPeriodColumns({
        onSettings: (row) => setPeriodSettings(row),
        canManage,
      }),
    [canManage],
  );

  const fiscalYearColumns = useMemo(
    () =>
      getFiscalYearColumns({
        onEdit: (row) => setFiscalYearSettings(row),
        onDelete: (row) => {
          setFiscalYearToDelete(row);
          setDeleteConfirm("");
        },
        canManage,
        canDelete: canManage,
      }),
    [canManage],
  );

  const handleCreate = async (payload: FiscalYearPayload) => {
    await createFiscalYear.mutateAsync(payload);
  };

  const handlePeriodStatusSave = async (status: PeriodStatus) => {
    if (!periodSettings) return;

    try {
      await updatePeriodStatus.mutateAsync({ id: periodSettings.id, status });
      toast.success(`Period ${status}.`);
      setPeriodSettings(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The period could not be updated."),
      );
    }
  };

  const handleFiscalYearSave = async (payload: FiscalYearUpdatePayload) => {
    if (!fiscalYearSettings) return;

    try {
      await updateFiscalYear.mutateAsync({
        id: fiscalYearSettings.id,
        payload,
      });
      toast.success("Fiscal year updated.");
      setFiscalYearSettings(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The fiscal year could not be saved."),
      );
    }
  };

  const handleDeleteFiscalYear = async () => {
    if (!fiscalYearToDelete) return;

    try {
      await deleteFiscalYear.mutateAsync(fiscalYearToDelete.id);
      toast.success("Fiscal year deleted.");
      setFiscalYearToDelete(null);
      setDeleteConfirm("");
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(
          error,
          "The fiscal year could not be deleted.",
        ),
      );
    }
  };

  return (
    <Stack spacing={5}>
      <CustomPageHeader
        title="Period Management"
        description="Manage your fiscal years and accounting periods."
      >
        <PeriodsKpi
          currentFiscalYear={currentFiscalYear}
          periods={periods}
          loading={fiscalYearsQuery.isPending || periodsQuery.isPending}
        />
      </CustomPageHeader>

      <PeriodsTableActions
        viewMode={viewMode}
        search={search}
        onSearchChange={setSearch}
        fiscalYearOptions={fiscalYears}
        selectedFiscalYearId={selectedFiscalYearId}
        onFiscalYearChange={setSelectedFiscalYearId}
        periodStatus={periodStatus}
        onPeriodStatusChange={setPeriodStatus}
        fiscalStatus={fiscalStatus}
        onFiscalStatusChange={setFiscalStatus}
        onCreate={() => setDrawerOpen(true)}
        canCreate={canManage}
      />

      <Paper>
        <Tabs
          value={viewMode}
          onChange={(_, value: PeriodsViewMode) => {
            setViewMode(value);
            setSearch("");
          }}
          sx={{ px: 4, pt: 2 }}
        >
          <Tab
            icon={<i className="bx-data" />}
            iconPosition="start"
            label="Period"
            value="period"
          />
          <Tab
            icon={<i className="bx-layer" />}
            iconPosition="start"
            label="Fiscal Years"
            value="fiscal_year"
          />
        </Tabs>

        {viewMode === "period" ? (
          <CustomTable
            rows={filteredPeriods}
            loading={periodsQuery.isPending || periodsQuery.isFetching}
            columns={periodColumns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            emptyTitle="No periods"
            emptyDescription="Select a fiscal year to view its periods."
            sx={{ minBlockSize: 420 }}
          />
        ) : (
          <CustomTable
            rows={filteredFiscalYears}
            loading={fiscalYearsQuery.isPending || fiscalYearsQuery.isFetching}
            columns={fiscalYearColumns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            emptyTitle="No fiscal years"
            emptyDescription="Create a fiscal year to generate periods."
            sx={{ minBlockSize: 420 }}
          />
        )}
      </Paper>

      <FiscalYearFormDrawer
        open={drawerOpen}
        onClose={() => {
          if (createFiscalYear.isPending) return;
          setDrawerOpen(false);
        }}
        isSubmitting={createFiscalYear.isPending}
        onSubmit={handleCreate}
      />

      <PeriodSettingsDialog
        period={periodSettings}
        open={Boolean(periodSettings)}
        onClose={() => {
          if (updatePeriodStatus.isPending) return;
          setPeriodSettings(null);
        }}
        onSubmit={handlePeriodStatusSave}
        submitting={updatePeriodStatus.isPending}
      />

      <FiscalYearSettingsDialog
        fiscalYear={fiscalYearSettings}
        open={Boolean(fiscalYearSettings)}
        onClose={() => {
          if (updateFiscalYear.isPending) return;
          setFiscalYearSettings(null);
        }}
        onSubmit={handleFiscalYearSave}
        submitting={updateFiscalYear.isPending}
      />

      <CustomDialog
        open={Boolean(fiscalYearToDelete)}
        onClose={
          deleteFiscalYear.isPending
            ? () => undefined
            : () => setFiscalYearToDelete(null)
        }
        closeAfterTransition
        width="500px"
        title="Delete Fiscal Year"
        icon={<i className="bx bx-trash text-error" />}
        description={
          fiscalYearToDelete
            ? `${fiscalYearToDelete.code} — ${fiscalYearToDelete.name}`
            : ""
        }
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={deleteFiscalYear.isPending}
              onClick={() => setFiscalYearToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={
                deleteConfirm.trim() !== "delete" || deleteFiscalYear.isPending
              }
              onClick={() => void handleDeleteFiscalYear()}
            >
              {deleteFiscalYear.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </>
        }
      >
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="body2" color="warning.main">
            This is a cascade delete — all accounting periods under this fiscal
            year will also be permanently deleted. Fiscal years with posted
            entries or the current year cannot be deleted.
          </Typography>
          <Typography variant="body2">
            Type <strong>delete</strong> below to confirm.
          </Typography>
          <CustomTextField
            fullWidth
            placeholder="Type delete"
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            disabled={deleteFiscalYear.isPending}
          />
        </Stack>
      </CustomDialog>
    </Stack>
  );
};

export default PeriodsView;
