"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import ReportPrintArea from "../shared/ReportPrintArea";
import type { TrialBalanceReport } from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";

const TrialBalancePrintable = ({ data }: { data: TrialBalanceReport }) => (
  <ReportPrintArea
    title="Trial Balance"
    subtitle={`As of ${formatDate(data.as_of)} · ${
      data.balanced ? "Balanced" : "Out of balance"
    }`}
  >
    <Table size="small">
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
        {data.rows.map((row) => (
          <TableRow key={row.account_id}>
            <TableCell>{row.code}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell sx={{ textTransform: "capitalize" }}>
              {row.type}
            </TableCell>
            <TableCell align="right">{formatPeso(row.debit)}</TableCell>
            <TableCell align="right">{formatPeso(row.credit)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} sx={{ fontWeight: 700, color: "#111827" }}>
            TOTAL
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, color: "#111827" }}>
            {formatPeso(data.total_debit)}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, color: "#111827" }}>
            {formatPeso(data.total_credit)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </ReportPrintArea>
);

export default TrialBalancePrintable;
