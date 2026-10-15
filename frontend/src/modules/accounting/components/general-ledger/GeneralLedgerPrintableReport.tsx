"use client";

import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import ReportPrintArea from "../shared/ReportPrintArea";
import { formatDate, formatPeso } from "../../utils/accountingFormat";
import type { GeneralLedgerRow } from "./generalLedgerColumns";

type GeneralLedgerPrintableReportProps = {
  rows: GeneralLedgerRow[];
  from: string;
  to: string;
  debitTotal: number;
  creditTotal: number;
};

const GeneralLedgerPrintableReport = ({
  rows,
  from,
  to,
  debitTotal,
  creditTotal,
}: GeneralLedgerPrintableReportProps) => (
  <ReportPrintArea
    title="General Ledger"
    subtitle={
      from === to
        ? `As of ${formatDate(to)}`
        : `From ${formatDate(from)} to ${formatDate(to)}`
    }
  >
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Accounts</TableCell>
          <TableCell align="right">Total Debit</TableCell>
          <TableCell align="right">Total Credit</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>{rows.length}</TableCell>
          <TableCell align="right">{formatPeso(debitTotal)}</TableCell>
          <TableCell align="right">{formatPeso(creditTotal)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    {rows.map((account) => (
      <Stack
        key={account.account_id}
        spacing={2}
        className="report-print-section"
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ color: "#111827" }}>
            {account.code} - {account.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#4b5563" }}>
            {account.type} account · Normal balance: {account.normal_balance}
          </Typography>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Journal #</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>Opening Balance</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">
                {formatPeso(account.opening_balance)}
              </TableCell>
            </TableRow>

            {account.transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  No posted transactions for this period.
                </TableCell>
              </TableRow>
            ) : (
              account.transactions.map((transaction, index) => (
                <TableRow key={`${transaction.journal_entry_id}-${index}`}>
                  <TableCell>{formatDate(transaction.entry_date)}</TableCell>
                  <TableCell>{transaction.entry_no ?? "-"}</TableCell>
                  <TableCell>
                    {transaction.description ?? transaction.memo ?? "-"}
                  </TableCell>
                  <TableCell align="right">
                    {Number(transaction.debit)
                      ? formatPeso(transaction.debit)
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {Number(transaction.credit)
                      ? formatPeso(transaction.credit)
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {formatPeso(transaction.balance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Ending Balance</TableCell>
              <TableCell align="right">
                {formatPeso(account.debitTotal)}
              </TableCell>
              <TableCell align="right">
                {formatPeso(account.creditTotal)}
              </TableCell>
              <TableCell align="right">
                {formatPeso(account.closing_balance)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Stack>
    ))}
  </ReportPrintArea>
);

export default GeneralLedgerPrintableReport;
