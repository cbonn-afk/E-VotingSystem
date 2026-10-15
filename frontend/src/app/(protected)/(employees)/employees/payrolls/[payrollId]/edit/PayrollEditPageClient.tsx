"use client";

import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";
import PayrollPreparationView from "@/modules/employees/views/payroll/PayrollPreparationView";

const PayrollEditPageClient = ({ payrollId }: { payrollId: string }) => (
  <AuthorizationGuard permission="employees.payroll.prepare">
    <PayrollPreparationView payrollId={payrollId} />
  </AuthorizationGuard>
);

export default PayrollEditPageClient;
