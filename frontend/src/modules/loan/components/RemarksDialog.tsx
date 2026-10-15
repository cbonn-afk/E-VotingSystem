"use client";

import { useEffect, useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

type Props = {
  open: boolean;
  title: string;
  label: string;
  confirmLabel: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
};

/** Asks staff for the reason the member will read. */
export default function RemarksDialog({ open, title, label, confirmLabel, pending, onClose, onConfirm }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth multiline minRows={3} label={label} value={text} onChange={(e) => setText(e.target.value)} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={text.trim() === "" || pending} onClick={() => onConfirm(text.trim())}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
