"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomTable, {
  type CustomTableColumn,
} from "@components/app/CustomTable";
import Link from "@components/Link";
import type {
  ExpensePaymentResource,
  ExpenseResource,
} from "@/modules/accounting/api/types";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import AccountingStatusChip from "@/modules/accounting/components/shared/AccountingStatusChip";
import { useVendor } from "@/modules/accounting/hooks/useVendorsApi";
import {
  formatDate,
  formatPeso,
} from "@/modules/accounting/utils/accountingFormat";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value || "—"}</Typography>
  </Stack>
);

export default function VendorDetailView({ vendorId }: { vendorId: string }) {
  const query = useVendor(vendorId);
  const vendor = query.data?.data;
  if (query.isLoading) return <Typography>Loading vendor…</Typography>;
  if (query.isError || !vendor)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => void query.refetch()}>Retry</Button>}
      >
        The vendor could not be loaded.
      </Alert>
    );

  const billColumns: CustomTableColumn<ExpenseResource>[] = [
    {
      id: "bill",
      label: "Expense",
      minWidth: 170,
      render: (bill) => (
        <Typography
          component={Link}
          href={`/accounting/expenses/${bill.id}`}
          color="primary.main"
          fontWeight={600}
        >
          {bill.billReference}
        </Typography>
      ),
    },
    {
      id: "date",
      label: "Expense Date",
      minWidth: 110,
      render: (bill) => formatDate(bill.expenseDate),
    },
    {
      id: "category",
      label: "Category",
      minWidth: 150,
      render: (bill) => bill.category?.label ?? "—",
    },
    {
      id: "total",
      label: "Total",
      minWidth: 110,
      align: "right",
      render: (bill) => formatPeso(bill.totalAmount),
    },
    {
      id: "balance",
      label: "Balance",
      minWidth: 110,
      align: "right",
      render: (bill) => formatPeso(bill.outstandingAmount),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 120,
      render: (bill) => <AccountingStatusChip status={bill.paymentStatus} />,
    },
  ];
  const paymentColumns: CustomTableColumn<ExpensePaymentResource>[] = [
    {
      id: "date",
      label: "Payment Date",
      minWidth: 120,
      render: (payment) => formatDate(payment.paymentDate),
    },
    {
      id: "reference",
      label: "Reference",
      minWidth: 150,
      render: (payment) => payment.reference || "—",
    },
    {
      id: "account",
      label: "Paid From",
      minWidth: 170,
      render: (payment) => payment.paidFromAccount?.name ?? "—",
    },
    {
      id: "amount",
      label: "Amount",
      minWidth: 120,
      align: "right",
      render: (payment) => formatPeso(payment.amount),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      render: (payment) => <AccountingStatusChip status={payment.status} />,
    },
    {
      id: "journal",
      label: "Journal",
      minWidth: 90,
      render: (payment) =>
        payment.journalEntryId ? (
          <Button
            component={Link}
            href={`/accounting/journals/${payment.journalEntryId}`}
            size="small"
          >
            Open
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  const bills = (vendor.bills ?? []).filter(
    (bill) => bill.status === "posted" && bill.outstandingAmount > 0,
  );
  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title={vendor.name}
        description={`${vendor.vendorNo} · Vendor master and payable activity`}
      >
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            href="/accounting/vendors"
            variant="outlined"
            startIcon={<i className="bx bx-arrow-back" />}
          >
            Vendors
          </Button>
          <AccountingStatusChip status={vendor.status} />
        </Stack>
      </AccountingPageHeader>
      <Box
        sx={{
          display: "grid",
          gap: 4,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        }}
      >
        <Card>
          <CardContent>
            <Field
              label="Current Payable Balance"
              value={
                <Typography variant="h3" color="primary.main">
                  {formatPeso(vendor.totalOutstanding)}
                </Typography>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Field
              label="Open Expenses"
              value={<Typography variant="h3">{vendor.openBills}</Typography>}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Field
              label="Total Paid"
              value={
                <Typography variant="h3" color="success.main">
                  {formatPeso(vendor.totalPaid)}
                </Typography>
              }
            />
          </CardContent>
        </Card>
      </Box>
      <Paper sx={{ p: 5 }}>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Vendor Information
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 4,
          }}
        >
          <Field label="Legal Name" value={vendor.legalName} />
          <Field label="TIN" value={vendor.tin} />
          <Field label="Contact Person" value={vendor.contactPerson} />
          <Field label="Email" value={vendor.email} />
          <Field label="Phone" value={vendor.phone} />
          <Field
            label="Default Payable Account"
            value={
              vendor.defaultPayableAccount
                ? `${vendor.defaultPayableAccount.code} · ${vendor.defaultPayableAccount.name}`
                : "Category default"
            }
          />
          <Field label="Address" value={vendor.address} />
          <Field label="Notes" value={vendor.notes} />
        </Box>
      </Paper>
      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h5">Open Expenses</Typography>
        </Box>
        <CustomTable
          rows={bills}
          columns={billColumns}
          getRowId={(row) => row.id}
          density="compact"
          disableRowSelectionOnClick
          emptyTitle="No open expenses"
          emptyDescription="This vendor has no outstanding posted expenses."
          sx={{ minBlockSize: 320 }}
        />
      </Paper>
      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h5">Payment History</Typography>
        </Box>
        <CustomTable
          rows={vendor.paymentHistory ?? []}
          columns={paymentColumns}
          getRowId={(row) => row.id}
          density="compact"
          disableRowSelectionOnClick
          emptyTitle="No payments"
          emptyDescription="No payment history is available for this vendor."
          sx={{ minBlockSize: 320 }}
        />
      </Paper>
    </Stack>
  );
}
