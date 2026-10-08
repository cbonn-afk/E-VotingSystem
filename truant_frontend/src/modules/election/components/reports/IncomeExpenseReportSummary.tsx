import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { IncomeExpenseReportSummary as Summary } from "../../api/types";
import { formatPeso } from "../../utils/accountingFormat";

const IncomeExpenseReportSummary = ({ summary }: { summary: Summary }) => {
  const netPositive = Number(summary.net_sales) >= 0;
  const rows = [
    { label: "Gross Sales", value: summary.gross_sales, color: "success.main" },
    {
      label: "Accounts Receivable",
      value: summary.accounts_receivable,
      color:
        Number(summary.accounts_receivable) > 0
          ? "warning.main"
          : "text.primary",
    },
    { label: "Cost of Goods Sold", value: summary.cogs, color: "error.main" },
    { label: "Bills", value: summary.bills, color: "error.main" },
    { label: "Payroll", value: summary.payroll, color: "error.main" },
    { label: "Other Expenses", value: summary.expenses, color: "error.main" },
    {
      label: "Total Expenses",
      value: summary.total_expenses,
      color: "error.main",
      strong: true,
    },
  ] as const;

  return (
    <Box
      component="section"
      sx={{
        mx: { xs: 3, md: 5 },
        my: 4,
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 3, py: 2, backgroundColor: "action.hover" }}>
        <Typography variant="overline" color="text.secondary">
          Period Summary
        </Typography>
      </Box>
      <Stack divider={<Divider flexItem />}>
        {rows.map((row) => (
          <Stack
            key={row.label}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={3}
            sx={{ px: 3, py: 1.5 }}
          >
            <Typography
              variant="body2"
              fontWeight={"strong" in row && row.strong ? 700 : 500}
            >
              {row.label}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={"strong" in row && row.strong ? 700 : 600}
              sx={{ color: row.color, fontVariantNumeric: "tabular-nums" }}
            >
              {formatPeso(row.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={3}
        sx={{
          px: 3,
          py: 2.25,
          borderTop: 2,
          borderColor: netPositive ? "success.main" : "error.main",
          backgroundColor: "action.hover",
        }}
      >
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={700}>
            Net Sales
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gross sales less COGS, bills, payroll, and other expenses
          </Typography>
        </Stack>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: netPositive ? "success.main" : "error.main",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatPeso(summary.net_sales)}
        </Typography>
      </Stack>
    </Box>
  );
};

export default IncomeExpenseReportSummary;
