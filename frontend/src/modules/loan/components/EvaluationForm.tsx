"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm, type Path } from "react-hook-form";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { emptyEvaluation, evaluationSchema, toEvaluationPayload, type EvaluationFormValues } from "../schemas/evaluationSchema";
import type { EvaluationPayload, LoanApplication } from "../types";
import { formatPeso } from "../utils/applicationStatus";

type Props = {
  application: LoanApplication;
  pending: boolean;
  onSubmit: (payload: EvaluationPayload, onError: (error: unknown) => void) => void;
};

/** The evaluator's assessment. It only recommends; the approvers decide. */
export default function EvaluationForm({ application, pending, onSubmit }: Props) {
  const { control, handleSubmit, setError, watch } = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema(application)),
    defaultValues: emptyEvaluation,
  });

  const recommendation = watch("recommendation");

  const field = (name: Path<EvaluationFormValues>, label: string, helper?: string, multiline = false) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField
          {...f}
          label={label}
          fullWidth
          multiline={multiline}
          minRows={multiline ? 3 : undefined}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helper}
        />
      )}
    />
  );

  const submit = handleSubmit((values) =>
    onSubmit(toEvaluationPayload(values), (error) => {
      if (error instanceof ApiError && error.status === 422) {
        Object.entries(error.errors).forEach(([name, messages]) => {
          if (name === "status") toast.error(messages[0]);
          else setError(name as Path<EvaluationFormValues>, { message: messages[0] });
        });

        return;
      }
      toast.error(error instanceof ApiError ? error.message : "The evaluation could not be saved.");
    }),
  );

  return (
    <Paper className="p-6" component="form" noValidate onSubmit={submit}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Evaluation</Typography>
          <Typography variant="body2" color="text.secondary">
            Review the member, the documents and the guarantors, then record your recommendation. Requested: {formatPeso(application.amount)}.
          </Typography>
        </Stack>

        <Controller
          name="recommendation"
          control={control}
          render={({ field: f }) => (
            <RadioGroup {...f}>
              <FormControlLabel value="approve" control={<Radio />} label="Recommend approval of the requested amount" />
              <FormControlLabel value="approve_lower" control={<Radio />} label="Recommend a lower amount" />
              <FormControlLabel value="reject" control={<Radio />} label="Recommend rejection" />
            </RadioGroup>
          )}
        />

        <Grid container spacing={3}>
          {recommendation === "approve_lower" && <Grid size={{ xs: 12, sm: 4 }}>{field("recommended_amount", "Recommended amount (PHP)")}</Grid>}
          <Grid size={{ xs: 12, sm: 4 }}>{field("verified_income", "Verified monthly income (optional)")}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field("existing_obligations", "Existing monthly obligations (optional)")}</Grid>
          <Grid size={12}>{field("notes", "Assessment", "Payment capacity, history, documents, anything the approvers should know.", true)}</Grid>
        </Grid>

        {recommendation === "reject" && (
          <Alert severity="info">A rejection recommendation does not end the application. The approvers still decide.</Alert>
        )}

        <Stack direction="row" justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={pending}>
            Submit evaluation
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
