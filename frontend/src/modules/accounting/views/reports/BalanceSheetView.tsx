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
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomKpiCard from "@components/app/CustomKPICard";
import AccountingPageHeader from "../../components/shared/AccountingPageHeader";
import AccountingDatePicker from "../../components/shared/AccountingDatePicker";
import ReportPrintMenu, {
  type ReportExportFormat,
} from "../../components/shared/ReportPrintMenu";
import BalanceSheetPrintable from "../../components/reports/BalanceSheetPrintable";
import {
  sectionHeaderSx,
  statementTableSx,
} from "../../components/shared/centerColumns";

import { accountingApi } from "../../api/accountingApi";
import type { StatementLine } from "../../api/types";
import { useBalanceSheet } from "../../hooks/useAccountingApi";
import {
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { downloadReport } from "../../utils/downloadReport";

const today = new Date().toISOString().slice(0, 10);

const subtotalCellSx = {
  fontWeight: 600,
  borderTop: 1,
  borderColor: "divider",
} as const;

const Section = ({
  title,
  lines,
  total,
}: {
  title: string;
  lines: StatementLine[];
  total: string;
}) => (
  <>
    <TableRow>
      <TableCell colSpan={2} sx={sectionHeaderSx}>
        {title}
      </TableCell>
    </TableRow>
    {lines.length === 0 ? (
      <TableRow>
        <TableCell sx={{ pl: 4, color: "text.disabled" }}>
          No {title.toLowerCase()} recorded
        </TableCell>
        <TableCell align="right" sx={{ color: "text.disabled" }}>
          —
        </TableCell>
      </TableRow>
    ) : (
      lines.map((line) => (
        <TableRow key={`${title}-${line.account_id ?? line.name}`} hover>
          <TableCell sx={{ pl: 4 }}>{line.name}</TableCell>
          <TableCell align="right">{formatPeso(line.amount)}</TableCell>
        </TableRow>
      ))
    )}
    <TableRow>
      <TableCell sx={subtotalCellSx}>Total {title}</TableCell>
      <TableCell align="right" sx={subtotalCellSx}>
        {formatPeso(total)}
      </TableCell>
    </TableRow>
  </>
);

const BalanceSheetView = () => {
  const [date, setDate] = useState(today);
  const report = useBalanceSheet({ date });
  const data = report.data?.data;

  const exportReport = async (format: ReportExportFormat) => {
    try {
      await downloadReport(
        accountingApi.reports.exportUrl("balance-sheet", {
          date,
          format,
        }),
        `balance-sheet-${date}.${format}`,
      );
    } catch (error) {
      toast.error(getAccountingErrorMessage(error, "Export failed."));
    }
  };

  return (
    <>
      <Stack spacing={5} className="report-screen-only">
        <AccountingPageHeader
          title="Balance Sheet"
          description="Assets, liabilities, and equity as of a date."
        >
          <Stack direction="row" spacing={2} className="items-end">
            <Box sx={{ width: 180 }}>
              <AccountingDatePicker
                label="As of"
                value={date}
                onChange={setDate}
              />
            </Box>
            <ReportPrintMenu
              onPrint={() => window.print()}
              onExport={(format) => void exportReport(format)}
              exportFormats={["xlsx", "csv"]}
              disabled={!data || report.isPending}
            />
          </Stack>
        </AccountingPageHeader>

        {report.isError && (
          <Alert severity="error">The report could not be loaded.</Alert>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ width: "100%" }}
        >
          <CustomKpiCard
            icon={<i className="bx-buildings" style={{ fontSize: 24 }} />}
            iconColor="primary"
            label="Total Assets"
            value={data ? formatPeso(data.total_assets) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={<i className="bx-credit-card" style={{ fontSize: 24 }} />}
            iconColor="warning"
            label="Total Liabilities"
            value={data ? formatPeso(data.total_liabilities) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={<i className="bx-pie-chart-alt-2" style={{ fontSize: 24 }} />}
            iconColor="info"
            label="Total Equity"
            value={data ? formatPeso(data.total_equity) : "—"}
            loading={report.isPending}
          />
        </Stack>

        <Paper>
          <Stack
            direction="row"
            className="items-center justify-between"
            sx={{ p: 5, pb: 2 }}
          >
            <Box>
              <Typography variant="h5">Balance Sheet</Typography>
              <Typography variant="body2" color="text.secondary">
                As of {data?.as_of ?? date}
              </Typography>
            </Box>
            {data && (
              <Chip
                label={data.balanced ? "Balanced" : "Out of balance"}
                color={data.balanced ? "success" : "error"}
                variant="tonal"
                size="small"
              />
            )}
          </Stack>
          <TableContainer>
            <Table size="small" sx={statementTableSx}>
              <TableBody>
                {report.isPending && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!report.isPending && !report.isError && !data && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      No data available as of this date.
                    </TableCell>
                  </TableRow>
                )}
                {data && (
                  <>
                    <Section
                      title="Assets"
                      lines={data.assets}
                      total={data.total_assets}
                    />
                    <Section
                      title="Liabilities"
                      lines={data.liabilities}
                      total={data.total_liabilities}
                    />
                    <Section
                      title="Equity"
                      lines={data.equity}
                      total={data.total_equity}
                    />
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& .MuiTableCell-root": {
                          borderTop: 2,
                          borderColor: "divider",
                          fontWeight: 700,
                        },
                      }}
                    >
                      <TableCell>Total Liabilities &amp; Equity</TableCell>
                      <TableCell align="right">
                        {formatPeso(
                          Number(data.total_liabilities) +
                            Number(data.total_equity),
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      {data && <BalanceSheetPrintable data={data} />}
    </>
  );
};

export default BalanceSheetView;
