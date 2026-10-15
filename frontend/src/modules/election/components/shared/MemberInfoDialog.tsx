"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

type Props = {
  open: boolean;
  member: { name: string; member_code: string } | null;
  confirming?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** "Is this the right person?" step. The Confirm button has focus, so Enter confirms. */
export default function MemberInfoDialog({
  open,
  member,
  confirming,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <CustomDialog
      open={open}
      onClose={onCancel}
      closeAfterTransition
      title="Member Info"
      actions={
        <>
          <Button onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button
            autoFocus
            variant="contained"
            color="success"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Stack spacing={1} alignItems="center" sx={{ mt: 2, minInlineSize: { sm: 360 } }}>
        <Typography variant="h4" textAlign="center">
          {member?.name}
        </Typography>
        <Typography color="text.secondary">
          Member Code: <b>{member?.member_code}</b>
        </Typography>
      </Stack>
    </CustomDialog>
  );
}
