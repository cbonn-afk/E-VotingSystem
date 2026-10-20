"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import CollectionStatusChip from "../components/CollectionStatusChip";
import CollectionSummaryCards from "../components/CollectionSummaryCards";
import { useCollections, useCollectionSummary } from "../hooks/useCollections";
import type { AgingBucket, CollectionStatus } from "../types";
import { formatDate, formatPeso } from "../utils/applicationStatus";

export default function CollectionsView() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CollectionStatus | "">("");
  const [bucket, setBucket] = useState<AgingBucket | "">("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);

  const summary = useCollectionSummary();
  const query = useCollections({ q: q || undefined, status, bucket, page: page + 1, per_page: perPage });
  const rows = query.data?.data ?? [];

  const reset = () => setPage(0);

  return (
    <Stack spacing={4}>
      <Stack spacing={0.5}>
        <Typography variant="h4">Collections</Typography>
        <Typography variant="body2" color="text.secondary">
          Loans with a payment past due, worst first. Labels are refreshed every night and whenever a payment is recorded.
        </Typography>
      </Stack>

      {summary.data && <CollectionSummaryCards summary={summary.data.data} />}

      <Card>
        <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Follow-up list
          </Typography>
          <TextField
            size="small"
            placeholder="Loan, member code or name"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              reset();
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            sx={{ minWidth: 160 }}
            onChange={(event) => {
              setStatus(event.target.value as CollectionStatus | "");
              reset();
            }}
          >
            <MenuItem value="">All late loans</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
            <MenuItem value="delinquent">Delinquent</MenuItem>
            <MenuItem value="default">Default</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Days late"
            value={bucket}
            sx={{ minWidth: 150 }}
            onChange={(event) => {
              setBucket(event.target.value as AgingBucket | "");
              reset();
            }}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="1-30">1 to 30</MenuItem>
            <MenuItem value="31-60">31 to 60</MenuItem>
            <MenuItem value="61-90">61 to 90</MenuItem>
            <MenuItem value="91+">Over 90</MenuItem>
          </TextField>
        </CardContent>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Loan</TableCell>
                <TableCell align="right">Days late</TableCell>
                <TableCell align="right">Overdue amount</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Last payment</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(`/loan/loans/${row.id}`)}>
                  <TableCell>
                    {row.member?.name}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.member?.member_code}
                      {row.member?.mobile_number ? ` · ${row.member.mobile_number}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.loan_no}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.product?.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {row.days_past_due}
                    <Typography variant="caption" color="text.secondary" display="block">
                      since {formatDate(row.oldest_due_date)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatPeso(row.overdue_amount)}</TableCell>
                  <TableCell align="right">{formatPeso(row.outstanding_balance)}</TableCell>
                  <TableCell>{row.last_payment_on ? formatDate(row.last_payment_on) : "None yet"}</TableCell>
                  <TableCell>
                    <CollectionStatusChip status={row.collection_status} />
                  </TableCell>
                </TableRow>
              ))}
              {!query.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography sx={{ py: 4, textAlign: "center" }}>No late loans match. Nothing to follow up.</Typography>
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
    </Stack>
  );
}
