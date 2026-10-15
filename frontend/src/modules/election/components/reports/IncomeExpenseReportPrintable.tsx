import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import type {
  IncomeExpenseExpenseRow,
  IncomeExpenseIncomeRow,
  IncomeExpensePayrollRow,
  IncomeExpenseReport,
} from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";
import ReportPrintArea from "../shared/ReportPrintArea";

const SectionTitle = ({ children }: { children: string }) => (
  <Typography
    variant="subtitle1"
    sx={{ mb: 1, color: "#111827", fontWeight: 700 }}
  >
    {children}
  </Typography>
);

const EmptyRow = ({ colSpan }: { colSpan: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} sx={{ color: "#6b7280", textAlign: "center" }}>
      No records for this period.
    </TableCell>
  </TableRow>
);

const IncomeTable = ({ rows }: { rows: IncomeExpenseIncomeRow[] }) => (
  <Box className="report-print-section">
    <SectionTitle>Income</SectionTitle>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Invoice / Customer</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Gross</TableCell>
          <TableCell align="right">COGS</TableCell>
          <TableCell align="right">Net Sales</TableCell>
          <TableCell align="right">Paid</TableCell>
          <TableCell align="right">A/R</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={8} />
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell>
                {row.reference} · {row.customer}
              </TableCell>
              <TableCell>{row.payment_status.replace("_", " ")}</TableCell>
              <TableCell align="right">
                {formatPeso(row.gross_amount)}
              </TableCell>
              <TableCell align="right">
                {row.expense_amount == null
                  ? row.bom_status === "Draft"
                    ? "Draft BOM"
                    : "Not costed"
                  : formatPeso(row.expense_amount)}
              </TableCell>
              <TableCell align="right">
                {row.net_sales_amount == null
                  ? "Not costed"
                  : formatPeso(row.net_sales_amount)}
              </TableCell>
              <TableCell align="right">{formatPeso(row.paid_amount)}</TableCell>
              <TableCell align="right">
                {formatPeso(row.balance_amount)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </Box>
);

const ExpenseTable = ({
  title,
  rows,
}: {
  title: string;
  rows: IncomeExpenseExpenseRow[];
}) => (
  <Box className="report-print-section">
    <SectionTitle>{title}</SectionTitle>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Reference</TableCell>
          <TableCell>Expense / Category</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Total</TableCell>
          <TableCell align="right">Paid</TableCell>
          <TableCell align="right">Balance</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={7} />
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell>{row.reference}</TableCell>
              <TableCell>
                {row.name} · {row.category}
              </TableCell>
              <TableCell>{row.payment_status.replace("_", " ")}</TableCell>
              <TableCell align="right">
                {formatPeso(row.total_amount)}
              </TableCell>
              <TableCell align="right">{formatPeso(row.paid_amount)}</TableCell>
              <TableCell align="right">
                {formatPeso(row.balance_amount)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </Box>
);

const PayrollTable = ({ rows }: { rows: IncomeExpensePayrollRow[] }) => (
  <Box className="report-print-section">
    <SectionTitle>Payroll</SectionTitle>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Payroll No.</TableCell>
          <TableCell>Period</TableCell>
          <TableCell>Type</TableCell>
          <TableCell align="right">Gross</TableCell>
          <TableCell align="right">Deductions</TableCell>
          <TableCell align="right">Payroll Expense</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow colSpan={6} />
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.reference}</TableCell>
              <TableCell>
                {formatDate(row.period_start)} to {formatDate(row.period_end)}
              </TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {row.payroll_type}
              </TableCell>
              <TableCell align="right">
                {formatPeso(row.gross_amount)}
              </TableCell>
              <TableCell align="right">
                {formatPeso(row.deduction_amount)}
              </TableCell>
              <TableCell align="right">
                {formatPeso(row.expense_total)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </Box>
);

const SummaryTable = ({ data }: { data: IncomeExpenseReport }) => {
  const rows = [
    ["Gross Sales", data.summary.gross_sales],
    ["Accounts Receivable", data.summary.accounts_receivable],
    ["Cost of Goods Sold", data.summary.cogs],
    ["Bills", data.summary.bills],
    ["Payroll", data.summary.payroll],
    ["Other Expenses", data.summary.expenses],
    ["Total Expenses", data.summary.total_expenses],
    ["Net Sales", data.summary.net_sales],
  ];

  return (
    <Box className="report-print-section">
      <SectionTitle>Period Summary</SectionTitle>
      <Table size="small">
        <TableBody>
          {rows.map(([label, value], index) => (
            <TableRow key={label}>
              <TableCell
                sx={{
                  color: "#111827",
                  fontWeight: index >= rows.length - 2 ? 700 : 500,
                }}
              >
                {label}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color:
                    label === "Gross Sales" || label === "Net Sales"
                      ? Number(value) >= 0
                        ? "#15803d"
                        : "#b91c1c"
                      : label === "Accounts Receivable"
                        ? "#a16207"
                        : "#b91c1c",
                  fontWeight: index >= rows.length - 2 ? 700 : 600,
                }}
              >
                {formatPeso(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const IncomeExpenseReportPrintable = ({
  data,
}: {
  data: IncomeExpenseReport;
}) => (
  <ReportPrintArea
    title="Operating Summary"
    subtitle={`From ${formatDate(data.from)} to ${formatDate(data.to)}`}
  >
    {(data.filters.section === "all" || data.filters.section === "income") && (
      <IncomeTable rows={data.income} />
    )}
    {(data.filters.section === "all" || data.filters.section === "bills") && (
      <ExpenseTable title="Bills" rows={data.bills} />
    )}
    {(data.filters.section === "all" || data.filters.section === "payroll") && (
      <PayrollTable rows={data.payroll} />
    )}
    {(data.filters.section === "all" ||
      data.filters.section === "expenses") && (
      <ExpenseTable title="Expenses" rows={data.expenses} />
    )}
    <SummaryTable data={data} />
  </ReportPrintArea>
);

export default IncomeExpenseReportPrintable;
