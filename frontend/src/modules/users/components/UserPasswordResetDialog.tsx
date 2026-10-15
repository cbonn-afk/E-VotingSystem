"use client";

import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";

import type { UserAccount } from "../types";

type UserPasswordResetDialogProps = {
  user: UserAccount | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    password: string;
    password_confirmation: string;
    require_password_change: boolean;
  }) => void;
};

const UserPasswordResetDialog = ({
  user,
  loading = false,
  onClose,
  onConfirm,
}: UserPasswordResetDialogProps) => {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;

    setPassword("");
    setPasswordConfirmation("");
    setRequirePasswordChange(true);
    setSubmitted(false);
  }, [user]);

  const passwordError =
    submitted && password.length < 8
      ? "Use at least 8 characters for the temporary password."
      : "";
  const confirmationError =
    submitted && passwordConfirmation !== password
      ? "Password confirmation does not match."
      : "";

  const submit = () => {
    setSubmitted(true);

    if (password.length < 8 || passwordConfirmation !== password) return;

    onConfirm({
      password,
      password_confirmation: passwordConfirmation,
      require_password_change: requirePasswordChange,
    });
  };

  return (
    <CustomDialog
      open={Boolean(user)}
      onClose={loading ? () => undefined : onClose}
      closeAfterTransition
      title="Reset Password"
      description={user ? `${user.fullName} (${user.email})` : undefined}
      icon={<i className="bx bx-key" />}
      width="520px"
      actions={
        <>
          <Button variant="outlined" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" disabled={loading} onClick={submit}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Alert severity="warning">
          This will replace the user's password and sign out their existing
          sessions.
        </Alert>
        <CustomTextField
          label="Temporary Password"
          type="password"
          value={password}
          error={Boolean(passwordError)}
          helperText={passwordError || " "}
          autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)}
        />
        <CustomTextField
          label="Confirm Password"
          type="password"
          value={passwordConfirmation}
          error={Boolean(confirmationError)}
          helperText={confirmationError || " "}
          autoComplete="new-password"
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={requirePasswordChange}
              onChange={(event) =>
                setRequirePasswordChange(event.target.checked)
              }
            />
          }
          label="Require password change on next login"
        />
        <Typography variant="body2" color="text.secondary">
          Use the user's profile page to reset your own password.
        </Typography>
      </Stack>
    </CustomDialog>
  );
};

export default UserPasswordResetDialog;

