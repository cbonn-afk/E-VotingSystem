"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomTextField from "@core/components/mui/TextField";
import { ApiError } from "@/libs/api/apiError";

import { portalApi, portalMemberKey } from "./portalApi";
import {
  PORTAL_CHANGE_PASSWORD_PATH,
  PORTAL_DASHBOARD_PATH,
  portalErrorStatus,
  usePortalMember,
} from "./usePortalMember";

const messageFrom = (error: unknown): string => {
  if (error instanceof ApiError) return error.errors.member_code?.[0] ?? error.errors.password?.[0] ?? error.message;

  return "You could not be signed in. Try again.";
};

export default function PortalLoginView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const existing = usePortalMember();

  const [memberCode, setMemberCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: go to the dashboard, or to the change-password page while the default password is still set.
  useEffect(() => {
    if (existing.data) {
      router.replace(existing.data.data.require_password_change ? PORTAL_CHANGE_PASSWORD_PATH : PORTAL_DASHBOARD_PATH);
    }
  }, [existing.data, router]);

  const login = useMutation({
    mutationFn: () => portalApi.login(memberCode.trim(), password),
    onSuccess: (response) => {
      queryClient.setQueryData(portalMemberKey, response);
      router.replace(response.data.require_password_change ? PORTAL_CHANGE_PASSWORD_PATH : PORTAL_DASHBOARD_PATH);
    },
    onError: (e) => setError(messageFrom(e)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (memberCode.trim() && password) login.mutate();
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
              Sign in with your member code and password. If this is your first time, use the default password given to you by the cooperative.
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
            <CustomTextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((shown) => !shown)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <i className={showPassword ? "bx-hide" : "bx-show"} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!memberCode.trim() || !password || login.isPending || blocked}
            >
              Sign in
            </Button>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
