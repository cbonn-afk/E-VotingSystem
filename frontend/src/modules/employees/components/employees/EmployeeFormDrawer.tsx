"use client";

import { useCallback, useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";

import CustomDatePicker from "@components/app/CustomDatePicker";
import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";
import type {
  EmployeePayload,
  EmployeeResource,
  EmployeeUserOption,
} from "../../api/types";
import {
  defaultEmployeeType,
  employeeTypeDefinitions,
  formatContribution,
} from "../../data/employeeTypes";
import {
  useCompensationConfiguration,
  useBranchOptions,
  useEmployeeTypeRates,
  useEmployeeUserOptions,
} from "../../hooks/useEmployeesApi";
import {
  employeeSchema,
  type EmployeeFormInput,
  type EmployeeFormValues,
} from "../../schemas/employeesSchemas";

type EmployeeFormDrawerProps = {
  open: boolean;
  employee?: EmployeeResource | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: EmployeePayload) => void;
};

const defaults: EmployeeFormValues = {
  employeeNo: "",
  userId: undefined,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  branchIds: [],
  position: defaultEmployeeType.value,
  employmentType: defaultEmployeeType.employmentType,
  employmentTypeId: undefined,
  paySchemeId: undefined,
  hireDate: undefined,
  baseSalary: defaultEmployeeType.baseRate,
  hourlyRate: defaultEmployeeType.overtimeRate,
  payrollStatus: "Eligible",
  attendanceTrackingEnabled: true,
  payrollExclusionReason: "",
  notes: "",
};

const nullable = (value?: string) => value?.trim() || null;

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
};

