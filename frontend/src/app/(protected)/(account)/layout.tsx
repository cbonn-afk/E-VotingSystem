// Type Imports
import type { ChildrenType } from "@core/types";

// Layout Imports
import HorizontalLayout from "@layouts/HorizontalLayout";

// Component Imports
import SuperAdminHeader from "@components/layout/superadmin/SuperAdminHeader";
import HorizontalFooter from "@components/layout/horizontal/Footer";

const AccountLayout = ({ children }: ChildrenType) => {
  return (
    <HorizontalLayout
      header={<SuperAdminHeader />}
      footer={<HorizontalFooter />}
    >
      {children}
    </HorizontalLayout>
  );
};

export default AccountLayout;
