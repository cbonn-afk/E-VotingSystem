"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomTextField from "@core/components/mui/TextField";
import { ApiError } from "@/libs/api/apiError";
import {
  changePasswordSchema,
  mapChangePasswordRequest,
  type ChangePasswordFormValues,
} from "@/modules/auth/schemas/changePasswordSchema";

import { portalApi, portalMemberKey } from "./portalApi";
import {
  PORTAL_DASHBOARD_PATH,
  PORTAL_LOGIN_PATH,
  portalErrorStatus,
  usePortalMember,
} from "./usePortalMember";

const backendFieldMap: Record<string, keyof ChangePasswordFormValues> = {
  current_password: "currentPassword",
  password: "password",
  password_confirmation: "passwordConfirmation",
};

type PasswordFieldProps = {
  label: string;
  autoComplete: string;
  shown: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
  onToggle: () => void;
};

const PasswordField = ({ label, autoComplete, shown, error, registration, onToggle }: PasswordFieldProps) => (
  <CustomTextField
    fullWidth
    label={label}
    type={shown ? "text" : "password"}
    autoComplete={autoComplete}
    placeholder="············"
    error={Boolean(error)}
    helperText={error}
    {...registration}
    slotProps={{
      input: {
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              aria-label={shown ? `Hide ${label}` : `Show ${label}`}
              onClick={onToggle}
              onMouseDown={(event) => event.preventDefault()}
            >
              <i className={shown ? "bx-hide" : "bx-show"} />
            </IconButton>
          </InputAdornment>
        ),
      },
    }}
  />
);

/** First sign-in with the default password: the member must choose a new one before using the portal. */
export default function PortalChangePasswordView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const member = usePortalMember();
  const status = portalErrorStatus(member.error);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", passwordConfirmation: "" },
  });

  // Not signed in: back to sign-in. Password already changed: nothing to do here, go to the dashboard.
  useEffect(() => {
    if (status === 401) router.replace(PORTAL_LOGIN_PATH);
    else if (member.data && !member.data.data.require_password_change) router.replace(PORTAL_DASHBOARD_PATH);
  }, [member.data, router, status]);

  const change = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => portalApi.changePassword(mapChangePasswordRequest(values)),
    onSuccess: (response) => {
      queryClient.setQueryData(portalMemberKey, response);
      // Anything that was refused (428) before the change must load again.
      void queryClient.invalidateQueries({ queryKey: ["loan-portal"], refetchType: "none" });
      router.replace(PORTAL_DASHBOARD_PATH);
    },
  });

  const logout = useMutation({
    mutationFn: portalApi.logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: portalMemberKey });
      router.replace(PORTAL_LOGIN_PATH);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      await change.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        let hasFieldError = false;

        Object.entries(error.errors).forEach(([field, messages]) => {
          const formField = backendFieldMap[field];

          if (!formField || !messages[0]) return;
          hasFieldError = true;
          setError(formField, { type: "server", message: messages[0] });
        });

        if (hasFieldError) return;
      }

      setServerError(error instanceof Error ? error.message : "Unable to change your password. Please try again.");
    }
  });

  if (member.isPending || status === 401 || member.data?.data.require_password_change === false) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!member.data) {
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

  const pending = change.isPending || logout.isPending;

  return (
    <Box className="flex min-bs-[100dvh] items-center justify-center bg-backgroundDefault p-6">
      <Paper className="is-full max-is-[460px] p-6 sm:p-8" elevation={3}>
        <Stack spacing={5}>
          <Stack spacing={1} className="items-center text-center">
            <Typography variant="h5" fontWeight="bold">
              Change your password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome, {member.data.data.name}. For your security, choose a new password before continuing. Your current
              password is the default one you signed in with.
            </Typography>
          </Stack>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Stack component="form" spacing={4} noValidate onSubmit={onSubmit}>
            <PasswordField
              label="Current Password"
              autoComplete="current-password"
              shown={showCurrent}
              error={errors.currentPassword?.message}
              registration={register("currentPassword")}
              onToggle={() => setShowCurrent((value) => !value)}
            />
            <PasswordField
              label="New Password"
              autoComplete="new-password"
              shown={showNew}
              error={errors.password?.message}
              registration={register("password")}
              onToggle={() => setShowNew((value) => !value)}
            />
            <PasswordField
              label="Confirm New Password"
              autoComplete="new-password"
              shown={showNew}
              error={errors.passwordConfirmation?.message}
              registration={register("passwordConfirmation")}
              onToggle={() => setShowNew((value) => !value)}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={pending}
              startIcon={
                change.isPending ? <CircularProgress color="inherit" size={18} /> : <i className="bx bx-lock-alt" />
              }
            >
              {change.isPending ? "Updating password..." : "Update Password"}
            </Button>
            <Button
              fullWidth
              variant="text"
              color="secondary"
              disabled={pending}
              startIcon={<i className="bx bx-log-out" />}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
