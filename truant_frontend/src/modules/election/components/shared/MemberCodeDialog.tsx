"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import CustomDialog from "@components/app/CustomDialog";

import MemberCodeInput from "./MemberCodeInput";

type Props = {
  open: boolean;
  title: string;
  label: string;
  autoSearch: boolean;
  scope: "registration" | "voting";
  busy?: boolean;
  error?: string | null;
  onSubmit: (code: string) => Promise<void>;
  onClose: () => void;
};

export default function MemberCodeDialog({
  open,
  title,
  label,
  autoSearch,
  scope,
  busy,
  error,
  onSubmit,
  onClose,
}: Props) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (open) setCode("");
  }, [open]);

  const submit = async (value: string) => {
    if (!value || busy) return;

    try {
      await onSubmit(value);
    } finally {
      setCode("");
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      title={title}
      actions={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            disabled={!code || busy}
            onClick={() => void submit(code)}
          >
            Check
          </Button>
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 2, minInlineSize: { sm: 420 } }}>
        {error && <Alert severity="warning">{error}</Alert>}
        <MemberCodeInput
          label={label}
          value={code}
          onChange={setCode}
          onSubmit={(value) => void submit(value)}
          autoSearch={autoSearch}
          scope={scope}
          disabled={busy}
        />
      </Stack>
    </CustomDialog>
  );
}
