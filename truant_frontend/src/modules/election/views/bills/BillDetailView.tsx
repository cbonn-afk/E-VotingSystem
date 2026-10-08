"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import Link from "@components/Link";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import RecordPaymentDialog from "@/modules/accounting/components/bills/RecordPaymentDialog";
import AccountingStatusChip from "@/modules/accounting/components/shared/AccountingStatusChip";
import {
  useBill,
  useBillMutations,
} from "@/modules/accounting/hooks/useBillsApi";
import {
  formatDate,
  formatDateTime,
  formatPeso,
  getAccountingErrorMessage,
} from "@/modules/accounting/utils/accountingFormat";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value || "—"}</Typography>
  </Stack>
);

export default function BillDetailView({ billId }: { billId: string }) {
  const router = useRouter();
  const authorization = useAuthorization();
  const billQuery = useBill(billId);
  const mutations = useBillMutations();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const bill = billQuery.data?.data;
  const documents = bill?.documents ?? [];

  if (billQuery.isLoading) return <Typography>Loading expense…</Typography>;
  if (billQuery.isError || !bill)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => void billQuery.refetch()}>Retry</Button>}
      >
        The expense could not be loaded.
      </Alert>
    );

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title={bill.billReference}
        description={bill.expenseName}
      >
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            href="/accounting/expenses"
            variant="outlined"
            startIcon={<i className="bx bx-arrow-back" />}
          >
            Expenses
          </Button>
          {bill.status === "draft" &&
            authorization.can("accounting.expenses.update") && (
              <Button
                component={Link}
                href={`/accounting/expenses/${bill.id}/edit`}
                variant="outlined"
                startIcon={<i className="bx bx-edit" />}
              >
                Edit Draft
              </Button>
            )}
          {bill.status === "draft" &&
            authorization.can("accounting.expenses.update") && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<i className="bx bx-trash" />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete Draft
              </Button>
            )}
          {bill.status === "posted" &&
            bill.outstandingAmount > 0 &&
            authorization.can("accounting.expenses.payments.create") && (
              <Button
                variant="contained"
                startIcon={<i className="bx bx-wallet" />}
                onClick={() => setPaymentOpen(true)}
              >
                Record Payment
              </Button>
            )}
        </Stack>
      </AccountingPageHeader>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 4,
        }}
      >
        <Paper sx={{ p: 5 }}>
          <Stack spacing={4}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h5">Expense Information</Typography>
              <Stack direction="row" spacing={1}>
                <AccountingStatusChip status={bill.paymentStatus} />
                <AccountingStatusChip status={bill.status} />
              </Stack>
            </Stack>
            <Divider />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 4,
              }}
            >
              <Field
                label="Vendor"
                value={
                  bill.vendor ? (
                    <Link href={`/accounting/vendors/${bill.vendor.id}`}>
                      {bill.vendor.name}
                    </Link>
                  ) : null
                }
              />
              <Field label="Category" value={bill.category?.label} />
              <Field
                label="Payable Account"
                value={`${bill.payableAccount?.code ?? ""} · ${bill.payableAccount?.name ?? ""}`}
              />
              <Field
                label="Expense Date"
                value={formatDate(bill.expenseDate)}
              />
              <Field label="Notes" value={bill.notes} />
            </Box>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {documents.map((document, index) => (
                <Button
                  key={document.id}
                  component="a"
                  href={document.previewUrl}
                  target="_blank"
                  variant="outlined"
                  startIcon={<i className="bx bx-image" />}
                >
                  View document {index + 1}
                </Button>
              ))}
              {bill.recognitionJournalEntryId && (
                <Button
                  component={Link}
                  href={`/accounting/journals/${bill.recognitionJournalEntryId}`}
                  variant="outlined"
                  startIcon={<i className="bx bx-book-open" />}
                >
                  Recognition Journal
                </Button>
              )}
              {bill.vendor && (
                <Button
                  component={Link}
                  href={`/accounting/vendors/${bill.vendor.id}`}
                  variant="outlined"
                  startIcon={<i className="bx bx-building" />}
                >
                  Vendor
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Balance</Typography>
                <Field label="Total" value={formatPeso(bill.totalAmount)} />
                <Field label="Paid" value={formatPeso(bill.paidAmount)} />
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Outstanding
                </Typography>
                <Typography variant="h3" color="primary.main">
                  {formatPeso(bill.outstandingAmount)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          {bill.vendor && (
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Vendor Contact</Typography>
                  <Field label="Contact" value={bill.vendor.contactPerson} />
                  <Field label="Email" value={bill.vendor.email} />
                  <Field label="Phone" value={bill.vendor.phone} />
                  <Field label="TIN" value={bill.vendor.tin} />
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      <Paper sx={{ p: 5 }}>
        <Stack spacing={3}>
          <Typography variant="h5">Payment History</Typography>
          {bill.payments?.length ? (
            bill.payments.map((payment, index) => (
              <Stack
                key={payment.id}
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
                sx={{
                  py: 2,
                  borderBottom:
                    index < (bill.payments?.length ?? 0) - 1 ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={3}>
                  <Box
                    sx={{
                      inlineSize: 40,
                      blockSize: 40,
                      borderRadius: "50%",
                      bgcolor: "action.hover",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <i className="bx bx-credit-card" />
                  </Box>
                  <Stack>
                    <Typography fontWeight={600}>
                      {formatPeso(payment.amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(payment.paymentDate)} ·{" "}
                      {payment.paidFromAccount?.name} ·{" "}
                      {payment.reference || "No reference"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(payment.postedAt)}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountingStatusChip status={payment.status} />
                  {payment.journalEntryId && (
                    <Button
                      component={Link}
                      href={`/accounting/journals/${payment.journalEntryId}`}
                      size="small"
                    >
                      Journal
                    </Button>
                  )}
                  {payment.status === "posted" &&
                    authorization.can("accounting.expenses.payments.void") && (
                      <Button
                        color="error"
                        size="small"
                        onClick={() => {
                          const reason = window.prompt(
                            "Reason for voiding this payment?",
                          );
                          if (!reason || reason.trim().length < 3) return;
                          void mutations.voidPayment
                            .mutateAsync({
                              expenseId: bill.id,
                              paymentId: payment.id,
                              reason,
                            })
                            .then(() => toast.success("Payment voided."))
                            .catch((error) =>
                              toast.error(getAccountingErrorMessage(error)),
                            );
                        }}
                      >
                        Void
                      </Button>
                    )}
                </Stack>
              </Stack>
            ))
          ) : (
            <Typography color="text.secondary">
              No payments have been recorded.
            </Typography>
          )}
        </Stack>
      </Paper>

      <RecordPaymentDialog
        open={paymentOpen}
        outstanding={bill.outstandingAmount}
        saving={mutations.recordPayment.isPending}
        onClose={() => setPaymentOpen(false)}
        onSubmit={async (values, postNow) => {
          try {
            await mutations.recordPayment.mutateAsync({
              expenseId: bill.id,
              payload: {
                payment_date: values.paymentDate,
                amount: values.amount,
                paid_from_account_id: values.paidFromAccountId,
                reference: values.reference || null,
                notes: values.notes || null,
                post_now: postNow,
              },
            });
            toast.success(
              postNow ? "Payment posted." : "Payment saved as draft.",
            );
            setPaymentOpen(false);
          } catch (error) {
            toast.error(getAccountingErrorMessage(error));
          }
        }}
      />
      <CustomDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        closeAfterTransition
        title="Delete Draft Expense"
        description={`This permanently deletes "${bill.billReference}" — ${bill.expenseName}. This cannot be undone.`}
        icon={<i className="bx bx-trash" />}
        actions={
          <>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={mutations.deleteBill.isPending}
              onClick={() => {
                void mutations.deleteBill
                  .mutateAsync(bill.id)
                  .then(() => {
                    toast.success("Draft expense deleted.");
                    router.replace("/accounting/expenses");
                  })
                  .catch((error) =>
                    toast.error(getAccountingErrorMessage(error)),
                  );
              }}
            >
              Delete Draft
            </Button>
          </>
        }
      >
        <Box />
      </CustomDialog>
    </Stack>
  );
}
