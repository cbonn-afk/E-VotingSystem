// Type Imports
import type { ChildrenType } from "@core/types";

// Component Imports
import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";

// Full-screen layout (no sidebar), like the election voting station.
const InquiryStationLayout = ({ children }: ChildrenType) => (
  <AuthorizationGuard module="inquiry" permission="inquiry.station.use">
    {children}
  </AuthorizationGuard>
);

export default InquiryStationLayout;