const EmployeeFormDrawer = ({
  open,
  employee,
  isSaving = false,
  onClose,
  onSubmit,
}: EmployeeFormDrawerProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<EmployeeFormInput, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaults,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const employeeTypeRatesQuery = useEmployeeTypeRates();
  const configurationQuery = useCompensationConfiguration();
  const branchOptionsQuery = useBranchOptions(open);
  const branchOptions = branchOptionsQuery.data?.data ?? [];
  const liveEmployeeTypes = useMemo(
    () =>
      (employeeTypeRatesQuery.data?.data ?? [])
        .filter((type) => type.isActive)
        .map((type) => ({
          jobPositionId: type.jobPositionId,
          employmentTypeId: type.employmentTypeId,
          paySchemeId: type.paySchemeId,
          value: type.employeeType,
          label: type.employeeType,
          baseRate: type.baseRate,
          overtimeRate: type.overtimeRate,
          employmentType: type.employmentType,
          sss: type.sssAmount,
          philHealth: type.philhealthAmount,
          pagIbig: type.pagibigAmount,
        })),
    [employeeTypeRatesQuery.data?.data],
  );
  const availableEmployeeTypes = useMemo(() => {
    const configured =
      configurationQuery.data?.data.jobPositions.filter(
        (position) => position.isActive,
      ) ?? [];
    if (configured.length === 0)
      return liveEmployeeTypes.length > 0
        ? liveEmployeeTypes
        : employeeTypeDefinitions.map((type) => ({
            ...type,
            jobPositionId: null,
            employmentTypeId: null,
            paySchemeId: null,
          }));

    return configured.map((position) => {
      const rate = liveEmployeeTypes.find(
        (type) =>
          type.jobPositionId === position.id &&
          type.employmentType.toLowerCase() === "regular",
      );
      return (
        rate ?? {
          jobPositionId: position.id,
          employmentTypeId: null,
          paySchemeId: null,
          value: position.name,
          label: position.name,
          baseRate: 0,
          overtimeRate: 0,
          employmentType: "Regular" as const,
          sss: null,
          philHealth: null,
          pagIbig: null,
        }
      );
    });
  }, [configurationQuery.data?.data.jobPositions, liveEmployeeTypes]);
  const findEmployeeType = useCallback(
    (value?: string | null) =>
      availableEmployeeTypes.find(
        (type) => type.value.toLowerCase() === value?.toLowerCase(),
      ) ??
      availableEmployeeTypes[0] ??
      defaultEmployeeType,
    [availableEmployeeTypes],
  );
  const selectedType = findEmployeeType(watch("position"));
  const selectedEmploymentTypeId = watch("employmentTypeId");
  const selectedPaySchemeId = watch("paySchemeId");
  const selectedPayScheme = configurationQuery.data?.data.paySchemes.find(
    (option) => option.id === selectedPaySchemeId,
  );
  const selectedUserId = watch("userId");
  const payrollStatus = watch("payrollStatus");
  const usersQuery = useEmployeeUserOptions(employee?.userId, open);
  const importableUsers = usersQuery.data?.data ?? [];
  const selectedUser = useMemo(
    () => importableUsers.find((user) => user.id === selectedUserId) ?? null,
    [importableUsers, selectedUserId],
  );

  useEffect(() => {
    if (!open) return;

    const employeeType = findEmployeeType(employee?.position);

    reset(
      employee
        ? {
            employeeNo: employee.employeeNo ?? "",
            userId: employee.userId ?? undefined,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            branchIds: employee.branches.map((branch) => branch.id),
            position: employeeType.value,
            employmentType:
              employee.employmentType ?? employeeType.employmentType,
            employmentTypeId: employee.employmentTypeId ?? undefined,
            paySchemeId: employee.paySchemeId ?? undefined,
            hireDate: employee.hireDate ?? undefined,
            baseSalary: employee.baseSalary ?? employeeType.baseRate,
            hourlyRate: employee.hourlyRate ?? employeeType.overtimeRate,
            payrollStatus: employee.payrollStatus ?? "Eligible",
            attendanceTrackingEnabled: employee.attendanceTrackingEnabled,
            payrollExclusionReason: employee.payrollExclusionReason ?? "",
            notes: employee.notes ?? "",
          }
        : {
            ...defaults,
            position: employeeType.value,
            employmentType: employeeType.employmentType,
            employmentTypeId:
              configurationQuery.data?.data.employmentTypes.find(
                (option) => option.name === employeeType.employmentType,
              )?.id,
            paySchemeId: configurationQuery.data?.data.paySchemes.find(
              (option) =>
                option.code ===
                (employeeType.value.toLowerCase().includes("tailor")
                  ? "piece_rate"
                  : "monthly"),
            )?.id,
            baseSalary: employeeType.baseRate,
            hourlyRate: employeeType.overtimeRate,
            attendanceTrackingEnabled: !employeeType.value
              .toLowerCase()
              .includes("tailor"),
          },
    );
  }, [configurationQuery.data?.data, employee, findEmployeeType, open, reset]);

  const importUser = (user: EmployeeUserOption | null) => {
    setValue("userId", user?.id, { shouldDirty: true, shouldValidate: true });

    if (!user) return;

    const { firstName, lastName } = splitName(user.name);

    setValue("firstName", firstName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("lastName", lastName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("email", user.email, { shouldDirty: true, shouldValidate: true });
  };

  const applyEmployeeType = (value: string) => {
    const type = findEmployeeType(value);
    const rate =
      liveEmployeeTypes.find(
        (candidate) =>
          candidate.jobPositionId === type.jobPositionId &&
          candidate.employmentTypeId === selectedEmploymentTypeId,
      ) ??
      liveEmployeeTypes.find(
        (candidate) => candidate.jobPositionId === type.jobPositionId,
      ) ??
      type;

    setValue("position", type.value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("employmentType", rate.employmentType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "employmentTypeId",
      rate.employmentTypeId ??
        configurationQuery.data?.data.employmentTypes.find(
          (option) => option.name === rate.employmentType,
        )?.id,
      { shouldDirty: true },
    );
    setValue("paySchemeId", rate.paySchemeId ?? undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("baseSalary", rate.baseRate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("hourlyRate", rate.overtimeRate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "attendanceTrackingEnabled",
      rate.paySchemeId
        ? configurationQuery.data?.data.paySchemes.find(
            (scheme) => scheme.id === rate.paySchemeId,
          )?.code !== "piece_rate"
        : !type.value.toLowerCase().includes("tailor"),
      { shouldDirty: true },
    );
  };

  const submit = handleSubmit((values) => {
    const type = findEmployeeType(values.position);
    const configuration = configurationQuery.data?.data;
    const position = configuration?.jobPositions.find(
      (option) => option.name.toLowerCase() === type.value.toLowerCase(),
    );
    const employmentType =
      configuration?.employmentTypes.find(
        (option) => option.id === values.employmentTypeId,
      ) ??
      configuration?.employmentTypes.find(
        (option) => option.name === values.employmentType,
      );
    const payScheme = configuration?.paySchemes.find(
      (option) => option.id === values.paySchemeId,
    );

    onSubmit({
      employee_no: nullable(values.employeeNo),
      user_id: values.userId ?? null,
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: nullable(values.phone),
      department: null,
      branch_ids: values.branchIds,
      position: type.value,
      job_position_id: position?.id ?? null,
      employment_type: values.employmentType,
      employment_type_id: employmentType?.id ?? null,
      pay_scheme_id: payScheme?.id ?? null,
      rate_effective_from: employee
        ? new Date().toISOString().slice(0, 10)
        : (values.hireDate ?? new Date().toISOString().slice(0, 10)),
      hire_date: values.hireDate ?? null,
      base_salary: values.baseSalary ?? 0,
      hourly_rate: values.hourlyRate ?? 0,
      attendance_tracking_enabled: values.attendanceTrackingEnabled,
      payroll_status: values.payrollStatus,
      payroll_exclusion_reason:
        values.payrollStatus === "Eligible"
          ? null
          : nullable(values.payrollExclusionReason),
      notes: nullable(values.notes),
    });
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={employee ? "Edit Employee" : "Create Employee"}
      subtitle="Maintain employee master data used by attendance, advances, overtime, and payroll."
      width={760}
    >
      <Stack
        component="form"
        spacing={4}
        sx={{ p: 5, "& .MuiFormHelperText-root": { minHeight: 20 } }}
        noValidate
        onSubmit={submit}
      >
        <Stack spacing={0.75}>
          <Typography variant="h5">Employee Details</Typography>
          <Typography variant="body2" color="text.secondary">
            Connect employee records to user accounts and keep payroll-ready
            staff type rates accurate.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={importableUsers}
              value={selectedUser}
              loading={usersQuery.isPending}
              disabled={isSaving}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, user) => importUser(user)}
              renderInput={(params) => (
                <CustomTextField
                  {...params}
                  label="Import from User"
                  placeholder="Search a system user"
                  error={Boolean(errors.userId)}
                  helperText={
                    errors.userId?.message ??
                    (usersQuery.isError
                      ? "User import is unavailable for this account."
                      : "Optional. Only Employee accounts that are not yet linked are shown.")
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="branchIds"
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={branchOptions}
                  value={branchOptions.filter((branch) =>
                    (field.value ?? []).includes(branch.id),
                  )}
                  loading={branchOptionsQuery.isPending}
                  disabled={isSaving}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_event, branches) =>
                    field.onChange(branches.map((branch) => branch.id))
                  }
                  renderInput={(params) => (
                    <CustomTextField
                      {...params}
                      label="Branches"
                      placeholder={
                        (field.value ?? []).length
                          ? ""
                          : "Select one or more branches"
                      }
                      error={Boolean(errors.branchIds)}
                      helperText={
                        errors.branchIds?.message ??
                        (branchOptionsQuery.isError
                          ? "Branch options could not be loaded."
                          : "Employees may be assigned to multiple branches.")
                      }
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="employeeNo"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Employee No."
                  placeholder="Auto-generated"
                  disabled={isSaving}
                  error={Boolean(errors.employeeNo)}
                  helperText={errors.employeeNo?.message ?? "Optional."}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="employmentTypeId"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  select
                  fullWidth
                  label="Employment Type"
                  disabled={isSaving}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    const selected =
                      configurationQuery.data?.data.employmentTypes.find(
                        (option) => option.id === event.target.value,
                      );
                    if (selected)
                      setValue(
                        "employmentType",
                        selected.name as EmployeeFormValues["employmentType"],
                        { shouldDirty: true },
                      );
                    const standardRate = liveEmployeeTypes.find(
                      (rate) =>
                        rate.jobPositionId === selectedType.jobPositionId &&
                        rate.employmentTypeId === event.target.value,
                    );
                    if (standardRate) {
                      setValue("paySchemeId", standardRate.paySchemeId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("baseSalary", standardRate.baseRate, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("hourlyRate", standardRate.overtimeRate, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  {(configurationQuery.data?.data.employmentTypes ?? [])
                    .filter((option) => option.isActive)
                    .map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="paySchemeId"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  select
                  fullWidth
                  label="Pay Scheme"
                  disabled={isSaving}
                >
                  {(configurationQuery.data?.data.paySchemes ?? [])
                    .filter((option) => option.isActive)
                    .map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="First Name"
                  disabled={isSaving}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Last Name"
                  disabled={isSaving}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  label="Email"
                  placeholder="employee@aiur.local"
                  disabled={isSaving}
                  error={Boolean(errors.email)}
                  helperText={
                    errors.email?.message ??
                    "Unique email used to link account access and employee records."
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Phone"
                  placeholder="+63 917 000 0000"
                  disabled={isSaving}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message ?? "Optional."}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Controller
              control={control}
              name="position"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label="Employee Type"
                  disabled={isSaving}
                  error={Boolean(errors.position)}
                  helperText={
                    errors.position?.message ??
                    "Rates and deductions follow the selected employee type."
                  }
                  onChange={(event) => applyEmployeeType(event.target.value)}
                >
                  {availableEmployeeTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={control}
              name="hireDate"
              render={({ field }) => (
                <CustomDatePicker
                  value={(field.value as string | undefined) ?? ""}
                  onChange={field.onChange}
                  label="Hire Date"
                  disabled={isSaving}
                  error={Boolean(errors.hireDate)}
                  helperText={errors.hireDate?.message ?? "Optional."}
                  maxDate={new Date()}
                  isClearable
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="baseSalary"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  type="number"
                  label={
                    selectedPayScheme?.code === "daily"
                      ? "Daily Rate"
                      : selectedPayScheme?.code === "monthly"
                        ? "Monthly Rate"
                        : "Base Rate (not used)"
                  }
                  disabled={
                    isSaving ||
                    selectedPayScheme?.code === "piece_rate" ||
                    selectedPayScheme?.code === "hourly"
                  }
                  error={Boolean(errors.baseSalary)}
                  helperText={
                    errors.baseSalary?.message ??
                    "Effective compensation rate for the selected scheme."
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="hourlyRate"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  type="number"
                  label={
                    selectedPayScheme?.code === "hourly"
                      ? "Hourly Rate"
                      : "Reference Hourly / OT Rate"
                  }
                  disabled={isSaving}
                  error={Boolean(errors.hourlyRate)}
                  helperText={
                    errors.hourlyRate?.message ??
                    "Hourly base for Hourly employees; overtime requests snapshot their approved rate."
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Controller
              control={control}
              name="payrollStatus"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label="Payroll Eligibility"
                  disabled={isSaving}
                  error={Boolean(errors.payrollStatus)}
                  helperText={
                    errors.payrollStatus?.message ??
                    "Only eligible employees are included in new payroll runs."
                  }
                >
                  <MenuItem value="Eligible">Eligible</MenuItem>
                  <MenuItem value="Excluded">Excluded</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Controller
              control={control}
              name="payrollExclusionReason"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label="Payroll Status Reason"
                  placeholder="Required when excluded or on hold"
                  disabled={isSaving || payrollStatus === "Eligible"}
                  required={payrollStatus !== "Eligible"}
                  error={Boolean(errors.payrollExclusionReason)}
                  helperText={
                    errors.payrollExclusionReason?.message ??
                    (payrollStatus === "Eligible"
                      ? "No exclusion reason is needed."
                      : "This reason is retained for payroll review and audit.")
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="attendanceTrackingEnabled"
              render={({ field }) => (
                <Stack spacing={0.25}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(field.value)}
                        disabled={
                          isSaving || selectedPayScheme?.code === "piece_rate"
                        }
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    }
                    label="Enable biometric attendance"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {selectedPayScheme?.code === "piece_rate"
                      ? "Piece-rate employees are excluded from biometric attendance."
                      : "Only attendance-enabled employees appear in scanner mapping and attendance filters."}
                  </Typography>
                </Stack>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Typography variant="body2" color="text.secondary">
                SSS: {formatContribution(selectedType?.sss ?? null)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PhilHealth:{" "}
                {formatContribution(selectedType?.philHealth ?? null)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pag-IBIG: {formatContribution(selectedType?.pagIbig ?? null)}
              </Typography>
            </Stack>
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
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving}
            startIcon={<i className="bx bx-save" />}
          >
            {employee ? "Save Changes" : "Create"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default EmployeeFormDrawer;
