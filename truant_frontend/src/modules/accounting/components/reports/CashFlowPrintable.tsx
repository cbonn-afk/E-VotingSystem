"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import ReportPrintArea from "../shared/ReportPrintArea";
import type { CashFlowReport, StatementLine } from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";

const Section = ({
  title,
  lines,
  total,
  previousTotal,
  comparing,
}: {
  title: string;
  lines: StatementLine[];
  total: string;
  previousTotal?: string;
  comparing: boolean;
}) => (
  <>
    <TableRow>
      <TableCell
        colSpan={comparing ? 3 : 2}
        sx={{ fontWeight: 700, color: "#111827" }}
      >
        {title}
      </TableCell>
    </TableRow>
    {lines.map((line) => (
      <TableRow key={`${title}-${line.account_id ?? line.name}`}>
        <TableCell sx={{ pl: 4 }}>{line.name}</TableCell>
        <TableCell align="right">{formatPeso(line.amount)}</TableCell>
        {comparing && (
          <TableCell align="right" sx={{ color: "#6b7280" }}>
            {formatPeso(line.previous_amount)}
          </TableCell>
        )}
      </TableRow>
    ))}
    <TableRow>
      <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
        Net Cash from {title}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 700, color: "#111827" }}>
        {formatPeso(total)}
      </TableCell>
      {comparing && (
        <TableCell align="right" sx={{ fontWeight: 700, color: "#6b7280" }}>
          {formatPeso(previousTotal)}
        </TableCell>
      )}
    </TableRow>
  </>
);

const TotalRow = ({
  label,
  value,
  previous,
  comparing,
}: {
  label: string;
  value: string;
  previous?: string;
  comparing: boolean;
}) => (
  <TableRow>
    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>{label}</TableCell>
    <TableCell align="right" sx={{ fontWeight: 700, color: "#111827" }}>
      {formatPeso(value)}
    </TableCell>
    {comparing && (
      <TableCell align="right" sx={{ fontWeight: 700, color: "#6b7280" }}>
        {formatPeso(previous)}
      </TableCell>
    )}
  </TableRow>
);

const CashFlowPrintable = ({ data }: { data: CashFlowReport }) => {
  const comparison = data.comparison ?? null;
  const comparing = Boolean(comparison);

  return (
    <ReportPrintArea
      title="Cash Flow Statement"
      subtitle={
        comparison
          ? `From ${formatDate(data.from)} to ${formatDate(data.to)} · compared with ${formatDate(comparison.from)} to ${formatDate(comparison.to)} · ${data.reconciled ? "Reconciled" : "Out of balance"}`
          : `From ${formatDate(data.from)} to ${formatDate(data.to)} · ${data.reconciled ? "Reconciled" : "Out of balance"}`
      }
    >
      <Table size="small">
        {comparing && (
          <TableHead>
            <TableRow>
              <TableCell>Account</TableCell>
              <TableCell align="right">This Period</TableCell>
              <TableCell align="right">Comparison</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          <Section
            title="Operating Activities"
            lines={data.operating}
            total={data.net_operating}
            previousTotal={comparison?.net_operating}
            comparing={comparing}
          />
          <Section
            title="Investing Activities"
            lines={data.investing}
            total={data.net_investing}
            previousTotal={comparison?.net_investing}
            comparing={comparing}
          />
          <Section
            title="Financing Activities"
            lines={data.financing}
            total={data.net_financing}
            previousTotal={comparison?.net_financing}
            comparing={comparing}
          />
          <TotalRow
            label="Beginning Cash Balance"
            value={data.beginning_cash}
            previous={comparison?.beginning_cash}
            comparing={comparing}
          />
          <TotalRow
            label="Net Change in Cash"
            value={data.net_change}
            previous={comparison?.net_change}
            comparing={comparing}
          />
          <TotalRow
            label="Ending Cash Balance"
            value={data.ending_cash}
            previous={comparison?.ending_cash}
            comparing={comparing}
          />
        </TableBody>
      </Table>
    </ReportPrintArea>
  );
};

export default CashFlowPrintable;
