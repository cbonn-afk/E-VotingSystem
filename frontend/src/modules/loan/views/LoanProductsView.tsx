"use client";

import { useState } from "react";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import LoanProductFormDialog from "../components/LoanProductFormDialog";
import { useLoanProducts } from "../hooks/useLoanProducts";
import type { LoanProduct } from "../types";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

const frequencyLabel = { weekly: "Weekly", semi_monthly: "Twice a month", monthly: "Monthly" } as const;

export default function LoanProductsView() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [editing, setEditing] = useState<LoanProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const query = useLoanProducts({ q: q || undefined, page: page + 1, per_page: perPage });
  const products = query.data?.data ?? [];

  const openForm = (product: LoanProduct | null) => {
    setEditing(product);
    setFormOpen(true);
  };

  return (
    <Card>
      <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Loan products
        </Typography>
        <TextField
          size="small"
          placeholder="Search code or name"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(0);
          }}
        />
        <Button variant="contained" onClick={() => openForm(null)}>
          Add product
        </Button>
      </CardContent>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Interest</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell>{product.code}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {frequencyLabel[product.payment_frequency]}
                  </Typography>
                </TableCell>
                <TableCell>
                  {peso.format(Number(product.min_amount))} to {peso.format(Number(product.max_amount))}
                </TableCell>
                <TableCell>
                  {Number(product.interest_rate)}% {product.interest_method === "flat" ? "flat" : "diminishing"}
                </TableCell>
                <TableCell>
                  {product.term_min_months} to {product.term_max_months} months
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="tonal"
                    label={product.status}
                    color={product.status === "active" ? "success" : "default"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => openForm(product)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!query.isLoading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography sx={{ py: 4, textAlign: "center" }}>
                    {q ? "No products match your search." : "No loan products yet. Add the first one."}
                  </Typography>
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

      <LoanProductFormDialog open={formOpen} product={editing} onClose={() => setFormOpen(false)} />
    </Card>
  );
}
