"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useLoans } from "../hooks/useLoans";
import type { LoanStatus } from "../types";
import { formatDate, formatPeso } from "../utils/applicationStatus";

export default function LoansView() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LoanStatus | "">("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);

  const query = useLoans({ q: q || undefined, status, page: page + 1, per_page: perPage });
  const rows = query.data?.data ?? [];

  return (
    <Card>
      <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Loans and payments
        </Typography>
        <TextField
          size="small"
          placeholder="Loan number, member code or name"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(0);
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          sx={{ minWidth: 180 }}
          onChange={(event) => {
            setStatus(event.target.value as LoanStatus | "");
            setPage(0);
          }}
        >
          <MenuItem value="">All loans</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="fully_paid">Fully paid</MenuItem>
        </TextField>
      </CardContent>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Loan</TableCell>
              <TableCell>Member</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="right">Due now</TableCell>
              <TableCell>Next payment</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((loan) => (
              <TableRow key={loan.id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(`/loan/loans/${loan.id}`)}>
                <TableCell>{loan.loan_no}</TableCell>
                <TableCell>
                  {loan.member?.name}
                  <Typography variant="caption" color="text.secondary" display="block">
                    {loan.member?.member_code}
                  </Typography>
                </TableCell>
                <TableCell>{loan.product?.name}</TableCell>
                <TableCell align="right">{formatPeso(loan.summary.outstanding)}</TableCell>
                <TableCell align="right" sx={{ color: loan.summary.overdue_count > 0 ? "error.main" : undefined }}>
                  {Number(loan.summary.due_now) > 0 ? formatPeso(loan.summary.due_now) : "-"}
                </TableCell>
                <TableCell>{loan.summary.next_due ? `${formatPeso(loan.summary.next_due.amount)} on ${formatDate(loan.summary.next_due.due_date)}` : "-"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="tonal"
                    color={loan.status === "fully_paid" ? "success" : loan.summary.overdue_count > 0 ? "error" : "info"}
                    label={loan.status === "fully_paid" ? "Fully paid" : loan.summary.overdue_count > 0 ? "Overdue" : "Active"}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!query.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography sx={{ py: 4, textAlign: "center" }}>No loans match. Loans appear here once they are released.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={query.data?.meta.total ?? 0}
        page={page}
        rowsPerPage={perPage}
        rowsPerPageOptions={[15, 30, 50]}
        onPageChange={(_, next) => setPage(next)}
        onRowsPerPageChange={(event) => {
          setPerPage(Number(event.target.value));
          setPage(0);
        }}
      />
    </Card>
  );
}
