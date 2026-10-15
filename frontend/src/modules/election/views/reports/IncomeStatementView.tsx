"use client";

import { useDeferredValue, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomKpiCard from "@components/app/CustomKPICard";
import CustomTextField from "@core/components/mui/TextField";
import PeriodRangeFilter from "@components/app/PeriodRangeFilter";
import AccountingPageHeader from "../../components/shared/AccountingPageHeader";
import ReportPrintMenu, {
  type ReportExportFormat,
} from "../../components/shared/ReportPrintMenu";
import IncomeStatementPrintable from "../../components/reports/IncomeStatementPrintable";
import IncomeStatementHierarchy from "../../components/reports/IncomeStatementHierarchy";
import ReportRangeComparer, {
  defaultComparisonValue,
} from "../../components/reports/ReportRangeComparer";
import {
  sectionHeaderSx,
  statementTableSx,
} from "../../components/shared/centerColumns";

import { accountingApi } from "../../api/accountingApi";
import type { IncomeStatementHierarchyNode } from "../../api/types";
import { useIncomeStatement } from "../../hooks/useAccountingApi";
import {
  formatDate,
  formatPeso,
  formatSignedPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { downloadReport } from "../../utils/downloadReport";
import { rangeValueForPreset, type DateRangeValue } from "@/utils/dateRange";

const subtotalCellSx = {
  fontWeight: 600,
  borderTop: 1,
  borderColor: "divider",
} as const;

type SectionFilter = "all" | "revenue" | "expenses";

const EmptySectionRow = ({
  title,
  isFiltered,
  comparing,
}: {
  title: string;
  isFiltered: boolean;
  comparing: boolean;
}) => (
  <TableRow>
    <TableCell colSpan={2} sx={{ pl: 4, color: "text.disabled" }}>
      {isFiltered
        ? `No ${title.toLowerCase()} match your search.`
        : `No ${title.toLowerCase()} recorded for this period.`}
    </TableCell>
    <TableCell align="right" sx={{ color: "text.disabled" }}>
      —
    </TableCell>
    {comparing && (
      <>
        <TableCell align="right" sx={{ color: "text.disabled" }}>
          —
        </TableCell>
        <TableCell align="right" sx={{ color: "text.disabled" }}>
          —
        </TableCell>
      </>
    )}
  </TableRow>
);

const Section = ({
  title,
  sectionType,
  nodes,
  isFiltered,
  comparing,
}: {
  title: string;
  sectionType: "revenue" | "expense";
  nodes: IncomeStatementHierarchyNode[];
  isFiltered: boolean;
  comparing: boolean;
}) => (
  <>
    <TableRow>
      <TableCell
        colSpan={comparing ? 5 : 3}
        sx={{
          ...sectionHeaderSx,
          borderLeft: 3,
          borderLeftColor:
            sectionType === "revenue" ? "success.main" : "error.main",
        }}
      >
        {title}
      </TableCell>
    </TableRow>
    {nodes.length === 0 ? (
      <EmptySectionRow
        title={title}
        isFiltered={isFiltered}
        comparing={comparing}
      />
    ) : (
      <IncomeStatementHierarchy
        nodes={nodes}
        sectionType={sectionType}
        comparing={comparing}
      />
    )}
  </>
);

/** Total row with the money value plus optional comparison + change columns. */
const SubtotalRow = ({
  label,
  current,
  previous,
  comparing,
}: {
  label: string;
  current: string;
  previous: string | undefined;
  comparing: boolean;
}) => (
  <TableRow>
    <TableCell colSpan={2} sx={subtotalCellSx}>
      {label}
    </TableCell>
    <TableCell align="right" sx={subtotalCellSx}>
      {formatPeso(current)}
    </TableCell>
    {comparing && (
      <>
        <TableCell
          align="right"
          sx={{ ...subtotalCellSx, color: "text.secondary" }}
        >
          {formatPeso(previous)}
        </TableCell>
        <TableCell
          align="right"
          sx={{ ...subtotalCellSx, color: "text.secondary" }}
        >
          {formatSignedPeso(Number(current) - Number(previous ?? 0))}
        </TableCell>
      </>
    )}
  </TableRow>
);

const IncomeStatementView = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    rangeValueForPreset("this_year"),
  );
  const [comparison, setComparison] = useState(() =>
    defaultComparisonValue(rangeValueForPreset("this_year")),
  );
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");
  const deferredSearch = useDeferredValue(search.trim());
  const isFiltered = deferredSearch.length > 0;
  const { from, to } = range;
  const report = useIncomeStatement({
    from,
    to,
    search: deferredSearch || undefined,
    compare: comparison.enabled ? 1 : undefined,
    compare_from: comparison.enabled ? comparison.from : undefined,
    compare_to: comparison.enabled ? comparison.to : undefined,
  });
  const data = report.data?.data;
  const comparing = comparison.enabled && Boolean(data?.comparison);
  const netPositive = data ? Number(data.net_income) >= 0 : true;
  const margin = useMemo(() => {
    if (!data) return null;
    const revenue = Number(data.total_revenue);
    if (!revenue) return null;
    return (Number(data.net_income) / revenue) * 100;
  }, [data]);
  const showRevenue = sectionFilter !== "expenses";
  const showExpenses = sectionFilter !== "revenue";

  const exportReport = async (format: ReportExportFormat) => {
    try {
      await downloadReport(
        accountingApi.reports.exportUrl("income-statement", {
          from,
          to,
          format,
          compare: comparison.enabled ? 1 : undefined,
          compare_from: comparison.enabled ? comparison.from : undefined,
          compare_to: comparison.enabled ? comparison.to : undefined,
        }),
        `income-statement-${from}_${to}.${format}`,
      );
    } catch (error) {
      toast.error(getAccountingErrorMessage(error, "Export failed."));
    }
  };

  return (
    <>
      <Stack spacing={5} className="report-screen-only">
        <AccountingPageHeader
          title="Income Statement"
          description="What came in, what went out, and where — grouped by account with every underlying transaction one click away."
        >
          <ReportPrintMenu
            onPrint={() => window.print()}
            onExport={(format) => void exportReport(format)}
            exportFormats={["xlsx", "csv"]}
            disabled={!data || report.isPending}
          />
        </AccountingPageHeader>

        <Paper className="p-5">
          <Stack spacing={3}>
            <PeriodRangeFilter value={range} onChange={setRange} />
            <ReportRangeComparer
              primary={{ from, to }}
              value={comparison}
              onChange={setComparison}
              disabled={report.isPending}
            />
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ md: "flex-end" }}
            >
              <CustomTextField
                fullWidth
                label="Search transactions"
                placeholder="Customer, vendor, partner, invoice or bill number…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="bx-search" style={{ fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                      >
                        <i className="bx-x" style={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
              <ToggleButtonGroup
                exclusive
                size="small"
                color="primary"
                value={sectionFilter}
                onChange={(_, value: SectionFilter | null) =>
                  value && setSectionFilter(value)
                }
                sx={{ flexShrink: 0 }}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="revenue">Revenue</ToggleButton>
                <ToggleButton value="expenses">Expenses</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {isFiltered && (
              <Typography variant="caption" color="text.secondary">
                Showing results for{" "}
                <strong>&ldquo;{deferredSearch}&rdquo;</strong>
                {report.isFetching ? " · updating…" : ""}
              </Typography>
            )}
          </Stack>
        </Paper>

        {report.isError && (
          <Alert severity="error">The report could not be loaded.</Alert>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ width: "100%" }}
        >
          <CustomKpiCard
            icon={<i className="bx-trending-up" style={{ fontSize: 24 }} />}
            iconColor="success"
            label="Total Revenue"
            value={data ? formatPeso(data.total_revenue) : "—"}
            loading={report.isPending}
          >
            {comparing && data?.comparison && (
              <Typography variant="caption" color="text.secondary">
                {formatSignedPeso(
                  Number(data.total_revenue) -
                    Number(data.comparison.total_revenue),
                )}{" "}
                vs comparison period
              </Typography>
            )}
          </CustomKpiCard>
          <CustomKpiCard
            icon={<i className="bx-trending-down" style={{ fontSize: 24 }} />}
            iconColor="error"
            label="Total Expenses"
            value={data ? formatPeso(data.total_expenses) : "—"}
            loading={report.isPending}
          >
            {comparing && data?.comparison && (
              <Typography variant="caption" color="text.secondary">
                {formatSignedPeso(
                  Number(data.total_expenses) -
                    Number(data.comparison.total_expenses),
                )}{" "}
                vs comparison period
              </Typography>
            )}
          </CustomKpiCard>
          <CustomKpiCard
            icon={<i className="bx-wallet" style={{ fontSize: 24 }} />}
            iconColor={netPositive ? "primary" : "error"}
            label="Net Income"
            value={data ? formatPeso(data.net_income) : "—"}
            loading={report.isPending}
          >
            {comparing && data?.comparison ? (
              <Typography variant="caption" color="text.secondary">
                {formatSignedPeso(
                  Number(data.net_income) - Number(data.comparison.net_income),
                )}{" "}
                vs comparison period
              </Typography>
            ) : (
              margin !== null && (
                <Typography variant="caption" color="text.secondary">
                  {margin >= 0 ? "+" : ""}
                  {margin.toFixed(1)}% margin
                </Typography>
              )
            )}
          </CustomKpiCard>
        </Stack>

        <Paper>
          <TableContainer>
            <Table size="small" sx={statementTableSx}>
              {comparing && data?.comparison && (
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={2}>Account</TableCell>
                    <TableCell align="right">
                      This Period
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        display="block"
                      >
                        {formatDate(data.from)} – {formatDate(data.to)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      Comparison
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        display="block"
                      >
                        {formatDate(data.comparison.from)} –{" "}
                        {formatDate(data.comparison.to)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">Change</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {report.isPending && (
                  <TableRow>
                    <TableCell
                      colSpan={comparing ? 5 : 3}
                      align="center"
                      sx={{ py: 6 }}
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!report.isPending && !report.isError && !data && (
                  <TableRow>
                    <TableCell
                      colSpan={comparing ? 5 : 3}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      No data available for this date range.
                    </TableCell>
                  </TableRow>
                )}
                {data && (
                  <>
                    {showRevenue && (
                      <>
                        <Section
                          title="Revenue"
                          sectionType="revenue"
                          nodes={data.revenue_hierarchy ?? []}
                          isFiltered={isFiltered}
                          comparing={comparing}
                        />
                        <SubtotalRow
                          label="Total Revenue"
                          current={data.total_revenue}
                          previous={data.comparison?.total_revenue}
                          comparing={comparing}
                        />
                      </>
                    )}
                    {showExpenses && (
                      <>
                        <Section
                          title="Expenses"
                          sectionType="expense"
                          nodes={data.expense_hierarchy ?? []}
                          isFiltered={isFiltered}
                          comparing={comparing}
                        />
                        <SubtotalRow
                          label="Total Expenses"
                          current={data.total_expenses}
                          previous={data.comparison?.total_expenses}
                          comparing={comparing}
                        />
                      </>
                    )}
                    {sectionFilter === "all" && (
                      <TableRow
                        sx={{
                          bgcolor: "action.hover",
                          "& .MuiTableCell-root": {
                            borderTop: 2,
                            borderColor: "divider",
                          },
                        }}
                      >
                        <TableCell colSpan={2}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            Net Income
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color={netPositive ? "success.main" : "error.main"}
                          >
                            {formatPeso(data.net_income)}
                          </Typography>
                        </TableCell>
                        {comparing && data.comparison && (
                          <>
                            <TableCell align="right">
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="text.secondary"
                              >
                                {formatPeso(data.comparison.net_income)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="text.secondary"
                              >
                                {formatSignedPeso(
                                  Number(data.net_income) -
                                    Number(data.comparison.net_income),
                                )}
                              </Typography>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Click the chevron next to any account to see its transactions — each
            shows the type of transaction and who it was with, and links through
            to the source record.
          </Typography>
        </Box>
      </Stack>

      {data && <IncomeStatementPrintable data={data} />}
    </>
  );
};

export default IncomeStatementView;
