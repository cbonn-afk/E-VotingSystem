"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import type { MemberStatement } from "../../api/types";
import {
  formatDate,
  formatMoney,
  transactionModeLabels,
  transactionTypeLabels,
} from "../../utils/inquiryFormat";

type Props = {
  statement: MemberStatement;
  secondsLeft: number;
  onExit: () => void;
};

type TabKey = "balances" | "transactions" | "loans";

const right = { textAlign: "right" } as const;

export default function StatementPanel({ statement, secondsLeft, onExit }: Props) {
  const [tab, setTab] = useState<TabKey>("balances");
  const { member, loans, transactions } = statement;

  const balances: [string, string][] = [
    ["Share Capital", member.share_capital],
    ["Regular Savings", member.regular_savings],
    ["Savings Bonus", member.savings_bonus],
    ["Time Deposit", member.time_deposit],
  ];

  return (
    <Stack spacing={4} sx={{ maxInlineSize: 1100, inlineSize: "100%", mx: "auto", p: { xs: 3, md: 5 } }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h3">{member.member_name}</Typography>
        <Typography variant="h6" color="text.secondary">
          Member Code {member.member_code}
        </Typography>
        {statement.has_statement && (
          <Typography color="text.secondary">Balances as of {formatDate(member.as_of_date)}</Typography>
        )}
      </Paper>

      {!statement.has_statement && (
        <Alert severity="info">
          No balance statement has been loaded for you yet. Please check with the cooperative office.
        </Alert>
      )}

      <Paper>
        <Tabs value={tab} onChange={(_, value: TabKey) => setTab(value)} variant="fullWidth">
          <Tab value="balances" label="Balances & Dividends" />
          <Tab value="transactions" label="Transactions" />
          <Tab value="loans" label={`Loans (${loans.length})`} />
        </Tabs>

        <TableContainer sx={{ maxBlockSize: 460 }}>
          {tab === "balances" && statement.has_statement && (
            <Table>
              <TableBody>
                {balances.map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
                    <TableCell sx={right}>{formatMoney(value)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: 700, bgcolor: "action.hover" }}>
                    Dividend computation
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Credited to Share Capital</TableCell>
                  <TableCell sx={right}>{formatMoney(member.dividend_to_share_capital)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Credited to Bank / Savings</TableCell>
                  <TableCell sx={right}>{formatMoney(member.dividend_to_savings)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {tab === "transactions" && (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Transaction</TableCell>
                  <TableCell sx={right}>Amount</TableCell>
                  <TableCell sx={right}>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No transactions on record.
                    </TableCell>
                  </TableRow>
                )}
                {transactions.map((tx, index) => (
                  <TableRow key={`${tx.transacted_on}-${index}`}>
                    <TableCell>{formatDate(tx.transacted_on)}</TableCell>
                    <TableCell>{transactionTypeLabels[tx.account_type] ?? tx.account_type}</TableCell>
                    <TableCell>{transactionModeLabels[tx.mode] ?? tx.mode}</TableCell>
                    <TableCell sx={right}>{formatMoney(tx.amount)}</TableCell>
                    <TableCell sx={right}>{formatMoney(tx.running_balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {tab === "loans" && (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Loan No.</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell sx={right}>Principal</TableCell>
                  <TableCell sx={right}>Principal Paid</TableCell>
                  <TableCell sx={right}>Principal Balance</TableCell>
                  <TableCell sx={right}>Interest Balance</TableCell>
                  <TableCell>Released</TableCell>
                  <TableCell>Maturity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No loans on record.
                    </TableCell>
                  </TableRow>
                )}
                {loans.map((loan) => (
                  <TableRow key={loan.loan_number}>
                    <TableCell>{loan.loan_number}</TableCell>
                    <TableCell>{loan.loan_type}</TableCell>
                    <TableCell sx={right}>{formatMoney(loan.principal)}</TableCell>
                    <TableCell sx={right}>{formatMoney(loan.principal_paid)}</TableCell>
                    <TableCell sx={right}>{formatMoney(loan.principal_balance)}</TableCell>
                    <TableCell sx={right}>{formatMoney(loan.interest_balance)}</TableCell>
                    <TableCell>{formatDate(loan.released_on)}</TableCell>
                    <TableCell>{formatDate(loan.maturity_on)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      {statement.contact_note && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {statement.contact_note}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button fullWidth size="large" color="error" variant="tonal" disabled>
          Signing out in {secondsLeft}s
        </Button>
        <Button fullWidth size="large" variant="contained" onClick={onExit}>
          Exit
        </Button>
      </Box>
    </Stack>
  );
}
