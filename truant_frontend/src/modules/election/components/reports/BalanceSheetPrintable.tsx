"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

import ReportPrintArea from "../shared/ReportPrintArea";
import type { BalanceSheetReport, StatementLine } from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";

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
      <TableCell colSpan={2} sx={{ fontWeight: 700, color: "#111827" }}>
        {title}
      </TableCell>
    </TableRow>
    {lines.map((line) => (
      <TableRow key={`${title}-${line.account_id ?? line.name}`}>
        <TableCell sx={{ pl: 4 }}>{line.name}</TableCell>
        <TableCell align="right">{formatPeso(line.amount)}</TableCell>
      </TableRow>
    ))}
    <TableRow>
      <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
        Total {title}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 700, color: "#111827" }}>
        {formatPeso(total)}
      </TableCell>
    </TableRow>
  </>
);

const BalanceSheetPrintable = ({ data }: { data: BalanceSheetReport }) => (
  <ReportPrintArea
    title="Balance Sheet"
    subtitle={`As of ${formatDate(data.as_of)} · ${
      data.balanced ? "Balanced" : "Out of balance"
    }`}
  >
    <Table size="small">
      <TableBody>
        <Section title="Assets" lines={data.assets} total={data.total_assets} />
        <Section
          title="Liabilities"
          lines={data.liabilities}
          total={data.total_liabilities}
        />
        <Section title="Equity" lines={data.equity} total={data.total_equity} />
      </TableBody>
    </Table>
  </ReportPrintArea>
);

export default BalanceSheetPrintable;
