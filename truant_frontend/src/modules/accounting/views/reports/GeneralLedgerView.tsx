"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomKpiCard from "@components/app/CustomKPICard";
import CustomPageHeader from "@components/app/CustomPageHeader";
import CustomTable from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import PromptUserCard from "@components/app/PromptUserCard";
import PeriodRangeFilter from "@components/app/PeriodRangeFilter";

import { rangeValueForPreset, type DateRangeValue } from "@/utils/dateRange";

import ReportPrintMenu, {
  type ReportExportFormat,
} from "../../components/shared/ReportPrintMenu";
import AccountTransactionsModal from "../../components/general-ledger/AccountTransactionsModal";
import GeneralLedgerPrintableReport from "../../components/general-ledger/GeneralLedgerPrintableReport";
import {
  getGeneralLedgerColumns,
  type GeneralLedgerRow,
} from "../../components/general-ledger/generalLedgerColumns";

import { accountingApi } from "../../api/accountingApi";
import { useAccounts, useGeneralLedger } from "../../hooks/useAccountingApi";
import type { ListParams } from "../../api/types";
import {
  formatDate,
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { downloadReport } from "../../utils/downloadReport";

const GeneralLedgerView = () => {
  const router = useRouter();

  const [range, setRange] = useState<DateRangeValue>(() =>
    rangeValueForPreset("this_month"),
  );
  const { from, to } = range;
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewAccount, setViewAccount] = useState<GeneralLedgerRow | null>(null);
  const initializedAccounts = useRef(false);

  const accountsQuery = useAccounts({
    per_page: 200,
    status: "active",
    is_posting: 1,
  });

  const accounts = accountsQuery.data?.data ?? [];

  useEffect(() => {
    if (initializedAccounts.current || accounts.length === 0) return;

    setSelectedAccountIds(accounts.map((account) => account.id));
    initializedAccounts.current = true;
  }, [accounts]);

  const isValidDateRange =
    new Date(`${from}T00:00:00`) <= new Date(`${to}T00:00:00`);
  const hasSelectedAccounts = selectedAccountIds.length > 0;
  const reportParams = useMemo<ListParams>(
    () => ({
      from,
      to,
      account_ids: selectedAccountIds,
      include_empty: 1,
    }),
    [from, selectedAccountIds, to],
  );

  const report = useGeneralLedger(
    reportParams,
    accounts.length > 0 && hasSelectedAccounts && isValidDateRange,
  );

  const rows = useMemo<GeneralLedgerRow[]>(() => {
    const ledgerAccounts = report.data?.data.accounts ?? [];

    return ledgerAccounts.map((account) => ({
      ...account,
      debitTotal: account.transactions.reduce(
        (sum, tx) => sum + Number(tx.debit),
        0,
      ),
      creditTotal: account.transactions.reduce(
        (sum, tx) => sum + Number(tx.credit),
        0,
      ),
    }));
  }, [report.data]);

  const stats = useMemo(
    () => ({
      accounts: rows.length,
      transactions: rows.reduce((sum, row) => sum + row.transactions.length, 0),
      debit: rows.reduce((sum, row) => sum + row.debitTotal, 0),
      credit: rows.reduce((sum, row) => sum + row.creditTotal, 0),
    }),
    [rows],
  );

  const columns = useMemo(
    () => getGeneralLedgerColumns({ onView: (row) => setViewAccount(row) }),
    [],
  );

  const exportReport = async (format: ReportExportFormat) => {
    if (!hasSelectedAccounts || !isValidDateRange) {
      toast.info("Select accounts and a valid date range before exporting.");

      return;
    }

    try {
      await downloadReport(
        accountingApi.reports.exportUrl("general-ledger", {
          ...reportParams,
          format,
        }),
        `general-ledger-${to}.${format}`,
      );
    } catch (error) {
      toast.error(getAccountingErrorMessage(error, "Export failed."));
    }
  };

  const printLedger = () => {
    if (rows.length === 0 || report.isFetching) {
      toast.info("Wait for the ledger to load before printing.");

      return;
    }

    window.print();
  };

  return (
    <>
      <Stack spacing={5} className="report-screen-only">
        <CustomPageHeader
          title="General Ledger"
          description="Review opening balances, account movement history, and closing balances."
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              color="secondary"
              variant="outlined"
              startIcon={<i className="bx-slider" />}
              onClick={() => setDrawerOpen(true)}
            >
              Filters
            </Button>
            <ReportPrintMenu
              onPrint={printLedger}
              onExport={(format) => void exportReport(format)}
              exportFormats={["xlsx", "csv"]}
              disabled={rows.length === 0 || report.isFetching}
            />
          </Stack>
        </CustomPageHeader>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ width: "100%" }}
        >
          <CustomKpiCard
            icon={<i className="bx-list-ul" style={{ fontSize: 24 }} />}
            iconColor="primary"
            label="Posting accounts shown"
            value={stats.accounts}
            loading={
              accountsQuery.isPending || report.isPending || report.isFetching
            }
          />
          <CustomKpiCard
            icon={
              <i className="bx-down-arrow-circle" style={{ fontSize: 24 }} />
            }
            iconColor="info"
            label="Total Debit"
            value={formatPeso(stats.debit)}
            loading={report.isPending || report.isFetching}
          />
          <CustomKpiCard
            icon={<i className="bx-up-arrow-circle" style={{ fontSize: 24 }} />}
            iconColor="success"
            label="Total Credit"
            value={formatPeso(stats.credit)}
            loading={report.isPending || report.isFetching}
          />
          <CustomKpiCard
            icon={<i className="bx-transfer" style={{ fontSize: 24 }} />}
            iconColor="warning"
            label="Transactions"
            value={stats.transactions}
            loading={report.isPending || report.isFetching}
          />
        </Stack>

        {report.isError && (
          <Alert severity="error">The report could not be loaded.</Alert>
        )}

        {!isValidDateRange && (
          <Alert severity="warning">
            Start date cannot be after the end date. Please adjust the filters.
          </Alert>
        )}

        {!accountsQuery.isPending && accounts.length === 0 ? (
          <PromptUserCard
            icon="bx-book"
            mainText="No accounts yet"
            subText="Create at least one posting account before using the general ledger."
            buttonText="Create Account"
            buttonAction={() => router.push("/accounting/accounts")}
          />
        ) : !hasSelectedAccounts ? (
          <PromptUserCard
            icon="bx-filter-alt"
            mainText="Select accounts"
            subText="Choose at least one posting account to show opening balances, transaction history, and closing balances."
            buttonText="Open Filters"
            buttonAction={() => setDrawerOpen(true)}
          />
        ) : (
          <Paper sx={{ overflow: "hidden" }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ p: 5, pb: 3 }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h6">Account Transactions</Typography>
                <Typography variant="body2" color="text.secondary">
                  {from === to
                    ? `As of ${formatDate(to)}`
                    : `From ${formatDate(from)} to ${formatDate(to)}`}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Includes zero-balance posting accounts.
              </Typography>
            </Stack>

            <CustomTable
              rows={rows}
              loading={report.isPending || report.isFetching}
              columns={columns}
              getRowId={(row) => row.account_id}
              disableRowSelectionOnClick
              getRowHeight={() => "auto"}
              emptyTitle="No ledger activity"
              emptyDescription="No posting accounts match the selected filters."
              sx={{
                minBlockSize: 460,
                pt: 0,
                "& .MuiDataGrid-columnHeaders": {
                  borderTop: "1px solid var(--mui-palette-divider)",
                },
                "& .MuiDataGrid-cell": {
                  alignItems: "center",
                  display: "flex",
                  px: 2,
                },
              }}
            />
          </Paper>
        )}

        <CustomDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={460}
          title="Filter Options"
          subtitle="Configure the date range and accounts."
        >
          <Stack spacing={4} sx={{ p: 5 }}>
            <Typography variant="subtitle2">Date Range</Typography>
            <PeriodRangeFilter
              value={range}
              onChange={setRange}
              orientation="vertical"
            />

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle2">Accounts</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  All
                </Typography>
                <Checkbox
                  size="small"
                  checked={
                    accounts.length > 0 &&
                    selectedAccountIds.length === accounts.length
                  }
                  indeterminate={
                    selectedAccountIds.length > 0 &&
                    selectedAccountIds.length < accounts.length
                  }
                  onChange={() =>
                    setSelectedAccountIds((current) =>
                      current.length === accounts.length
                        ? []
                        : accounts.map((account) => account.id),
                    )
                  }
                />
              </Stack>
            </Stack>
            <Autocomplete
              multiple
              size="small"
              options={accounts}
              disableCloseOnSelect
              limitTags={3}
              getOptionLabel={(account) => `(${account.code}) ${account.name}`}
              isOptionEqualToValue={(account, value) => account.id === value.id}
              value={accounts.filter((account) =>
                selectedAccountIds.includes(account.id),
              )}
              onChange={(_, value) =>
                setSelectedAccountIds(value.map((account) => account.id))
              }
              renderInput={(params) => (
                <CustomTextField {...params} placeholder="All accounts" />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              Select the posting accounts that should appear in the ledger.
            </Typography>

            <Button variant="contained" onClick={() => setDrawerOpen(false)}>
              Done
            </Button>
          </Stack>
        </CustomDrawer>

        <AccountTransactionsModal
          account={viewAccount}
          open={Boolean(viewAccount)}
          onClose={() => setViewAccount(null)}
        />
      </Stack>

      <GeneralLedgerPrintableReport
        rows={rows}
        from={from}
        to={to}
        debitTotal={stats.debit}
        creditTotal={stats.credit}
      />
    </>
  );
};

export default GeneralLedgerView;
