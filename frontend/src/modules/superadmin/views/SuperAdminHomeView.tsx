"use client";

// React Imports
import { useEffect } from "react";

// Next Imports
import { useRouter } from "next/navigation";

// MUI Imports
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// Component Imports
import AuthorizationLoadingScreen from "@/modules/auth/components/AuthorizationLoadingScreen";
import ModuleGrid from "../components/ModuleGrid";

// Data Imports
import { superAdminModules } from "../data/modules";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { getHomeLandingPath } from "../utils/homeAccess";

const SuperAdminHomeView = () => {
  const router = useRouter();
  const authorization = useAuthorization();
  const landingPath = getHomeLandingPath(authorization.user, superAdminModules);

  useEffect(() => {
    if (!authorization.isLoading && landingPath) {
      router.replace(landingPath);
    }
  }, [authorization.isLoading, landingPath, router]);

  if (authorization.isLoading || landingPath) {
    return <AuthorizationLoadingScreen />;
  }

  return (
    <Box
      className="flex justify-center items-center h-full"
      sx={{
        minBlockSize: { xs: 520, md: 600 },
        py: { xs: 6, md: 10 },
      }}
    >
      <Stack spacing={{ xs: 6, md: 8 }} className="is-full max-is-[1040px]">
        <Stack spacing={1.5} className="items-center text-center">
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              inlineSize: 52,
              blockSize: 52,
              mb: 0.5,
              color: "primary.main",
              bgcolor: "var(--mui-palette-primary-lightOpacity)",
              borderRadius: 2,
              fontSize: 26,
            }}
          >
            <i className="bx-grid-alt" />
          </Box>

          <Typography
            variant="h3"
            color="text.primary"
            sx={{
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            Workplace
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            Select a module to continue
          </Typography>
        </Stack>

        <ModuleGrid modules={superAdminModules} />
      </Stack>
    </Box>
  );
};

export default SuperAdminHomeView;
