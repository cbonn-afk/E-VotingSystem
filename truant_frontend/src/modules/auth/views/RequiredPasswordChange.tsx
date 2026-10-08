"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useChangePassword } from "@/modules/auth/hooks/useChangePassword";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { getRequestedDestination } from "@/modules/auth/passwordChange";
import {
  changePasswordSchema,
  mapChangePasswordRequest,
  type ChangePasswordFormValues,
} from "@/modules/auth/schemas/changePasswordSchema";

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

const PasswordField = ({
  label,
  autoComplete,
  shown,
  error,
  registration,
  onToggle,
}: PasswordFieldProps) => (
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

const RequiredPasswordChange = () => {
  const changePassword = useChangePassword();
  const logout = useLogout();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswords, setShowNewPasswords] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const user = await changePassword.mutateAsync(
        mapChangePasswordRequest(values),
      );

      if (user.require_password_change) {
        setServerError(
          "Your password was updated, but the account still requires a password change.",
        );
        return;
      }

      window.location.replace(getRequestedDestination(window.location.search));
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

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to change your password. Please try again.",
      );
    }
  });

  const handleLogout = async () => {
    setServerError(null);

    try {
      await logout.mutateAsync();
      window.location.replace("/login");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.",
      );
    }
  };

  const pending = changePassword.isPending || logout.isPending;

  return (
    <Box className="flex min-bs-[100dvh] items-center justify-center bg-backgroundDefault p-6">
      <Paper className="is-full max-is-[460px] p-6 sm:p-8" elevation={3}>
        <Stack spacing={5}>
          <Stack spacing={2} className="items-center text-center">
            <Box
              component="img"
              src="/images/truant-mark.png"
              alt="Truant Enterprises logo"
              sx={{ inlineSize: 58, blockSize: "auto", objectFit: "contain" }}
            />
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={700}>
                Change your password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set a new password before continuing to the ERP.
              </Typography>
            </Stack>
          </Stack>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Stack component="form" spacing={4} noValidate onSubmit={onSubmit}>
            <PasswordField
              label="Current Password"
              autoComplete="current-password"
              shown={showCurrentPassword}
              error={errors.currentPassword?.message}
              registration={register("currentPassword")}
              onToggle={() => setShowCurrentPassword((current) => !current)}
            />
            <PasswordField
              label="New Password"
              autoComplete="new-password"
              shown={showNewPasswords}
              error={errors.password?.message}
              registration={register("password")}
              onToggle={() => setShowNewPasswords((current) => !current)}
            />
            <PasswordField
              label="Confirm New Password"
              autoComplete="new-password"
              shown={showNewPasswords}
              error={errors.passwordConfirmation?.message}
              registration={register("passwordConfirmation")}
              onToggle={() => setShowNewPasswords((current) => !current)}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={pending}
              startIcon={
                changePassword.isPending ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <i className="bx bx-lock-alt" />
                )
              }
            >
              {changePassword.isPending
                ? "Updating password..."
                : "Update Password"}
            </Button>
            <Button
              fullWidth
              variant="text"
              color="secondary"
              disabled={pending}
              startIcon={<i className="bx bx-log-out" />}
              onClick={handleLogout}
            >
              {logout.isPending ? "Logging out..." : "Log out"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RequiredPasswordChange;
