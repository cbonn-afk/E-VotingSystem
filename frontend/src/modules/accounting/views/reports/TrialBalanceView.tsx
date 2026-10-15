"use client";

// React Imports
import { useState } from "react";

// MUI Imports
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

// Third-party Imports
import { toast } from "react-toastify";

// Component Imports
import CustomKpiCard from "@components/app/CustomKPICard";
import AccountingPageHeader from "../../components/shared/AccountingPageHeader";
import AccountingDatePicker from "../../components/shared/AccountingDatePicker";
import ReportPrintMenu, {
  type ReportExportFormat,
} from "../../components/shared/ReportPrintMenu";
import TrialBalancePrintable from "../../components/reports/TrialBalancePrintable";
import { ACCOUNT_TYPE_COLOR } from "../../components/accounts/accountsShared";
import { statementTableSx } from "../../components/shared/centerColumns";

import { accountingApi } from "../../api/accountingApi";
import { useTrialBalance } from "../../hooks/useAccountingApi";
import {
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { downloadReport } from "../../utils/downloadReport";

const today = new Date().toISOString().slice(0, 10);

const amountCell = (value: string) =>
  Number(value) ? (
    formatPeso(value)
  ) : (
    <Box component="span" sx={{ color: "text.disabled" }}>
      —
    </Box>
  );

const TrialBalanceView = () => {
  const [date, setDate] = useState(today);
  const report = useTrialBalance({ date });
  const data = report.data?.data;

  const exportReport = async (format: ReportExportFormat) => {
    try {
      await downloadReport(
        accountingApi.reports.exportUrl("trial-balance", { date, format }),
        `trial-balance-${date}.${format}`,
      );
    } catch (error) {
      toast.error(getAccountingErrorMessage(error, "Export failed."));
    }
  };

  return (
    <>
      <Stack spacing={5} className="report-screen-only">
        <AccountingPageHeader
          title="Trial Balance"
          description="All account balances as of a date — debits must equal credits."
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
            icon={
              <i className="bx-down-arrow-circle" style={{ fontSize: 24 }} />
            }
            iconColor="primary"
            label="Total Debit"
            value={data ? formatPeso(data.total_debit) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={<i className="bx-up-arrow-circle" style={{ fontSize: 24 }} />}
            iconColor="info"
            label="Total Credit"
            value={data ? formatPeso(data.total_credit) : "—"}
            loading={report.isPending}
          />
          <CustomKpiCard
            icon={<i className="bx-check-shield" style={{ fontSize: 24 }} />}
            iconColor={data?.balanced ? "success" : "error"}
            label="Status"
            value={data ? (data.balanced ? "Balanced" : "Out of balance") : "—"}
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
              <Typography variant="h5">Trial Balance</Typography>
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
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.isPending && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {data?.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      No posted activity as of this date.
                    </TableCell>
                  </TableRow>
                )}
                {data?.rows.map((row) => (
                  <TableRow key={row.account_id} hover>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {row.code}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.type}
                        color={ACCOUNT_TYPE_COLOR[row.type]}
                        variant="tonal"
                        size="small"
                        className="capitalize"
                      />
                    </TableCell>
                    <TableCell align="right">{amountCell(row.debit)}</TableCell>
                    <TableCell align="right">
                      {amountCell(row.credit)}
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.rows.length > 0 && (
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
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell align="right">
                      {formatPeso(data.total_debit)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPeso(data.total_credit)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      {data && <TrialBalancePrintable data={data} />}
    </>
  );
};

export default TrialBalanceView;
