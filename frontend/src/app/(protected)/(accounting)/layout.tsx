// Type Imports
import type { ChildrenType } from "@core/types";

// Layout Imports
import VerticalLayout from "@layouts/VerticalLayout";

// Component Imports
import Navbar from "@components/layout/vertical/Navbar";
import VerticalFooter from "@components/layout/vertical/Footer";
import AccountingSidebar from "@/modules/accounting/components/shared/AccountingSidebar";
import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";

// Util Imports
import { getMode } from "@core/utils/serverHelpers";

const AccountingLayout = async ({ children }: ChildrenType) => {
  const mode = await getMode();

  return (
    <AuthorizationGuard module="accounting">
      <VerticalLayout
        navigation={<AccountingSidebar mode={mode} />}
        navbar={<Navbar />}
        footer={<VerticalFooter />}
      >
        {children}
      </VerticalLayout>
    </AuthorizationGuard>
  );
};

export default AccountingLayout;
