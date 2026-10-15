// Type Imports
import type { ChildrenType } from "@core/types";

// Component Imports
import AuthorizationGuard from "@/modules/auth/components/AuthorizationGuard";

const ElectionVotingLayout = ({ children }: ChildrenType) => (
  <AuthorizationGuard module="election" permission="election.voting.cast">
    {children}
  </AuthorizationGuard>
);

export default ElectionVotingLayout;
