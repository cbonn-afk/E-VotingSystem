import type { ChildrenType } from "@core/types";
import VerticalLayout from "@layouts/VerticalLayout";
import Navbar from "@components/layout/vertical/Navbar";
import VerticalFooter from "@components/layout/vertical/Footer";
import { getMode } from "@core/utils/serverHelpers";
import EmployeePortalGuard from "@/modules/employees/components/shared/EmployeePortalGuard";
import EmployeePortalSidebar from "@/modules/employees/components/shared/EmployeePortalSidebar";

export default async function EmployeePortalLayout({ children }: ChildrenType) {
  const mode = await getMode();

  return (
    <EmployeePortalGuard>
      <VerticalLayout
        navigation={<EmployeePortalSidebar mode={mode} />}
        navbar={<Navbar />}
        footer={<VerticalFooter />}
      >
        {children}
      </VerticalLayout>
    </EmployeePortalGuard>
  );
}
