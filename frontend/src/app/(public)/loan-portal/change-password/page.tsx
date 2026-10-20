// Next Imports
import type { Metadata } from "next";

// Component Imports
import PortalChangePasswordView from "@/modules/loan/portal/PortalChangePasswordView";

export const metadata: Metadata = {
  title: "Change password",
  description: "Choose a new password for the member portal",
};

export default function LoanPortalChangePasswordPage() {
  return <PortalChangePasswordView />;
}
