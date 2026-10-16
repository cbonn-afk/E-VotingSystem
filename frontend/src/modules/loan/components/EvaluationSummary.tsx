import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ApplicationEvaluation, Recommendation } from "../types";
import { formatDateTime, formatPeso } from "../utils/applicationStatus";

const label: Record<Recommendation, string> = {
  approve: "Recommends approval",
  approve_lower: "Recommends a lower amount",
  reject: "Recommends rejection",
};

const color: Record<Recommendation, "success" | "warning" | "error"> = { approve: "success", approve_lower: "warning", reject: "error" };

export default function EvaluationSummary({ evaluation }: { evaluation: ApplicationEvaluation }) {
  return (
    <Paper className="p-6">
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="h6">Evaluation</Typography>
          <Chip size="small" variant="tonal" color={color[evaluation.recommendation]} label={label[evaluation.recommendation]} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {evaluation.evaluator_name} · {formatDateTime(evaluation.created_at)}
        </Typography>
        {evaluation.recommended_amount && evaluation.recommendation === "approve_lower" && (
          <Typography variant="body2">Recommended amount: {formatPeso(evaluation.recommended_amount)}</Typography>
        )}
        {evaluation.verified_income && <Typography variant="body2">Verified monthly income: {formatPeso(evaluation.verified_income)}</Typography>}
        {evaluation.existing_obligations && <Typography variant="body2">Existing monthly obligations: {formatPeso(evaluation.existing_obligations)}</Typography>}
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {evaluation.notes}
        </Typography>
      </Stack>
    </Paper>
  );
}
