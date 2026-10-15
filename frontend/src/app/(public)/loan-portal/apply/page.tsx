import type { Metadata } from "next";

import PortalApplyView from "@/modules/loan/portal/PortalApplyView";

export const metadata: Metadata = { title: "Apply for a loan" };

export default function Page() {
  return <PortalApplyView />;
}
