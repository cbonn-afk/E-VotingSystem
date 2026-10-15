"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import ReportPrintArea from "../shared/ReportPrintArea";
import type {
  IncomeStatementHierarchyNode,
  IncomeStatementReport,
  IncomeStatementTransaction,
} from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";
import {
  getTransactionDocument,
  getTransactionParty,
  getTransactionTypeMeta,
} from "../../utils/incomeStatementTransaction";

const Section = ({
  title,
  nodes,
  comparing,
}: {
  title: string;
  nodes: IncomeStatementHierarchyNode[];
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
    {nodes.map((node) => (
      <PrintableNode
        key={node.account_id}
        node={node}
        depth={0}
        comparing={comparing}
      />
    ))}
  </>
);

const transactionLabel = (transaction: IncomeStatementTransaction) => {
  const type = getTransactionTypeMeta(transaction).label;
  const document = getTransactionDocument(transaction);
  const party = getTransactionParty(transaction);

  return `${formatDate(transaction.entry_date)} · ${type} · ${document}${party ? ` · ${party}` : ""}`;
};

const PrintableNode = ({
  node,
  depth,
  comparing,
}: {
  node: IncomeStatementHierarchyNode;
  depth: number;
  comparing: boolean;
}) => (
  <>
    <TableRow>
      <TableCell
        sx={{ pl: 4 + depth * 3, fontWeight: node.children.length ? 700 : 400 }}
      >
        {node.code} · {node.name}
      </TableCell>
      <TableCell
        align="right"
        sx={{ fontWeight: node.children.length ? 700 : 400 }}
      >
        {formatPeso(node.amount)}
      </TableCell>
      {comparing && (
        <TableCell
          align="right"
          sx={{
            fontWeight: node.children.length ? 700 : 400,
            color: "#6b7280",
          }}
        >
          {formatPeso(node.previous_amount)}
        </TableCell>
      )}
    </TableRow>
    {node.children.map((child) => (
      <PrintableNode
        key={child.account_id}
        node={child}
        depth={depth + 1}
        comparing={comparing}
      />
    ))}
    {node.transactions.map((transaction) => (
      <TableRow
        key={`${node.account_id}-${transaction.journal_entry_id}-${transaction.debit}-${transaction.credit}`}
      >
        <TableCell
          sx={{ pl: 7 + depth * 3, color: "#6b7280", fontSize: "0.75rem" }}
        >
          {transactionLabel(transaction)}
        </TableCell>
        <TableCell align="right" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
          {formatPeso(transaction.amount)}
        </TableCell>
        {comparing && <TableCell />}
      </TableRow>
    ))}
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

const IncomeStatementPrintable = ({
  data,
}: {
  data: IncomeStatementReport;
}) => {
  const comparison = data.comparison ?? null;
  const comparing = Boolean(comparison);

  return (
    <ReportPrintArea
      title="Income Statement"
      subtitle={
        comparison
          ? `From ${formatDate(data.from)} to ${formatDate(data.to)} · compared with ${formatDate(comparison.from)} to ${formatDate(comparison.to)}`
          : `From ${formatDate(data.from)} to ${formatDate(data.to)}`
      }
    >
      <Table size="small">
        {comparing && comparison && (
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
            title="Revenue"
            nodes={data.revenue_hierarchy ?? []}
            comparing={comparing}
          />
          <TotalRow
            label="Total Revenue"
            value={data.total_revenue}
            previous={comparison?.total_revenue}
            comparing={comparing}
          />
          <Section
            title="Expenses"
            nodes={data.expense_hierarchy ?? []}
            comparing={comparing}
          />
          <TotalRow
            label="Total Expenses"
            value={data.total_expenses}
            previous={comparison?.total_expenses}
            comparing={comparing}
          />
          <TotalRow
            label="Net Income"
            value={data.net_income}
            previous={comparison?.net_income}
            comparing={comparing}
          />
        </TableBody>
      </Table>
    </ReportPrintArea>
  );
};

export default IncomeStatementPrintable;
