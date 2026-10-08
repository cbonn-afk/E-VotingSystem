// Next Imports
import type { Metadata } from "next";
import { Suspense } from "react";

// Component Imports
import MaintenanceView from "@/modules/misc/views/MaintenanceView";

export const metadata: Metadata = {
  title: "Site Under Maintenance",
  description: "Truant Enterprises is temporarily undergoing maintenance.",
};

const MaintenancePage = () => {
  return (
    <Suspense>
      <MaintenanceView />
    </Suspense>
  );
};

export default MaintenancePage;
