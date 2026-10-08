"use client";

import { Fragment, useState } from "react";

import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { StatementLine } from "../../api/types";
import {
  sectionHeaderSx,
  subtotalCellSx,
} from "../shared/centerColumns";
import { formatPeso, formatSignedPeso } from "../../utils/accountingFormat";
import { TransactionRow } from "./IncomeStatementHierarchy";

const LineRow = ({
  line,
  comparing,
}: {
  line: StatementLine;
  comparing: boolean;
}) => {
  const transactions = line.transactions ?? [];
  const expandable = transactions.length > 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <Fragment>
      <TableRow hover>
        <TableCell sx={{ width: 150 }}>
          {expandable ? (
            <Tooltip title={expanded ? "Collapse details" : "Expand details"}>
              <IconButton
                size="small"
                aria-label={
                  expanded ? `Collapse ${line.name}` : `Expand ${line.name}`
                }
                onClick={() => setExpanded((value) => !value)}
              >
                <i
                  className={expanded ? "bx-chevron-down" : "bx-chevron-right"}
                />
              </IconButton>
            </Tooltip>
          ) : (
            <span style={{ display: "inline-block", width: 30 }} />
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2">{line.name}</Typography>
        </TableCell>
        <TableCell align="right">{formatPeso(line.amount)}</TableCell>
        {comparing && (
          <>
            <TableCell align="right" sx={{ color: "text.secondary" }}>
              {formatPeso(line.previous_amount)}
            </TableCell>
            <TableCell align="right" sx={{ color: "text.secondary" }}>
              {formatSignedPeso(
                Number(line.amount) - Number(line.previous_amount ?? 0),
              )}
            </TableCell>
          </>
        )}
      </TableRow>
      {expanded &&
        transactions.map((transaction) => (
          <TransactionRow
            key={`${transaction.journal_entry_id}-${transaction.description}-${transaction.debit}-${transaction.credit}`}
            transaction={transaction}
            depth={0}
            // Cash flow mixes inflows and outflows within the same activity
            // (e.g. Operating), so each transaction is colored by its own
            // sign rather than a fixed section tone.
            tone={Number(transaction.amount) >= 0 ? "success" : "error"}
            comparing={comparing}
          />
        ))}
    </Fragment>
  );
};

const CashFlowSection = ({
  title,
  lines,
  total,
  previousTotal,
  comparing = false,
}: {
  title: string;
  lines: StatementLine[];
  total: string;
  previousTotal?: string;
  comparing?: boolean;
}) => (
  <>
    <TableRow>
      <TableCell colSpan={comparing ? 5 : 3} sx={sectionHeaderSx}>
        {title}
      </TableCell>
    </TableRow>
    {lines.length === 0 ? (
      <TableRow>
        <TableCell colSpan={2} sx={{ pl: 4, color: "text.disabled" }}>
          No activity recorded
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
    ) : (
      lines.map((line) => (
        <LineRow
          key={line.account_id ?? line.name}
          line={line}
          comparing={comparing}
        />
      ))
    )}
    <TableRow>
      <TableCell colSpan={2} sx={subtotalCellSx}>
        Net Cash from {title}
      </TableCell>
      <TableCell align="right" sx={subtotalCellSx}>
        {formatPeso(total)}
      </TableCell>
      {comparing && (
        <>
          <TableCell
            align="right"
            sx={{ ...subtotalCellSx, color: "text.secondary" }}
          >
            {formatPeso(previousTotal)}
          </TableCell>
          <TableCell
            align="right"
            sx={{ ...subtotalCellSx, color: "text.secondary" }}
          >
            {formatSignedPeso(Number(total) - Number(previousTotal ?? 0))}
          </TableCell>
        </>
      )}
    </TableRow>
  </>
);

export default CashFlowSection;
