"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { useApprovalLevels, useSaveApprovalLevels } from "../hooks/useApprovalLevels";
import {
  approvalLevelsSchema,
  toLevelsForm,
  toLevelsRequest,
  type ApprovalLevelsFormValues,
} from "../schemas/approvalLevelsSchema";
import { describeChain } from "../utils/approval";

const MAX_LEVELS = 6;

export default function ApprovalLevelsView() {
  const query = useApprovalLevels();
  const save = useSaveApprovalLevels();
  const roles = query.data?.data.roles ?? [];

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<ApprovalLevelsFormValues>({
    resolver: zodResolver(approvalLevelsSchema),
    defaultValues: { levels: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "levels" });

  useEffect(() => {
    if (query.data) reset(toLevelsForm(query.data.data.levels));
  }, [query.data, reset]);

  const levels = watch("levels");
  const preview = describeChain(levels.filter((l) => /^\d+(\.\d+)?$/.test(l.min_amount)));

  const submit = handleSubmit((values) =>
    save.mutate(toLevelsRequest(values), {
      onSuccess: (response) => {
        reset(toLevelsForm(response.data.levels));
        toast.success("Approval levels saved.");
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          Object.entries(error.errors).forEach(([path, messages]) => {
            // "levels.1.min_amount" -> the matching form field
            setError(path as `levels.${number}.min_amount`, { message: messages[0] });
          });

          return;
        }
        toast.error(error instanceof ApiError ? error.message : "The levels could not be saved.");
      },
    }),
  );

  return (
    <Stack spacing={5}>
      <Stack spacing={0.5}>
        <Typography variant="h4">Approval levels</Typography>
        <Typography variant="body2" color="text.secondary">
          A loan goes through every level whose starting amount it reaches, one after the other. Loans already in approval keep the
          levels they started with.
        </Typography>
      </Stack>

      {query.isError && <Alert severity="error">The approval levels could not be loaded.</Alert>}

      <Paper className="p-6" component="form" noValidate onSubmit={submit}>
        <Stack spacing={4}>
          {fields.map((row, index) => (
            <Stack key={row.id} direction="row" spacing={2} alignItems="flex-start">
              <Typography variant="h6" sx={{ pt: 1.5, minWidth: 24 }}>
                {index + 1}
              </Typography>
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name={`levels.${index}.name`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField {...field} label="Level name" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name={`levels.${index}.role_id`}
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label="Who can approve" fullWidth helperText="Needs the approve permission either way">
                        <MenuItem value="">Anyone with the approve permission</MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name={`levels.${index}.min_amount`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Required from loan amount (PHP)"
                        fullWidth
                        disabled={index === 0}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message ?? (index === 0 ? "The first level covers every loan." : undefined)}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              <IconButton aria-label="Remove level" disabled={index === 0} onClick={() => remove(index)} sx={{ mt: 0.5 }}>
                <i className="bx bx-trash" />
              </IconButton>
            </Stack>
          ))}

          {errors.levels?.root?.message && <Alert severity="error">{errors.levels.root.message}</Alert>}

          <Stack direction="row" justifyContent="space-between">
            <Button disabled={fields.length >= MAX_LEVELS} onClick={() => append({ name: "", role_id: "", min_amount: "" })}>
              Add level
            </Button>
            <Button type="submit" variant="contained" disabled={!isDirty || save.isPending || query.isLoading}>
              Save levels
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {preview.length > 0 && (
        <Paper className="p-6">
          <Stack spacing={1.5}>
            <Typography variant="h6">What this means</Typography>
            {preview.map((band) => (
              <Typography key={band.range} variant="body2">
                <strong>{band.range}:</strong> {band.steps}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      <Alert severity="info">
        Two safeguards always apply, even to administrators: the person who evaluated a loan cannot approve it, and one person cannot
        approve two levels of the same loan. Make sure you have enough different people for the longest chain.
      </Alert>
    </Stack>
  );
}
