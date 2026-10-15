// MUI Imports
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

// Component Imports
import type { CustomTableColumn } from "@components/app/CustomTable";
import { formatCurrency, renderStatusChip } from "../shared/statusUtils";

// Type Imports
import type { CashAdvance } from "../../types";

export const getAdvancesTableColumns = (actions: {
  onDecision: (
    advance: CashAdvance,
    decision: "approve" | "deny" | "view",
  ) => void;
}): CustomTableColumn<CashAdvance>[] => [
  { id: "employeeName", label: "Employee", sortable: true, minWidth: 180 },
  {
    id: "requestedAmount",
    label: "Requested Amount",
    sortable: true,
    align: "right",
    minWidth: 180,
    render: (row) => formatCurrency(row.requestedAmount),
  },
  { id: "reason", label: "Reason", minWidth: 220 },
  { id: "repaymentMethod", label: "Repayment Method", minWidth: 230 },
  {
    id: "requestedDate",
    label: "Requested Date",
    sortable: true,
    minWidth: 150,
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    minWidth: 130,
    render: (row) => renderStatusChip(row.status),
  },
  { id: "approvedBy", label: "Approved By", minWidth: 150 },
  {
    id: "actions",
    label: "Actions",
    minWidth: 290,
    render: (row) => (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="tonal"
          onClick={() => actions.onDecision(row, "view")}
        >
          View Details
        </Button>
        <Button
          size="small"
          variant="tonal"
          color="success"
          onClick={() => actions.onDecision(row, "approve")}
        >
          Approve Advance
        </Button>
        <Button
          size="small"
          variant="tonal"
          color="error"
          onClick={() => actions.onDecision(row, "deny")}
        >
          Deny
        </Button>
      </Stack>
    ),
  },
];
