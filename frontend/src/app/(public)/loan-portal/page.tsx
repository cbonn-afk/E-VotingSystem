// Next Imports
import type { Metadata } from "next";

// Component Imports
import PortalLoginView from "@/modules/loan/portal/PortalLoginView";

export const metadata: Metadata = {
  title: "Member portal",
  description: "Sign in to the member portal",
};

export default function LoanPortalPage() {
  return <PortalLoginView />;
}
