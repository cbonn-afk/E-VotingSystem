"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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

import ApplicationStatusChip from "../components/ApplicationStatusChip";
import { useLoanApplications } from "../hooks/useLoanApplications";
import type { ApplicationStatus } from "../types";
import { applicationStatusLabel, formatDateTime, formatPeso, staffStatusFilters } from "../utils/applicationStatus";

export default function LoanApplicationsView() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);

  const query = useLoanApplications({ q: q || undefined, status, page: page + 1, per_page: perPage });
  const rows = query.data?.data ?? [];

  return (
    <Card>
      <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Loan applications
        </Typography>
        <TextField
          size="small"
          placeholder="Reference, member code or name"
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
          sx={{ minWidth: 200 }}
          onChange={(event) => {
            setStatus(event.target.value as ApplicationStatus | "");
            setPage(0);
          }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {staffStatusFilters.map((value) => (
            <MenuItem key={value} value={value}>
              {applicationStatusLabel[value]}
            </MenuItem>
          ))}
        </TextField>
      </CardContent>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell>
              <TableCell>Member</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(`/loan/applications/${row.id}`)}>
                <TableCell>{row.reference_no}</TableCell>
                <TableCell>
                  {row.member?.name}
                  <Typography variant="caption" color="text.secondary" display="block">
                    {row.member?.member_code}
                  </Typography>
                </TableCell>
                <TableCell>{row.product?.name}</TableCell>
                <TableCell>
                  {formatPeso(row.amount)} / {row.term_months} mo
                </TableCell>
                <TableCell>{formatDateTime(row.submitted_at)}</TableCell>
                <TableCell>
                  <ApplicationStatusChip status={row.status} />
                </TableCell>
              </TableRow>
            ))}
            {!query.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 4, textAlign: "center" }}>No submitted applications match.</Typography>
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
