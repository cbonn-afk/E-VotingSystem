"use client";

import Button from "@mui/material/Button";

import CustomDialog from "@components/app/CustomDialog";

type WorkflowStatusDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "primary" | "success" | "error" | "warning";
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const WorkflowStatusDialog = ({
  open,
  title,
  description,
  confirmLabel,
  confirmColor = "primary",
  isSaving = false,
  onClose,
  onConfirm,
}: WorkflowStatusDialogProps) => (
  <CustomDialog
    open={open}
    onClose={onClose}
    closeAfterTransition
    title={title}
    description={description}
    icon={<i className="bx bx-check-shield" />}
    actions={
      <>
        <Button variant="outlined" disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          disabled={isSaving}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {null}
  </CustomDialog>
);

export default WorkflowStatusDialog;
