"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";

import CustomDatePicker from "@components/app/CustomDatePicker";
import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { PayrollPayload, PayrollResource } from "../../api/types";
import {
  payrollSchema,
  type PayrollFormInput,
  type PayrollFormValues,
} from "../../schemas/employeesSchemas";

type PayrollFormDrawerProps = {
  open: boolean;
  payroll?: PayrollResource | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: PayrollPayload) => void;
};

const defaults: PayrollFormValues = {
  periodStart: "",
  periodEnd: "",
  employeeIds: [],
  notes: "",
};

const nullable = (value?: string) => value?.trim() || null;

const PayrollFormDrawer = ({
  open,
  payroll,
  isSaving = false,
  onClose,
  onSubmit,
}: PayrollFormDrawerProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<PayrollFormInput, unknown, PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    reset(
      payroll
        ? {
            periodStart: payroll.periodStart,
            periodEnd: payroll.periodEnd,
            employeeIds: payroll.items?.map((item) => item.employeeId) ?? [],
            notes: payroll.notes ?? "",
          }
        : defaults,
    );
  }, [open, payroll, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      period_start: values.periodStart,
      period_end: values.periodEnd,
      employee_ids: values.employeeIds?.length ? values.employeeIds : undefined,
      notes: nullable(values.notes),
    });
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={620}
      title={payroll ? "Edit Payroll Run" : "Prepare Payroll Run"}
      subtitle="Create a payroll period. Totals are calculated by the backend."
    >
      <Stack
        component="form"
        spacing={4}
        sx={{ p: 5 }}
        noValidate
        onSubmit={submit}
      >
        <Stack spacing={0.75}>
          <Typography variant="h5">Payroll Period</Typography>
          <Typography variant="body2" color="text.secondary">
            Do not enter payroll totals here. The backend calculates gross,
            overtime, advance, deduction, and net totals.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="periodStart"
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  label="Period Start"
                  disabled={isSaving}
                  error={Boolean(errors.periodStart)}
                  helperText={errors.periodStart?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="periodEnd"
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  label="Period End"
                  disabled={isSaving}
                  error={Boolean(errors.periodEnd)}
                  helperText={errors.periodEnd?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  label="Notes"
                  disabled={isSaving}
                  error={Boolean(errors.notes)}
                  helperText={errors.notes?.message ?? "Optional."}
                />
              )}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" disabled={isSaving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {payroll ? "Save Changes" : "Create Payroll"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default PayrollFormDrawer;
