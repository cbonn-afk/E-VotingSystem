// MUI Imports
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

// Component Imports
import type { CustomTableColumn } from "@components/app/CustomTable";
import { formatCurrency, renderStatusChip } from "../shared/statusUtils";

// Type Imports
import type { PayrollRun } from "../../types";

export const getPayrollTableColumns = (actions: {
  onAction: (payroll: PayrollRun, action: string) => void;
}): CustomTableColumn<PayrollRun>[] => [
  { id: "runNo", label: "Payroll Run No.", sortable: true, minWidth: 160 },
  { id: "payPeriod", label: "Pay Period", sortable: true, minWidth: 160 },
  {
    id: "employeesIncluded",
    label: "Employees Included",
    sortable: true,
    align: "right",
    minWidth: 170,
  },
  {
    id: "grossPay",
    label: "Gross Pay",
    sortable: true,
    align: "right",
    minWidth: 140,
    render: (row) => formatCurrency(row.grossPay),
  },
  {
    id: "overtimePay",
    label: "Overtime Pay",
    sortable: true,
    align: "right",
    minWidth: 150,
    render: (row) => formatCurrency(row.overtimePay),
  },
  {
    id: "advancesDeducted",
    label: "Advances Deducted",
    sortable: true,
    align: "right",
    minWidth: 180,
    render: (row) => formatCurrency(row.advancesDeducted),
  },
  {
    id: "otherDeductions",
    label: "Other Deductions",
    sortable: true,
    align: "right",
    minWidth: 170,
    render: (row) => formatCurrency(row.otherDeductions),
  },
  {
    id: "netPay",
    label: "Net Pay",
    sortable: true,
    align: "right",
    minWidth: 140,
    render: (row) => formatCurrency(row.netPay),
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    minWidth: 130,
    render: (row) => renderStatusChip(row.status),
  },
  {
    id: "actions",
    label: "Actions",
    minWidth: 360,
    render: (row) => (
      <Stack direction="row" spacing={1}>
        {["View", "Review", "Approve", "Mark as Paid", "Export Payslip"].map(
          (action) => (
            <Button
              key={action}
              size="small"
              variant="tonal"
              onClick={() => actions.onAction(row, action)}
            >
              {action}
            </Button>
          ),
        )}
      </Stack>
    ),
  },
];
