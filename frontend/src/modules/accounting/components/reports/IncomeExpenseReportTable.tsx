"use client";

import { Fragment, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import type {
  IncomeExpenseExpenseRow,
  IncomeExpenseIncomeRow,
  IncomeExpensePaymentStatus,
  IncomeExpensePayrollEmployee,
  IncomeExpensePayrollRow,
} from "../../api/types";
import { statementTableSx } from "../shared/centerColumns";
import { formatDate, formatPeso } from "../../utils/accountingFormat";

export type IncomeExpenseSection = "income" | "bills" | "payroll" | "expenses";

type Props =
  | {
      section: "income";
      rows: IncomeExpenseIncomeRow[];
      onViewDocuments?: (row: IncomeExpenseIncomeRow) => void;
    }
  | {
      section: "bills" | "expenses";
      rows: IncomeExpenseExpenseRow[];
    }
  | {
      section: "payroll";
      rows: IncomeExpensePayrollRow[];
      showPayrollDetails?: boolean;
    };

const sectionMeta: Record<
  IncomeExpenseSection,
  { title: string; description: string; icon: string; color: string }
> = {
  income: {
    title: "Income",
    description: "Issued invoices, collections, and open receivables",
    icon: "bx-trending-up",
    color: "success.main",
  },
  bills: {
    title: "Bills",
    description: "Posted expenses tied to vendors",
    icon: "bx-receipt",
    color: "error.main",
  },
  payroll: {
    title: "Payroll",
    description: "Released employee and tailor payroll runs",
    icon: "bx-group",
    color: "warning.main",
  },
  expenses: {
    title: "Expenses",
    description: "Posted direct expenses without a required vendor",
    icon: "bx-wallet",
    color: "error.main",
  },
};

const statusMeta: Record<
  IncomeExpensePaymentStatus,
  { label: string; color: "success" | "warning" | "error" }
> = {
  paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partial", color: "warning" },
  unpaid: { label: "Unpaid", color: "error" },
};

const PaymentStatusChip = ({
  status,
}: {
  status: IncomeExpensePaymentStatus;
}) => {
  const meta = statusMeta[status];

  return (
    <Chip size="small" variant="tonal" color={meta.color} label={meta.label} />
  );
};

const ReferenceCell = ({
  reference,
  secondary,
}: {
  reference: string;
  secondary?: string | null;
}) => (
  <Stack spacing={0.25}>
    <Typography variant="body2" fontWeight={600}>
      {reference}
    </Typography>
    {secondary && (
      <Typography variant="caption" color="text.secondary">
        {secondary}
      </Typography>
    )}
  </Stack>
);

const BomExpenseCell = ({ row }: { row: IncomeExpenseIncomeRow }) => {
  if (row.expense_amount != null) {
    return (
      <Typography variant="body2" fontWeight={600} color="error.main">
        {formatPeso(row.expense_amount)}
      </Typography>
    );
  }

  return (
    <Chip
      size="small"
      variant="tonal"
      color={row.bom_status === "Draft" ? "warning" : "secondary"}
      label={row.bom_status === "Draft" ? "Draft BOM" : "Not costed"}
    />
  );
};

const NetSalesCell = ({ row }: { row: IncomeExpenseIncomeRow }) => {
  if (row.net_sales_amount != null) {
    return (
      <Typography variant="body2" fontWeight={700} color="success.main">
        {formatPeso(row.net_sales_amount)}
      </Typography>
    );
  }

  return (
    <Typography variant="body2" color="text.secondary">
      Not costed
    </Typography>
  );
};

const EmptyRow = ({ colSpan }: { colSpan: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
      <Stack spacing={1} alignItems="center">
        <i
          className="bx bx-folder-open"
          style={{ fontSize: 28, opacity: 0.45 }}
        />
        <Typography variant="body2" color="text.secondary">
          No records match the selected filters.
        </Typography>
      </Stack>
    </TableCell>
  </TableRow>
);

const IncomeRows = ({
  rows,
  onViewDocuments,
}: {
  rows: IncomeExpenseIncomeRow[];
  onViewDocuments?: (row: IncomeExpenseIncomeRow) => void;
}) => (
  <>
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>Invoice</TableCell>
        <TableCell>Customer</TableCell>
        <TableCell align="center">Status</TableCell>
        <TableCell align="right">Balance</TableCell>
        <TableCell align="right">Paid</TableCell>
        <TableCell align="right">Expense</TableCell>
        <TableCell align="right">Gross Sales</TableCell>
        <TableCell align="right">Net Sales</TableCell>
        <TableCell align="right">Documents</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.length === 0 ? (
        <EmptyRow colSpan={10} />
      ) : (
        rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>{formatDate(row.date)}</TableCell>
            <TableCell>
              <ReferenceCell
                reference={row.reference}
                secondary={row.order_no}
              />
            </TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell align="center">
              <PaymentStatusChip status={row.payment_status} />
            </TableCell>
            <TableCell
              align="right"
              sx={{
                color:
                  Number(row.balance_amount) > 0
                    ? "error.main"
                    : "text.primary",
                fontWeight: Number(row.balance_amount) > 0 ? 600 : 400,
              }}
            >
              {formatPeso(row.balance_amount)}
            </TableCell>
            <TableCell align="right" sx={{ color: "success.main" }}>
              {formatPeso(row.paid_amount)}
            </TableCell>

            <TableCell align="right">
              <BomExpenseCell row={row} />
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {formatPeso(row.gross_amount)}
            </TableCell>
            <TableCell align="right">
              <NetSalesCell row={row} />
            </TableCell>
            <TableCell align="right">
              <Button
                size="small"
                variant="tonal"
                color="secondary"
                startIcon={<i className="bx bx-show" />}
                onClick={() => onViewDocuments?.(row)}
                disabled={!onViewDocuments}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </>
);

const ExpenseRows = ({ rows }: { rows: IncomeExpenseExpenseRow[] }) => (
  <>
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>Reference</TableCell>
        <TableCell>Expense</TableCell>
        <TableCell>Category / Payee</TableCell>
        <TableCell>Payment Date</TableCell>
        <TableCell align="center">Status</TableCell>
        <TableCell align="right">Total</TableCell>
        <TableCell align="right">Paid</TableCell>
        <TableCell align="right">Balance</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.length === 0 ? (
        <EmptyRow colSpan={9} />
      ) : (
        rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>{formatDate(row.date)}</TableCell>
            <TableCell>
              <ReferenceCell reference={row.reference} />
            </TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>
              <ReferenceCell reference={row.category} secondary={row.payee} />
            </TableCell>
            <TableCell>
              {row.payment_date ? formatDate(row.payment_date) : "—"}
            </TableCell>
            <TableCell align="center">
              <PaymentStatusChip status={row.payment_status} />
            </TableCell>
            <TableCell
              align="right"
              sx={{ color: "error.main", fontWeight: 600 }}
            >
              {formatPeso(row.total_amount)}
            </TableCell>
            <TableCell align="right">{formatPeso(row.paid_amount)}</TableCell>
            <TableCell
              align="right"
              sx={{
                color:
                  Number(row.balance_amount) > 0
                    ? "error.main"
                    : "text.primary",
              }}
            >
              {formatPeso(row.balance_amount)}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </>
);

const benefitMeta = [
  { key: "sss", label: "SSS", icon: "bx-shield-quarter" },
  { key: "philhealth", label: "PhilHealth", icon: "bx-plus-medical" },
  { key: "pagibig", label: "Pag-IBIG", icon: "bx-home-heart" },
] as const;

const EmployerBenefits = ({
  benefits,
}: {
  benefits: IncomeExpensePayrollEmployee["employer_benefits"];
}) => {
  const activeBenefits = benefitMeta.filter(
    (benefit) => Number(benefits[benefit.key]) > 0,
  );

  if (activeBenefits.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No employer benefits
      </Typography>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      justifyContent="flex-end"
      useFlexGap
      flexWrap="wrap"
    >
      {activeBenefits.map((benefit) => (
        <Box
          key={benefit.key}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.75,
            py: 0.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <i className={`bx ${benefit.icon}`} style={{ fontSize: 15 }} />
          <Typography variant="caption" color="text.secondary">
            {benefit.label}
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {formatPeso(benefits[benefit.key])}
          </Typography>
        </Box>
      ))}
      <Chip
        size="small"
        variant="tonal"
        color="success"
        label={`Total ${formatPeso(benefits.total)}`}
      />
    </Stack>
  );
};

const PayrollEmployeeBreakdown = ({
  employees,
}: {
  employees: IncomeExpensePayrollEmployee[];
}) => (
  <Box sx={{ px: { xs: 2, md: 4 }, py: 2.5, bgcolor: "action.hover" }}>
    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
      Payroll details
    </Typography>
    <Table
      size="small"
      aria-label="Employee payroll breakdown"
      sx={{ minWidth: 760 }}
    >
      <TableHead>
        <TableRow>
          <TableCell>
            <i className="bx bx-user" /> Employee
          </TableCell>
          <TableCell align="right">
            <i className="bx bx-money" /> Gross Pay
          </TableCell>
          <TableCell align="right">
            <i className="bx bx-minus-circle" /> Deductions
          </TableCell>
          <TableCell align="right">
            <i className="bx bx-heart-circle" /> Benefits
          </TableCell>
          <TableCell align="right">
            <i className="bx bx-wallet" /> Net Pay
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <ReferenceCell
                reference={employee.employee_name}
                secondary={employee.position}
              />
            </TableCell>
            <TableCell align="right">
              {formatPeso(employee.gross_amount)}
            </TableCell>
            <TableCell align="right">
              {formatPeso(employee.deduction_amount)}
            </TableCell>
            <TableCell align="right">
              <EmployerBenefits benefits={employee.employer_benefits} />
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              {formatPeso(employee.net_amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

const PayrollRow = ({
  row,
  showPayrollDetails,
}: {
  row: IncomeExpensePayrollRow;
  showPayrollDetails: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const canExpand = showPayrollDetails && row.employees.length > 0;

  return (
    <Fragment>
      <TableRow hover>
        {showPayrollDetails && (
          <TableCell sx={{ width: 52 }}>
            {canExpand && (
              <IconButton
                size="small"
                aria-label={
                  expanded
                    ? `Collapse payroll ${row.reference}`
                    : `Expand payroll ${row.reference}`
                }
                onClick={() => setExpanded((value) => !value)}
              >
                <i
                  className={expanded ? "bx-chevron-down" : "bx-chevron-right"}
                />
              </IconButton>
            )}
          </TableCell>
        )}
        <TableCell>
          <ReferenceCell
            reference={formatDate(row.period_start)}
            secondary={`to ${formatDate(row.period_end)}`}
          />
        </TableCell>
        <TableCell>
          <ReferenceCell reference={row.reference} />
        </TableCell>
        <TableCell sx={{ textTransform: "capitalize" }}>
          {row.payroll_type}
        </TableCell>
        <TableCell sx={{ textTransform: "capitalize" }}>
          {row.frequency}
        </TableCell>
        <TableCell>
          {row.released_at ? formatDate(row.released_at) : "—"}
        </TableCell>
        <TableCell align="center">
          <Chip
            size="small"
            variant="tonal"
            color="success"
            label={row.status}
          />
        </TableCell>
        <TableCell align="right">{formatPeso(row.gross_amount)}</TableCell>
        <TableCell align="right">{formatPeso(row.deduction_amount)}</TableCell>
        <TableCell align="right" sx={{ color: "error.main", fontWeight: 600 }}>
          {formatPeso(row.expense_total)}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={10} sx={{ p: 0 }}>
            <TableContainer>
              <PayrollEmployeeBreakdown employees={row.employees} />
            </TableContainer>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

const PayrollRows = ({
  rows,
  showPayrollDetails,
}: {
  rows: IncomeExpensePayrollRow[];
  showPayrollDetails: boolean;
}) => (
  <>
    <TableHead>
      <TableRow>
        {showPayrollDetails && <TableCell sx={{ width: 52 }} />}
        <TableCell>Period</TableCell>
        <TableCell>Payroll No.</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Frequency</TableCell>
        <TableCell>Released</TableCell>
        <TableCell align="center">Status</TableCell>
        <TableCell align="right">Gross Pay</TableCell>
        <TableCell align="right">Deductions</TableCell>
        <TableCell align="right">Payroll Expense</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.length === 0 ? (
        <EmptyRow colSpan={showPayrollDetails ? 10 : 9} />
      ) : (
        rows.map((row) => (
          <PayrollRow
            key={row.id}
            row={row}
            showPayrollDetails={showPayrollDetails}
          />
        ))
      )}
    </TableBody>
  </>
);

const IncomeExpenseReportTable = (props: Props) => {
  const meta = sectionMeta[props.section];

  return (
    <Box component="section">
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ px: { xs: 3, md: 5 }, py: 3 }}
      >
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            inlineSize: 36,
            blockSize: 36,
            borderRadius: 1.5,
            color: meta.color,
            backgroundColor: "action.hover",
            flexShrink: 0,
          }}
        >
          <i className={`bx ${meta.icon}`} style={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">{meta.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {meta.description}
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table size="small" sx={{ ...statementTableSx, minWidth: 1080 }}>
          {props.section === "income" && (
            <IncomeRows
              rows={props.rows}
              onViewDocuments={props.onViewDocuments}
            />
          )}
          {(props.section === "bills" || props.section === "expenses") && (
            <ExpenseRows rows={props.rows} />
          )}
          {props.section === "payroll" && (
            <PayrollRows
              rows={props.rows}
              showPayrollDetails={props.showPayrollDetails ?? true}
            />
          )}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default IncomeExpenseReportTable;
