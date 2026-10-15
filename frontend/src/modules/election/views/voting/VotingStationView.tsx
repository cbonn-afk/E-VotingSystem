"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";

import type {
  AmendmentChoice,
  CastBallotPayload,
  PositionResource,
  VoterEligibility,
  VotingBallot,
} from "../../api/types";
import BallotForm from "../../components/voting/BallotForm";
import ConfirmBallotDialog from "../../components/voting/ConfirmBallotDialog";
import VoterCodeEntry from "../../components/voting/VoterCodeEntry";
import MemberInfoDialog from "../../components/shared/MemberInfoDialog";
import { useElectionSettings } from "../../hooks/useElectionSettingsApi";
import { useVotingMutations } from "../../hooks/useVotingApi";
import { getElectionErrorMessage } from "../../utils/electionFormat";

type Stage = "code" | "info" | "ballot";
type Notice = { severity: "success" | "warning" | "error"; message: string };

export default function VotingStationView() {
  const settings = useElectionSettings().data?.data;
  const mutations = useVotingMutations();
  const [stage, setStage] = useState<Stage>("code");
  const [voter, setVoter] = useState<VoterEligibility | null>(null);
  const [ballot, setBallot] = useState<VotingBallot | null>(null);
  const [selection, setSelection] = useState<Record<number, number[]>>({});
  const [choices, setChoices] = useState<Record<number, AmendmentChoice | undefined>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const reset = () => {
    setStage("code");
    setVoter(null);
    setBallot(null);
    setSelection({});
    setChoices({});
    setConfirmOpen(false);
  };

  const startVoting = async (code: string) => {
    setNotice(null);

    try {
      const eligibility = await mutations.eligibility.mutateAsync(code);
      const loaded = await mutations.loadBallot.mutateAsync();

      setVoter(eligibility.data);
      setBallot(loaded.data);
      setSelection({});
      setChoices({});
      setStage(settings?.vote_show_member_info ?? true ? "info" : "ballot");
    } catch (error) {
      setNotice({ severity: "warning", message: getElectionErrorMessage(error) });
    }
  };

  const toggleCandidate = (position: PositionResource, candidateId: number) => {
    const current = selection[position.id] ?? [];

    if (current.includes(candidateId)) {
      setSelection({ ...selection, [position.id]: current.filter((id) => id !== candidateId) });

      return;
    }

    if (current.length >= position.seats) {
      setNotice({
        severity: "error",
        message: "You have now cast the most votes possible in this category.",
      });

      return;
    }

    setSelection({ ...selection, [position.id]: [...current, candidateId] });
  };

  const review = () => {
    if (!ballot || !voter) return;

    if (
      voter.sections.amendments &&
      ballot.amendments.some((amendment) => !choices[amendment.id])
    ) {
      setNotice({ severity: "error", message: "Please vote for every proposed amendment." });

      return;
    }

    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!ballot || !voter) return;

    const payload: CastBallotPayload = {
      member_code: voter.member_code,
      votes: voter.sections.election
        ? ballot.positions.map((position) => ({
            position_id: position.id,
            candidate_ids: selection[position.id] ?? [],
          }))
        : null,
      amendments: voter.sections.amendments
        ? ballot.amendments.map((amendment) => ({
            amendment_id: amendment.id,
            choice: choices[amendment.id] as AmendmentChoice,
          }))
        : null,
    };

    try {
      await mutations.cast.mutateAsync(payload);
      setNotice({ severity: "success", message: "We've successfully registered your vote." });
    } catch (error) {
      setNotice({ severity: "error", message: getElectionErrorMessage(error) });
    } finally {
      // Either way, the next voter starts clean.
      reset();
    }
  };

  return (
    <Box sx={{ minBlockSize: "100dvh", bgcolor: "background.default" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          blockSize: 64,
          px: 4,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h6" color="inherit">
          {stage === "ballot" && voter
            ? `Please vote accordingly · ${voter.name}`
            : settings?.company_title || "Voting Station"}
        </Typography>
        {stage === "code" ? (
          <Button component={Link} href="/election" color="inherit" size="small">
            Exit
          </Button>
        ) : (
          <Button color="inherit" size="small" onClick={reset}>
            Cancel
          </Button>
        )}
      </Stack>

      {stage === "ballot" && ballot && voter ? (
        <BallotForm
          ballot={ballot}
          sections={voter.sections}
          selection={selection}
          choices={choices}
          onToggle={toggleCandidate}
          onChoose={(amendmentId, choice) =>
            setChoices({ ...choices, [amendmentId]: choice })
          }
          onReview={review}
        />
      ) : (
        <VoterCodeEntry
          title={settings?.document_title || "Cast Your Vote"}
          autoSearch={settings?.vote_auto_search ?? false}
          busy={mutations.eligibility.isPending || mutations.loadBallot.isPending}
          onSubmit={startVoting}
        />
      )}

      <MemberInfoDialog
        open={stage === "info"}
        member={voter}
        confirmLabel="Continue to ballot"
        onConfirm={() => setStage("ballot")}
        onCancel={reset}
      />
      <ConfirmBallotDialog
        open={confirmOpen}
        submitting={mutations.cast.isPending}
        positions={voter?.sections.election ? (ballot?.positions ?? null) : null}
        selection={selection}
        amendments={voter?.sections.amendments ? (ballot?.amendments ?? null) : null}
        choices={choices}
        onBack={() => setConfirmOpen(false)}
        onConfirm={() => void submit()}
      />
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setNotice(null)}
      >
        <Alert
          severity={notice?.severity ?? "info"}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ fontSize: "1.1rem" }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
