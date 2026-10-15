"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";

import CustomDatePicker from "@components/app/CustomDatePicker";
import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type {
  AdvancePayload,
  AdvanceResource,
  EmployeeResource,
} from "../../api/types";
import {
  advanceSchema,
  type AdvanceFormInput,
  type AdvanceFormValues,
} from "../../schemas/employeesSchemas";

type AdvanceFormDrawerProps = {
  open: boolean;
  advance?: AdvanceResource | null;
  employees: EmployeeResource[];
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: AdvancePayload) => void;
};

const defaults: AdvanceFormValues = {
  employeeId: "",
  amount: 0,
  requestedAt: undefined,
  paymentDate: undefined,
  reason: "",
};

const nullable = (value?: string) => value?.trim() || null;

const AdvanceFormDrawer = ({
  open,
  advance,
  employees,
  isSaving = false,
  onClose,
  onSubmit,
}: AdvanceFormDrawerProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<AdvanceFormInput, unknown, AdvanceFormValues>({
    resolver: zodResolver(advanceSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    reset(
      advance
        ? {
            employeeId: advance.employeeId,
            amount: advance.amount,
            requestedAt: advance.requestedAt ?? undefined,
            paymentDate: advance.paymentDate ?? undefined,
            reason: advance.reason ?? "",
          }
        : defaults,
    );
  }, [advance, open, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      employee_id: values.employeeId,
      amount: values.amount,
      requested_at: values.requestedAt,
      payment_date: values.paymentDate ?? null,
      reason: nullable(values.reason),
    });
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={620}
      title={advance ? "Edit Advance" : "Request Advance"}
      subtitle="Record employee salary advances before approval and payroll deduction."
    >
      <Stack
        component="form"
        spacing={4}
        sx={{ p: 5 }}
        noValidate
        onSubmit={submit}
      >
        <Stack spacing={0.75}>
          <Typography variant="h5">Advance Details</Typography>
          <Typography variant="body2" color="text.secondary">
            Only pending advances can be edited after submission.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label="Employee"
                  disabled={isSaving || Boolean(advance)}
                  error={Boolean(errors.employeeId)}
                  helperText={
                    errors.employeeId?.message ??
                    (advance
                      ? "The employee cannot be changed after submission."
                      : undefined)
                  }
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.fullName} · {employee.employeeNo}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Requested Amount"
                  disabled={isSaving || Boolean(advance)}
                  error={Boolean(errors.amount)}
                  helperText={
                    errors.amount?.message ??
                    (advance
                      ? "The requested amount is preserved after submission."
                      : undefined)
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="requestedAt"
              render={({ field }) => (
                <CustomDatePicker
                  value={(field.value as string | undefined) ?? ""}
                  onChange={field.onChange}
                  label="Requested Date"
                  disabled={isSaving || Boolean(advance)}
                  error={Boolean(errors.requestedAt)}
                  helperText={
                    errors.requestedAt?.message ??
                    (advance
                      ? "The request date is preserved after submission."
                      : "Optional.")
                  }
                  isClearable
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="paymentDate"
              render={({ field }) => (
                <CustomDatePicker
                  value={(field.value as string | undefined) ?? ""}
                  onChange={field.onChange}
                  label="Payment Date"
                  disabled={isSaving || Boolean(advance)}
                  error={Boolean(errors.paymentDate)}
                  helperText={
                    errors.paymentDate?.message ??
                    (advance
                      ? "Payment is recorded through the status workflow."
                      : "Optional.")
                  }
                  isClearable
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  label="Reason"
                  disabled={isSaving}
                  error={Boolean(errors.reason)}
                  helperText={errors.reason?.message ?? "Optional."}
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
            {advance ? "Save Changes" : "Submit Request"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default AdvanceFormDrawer;
