// Type Imports
import type { ChildrenType } from "@core/types";

// Layout Imports
import VerticalLayout from "@layouts/VerticalLayout";

// Component Imports
import Navbar from "@components/layout/vertical/Navbar";
import VerticalFooter from "@components/layout/vertical/Footer";
import MembersSidebar from "@/modules/members/components/MembersSidebar";
import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";

// Util Imports
import { getMode } from "@core/utils/serverHelpers";

// Members is its own module: the one member list that Election, Loan and Inquiry all read.
const MembersLayout = async ({ children }: ChildrenType) => {
  const mode = await getMode();

  return (
    <AuthorizationGuard module="members">
      <VerticalLayout
        navigation={<MembersSidebar mode={mode} />}
        navbar={<Navbar />}
        footer={<VerticalFooter />}
      >
        {children}
      </VerticalLayout>
    </AuthorizationGuard>
  );
};

export default MembersLayout;
