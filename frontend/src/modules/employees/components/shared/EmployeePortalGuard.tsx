"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

const EmployeePortalGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const authorization = useAuthorization();
  const allowed = authorization.canAccessEmployeePortal();

  useEffect(() => {
    if (!authorization.isLoading && !allowed) router.replace("/home");
  }, [allowed, authorization.isLoading, router]);

  if (authorization.isLoading || !allowed) {
    return (
      <Box sx={{ minBlockSize: 320, display: "grid", placeItems: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return children;
};

export default EmployeePortalGuard;
