"use client";

import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";
import PayrollPreparationView from "@/modules/employees/views/payroll/PayrollPreparationView";

const PayrollPreparePageClient = () => (
  <AuthorizationGuard permission="employees.payroll.prepare">
    <PayrollPreparationView />
  </AuthorizationGuard>
);

export default PayrollPreparePageClient;
