import { Suspense } from "react";

import PayrollListView from "@/modules/employees/views/payroll/PayrollListView";

export default function Page() {
  return (
    <Suspense>
      <PayrollListView />
    </Suspense>
  );
}
