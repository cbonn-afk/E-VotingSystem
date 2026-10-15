"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import BillForm from "@/modules/accounting/components/bills/BillForm";
import { useBill } from "@/modules/accounting/hooks/useBillsApi";

export default function BillEditView({ billId }: { billId: string }) {
  const billQuery = useBill(billId);
  const bill = billQuery.data?.data;

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

  // Matches the backend's ExpenseWorkflowService::assertDraft — only a draft
  // bill can be edited this way.
  if (bill.status !== "draft")
    return (
      <Alert severity="warning">
        Only draft expenses can be edited. This expense is already {bill.status}
        .
      </Alert>
    );

  return <BillForm bill={bill} />;
}
