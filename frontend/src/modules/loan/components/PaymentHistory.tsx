"use client";

import { useState } from "react";

import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import type { LoanPaymentRecord } from "../types";
import { formatDate, formatDateTime, formatPeso, paymentMethodLabel } from "../utils/applicationStatus";
import RemarksDialog from "./RemarksDialog";

type Props = {
  payments: LoanPaymentRecord[];
  /** Where a printable receipt lives, per payment. Omit for the member portal. */
  receiptHref?: (payment: LoanPaymentRecord) => string;
  canVoid?: boolean;
  voidPending?: boolean;
  onVoid?: (payment: LoanPaymentRecord, reason: string) => void;
};

export default function PaymentHistory({ payments, receiptHref, canVoid, voidPending, onVoid }: Props) {
  const [voiding, setVoiding] = useState<LoanPaymentRecord | null>(null);
  // Only the latest posted payment can be undone, because later payments depend on it.
  const latestPosted = payments.find((p) => p.status === "posted");

  if (payments.length === 0) return <Typography variant="body2">No payments yet.</Typography>;

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Receipt</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Paid by</TableCell>
              <TableCell>Applied to</TableCell>
              <TableCell align="right">Balance after</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} sx={payment.status === "voided" ? { opacity: 0.55 } : undefined}>
                <TableCell>
                  {payment.receipt_no}
                  {payment.status === "voided" && (
                    <Stack spacing={0.25}>
                      <Chip size="small" variant="tonal" color="error" label="Voided" sx={{ alignSelf: "flex-start" }} />
                      <Typography variant="caption" color="text.secondary">
                        {payment.voided_by_name} · {formatDateTime(payment.voided_at ?? null)}: {payment.void_reason}
                      </Typography>
                    </Stack>
                  )}
                </TableCell>
                <TableCell>{formatDate(payment.paid_on)}</TableCell>
                <TableCell align="right">{formatPeso(payment.amount)}</TableCell>
                <TableCell>
                  {paymentMethodLabel[payment.method]}
                  {payment.reference_no ? ` · ${payment.reference_no}` : ""}
                  {payment.received_by_name && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {payment.received_by_name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" display="block">Penalty {formatPeso(payment.applied_to.penalty)}</Typography>
                  <Typography variant="caption" display="block">Interest {formatPeso(payment.applied_to.interest)}</Typography>
                  <Typography variant="caption" display="block">Principal {formatPeso(payment.applied_to.principal)}</Typography>
                </TableCell>
                <TableCell align="right">{formatPeso(Number(payment.balance_after) + Number(payment.penalty_after))}</TableCell>
                <TableCell align="right">
                  {receiptHref && payment.status === "posted" && (
                    <Button size="small" href={receiptHref(payment)} target="_blank" rel="noopener">
                      Receipt
                    </Button>
                  )}
                  {canVoid && onVoid && latestPosted?.id === payment.id && (
                    <Button size="small" color="error" onClick={() => setVoiding(payment)}>
                      Void
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <RemarksDialog
        open={voiding !== null}
        title={`Void payment ${voiding?.receipt_no ?? ""}`}
        label="Why is this payment being voided?"
        confirmLabel="Void payment"
        pending={Boolean(voidPending)}
        onClose={() => setVoiding(null)}
        onConfirm={(reason) => {
          if (voiding && onVoid) onVoid(voiding, reason);
          setVoiding(null);
        }}
      />
    </>
  );
}
