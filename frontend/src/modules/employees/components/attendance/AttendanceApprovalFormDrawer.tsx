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
  AttendanceApprovalPayload,
  AttendanceApprovalResource,
  EmployeeResource,
} from "../../api/types";
import {
  attendanceApprovalSchema,
  type AttendanceApprovalFormInput,
  type AttendanceApprovalFormValues,
} from "../../schemas/employeesSchemas";

type AttendanceApprovalFormDrawerProps = {
  open: boolean;
  attendance?: AttendanceApprovalResource | null;
  employees: EmployeeResource[];
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: AttendanceApprovalPayload) => void;
};

const defaults: AttendanceApprovalFormValues = {
  employeeId: "",
  attendanceDate: "",
  type: "",
  timeIn: "",
  timeOut: "",
  reason: "",
};

const nullable = (value?: string) => value?.trim() || null;

const AttendanceApprovalFormDrawer = ({
  open,
  attendance,
  employees,
  isSaving = false,
  onClose,
  onSubmit,
}: AttendanceApprovalFormDrawerProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<
    AttendanceApprovalFormInput,
    unknown,
    AttendanceApprovalFormValues
  >({
    resolver: zodResolver(attendanceApprovalSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    reset(
      attendance
        ? {
            employeeId: attendance.employeeId,
            attendanceDate: attendance.attendanceDate,
            type: attendance.type ?? "",
            timeIn: attendance.timeIn ?? "",
            timeOut: attendance.timeOut ?? "",
            reason: attendance.reason ?? "",
          }
        : defaults,
    );
  }, [attendance, open, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      employee_id: values.employeeId,
      attendance_date: values.attendanceDate,
      type: values.type?.trim() || undefined,
      time_in: nullable(values.timeIn),
      time_out: nullable(values.timeOut),
      reason: nullable(values.reason),
    });
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={620}
      title={
        attendance ? "Edit Attendance Approval" : "Create Attendance Approval"
      }
      subtitle="Record attendance corrections that require approval before payroll."
    >
      <Stack
        component="form"
        spacing={4}
        sx={{ p: 5 }}
        noValidate
        onSubmit={submit}
      >
        <Stack spacing={0.75}>
          <Typography variant="h5">Attendance Details</Typography>
          <Typography variant="body2" color="text.secondary">
            Only pending attendance approvals can be edited or resolved.
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="attendanceDate"
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  label="Attendance Date"
                  disabled={isSaving}
                  error={Boolean(errors.attendanceDate)}
                  helperText={errors.attendanceDate?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Type"
                  placeholder="Correction"
                  disabled={isSaving}
                  error={Boolean(errors.type)}
                  helperText={errors.type?.message ?? "Optional."}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="timeIn"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type="time"
                  label="Time In"
                  disabled={isSaving}
                  error={Boolean(errors.timeIn)}
                  helperText={errors.timeIn?.message ?? "Optional."}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="timeOut"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type="time"
                  label="Time Out"
                  disabled={isSaving}
                  error={Boolean(errors.timeOut)}
                  helperText={errors.timeOut?.message ?? "Optional."}
                  InputLabelProps={{ shrink: true }}
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
            {attendance ? "Save Changes" : "Create Request"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default AttendanceApprovalFormDrawer;
