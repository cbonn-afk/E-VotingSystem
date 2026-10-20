"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ApplicationStatusChip from "../components/ApplicationStatusChip";
import { formatDate, formatPeso } from "../utils/applicationStatus";
import { portalApi, portalMemberKey } from "./portalApi";
import { usePortalApplicationList } from "./usePortalApplications";
import { usePortalLoans } from "./usePortalLoans";
import { portalErrorStatus, usePortalMember } from "./usePortalMember";

export default function PortalDashboardView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = usePortalMember();
  const member = query.data?.data;
  const applications = usePortalApplicationList();
  const loans = usePortalLoans();
  const status = portalErrorStatus(query.error);

  // Session missing or expired: back to the sign-in page.
  useEffect(() => {
    if (status === 401) router.replace("/loan-portal");
  }, [router, status]);

  const logout = useMutation({
    mutationFn: portalApi.logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: portalMemberKey });
      router.replace("/loan-portal");
    },
  });

  if (query.isPending || status === 401) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!member) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center p-6">
        <Alert severity="error">
          {status === 403
            ? "The member portal is not available from this network."
            : "The portal could not be loaded. Try again later."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="mx-auto is-full max-is-[720px] p-6">
      <Stack spacing={5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Member portal
          </Typography>
          <Button variant="outlined" color="secondary" disabled={logout.isPending} onClick={() => logout.mutate()}>
            Sign out
          </Button>
        </Stack>

        <Paper className="p-6">
          <Stack spacing={1}>
            <Typography variant="h6">{member.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Member code {member.member_code}
              {member.mobile_masked ? ` · ${member.mobile_masked}` : ""}
            </Typography>
          </Stack>
        </Paper>

        {(loans.data?.data.length ?? 0) > 0 && (
          <Stack spacing={2}>
            <Typography variant="h6">My loans</Typography>
            {loans.data?.data.map((loan) => (
              <Card key={loan.id} variant="outlined">
                <CardActionArea onClick={() => router.push(`/loan-portal/loans/${loan.id}`)}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle1">{loan.product?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {loan.loan_no} · balance {formatPeso(loan.summary.outstanding)}
                          {loan.summary.next_due ? ` · next ${formatPeso(loan.summary.next_due.amount)} on ${formatDate(loan.summary.next_due.due_date)}` : ""}
                        </Typography>
                      </Stack>
                      <Chip
                        size="small"
                        variant="tonal"
                        color={loan.status === "fully_paid" ? "success" : loan.summary.overdue_count > 0 ? "error" : "info"}
                        label={loan.status === "fully_paid" ? "Fully paid" : loan.summary.overdue_count > 0 ? "Overdue" : "Active"}
                      />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">My loan applications</Typography>
          <Button variant="contained" onClick={() => router.push("/loan-portal/apply")}>
            Apply for a loan
          </Button>
        </Stack>

        {applications.isError && <Alert severity="error">Your applications could not be loaded.</Alert>}
        {applications.data && applications.data.data.length === 0 && (
          <Alert severity="info">You have no applications yet. Choose "Apply for a loan" to start.</Alert>
        )}

        {applications.data?.data.map((application) => (
          <Card key={application.id} variant="outlined">
            <CardActionArea onClick={() => router.push(`/loan-portal/applications/${application.id}`)}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Stack spacing={0.25}>
                    <Typography variant="subtitle1">{application.product?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {application.reference_no} · {formatPeso(application.amount)} · {application.term_months} months
                    </Typography>
                  </Stack>
                  <ApplicationStatusChip status={application.status} />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
