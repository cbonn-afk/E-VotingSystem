"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { PaymentReceiptDocument, PrintButton, PrintStyles } from "../components/PrintDocuments";
import { useLoan } from "../hooks/useLoans";

export default function PaymentReceiptView({ loanId, paymentId }: { loanId: number; paymentId: number }) {
  const query = useLoan(loanId);
  const loan = query.data?.data;
  const payment = loan?.payments?.find((p) => p.id === paymentId);

  if (query.isPending) return <CircularProgress size={32} />;
  if (!loan || !payment || payment.status !== "posted") return <Alert severity="info">This receipt is not available. The payment may have been voided.</Alert>;

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <PrintStyles />
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="center">
          <PrintButton label="Print receipt" />
        </Stack>
        <PaymentReceiptDocument loan={loan} payment={payment} />
      </Stack>
    </Box>
  );
}
