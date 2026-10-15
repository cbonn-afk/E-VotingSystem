// Next Imports
import type { Metadata } from "next";

// Component Imports
import PortalDashboardView from "@/modules/loan/portal/PortalDashboardView";

export const metadata: Metadata = {
  title: "Member portal",
};

export default function LoanPortalDashboardPage() {
  return <PortalDashboardView />;
}
