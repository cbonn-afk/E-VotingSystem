"use client";

// MUI Imports
import Button from "@mui/material/Button";

// Component Imports
import CustomDialog from "@components/app/CustomDialog";

type ApprovalDecisionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "primary" | "success" | "error" | "warning";
  onClose: () => void;
  onConfirm: () => void;
};

const ApprovalDecisionDialog = ({
  open,
  title,
  description,
  confirmLabel,
  confirmColor = "primary",
  onClose,
  onConfirm,
}: ApprovalDecisionDialogProps) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      title={title}
      description={description}
      icon={<i className="bx-check-shield" />}
      actions={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color={confirmColor} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {null}
    </CustomDialog>
  );
};

export default ApprovalDecisionDialog;
