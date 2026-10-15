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
  EmployeeResource,
  OvertimePayload,
  OvertimeResource,
} from "../../api/types";
import {
  overtimeSchema,
  type OvertimeFormInput,
  type OvertimeFormValues,
} from "../../schemas/employeesSchemas";

type OvertimeFormDrawerProps = {
  open: boolean;
  overtime?: OvertimeResource | null;
  employees: EmployeeResource[];
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: OvertimePayload) => void;
};

const defaults: OvertimeFormValues = {
  employeeId: "",
  workDate: "",
  hours: 0,
  ratePerHour: undefined,
};

const OvertimeFormDrawer = ({
  open,
  overtime,
  employees,
  isSaving = false,
  onClose,
  onSubmit,
}: OvertimeFormDrawerProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<OvertimeFormInput, unknown, OvertimeFormValues>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    reset(
      overtime
        ? {
            employeeId: overtime.employeeId,
            workDate: overtime.workDate,
            hours: overtime.hours,
            ratePerHour: overtime.ratePerHour ?? undefined,
          }
        : defaults,
    );
  }, [open, overtime, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      employee_id: values.employeeId,
      work_date: values.workDate,
      hours: values.hours,
      rate_per_hour: values.ratePerHour ?? null,
    });
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={620}
      title={overtime ? "Edit Overtime" : "Request Overtime"}
      subtitle="Capture overtime requests before approval and payroll computation."
    >
      <Stack
        component="form"
        spacing={4}
        sx={{ p: 5 }}
        noValidate
        onSubmit={submit}
      >
        <Stack spacing={0.75}>
          <Typography variant="h5">Overtime Details</Typography>
          <Typography variant="body2" color="text.secondary">
            If rate is blank, the backend uses the active standard OT rate for
            the employee's position and employment type.
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
                  disabled={isSaving}
                  error={Boolean(errors.employeeId)}
                  helperText={errors.employeeId?.message}
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
              name="workDate"
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  label="Work Date"
                  disabled={isSaving}
                  error={Boolean(errors.workDate)}
                  helperText={errors.workDate?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="hours"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Hours"
                  disabled={isSaving}
                  error={Boolean(errors.hours)}
                  helperText={errors.hours?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="ratePerHour"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  type="number"
                  label="Rate / Hour"
                  disabled={isSaving}
                  error={Boolean(errors.ratePerHour)}
                  helperText={errors.ratePerHour?.message ?? "Optional."}
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
            {overtime ? "Save Changes" : "Submit Request"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default OvertimeFormDrawer;
