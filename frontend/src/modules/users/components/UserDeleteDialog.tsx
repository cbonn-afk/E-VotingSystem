import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

import type { UserAccount } from "../types";

const UserDeleteDialog = ({
  user,
  loading,
  onClose,
  onConfirm,
}: {
  user: UserAccount | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const mustDeactivateFirst = user?.status !== "Inactive";

  return (
    <CustomDialog
      open={Boolean(user)}
      onClose={onClose}
      closeAfterTransition
      title="Remove this user?"
      description={
        user
          ? `${user.fullName} (${user.email}) will be removed from the user list.`
          : undefined
      }
      icon={<i className="bx bx-trash" />}
      actions={
        <>
          <Button variant="outlined" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={loading || mustDeactivateFirst}
            onClick={onConfirm}
          >
            {loading ? "Removing..." : "Remove User"}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 2 }}>
        {mustDeactivateFirst && user && (
          <Alert severity="warning">
            Please turn off this account first. You can only remove a user once
            their account has been deactivated.
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary">
          This person will be removed from the user list and won't be able to
          sign in anymore. Anything they created — like orders, costings, and
          statements — stays in the system and will simply show that it was made
          by a removed user.
        </Typography>
      </Stack>
    </CustomDialog>
  );
};

export default UserDeleteDialog;
