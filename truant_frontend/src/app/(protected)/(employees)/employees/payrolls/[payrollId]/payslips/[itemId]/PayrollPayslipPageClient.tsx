"use client";

import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";
import PayrollPayslipPrintView from "@/modules/employees/views/payroll/PayrollPayslipPrintView";

const PayrollPayslipPageClient = ({
  payrollId,
  itemId,
}: {
  payrollId: string;
  itemId: string;
}) => (
  <AuthorizationGuard permission="employees.payroll.view">
    <PayrollPayslipPrintView payrollId={payrollId} itemId={itemId} />
  </AuthorizationGuard>
);

export default PayrollPayslipPageClient;
