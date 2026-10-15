import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

import type { UserRole } from "../types";

const RoleDeleteDialog = ({
  role,
  assignedUsers,
  loading,
  onClose,
  onConfirm,
}: {
  role: UserRole | null;
  assignedUsers: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <CustomDialog
    open={Boolean(role)}
    onClose={onClose}
    closeAfterTransition
    title="Delete Role"
    description={
      role
        ? `${role.name} will be permanently removed from the role register.`
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
          disabled={loading || assignedUsers > 0 || Boolean(role?.isSystem)}
          onClick={onConfirm}
        >
          {loading ? "Deleting..." : "Delete Role"}
        </Button>
      </>
    }
  >
    <Typography sx={{ mt: 2 }}>
      {assignedUsers > 0
        ? `This role is assigned to ${assignedUsers} user${assignedUsers === 1 ? "" : "s"}. Remove those assignments first.`
        : "This action cannot be undone. System roles cannot be deleted."}
    </Typography>
  </CustomDialog>
);

export default RoleDeleteDialog;
