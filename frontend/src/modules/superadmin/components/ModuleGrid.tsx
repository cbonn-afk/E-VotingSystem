"use client";

// MUI Imports
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Component Imports
import ModuleCard from "./ModuleCard";

// Type Imports
import type { SuperAdminModule } from "../types";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { getAuthorizedHomeModules } from "../utils/homeAccess";

type ModuleGridProps = {
  modules: SuperAdminModule[];
};

const ModuleGrid = ({ modules }: ModuleGridProps) => {
  const authorization = useAuthorization();
  const visibleModules = getAuthorizedHomeModules(authorization.user, modules);

  if (visibleModules.length === 0) {
    return (
      <Typography
        variant="body1"
        color="text.secondary"
        className="text-center"
      >
        No modules are assigned to your account yet. Please contact an
        administrator.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
        },
        gap: 6,
        alignItems: "stretch",
      }}
    >
      {visibleModules.map((module) => (
        <ModuleCard key={module.title} module={module} />
      ))}
    </Box>
  );
};

export default ModuleGrid;
