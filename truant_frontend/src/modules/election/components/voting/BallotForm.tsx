"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type {
  AmendmentChoice,
  PositionResource,
  VoterEligibility,
  VotingBallot,
} from "../../api/types";
import AmendmentVoteCard from "./AmendmentVoteCard";
import CandidatePickCard from "./CandidatePickCard";

type Props = {
  ballot: VotingBallot;
  sections: VoterEligibility["sections"];
  selection: Record<number, number[]>;
  choices: Record<number, AmendmentChoice | undefined>;
  onToggle: (position: PositionResource, candidateId: number) => void;
  onChoose: (amendmentId: number, choice: AmendmentChoice) => void;
  onReview: () => void;
};

export default function BallotForm({
  ballot,
  sections,
  selection,
  choices,
  onToggle,
  onChoose,
  onReview,
}: Props) {
  return (
    <Stack spacing={8} sx={{ p: { xs: 3, md: 6 }, maxInlineSize: 1600, mx: "auto" }}>
      {sections.election &&
        ballot.positions.map((position) => (
          <Stack key={position.id} spacing={4}>
            <Stack alignItems="center" spacing={1}>
              <Typography variant="h3" sx={{ fontWeight: 900, textTransform: "uppercase" }} textAlign="center">
                {position.title}
              </Typography>
              <Typography variant="h5" color="warning.main" fontWeight={700}>
                Vote for up to {position.seats} ·{" "}
                {(selection[position.id] ?? []).length} selected
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gap: 4,
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                justifyItems: "stretch",
              }}
            >
              {(position.candidates ?? []).map((candidate) => (
                <CandidatePickCard
                  key={candidate.id}
                  candidate={candidate}
                  selected={(selection[position.id] ?? []).includes(candidate.id)}
                  onToggle={() => onToggle(position, candidate.id)}
                />
              ))}
            </Box>
          </Stack>
        ))}

      {sections.amendments && ballot.amendments.length > 0 && (
        <Stack spacing={4}>
          <Typography variant="h3" sx={{ fontWeight: 900, textTransform: "uppercase" }} textAlign="center">
            Proposed Amendments
          </Typography>
          {ballot.amendments.map((amendment) => (
            <AmendmentVoteCard
              key={amendment.id}
              amendment={amendment}
              choice={choices[amendment.id]}
              onChoose={(choice) => onChoose(amendment.id, choice)}
            />
          ))}
        </Stack>
      )}

      <Stack spacing={3} alignItems="center">
        <Typography variant="h5" color="error.main" textAlign="center">
          <b>NOTICE:</b> Check your votes carefully before submitting. Once submitted, you can&apos;t edit them.
        </Typography>
        <Button
          size="large"
          variant="contained"
          color="success"
          startIcon={<i className="bx bx-check-circle" />}
          onClick={onReview}
          sx={{ px: 8, py: 2.5, fontSize: "1.25rem" }}
        >
          Cast Vote
        </Button>
      </Stack>
    </Stack>
  );
}
