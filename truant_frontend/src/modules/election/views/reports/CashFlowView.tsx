"use client";

import { useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomKpiCard from "@components/app/CustomKPICard";
import PeriodRangeFilter from "@components/app/PeriodRangeFilter";
import AccountingPageHeader from "../../components/shared/AccountingPageHeader";
import ReportPrintMenu, {
  type ReportExportFormat,
} from "../../components/shared/ReportPrintMenu";
import CashFlowPrintable from "../../components/reports/CashFlowPrintable";
import CashFlowSection from "../../components/reports/CashFlowSection";
import ReportRangeComparer, {
  defaultComparisonValue,
} from "../../components/reports/ReportRangeComparer";
import {
  statementTableSx,
  subtotalCellSx,
} from "../../components/shared/centerColumns";

import { accountingApi } from "../../api/accountingApi";
import { useCashFlow } from "../../hooks/useAccountingApi";
import {
  formatPeso,
  formatSignedPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { downloadReport } from "../../utils/downloadReport";
import { rangeValueForPreset, type DateRangeValue } from "@/utils/dateRange";

const CashFlowView = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    rangeValueForPreset("this_year"),
  );
  const [comparison, setComparison] = useState(() =>
    defaultComparisonValue(rangeValueForPreset("this_year")),
  );
  const { from, to } = range;
  const report = useCashFlow({
    from,
    to,
    compare: comparison.enabled ? 1 : undefined,
    compare_from: comparison.enabled ? comparison.from : undefined,
    compare_to: comparison.enabled ? comparison.to : undefined,
  });
  const data = report.data?.data;
  const comparing = comparison.enabled && Boolean(data?.comparison);
  const netPositive = data ? Number(data.net_change) >= 0 : true;

  const exportReport = async (format: ReportExportFormat) => {
    try {
      await downloadReport(
        accountingApi.reports.exportUrl("cash-flow", {
          from,
          to,
          format,
          compare: comparison.enabled ? 1 : undefined,
          compare_from: comparison.enabled ? comparison.from : undefined,
          compare_to: comparison.enabled ? comparison.to : undefined,
        }),
        `cash-flow-${from}_${to}.${format}`,
      );
    } catch (error) {
      toast.error(getAccountingErrorMessage(error, "Export failed."));
    }
  };

  return (
    <>
      <Stack spacing={5} className="report-screen-only">
        <AccountingPageHeader
          title="Cash Flow"
          description="Where your cash actually came from and where it went, over a date range."
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
            icon={<i className="bx-wallet" style={{ fontSize: 24 }} />}
            iconColor="secondary"
            label="Beginning Cash"
            value={data ? formatPeso(data.beginning_cash) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={
              <i
                className={netPositive ? "bx-trending-up" : "bx-trending-down"}
                style={{ fontSize: 24 }}
              />
            }
            iconColor={netPositive ? "success" : "error"}
            label="Net Change in Cash"
            value={data ? formatPeso(data.net_change) : "—"}
            loading={report.isPending}
          >
            {comparing && data?.comparison && (
              <Typography variant="caption" color="text.secondary">
                {formatSignedPeso(
                  Number(data.net_change) - Number(data.comparison.net_change),
                )}{" "}
                vs comparison period
              </Typography>
            )}
          </CustomKpiCard>
          <CustomKpiCard
            icon={<i className="bx-wallet-alt" style={{ fontSize: 24 }} />}
            iconColor="primary"
            label="Ending Cash"
            value={data ? formatPeso(data.ending_cash) : "—"}
            loading={report.isPending}
          >
            {comparing && data?.comparison && (
              <Typography variant="caption" color="text.secondary">
                {formatSignedPeso(
                  Number(data.ending_cash) -
                    Number(data.comparison.ending_cash),
                )}{" "}
                vs comparison period
              </Typography>
            )}
          </CustomKpiCard>
        </Stack>

        <Paper>
          <Stack
            direction="row"
            className="items-center justify-between"
            sx={{ p: 5, pb: 2 }}
          >
            <Box>
              <Typography variant="h5">Cash Flow Statement</Typography>
              <Typography variant="body2" color="text.secondary">
                From {data?.from ?? from} to {data?.to ?? to}
                {comparing && data?.comparison
                  ? ` · compared with ${data.comparison.from} to ${data.comparison.to}`
                  : ""}
              </Typography>
            </Box>
            {data && (
              <Chip
                label={data.reconciled ? "Reconciled" : "Out of balance"}
                color={data.reconciled ? "success" : "error"}
                variant="tonal"
                size="small"
              />
            )}
          </Stack>
          <TableContainer>
            <Table size="small" sx={statementTableSx}>
              {comparing && data?.comparison && (
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={2}>Account</TableCell>
                    <TableCell align="right">This Period</TableCell>
                    <TableCell align="right">Comparison</TableCell>
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
                    <CashFlowSection
                      title="Operating Activities"
                      lines={data.operating}
                      total={data.net_operating}
                      previousTotal={data.comparison?.net_operating}
                      comparing={comparing}
                    />
                    <CashFlowSection
                      title="Investing Activities"
                      lines={data.investing}
                      total={data.net_investing}
                      previousTotal={data.comparison?.net_investing}
                      comparing={comparing}
                    />
                    <CashFlowSection
                      title="Financing Activities"
                      lines={data.financing}
                      total={data.net_financing}
                      previousTotal={data.comparison?.net_financing}
                      comparing={comparing}
                    />
                    <TableRow>
                      <TableCell colSpan={2} sx={subtotalCellSx}>
                        Beginning Cash Balance
                      </TableCell>
                      <TableCell align="right" sx={subtotalCellSx}>
                        {formatPeso(data.beginning_cash)}
                      </TableCell>
                      {comparing && data.comparison && (
                        <>
                          <TableCell
                            align="right"
                            sx={{ ...subtotalCellSx, color: "text.secondary" }}
                          >
                            {formatPeso(data.comparison.beginning_cash)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ ...subtotalCellSx, color: "text.secondary" }}
                          >
                            {formatSignedPeso(
                              Number(data.beginning_cash) -
                                Number(data.comparison.beginning_cash),
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
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
                          Ending Cash Balance
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight={700}>
                          {formatPeso(data.ending_cash)}
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
                              {formatPeso(data.comparison.ending_cash)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              color="text.secondary"
                            >
                              {formatSignedPeso(
                                Number(data.ending_cash) -
                                  Number(data.comparison.ending_cash),
                              )}
                            </Typography>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Click the chevron next to any line to see its transactions — each
            shows the type of transaction and who it was with, and links through
            to the source record.
          </Typography>
        </Box>
      </Stack>

      {data && <CashFlowPrintable data={data} />}
    </>
  );
};

export default CashFlowView;
