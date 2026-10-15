"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import MemberCodeInput from "../shared/MemberCodeInput";

type Props = {
  title: string;
  autoSearch: boolean;
  busy: boolean;
  onSubmit: (code: string) => Promise<void>;
};

export default function VoterCodeEntry({ title, autoSearch, busy, onSubmit }: Props) {
  const [code, setCode] = useState("");

  const submit = async (value: string) => {
    if (!value || busy) return;

    try {
      await onSubmit(value);
    } finally {
      setCode("");
    }
  };

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minBlockSize: "calc(100dvh - 64px)", p: 4 }}>
      <Paper elevation={6} sx={{ inlineSize: "100%", maxInlineSize: 640, p: { xs: 4, md: 8 } }}>
        <Stack spacing={5} alignItems="center">
          <Stack spacing={1} alignItems="center">
            <Typography variant="h3" textAlign="center">
              {title}
            </Typography>
            <Typography color="text.secondary" textAlign="center">
              {autoSearch ? "Search for your name to begin." : "Scan or enter your badge number to begin."}
            </Typography>
          </Stack>
          <MemberCodeInput
            large
            label={autoSearch ? "Search your name or code" : "Enter Badge Number"}
            value={code}
            onChange={setCode}
            onSubmit={(value) => void submit(value)}
            autoSearch={autoSearch}
            scope="voting"
            disabled={busy}
          />
          {!autoSearch && (
            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={!code || busy}
              onClick={() => void submit(code)}
              startIcon={<i className="bx bx-check" />}
            >
              {busy ? "Checking…" : "Continue"}
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
