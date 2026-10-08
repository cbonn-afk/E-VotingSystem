"use client";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

import type {
  AmendmentChoice,
  AmendmentResource,
  PositionResource,
} from "../../api/types";

type Props = {
  open: boolean;
  submitting: boolean;
  positions: PositionResource[] | null;
  selection: Record<number, number[]>;
  amendments: AmendmentResource[] | null;
  choices: Record<number, AmendmentChoice | undefined>;
  onBack: () => void;
  onConfirm: () => void;
};

export default function ConfirmBallotDialog({
  open,
  submitting,
  positions,
  selection,
  amendments,
  choices,
  onBack,
  onConfirm,
}: Props) {
  return (
    <CustomDialog
      open={open}
      onClose={onBack}
      closeAfterTransition
      title="Confirm Vote"
      description="Check your choices. Once submitted, they cannot be changed."
      actions={
        <>
          <Button onClick={onBack} disabled={submitting} size="large">
            Back
          </Button>
          <Button
            autoFocus
            variant="contained"
            color="success"
            size="large"
            disabled={submitting}
            onClick={onConfirm}
          >
            {submitting ? "Submitting…" : "Confirm"}
          </Button>
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 2, minInlineSize: { sm: 440 } }}>
        {positions && (
          <Stack spacing={1.5}>
            <Typography variant="h6">Candidates</Typography>
            {positions.map((position) => {
              const chosen = (position.candidates ?? []).filter((candidate) =>
                (selection[position.id] ?? []).includes(candidate.id),
              );

              return (
                <Stack key={position.id}>
                  <Typography fontWeight={700}>{position.title}</Typography>
                  {chosen.length === 0 ? (
                    <Typography color="text.secondary" sx={{ ml: 3 }}>
                      – No selection
                    </Typography>
                  ) : (
                    chosen.map((candidate) => (
                      <Typography key={candidate.id} sx={{ ml: 3 }}>
                        – {candidate.name}
                      </Typography>
                    ))
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}
        {positions && amendments && <Divider />}
        {amendments && (
          <Stack spacing={1.5}>
            <Typography variant="h6">Amendments</Typography>
            {amendments.map((amendment) => (
              <Stack key={amendment.id}>
                <Typography fontWeight={700}>{amendment.title}</Typography>
                <Typography
                  sx={{ ml: 3 }}
                  color={choices[amendment.id] === "agree" ? "success.main" : "error.main"}
                >
                  – {choices[amendment.id] === "agree" ? "Agree" : "Disagree"}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </CustomDialog>
  );
}
