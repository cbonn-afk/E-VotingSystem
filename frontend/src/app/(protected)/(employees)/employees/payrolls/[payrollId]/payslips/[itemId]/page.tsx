import { Suspense } from "react";

import PayrollPayslipPageClient from "./PayrollPayslipPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ payrollId: string; itemId: string }>;
}) {
  const { payrollId, itemId } = await params;

  return (
    <Suspense>
      <PayrollPayslipPageClient payrollId={payrollId} itemId={itemId} />
    </Suspense>
  );
}
