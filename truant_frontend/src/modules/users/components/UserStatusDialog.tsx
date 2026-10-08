import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

import type { UserAccount } from "../types";

export type UserStatusAction = "reactivate" | "deactivate";

const actionContent: Record<
  UserStatusAction,
  {
    title: string;
    consequence: string;
    label: string;
    color: "warning" | "success" | "error";
  }
> = {
  reactivate: {
    title: "Turn this account back on?",
    consequence:
      "This person will be able to sign in again and use the parts of the system their role allows.",
    label: "Reactivate Account",
    color: "success",
  },
  deactivate: {
    title: "Turn off this account?",
    consequence:
      "This person will be signed out and won't be able to log in until you turn the account back on. Everything they've created stays exactly where it is.",
    label: "Deactivate Account",
    color: "error",
  },
};

const UserStatusDialog = ({
  user,
  action,
  loading,
  onClose,
  onConfirm,
}: {
  user: UserAccount | null;
  action: UserStatusAction | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const content = action ? actionContent[action] : null;

  return (
    <CustomDialog
      open={Boolean(user && action)}
      onClose={onClose}
      closeAfterTransition
      title={content?.title ?? "Change User Status"}
      description={user ? `${user.fullName} (${user.email})` : undefined}
      icon={
        <i
          className={`bx ${action === "reactivate" ? "bx-check-circle" : "bx-block"}`}
        />
      }
      actions={
        <>
          <Button variant="outlined" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={content?.color}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Updating..." : content?.label}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Typography>{content?.consequence}</Typography>
        <Typography variant="body2" color="text.secondary">
          You can change this again at any time.
        </Typography>
      </Stack>
    </CustomDialog>
  );
};

export default UserStatusDialog;
