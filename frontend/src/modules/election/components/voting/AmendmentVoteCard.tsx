import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { AmendmentChoice, AmendmentResource } from "../../api/types";

type Props = {
  amendment: AmendmentResource;
  choice: AmendmentChoice | undefined;
  onChoose: (choice: AmendmentChoice) => void;
};

const Block = ({ label, text }: { label: string; text: string | null }) => (
  <Stack spacing={1}>
    <Typography variant="overline" color="error.main" fontWeight={700}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "1.35rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
      {text || "—"}
    </Typography>
  </Stack>
);

export default function AmendmentVoteCard({ amendment, choice, onChoose }: Props) {
  return (
    <Paper sx={{ p: { xs: 4, md: 6 } }} elevation={3}>
      <Stack spacing={4}>
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h4" color="error.main" textAlign="center">
            {amendment.title}
          </Typography>
          <Typography variant="h6">Proposed By: {amendment.proposed_by || "—"}</Typography>
        </Stack>
        <Block label="Proposed amendment" text={amendment.proposed_content} />
        <Block label="Original content" text={amendment.original_content} />
        <Block label="Effect" text={amendment.effect} />
        <RadioGroup
          row
          sx={{ justifyContent: "flex-end", gap: 6 }}
          value={choice ?? ""}
          onChange={(event) => onChoose(event.target.value as AmendmentChoice)}
        >
          <FormControlLabel
            value="disagree"
            control={<Radio color="error" size="medium" />}
            label={<Typography variant="h5" fontWeight={700}>Disagree</Typography>}
          />
          <FormControlLabel
            value="agree"
            control={<Radio color="success" size="medium" />}
            label={<Typography variant="h5" fontWeight={700}>Agree</Typography>}
          />
        </RadioGroup>
      </Stack>
    </Paper>
  );
}
