"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";
import { filterAuthorizedItems } from "@/modules/auth/authorization/authorization";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import ElectionStatusChip from "../../components/shared/ElectionStatusChip";
import { electionNavigation } from "../../data/electionNavigation";
import { useCurrentAssembly } from "../../hooks/useAssembliesApi";
import { assemblyStatusLabels } from "../../data/electionOptions";

export default function ElectionDashboardView() {
  const authorization = useAuthorization();
  const query = useCurrentAssembly();
  const assembly = query.data?.data;
  const links = electionNavigation
    .flatMap((group) => group.items)
    .filter((item) => item.href !== "/election");
  const visibleLinks = filterAuthorizedItems(authorization.user, links);

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Election"
        description="Run the general assembly: attendance, voting, and results."
      />

      {query.isError && (
        <Alert severity="error">The current assembly could not be loaded.</Alert>
      )}

      {!query.isLoading && !assembly && !query.isError && (
        <Alert
          severity="info"
          action={
            <Button
              component={Link}
              href="/election/assemblies"
              color="inherit"
            >
              Open assemblies
            </Button>
          }
        >
          No assembly has been created yet.
        </Alert>
      )}

      {assembly && (
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Current assembly
                </Typography>
                <Typography variant="h5">{assembly.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {assembly.year} · {assemblyStatusLabels[assembly.status]}
                </Typography>
              </Stack>
              <ElectionStatusChip status={assembly.status} />
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 4,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {visibleLinks.map((item) => (
          <Card key={item.href}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <i className={`bx ${item.icon}`} />
                  <Typography variant="h6">{item.label}</Typography>
                </Stack>
                <Button
                  component={Link}
                  href={item.href}
                  variant="tonal"
                  endIcon={<i className="bx-right-arrow-alt" />}
                >
                  Open
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
