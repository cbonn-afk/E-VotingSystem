"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomTextField from "@core/components/mui/TextField";
import { ApiError } from "@/libs/api/apiError";

import { portalApi, portalMemberKey } from "./portalApi";
import { portalErrorStatus, usePortalMember } from "./usePortalMember";

const messageFrom = (error: unknown): string => {
  if (error instanceof ApiError) return error.errors.member_code?.[0] ?? error.message;

  return "You could not be signed in. Try again.";
};

export default function PortalLoginView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const existing = usePortalMember();

  const [memberCode, setMemberCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Already signed in: go straight to the dashboard.
  useEffect(() => {
    if (existing.data) router.replace("/loan-portal/dashboard");
  }, [existing.data, router]);

  const login = useMutation({
    mutationFn: () => portalApi.login(memberCode.trim()),
    onSuccess: (response) => {
      queryClient.setQueryData(portalMemberKey, response);
      router.replace("/loan-portal/dashboard");
    },
    onError: (e) => setError(messageFrom(e)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (memberCode.trim()) login.mutate();
  };

  const blocked = portalErrorStatus(existing.error) === 403;

  return (
    <Box className="flex min-bs-[100dvh] items-center justify-center bg-backgroundDefault p-6">
      <Paper className="is-full max-is-[420px] p-6 sm:p-8" elevation={3}>
        <Stack spacing={5}>
          <Stack spacing={1} className="items-center text-center">
            <Typography variant="h5" fontWeight="bold">
              Member portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your member code to continue. Keep it private: anyone who has it can see your information.
            </Typography>
          </Stack>

          {blocked && <Alert severity="warning">The member portal is not available from this network.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <form noValidate autoComplete="off" onSubmit={submit} className="flex flex-col gap-5">
            <CustomTextField
              autoFocus
              fullWidth
              label="Member code"
              value={memberCode}
              onChange={(event) => setMemberCode(event.target.value)}
            />
            <Button type="submit" variant="contained" disabled={!memberCode.trim() || login.isPending || blocked}>
              Sign in
            </Button>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
