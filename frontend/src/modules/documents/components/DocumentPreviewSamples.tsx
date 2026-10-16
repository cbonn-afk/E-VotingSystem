"use client";

import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

import PrintDocumentFrame from "./PrintDocumentFrame";
import type { DocumentSettings } from "../types";

export type PreviewKind = "agreement" | "receipt" | "report" | "results";

export const previewTabs: { value: PreviewKind; label: string }[] = [
  { value: "agreement", label: "Loan Agreement" },
  { value: "receipt", label: "Loan Receipt" },
  { value: "report", label: "Financial Report" },
  { value: "results", label: "Election Results" },
];

const Row = ({ label, value }: { label: string; value: string }) => (
  <Stack direction="row" justifyContent="space-between" spacing={3}>
    <Typography sx={{ fontSize: "0.78rem", color: "#4b5563 !important" }}>{label}</Typography>
    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{value}</Typography>
  </Stack>
);

const SimpleTable = ({ head, rows, right = [] }: { head: string[]; rows: string[][]; right?: number[] }) => (
  <table>
    <thead>
      <tr>
        {head.map((cell, i) => (
          <th key={cell} style={{ textAlign: right.includes(i) ? "right" : "left" }}>
            {cell}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, r) => (
        <tr key={r}>
          {row.map((cell, i) => (
            <td key={i} style={{ textAlign: right.includes(i) ? "right" : "left" }}>
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/**
 * Representative sample documents drawn with the same PrintDocumentFrame the
 * real printables use, so the preview shows exactly what will print.
 */
const DocumentPreviewSamples = ({ kind, settings }: { kind: PreviewKind; settings: DocumentSettings }) => {
  // Preview with the signed-in user's name, as the real printouts do.
  const userName = useCurrentUser().data?.name ?? "Your Name";
  const common = { preview: true as const, settings, preparedBy: userName };

  if (kind === "receipt") {
    return (
      <PrintDocumentFrame
        {...common}
        title="Loan Release Receipt"
        subtitle="RCT-2026-0007 · Oct 16, 2026"
        signatures={[{ label: "Received by (Borrower)" }, { label: "Released by", note: userName }]}
      >
        <Stack spacing={0.75}>
          <Row label="Member" value="Juan Dela Cruz (M-0042)" />
          <Row label="Loan" value="LN-2026-0012 · Regular Loan" />
          <Row label="Loan amount" value="₱50,000.00" />
          <Row label="Fees" value="₱750.00 (deducted)" />
          <Row label="Amount released" value="₱49,250.00" />
          <Row label="First payment due" value="Nov 16, 2026" />
        </Stack>
      </PrintDocumentFrame>
    );
  }

  if (kind === "report") {
    return (
      <PrintDocumentFrame {...common} title="Income Statement" subtitle="For the year ended Dec 31, 2026">
        <SimpleTable
          head={["Account", "Current", "Previous"]}
          right={[1, 2]}
          rows={[
            ["Interest income", "₱412,300.00", "₱378,900.00"],
            ["Service fees", "₱58,200.00", "₱49,100.00"],
            ["Membership fees", "₱21,000.00", "₱19,500.00"],
            ["Operating expenses", "(₱186,450.00)", "(₱171,200.00)"],
            ["Net surplus", "₱305,050.00", "₱276,300.00"],
          ]}
        />
      </PrintDocumentFrame>
    );
  }

  if (kind === "results") {
    return (
      <PrintDocumentFrame {...common} title="Election Summary" subtitle="2026 Annual General Assembly">
        <Stack spacing={3}>
          <SimpleTable
            head={["Turnout", "Count", "Of registered"]}
            right={[1, 2]}
            rows={[
              ["Registered members", "412", ""],
              ["Voted (candidates)", "338", "82.04 %"],
            ]}
          />
          <SimpleTable
            head={["Board of Directors (3 seats)", "Votes", "Result"]}
            right={[1]}
            rows={[
              ["1. Maria Santos", "301", "Elected"],
              ["2. Pedro Reyes", "287", "Elected"],
              ["3. Ana Lim", "260", "Elected"],
              ["4. Jose Cruz", "198", ""],
            ]}
          />
        </Stack>
      </PrintDocumentFrame>
    );
  }

  return (
    <PrintDocumentFrame
      {...common}
      title="Loan Agreement"
      subtitle="AGR-2026-0012 · Application APP-2026-0031 · Oct 16, 2026"
      signatures={[{ label: "Borrower", note: "Juan Dela Cruz" }, { label: "For the Cooperative" }]}
    >
      <Stack spacing={2.5}>
        <Typography sx={{ fontSize: "0.8rem" }}>
          Between the Cooperative (the &quot;Lender&quot;) and <strong>Juan Dela Cruz</strong> (the &quot;Borrower&quot;).
        </Typography>
        <Stack spacing={0.75}>
          <Row label="Loan amount" value="₱50,000.00" />
          <Row label="Interest" value="12% a year, diminishing" />
          <Row label="Term" value="12 months" />
          <Row label="Payments" value="12 monthly payments of ₱4,442.44" />
        </Stack>
        <Divider />
        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{settings.termsTitle}</Typography>
        <Typography sx={{ fontSize: "0.76rem", whiteSpace: "pre-wrap" }}>
          {"1. The Borrower promises to repay the loan in full, with interest, on the due dates in the payment schedule.\n2. A penalty is charged on any overdue amount after the grace period."}
        </Typography>
      </Stack>
    </PrintDocumentFrame>
  );
};

export default DocumentPreviewSamples;
