"use client";

import { useDeferredValue, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomKpiCard from "@components/app/CustomKPICard";
import PeriodRangeFilter from "@components/app/PeriodRangeFilter";
import CustomTextField from "@core/components/mui/TextField";
import AccountingPageHeader from "../../components/shared/AccountingPageHeader";
import IncomeExpenseReportPrintable from "../../components/reports/IncomeExpenseReportPrintable";
import IncomeExpenseReportSummary from "../../components/reports/IncomeExpenseReportSummary";
import IncomeExpenseReportTable, {
  type IncomeExpenseSection,
} from "../../components/reports/IncomeExpenseReportTable";
import IncomeDocumentsDialog from "../../components/reports/IncomeDocumentsDialog";
import ReportPrintMenu, {
  type ReportExportFormat,
} from "../../components/shared/ReportPrintMenu";
import { accountingApi } from "../../api/accountingApi";
import type {
  IncomeExpenseIncomeRow,
  IncomeExpensePaymentStatus,
} from "../../api/types";
import { useIncomeExpenseReport } from "../../hooks/useAccountingApi";
import {
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { downloadReport } from "../../utils/downloadReport";
import { rangeValueForPreset, type DateRangeValue } from "@/utils/dateRange";

type SectionFilter = "all" | IncomeExpenseSection;
type PaymentFilter = "all" | IncomeExpensePaymentStatus;

const tabs: Array<{
  value: SectionFilter;
  label: string;
  icon: string;
}> = [
  { value: "all", label: "All Activity", icon: "bx-grid-alt" },
  { value: "income", label: "Income", icon: "bx-trending-up" },
  { value: "bills", label: "Bills", icon: "bx-receipt" },
  { value: "payroll", label: "Payroll", icon: "bx-group" },
  { value: "expenses", label: "Expenses", icon: "bx-wallet" },
];

const IncomeExpenseReportView = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    rangeValueForPreset("this_month"),
  );
  const [section, setSection] = useState<SectionFilter>("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIncome, setSelectedIncome] =
    useState<IncomeExpenseIncomeRow | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const { from, to } = range;

  const report = useIncomeExpenseReport({
    from,
    to,
    section,
    payment_status: paymentStatus,
    search: deferredSearch || undefined,
  });
  const data = report.data?.data;
  const netPositive = data ? Number(data.summary.net_sales) >= 0 : true;

  const exportReport = async (format: ReportExportFormat) => {
    try {
      await downloadReport(
        accountingApi.reports.exportUrl("income-expenses", {
          from,
          to,
          section,
          payment_status: paymentStatus,
          search: deferredSearch || undefined,
          format,
        }),
        `operating-summary-${from}_${to}.${format}`,
      );
    } catch (error) {
      toast.error(getAccountingErrorMessage(error, "Export failed."));
    }
  };

  const handleSectionChange = (value: SectionFilter) => {
    setSection(value);
    if (value === "payroll") setPaymentStatus("all");
  };

  return (
    <>
      <Stack spacing={5} className="report-screen-only">
        <AccountingPageHeader
          title="Operating Summary"
          description="A document-level view of sales, receivables, bills, payroll, and direct expenses for the selected period."
        >
          <ReportPrintMenu
            onPrint={() => window.print()}
            onExport={(format) => void exportReport(format)}
            exportFormats={["xlsx", "csv"]}
            disabled={!data || report.isPending}
          />
        </AccountingPageHeader>

        <Paper sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={3}>
            <PeriodRangeFilter
              value={range}
              onChange={setRange}
              enableMonthNavigation
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "minmax(320px, 1fr) minmax(200px, 260px)",
                },
                gap: 2,
              }}
            >
              <CustomTextField
                fullWidth
                label="Search report"
                placeholder="Invoice, customer, expense, vendor, or payroll no."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="bx bx-search" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl
                size="small"
                fullWidth
                disabled={section === "payroll"}
              >
                <InputLabel>Payment Status</InputLabel>
                <Select
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value as PaymentFilter)
                  }
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {report.isFetching && !report.isPending && (
              <Typography variant="caption" color="text.secondary">
                Updating report…
              </Typography>
            )}
          </Stack>
        </Paper>

        {report.isError && (
          <Alert severity="error">
            The income and expense report could not be loaded.
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 3,
          }}
        >
          <CustomKpiCard
            icon={<i className="bx bx-trending-up" style={{ fontSize: 24 }} />}
            iconColor="success"
            label="Gross Sales"
            value={data ? formatPeso(data.summary.gross_sales) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={<i className="bx bx-time-five" style={{ fontSize: 24 }} />}
            iconColor="warning"
            label="Accounts Receivable"
            value={data ? formatPeso(data.summary.accounts_receivable) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={<i className="bx bx-wallet" style={{ fontSize: 24 }} />}
            iconColor="error"
            label="Total Expenses"
            value={data ? formatPeso(data.summary.total_expenses) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={
              <i
                className={
                  netPositive ? "bx bx-line-chart" : "bx bx-trending-down"
                }
                style={{ fontSize: 24 }}
              />
            }
            iconColor={netPositive ? "success" : "error"}
            label="Net Sales"
            value={data ? formatPeso(data.summary.net_sales) : "—"}
            loading={report.isPending}
          />
        </Box>

        <Paper sx={{ overflow: "hidden" }}>
          <Tabs
            value={section}
            onChange={(_, value: SectionFilter) => handleSectionChange(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              px: { xs: 1, md: 3 },
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<i className={`bx ${tab.icon}`} />}
                iconPosition="start"
              />
            ))}
          </Tabs>

          {report.isPending && (
            <Stack spacing={2} sx={{ p: 5 }}>
              <Skeleton width="32%" height={32} />
              <Skeleton variant="rounded" height={220} />
            </Stack>
          )}

          {!report.isPending && data && (
            <Stack
              divider={
                <Box
                  sx={{
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                />
              }
            >
              {(section === "all" || section === "income") && (
                <IncomeExpenseReportTable
                  section="income"
                  rows={data.income}
                  onViewDocuments={setSelectedIncome}
                />
              )}
              {(section === "all" || section === "bills") && (
                <IncomeExpenseReportTable section="bills" rows={data.bills} />
              )}
              {(section === "all" || section === "payroll") && (
                <IncomeExpenseReportTable
                  section="payroll"
                  rows={data.payroll}
                />
              )}
              {(section === "all" || section === "expenses") && (
                <IncomeExpenseReportTable
                  section="expenses"
                  rows={data.expenses}
                />
              )}
              <IncomeExpenseReportSummary summary={data.summary} />
            </Stack>
          )}
        </Paper>
      </Stack>

      {data && <IncomeExpenseReportPrintable data={data} />}
      <IncomeDocumentsDialog
        row={selectedIncome}
        onClose={() => setSelectedIncome(null)}
      />
    </>
  );
};

export default IncomeExpenseReportView;
