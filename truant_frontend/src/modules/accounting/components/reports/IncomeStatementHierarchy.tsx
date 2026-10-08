"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type {
  AccountTypeValue,
  IncomeStatementHierarchyNode,
  IncomeStatementTransaction,
} from "../../api/types";
import {
  formatDate,
  formatPeso,
  formatSignedPeso,
} from "../../utils/accountingFormat";
import {
  getTransactionLinks,
  getTransactionParty,
  getTransactionTypeMeta,
} from "../../utils/incomeStatementTransaction";

export type TransactionTone = "success" | "error";

export const TransactionRow = ({
  transaction,
  depth,
  tone,
  comparing = false,
}: {
  transaction: IncomeStatementTransaction;
  depth: number;
  tone: TransactionTone;
  comparing?: boolean;
}) => {
  const typeMeta = getTransactionTypeMeta(transaction);
  const party = getTransactionParty(transaction);
  const links = getTransactionLinks(transaction);
  const href = links.primary ?? links.journal;
  const linkText = party ? `${typeMeta.label} · ${party}` : typeMeta.label;
  const amountColor = tone === "success" ? "success.main" : "error.main";

  return (
    <TableRow sx={{ "&:hover": { bgcolor: "action.hover" } }}>
      <TableCell sx={{ pl: 5 + depth * 3, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(transaction.entry_date)}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Stack
          component={Link}
          href={href}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            width: "fit-content",
            color: amountColor,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          <i className={typeMeta.icon} style={{ fontSize: 15 }} />
          <Typography variant="body2" color="inherit" fontWeight={500}>
            {linkText}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell
        align="right"
        sx={{ py: 1.5, fontVariantNumeric: "tabular-nums" }}
      >
        <Typography variant="body2" color={amountColor} fontWeight={500}>
          {formatPeso(transaction.amount)}
        </Typography>
      </TableCell>
      {comparing && (
        <>
          {/* Transactions are period-specific, so the comparison and change
              columns stay blank for drill-down rows. */}
          <TableCell align="right" sx={{ py: 1.5 }} />
          <TableCell align="right" sx={{ py: 1.5 }} />
        </>
      )}
    </TableRow>
  );
};

const NodeRows = ({
  node,
  depth,
  sectionType,
  comparing,
}: {
  node: IncomeStatementHierarchyNode;
  depth: number;
  sectionType: AccountTypeValue;
  comparing: boolean;
}) => {
  const expandable = node.children.length > 0 || node.transactions.length > 0;
  const isGroup = node.children.length > 0;
  // Show the full chart-of-accounts structure (groups expand to reveal their
  // accounts) but keep each posting account's transaction drill-down collapsed
  // by default — so COGS and its peers list without flooding the statement.
  const [expanded, setExpanded] = useState(isGroup);
  const tone: TransactionTone = sectionType === "revenue" ? "success" : "error";
  const previous = comparing ? Number(node.previous_amount ?? 0) : 0;
  const change = comparing ? Number(node.amount) - previous : 0;

  return (
    <Fragment>
      <TableRow hover sx={isGroup ? { bgcolor: "action.hover" } : undefined}>
        <TableCell sx={{ pl: 2 + depth * 3, width: 150 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {expandable ? (
              <Tooltip title={expanded ? "Collapse details" : "Expand details"}>
                <IconButton
                  size="small"
                  aria-label={
                    expanded ? `Collapse ${node.name}` : `Expand ${node.name}`
                  }
                  onClick={() => setExpanded((value) => !value)}
                >
                  <i
                    className={
                      expanded ? "bx-chevron-down" : "bx-chevron-right"
                    }
                  />
                </IconButton>
              </Tooltip>
            ) : (
              <span style={{ width: 30 }} />
            )}
            <Typography variant="body2" color="text.secondary">
              {node.code}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={isGroup ? 600 : 400}>
            {node.name}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: isGroup ? 600 : 400 }}>
          {formatPeso(node.amount)}
        </TableCell>
        {comparing && (
          <>
            <TableCell
              align="right"
              sx={{ fontWeight: isGroup ? 600 : 400, color: "text.secondary" }}
            >
              {formatPeso(previous)}
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: isGroup ? 600 : 400, color: "text.secondary" }}
            >
              {formatSignedPeso(change)}
            </TableCell>
          </>
        )}
      </TableRow>
      {expanded &&
        node.children.map((child) => (
          <NodeRows
            key={child.account_id}
            node={child}
            depth={depth + 1}
            sectionType={sectionType}
            comparing={comparing}
          />
        ))}
      {expanded &&
        node.transactions.map((transaction) => (
          <TransactionRow
            key={`${transaction.journal_entry_id}-${transaction.description}-${transaction.debit}-${transaction.credit}`}
            transaction={transaction}
            depth={depth}
            tone={tone}
            comparing={comparing}
          />
        ))}
    </Fragment>
  );
};

const IncomeStatementHierarchy = ({
  nodes,
  sectionType,
  comparing = false,
}: {
  nodes: IncomeStatementHierarchyNode[];
  sectionType: AccountTypeValue;
  comparing?: boolean;
}) => (
  <>
    {nodes.map((node) => (
      <NodeRows
        key={node.account_id}
        node={node}
        depth={0}
        sectionType={sectionType}
        comparing={comparing}
      />
    ))}
  </>
);

export default IncomeStatementHierarchy;
