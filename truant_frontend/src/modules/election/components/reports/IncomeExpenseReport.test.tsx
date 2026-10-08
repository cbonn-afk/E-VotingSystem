import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import IncomeExpenseReportSummary from "./IncomeExpenseReportSummary";
import IncomeExpenseReportTable from "./IncomeExpenseReportTable";

describe("IncomeExpenseReport components", () => {
  it("shows unpaid income as receivable without hiding its gross sale", () => {
    render(
      <IncomeExpenseReportTable
        section="income"
        rows={[
          {
            id: "invoice-1",
            date: "2026-07-15",
            due_date: "2026-08-14",
            reference: "INV-0001",
            order_id: "order-1",
            order_no: "TRU-ORD-0001",
            customer: "Grumpy Joe",
            sales_type: "Charge",
            gross_amount: "1000.00",
            expense_amount: "150.00",
            net_sales_amount: "850.00",
            paid_amount: "0.00",
            balance_amount: "1000.00",
            payment_status: "unpaid",
          },
        ]}
      />,
    );

    const row = screen.getByRole("row", { name: /INV-0001/i });

    expect(within(row).getByText("Unpaid")).toBeInTheDocument();
    expect(within(row).getAllByText("₱1,000.00")).toHaveLength(2);
    expect(within(row).getByText("₱850.00")).toBeInTheDocument();
    expect(within(row).getByText("Grumpy Joe")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /view/i })).toBeDisabled();
  });

  it("reconciles the bottom summary and labels the final net sales value", () => {
    render(
      <IncomeExpenseReportSummary
        summary={{
          gross_sales: "1000.00",
          collected_sales: "600.00",
          accounts_receivable: "400.00",
          cogs: "150.00",
          bills: "200.00",
          payroll: "300.00",
          expenses: "100.00",
          total_expenses: "750.00",
          net_sales: "250.00",
        }}
      />,
    );

    expect(screen.getByText("Gross Sales")).toBeInTheDocument();
    expect(screen.getByText("Accounts Receivable")).toBeInTheDocument();
    expect(screen.getByText("Cost of Goods Sold")).toBeInTheDocument();
    expect(screen.getByText("Total Expenses")).toBeInTheDocument();
    expect(screen.getByText("Net Sales")).toBeInTheDocument();
    expect(screen.getByText("₱250.00")).toBeInTheDocument();
  });

  it("expands a payroll run to show employee and statutory benefit details", () => {
    render(
      <IncomeExpenseReportTable
        section="payroll"
        rows={[
          {
            id: "payroll-1",
            date: "2026-07-15",
            reference: "PAY-0001",
            payroll_type: "employee",
            frequency: "semi_monthly",
            period_start: "2026-07-01",
            period_end: "2026-07-15",
            released_at: "2026-07-16T01:00:00.000Z",
            gross_amount: "1000.00",
            deduction_amount: "150.00",
            net_amount: "850.00",
            expense_total: "1100.00",
            status: "Released",
            employees: [
              {
                id: "employee-1",
                employee_name: "Maria Santos",
                position: "Production Staff",
                gross_amount: "1000.00",
                deduction_amount: "150.00",
                net_amount: "850.00",
                employer_benefits: {
                  sss: "50.00",
                  philhealth: "25.00",
                  pagibig: "25.00",
                  total: "100.00",
                },
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Expand payroll PAY-0001" }),
    );

    expect(
      screen.getByRole("table", { name: "Employee payroll breakdown" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("Benefits")).toBeInTheDocument();
    expect(screen.getByText("PhilHealth")).toBeInTheDocument();
    expect(screen.getByText("Total ₱100.00")).toBeInTheDocument();
  });
});
