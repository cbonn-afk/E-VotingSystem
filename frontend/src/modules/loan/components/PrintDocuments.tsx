"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { LoanAccount, LoanAgreement, LoanApplication } from "../types";
import { formatDate, formatDateTime, formatPeso, frequencyLabel, interestMethodLabel, releaseMethodLabel } from "../utils/applicationStatus";
import ScheduleTable from "./ScheduleTable";

/** Hides everything except the document when printing, and the Print button itself. */
export function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        .print-area, .print-area * { visibility: visible !important; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; box-shadow: none !important; }
        .no-print { display: none !important; }
      }
    `}</style>
  );
}

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <Button className="no-print" variant="contained" onClick={() => window.print()}>
      {label}
    </Button>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <Stack direction="row" justifyContent="space-between" spacing={3}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} textAlign="right">
      {value}
    </Typography>
  </Stack>
);

const SignatureLine = ({ label, note }: { label: string; note?: string }) => (
  <Stack spacing={0.5} sx={{ flex: 1 }}>
    <Box sx={{ borderBottom: 1, borderColor: "text.primary", height: 48 }} />
    <Typography variant="caption">{label}</Typography>
    {note && (
      <Typography variant="caption" color="text.secondary">
        {note}
      </Typography>
    )}
  </Stack>
);

export function AgreementDocument({ application, agreement }: { application: LoanApplication; agreement: LoanAgreement }) {
  const fees = Number(agreement.processing_fee) + Number(agreement.service_fee);
  const accepted =
    agreement.signed_method === "portal"
      ? `Accepted electronically by ${application.member?.name ?? "the Borrower"} on ${formatDateTime(agreement.signed_at)}.`
      : agreement.signed_method === "paper"
        ? `A signed paper copy was received on ${formatDateTime(agreement.signed_at)}.`
        : null;

  return (
    <Box className="print-area" sx={{ bgcolor: "background.paper", p: 5, maxWidth: 820, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h5" fontWeight="bold">
            LOAN AGREEMENT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {agreement.agreement_no} · Application {application.reference_no} · {formatDate(agreement.generated_at)}
          </Typography>
        </Stack>

        <Typography variant="body2">
          Between the Cooperative (the &quot;Lender&quot;) and <strong>{application.member?.name}</strong> (Member code {application.member?.member_code}), the
          &quot;Borrower&quot;, for the <strong>{application.product?.name}</strong> loan on the following terms.
        </Typography>

        <Stack spacing={0.75}>
          <Row label="Loan amount" value={formatPeso(agreement.principal)} />
          <Row label="Interest" value={`${Number(agreement.interest_rate)}% a year, ${interestMethodLabel[agreement.interest_method].toLowerCase()}`} />
          <Row label="Term" value={`${agreement.term_months} months`} />
          <Row label="Payments" value={`${agreement.installments_count} ${frequencyLabel[agreement.payment_frequency].toLowerCase()} payments of ${formatPeso(agreement.installment_amount)}`} />
          <Row label="Total interest" value={formatPeso(agreement.total_interest)} />
          <Row label="Processing fee" value={formatPeso(agreement.processing_fee)} />
          <Row label="Service fee" value={formatPeso(agreement.service_fee)} />
          <Row
            label={agreement.fee_handling === "deduct_from_proceeds" ? "Amount to be released (after fees)" : "Amount to be released"}
            value={formatPeso(agreement.net_proceeds)}
          />
          {agreement.fee_handling === "collect_separately" && fees > 0 && <Row label="Fees paid separately" value={formatPeso(fees)} />}
          <Row label="Late penalty" value={`${Number(agreement.penalty_rate_percent)}% a month after a ${agreement.grace_period_days}-day grace period`} />
          <Row label="First payment due" value={formatDate(agreement.first_due_date)} />
          <Row label="Final payment due" value={formatDate(agreement.maturity_date)} />
        </Stack>

        <Divider />
        <Typography variant="subtitle1">Payment schedule</Typography>
        <ScheduleTable items={agreement.schedule} />

        <Divider />
        <Typography variant="subtitle1">Terms and conditions</Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {agreement.terms_text}
        </Typography>

        <Divider />
        {accepted && <Typography variant="body2">{accepted}</Typography>}
        <Stack direction="row" spacing={6} sx={{ pt: 3 }}>
          <SignatureLine label="Borrower" note={application.member?.name} />
          <SignatureLine label="For the Cooperative" />
        </Stack>
      </Stack>
    </Box>
  );
}

export function ReceiptDocument({ application, loan }: { application: LoanApplication; loan: LoanAccount }) {
  const release = loan.release;

  if (!release) return null;

  return (
    <Box className="print-area" sx={{ bgcolor: "background.paper", p: 5, maxWidth: 620, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h5" fontWeight="bold">
            LOAN RELEASE RECEIPT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {release.receipt_no} · {formatDateTime(release.released_at)}
          </Typography>
        </Stack>

        <Stack spacing={0.75}>
          <Row label="Member" value={`${application.member?.name} (${application.member?.member_code})`} />
          <Row label="Loan" value={`${loan.loan_no} · ${application.product?.name}`} />
          <Row label="Loan amount" value={formatPeso(loan.principal)} />
          <Row label="Fees" value={`${formatPeso(release.fees_total)}${release.fee_handling === "deduct_from_proceeds" ? " (deducted)" : " (paid separately)"}`} />
          <Row label="Amount released" value={formatPeso(release.amount_released)} />
          <Row label="Method" value={`${releaseMethodLabel[release.method]}${release.reference_no ? ` · ${release.reference_no}` : ""}`} />
          <Row label="First payment due" value={formatDate(loan.first_due_date)} />
          <Row label="Released by" value={release.released_by_name} />
          {release.remarks && <Row label="Remarks" value={release.remarks} />}
        </Stack>

        <Stack direction="row" spacing={6} sx={{ pt: 4 }}>
          <SignatureLine label="Received by (Borrower)" />
          <SignatureLine label="Released by" note={release.released_by_name} />
        </Stack>
      </Stack>
    </Box>
  );
}
