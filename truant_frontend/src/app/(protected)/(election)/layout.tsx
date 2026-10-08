// Type Imports
import type { ChildrenType } from "@core/types";

// Layout Imports
import VerticalLayout from "@layouts/VerticalLayout";

// Component Imports
import Navbar from "@components/layout/vertical/Navbar";
import VerticalFooter from "@components/layout/vertical/Footer";
import ElectionSidebar from "@/modules/election/components/shared/ElectionSidebar";
import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";

// Util Imports
import { getMode } from "@core/utils/serverHelpers";

const ElectionLayout = async ({ children }: ChildrenType) => {
  const mode = await getMode();

  return (
    <AuthorizationGuard module="election">
      <VerticalLayout
        navigation={<ElectionSidebar mode={mode} />}
        navbar={<Navbar />}
        footer={<VerticalFooter />}
      >
        {children}
      </VerticalLayout>
    </AuthorizationGuard>
  );
};

export default ElectionLayout;
