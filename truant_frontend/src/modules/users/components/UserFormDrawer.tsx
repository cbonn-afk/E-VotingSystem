"use client";

import { useEffect, useMemo, useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";
import CustomDrawer from "@components/app/CustomDrawer";

import { getModulesFromRoles, hasSuperAdminRole } from "../data/accessSummary";
import { mapUserAccountToFormValues } from "../mappers/userMappers";
import {
  createUserSchema,
  editUserSchema,
  type UserFormValues,
} from "../schemas/userSchemas";
import type { UserAccount, UserRole } from "../types";

type UserFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  user?: UserAccount | null;
  roles: UserRole[];
  saving?: boolean;
  onRequestClose: (hasUnsavedChanges: boolean) => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
};

const emptyValues = mapUserAccountToFormValues();

const backendFieldMap: Record<string, keyof UserFormValues> = {
  name: "fullName",
  email: "email",
  password: "temporaryPassword",
  password_confirmation: "confirmPassword",
  roles: "roleIds",
  account_type: "accountType",
  status: "status",
};

const UserFormDrawer = ({
  open,
  mode,
  user,
  roles,
  saving = false,
  onRequestClose,
  onSubmit,
}: UserFormDrawerProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const schema = mode === "create" ? createUserSchema : editUserSchema;
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting, isSubmitted },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    reset(mapUserAccountToFormValues(user));
    setShowPassword(false);
  }, [open, reset, user]);

  const selectedRoleIds = watch("roleIds");
  const accountType = watch("accountType");
  const compatibleRoles = useMemo(() => {
    if (accountType === "Partner")
      return roles.filter((role) => role.name === "Partner");
    if (accountType === "Employee")
      return roles.filter(
        (role) =>
          !["Admin", "Super Admin", "Partner", "Employee"].includes(role.name),
      );
    if (accountType === "System")
      return roles.filter((role) => role.name !== "Partner");

    return roles.filter((role) => role.name !== "Partner");
  }, [accountType, roles]);

  useEffect(() => {
    const compatibleIds = new Set(compatibleRoles.map((role) => role.id));
    let nextIds = selectedRoleIds.filter((id) => compatibleIds.has(id));
    const baselineRole = compatibleRoles.find(
      (role) => accountType === "Partner" && role.name === "Partner",
    );
    if (baselineRole && !nextIds.includes(baselineRole.id))
      nextIds = [...nextIds, baselineRole.id];

    if (
      nextIds.length !== selectedRoleIds.length ||
      nextIds.some((id, index) => id !== selectedRoleIds[index])
    ) {
      setValue("roleIds", nextIds, { shouldDirty: true, shouldValidate: true });
    }
  }, [accountType, compatibleRoles, selectedRoleIds, setValue]);
  const selectedRoles = roles.filter((role) =>
    selectedRoleIds.includes(role.id),
  );
  const fullSystemAccess = hasSuperAdminRole(selectedRoles);
  const accessibleModules = useMemo(
    () => getModulesFromRoles(selectedRoles),
    [selectedRoles],
  );
  const pending = saving || isSubmitting;

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError) {
        let mappedField = false;

        Object.entries(error.errors).forEach(([field, messages]) => {
          const formField = backendFieldMap[field];

          if (!formField || !messages[0]) return;
          mappedField = true;
          setError(formField, { type: "server", message: messages[0] });
        });

        if (!mappedField) toast.error(error.message);

        return;
      }

      toast.error("The user could not be saved. Please try again.");
    }
  });

  return (
    <CustomDrawer
      open={open}
      onClose={() => onRequestClose(isDirty)}
      title={mode === "create" ? "Add User" : "Edit User"}
      subtitle="Maintain account details, role assignment, and module access."
      width={480}
    >
      <Stack
        component="form"
        spacing={5}
        className="max-is-[100vw] p-6"
        onSubmit={submit}
      >
        {isSubmitted && Object.keys(errors).length > 0 && (
          <Alert severity="warning">
            Correct the highlighted fields before saving.
          </Alert>
        )}

        <Stack spacing={4}>
          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <FormControl size="small" error={Boolean(errors.accountType)}>
                <InputLabel>Account Purpose</InputLabel>
                <Select
                  {...field}
                  label="Account Purpose"
                  disabled={mode === "edit"}
                >
                  <MenuItem value="System">System / Non-payroll</MenuItem>
                  <MenuItem value="Employee">Employee</MenuItem>
                  <MenuItem value="Partner">Partner</MenuItem>
                </Select>
                <FormHelperText>
                  {errors.accountType?.message ??
                    (mode === "edit"
                      ? "Account purpose is changed through a reviewed profile conversion."
                      : accountType === "Employee"
                        ? "Creates an employee-login candidate; the Employee profile is linked separately."
                        : accountType === "Partner"
                          ? "Uses the isolated Partner portal and never enters payroll."
                          : "Login access only. This account will not appear in Employees or payroll.")}
                </FormHelperText>
              </FormControl>
            )}
          />
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full Name"
                size="small"
                required
                error={Boolean(errors.fullName)}
                helperText={errors.fullName?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                size="small"
                type="email"
                required
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl size="small" error={Boolean(errors.status)}>
                <InputLabel>Account Status</InputLabel>
                <Select {...field} label="Account Status">
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
                {errors.status && (
                  <FormHelperText>{errors.status.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="roleIds"
            control={control}
            render={({ field }) => (
              <FormControl size="small" error={Boolean(errors.roleIds)}>
                <InputLabel>Roles</InputLabel>
                <Select
                  {...field}
                  multiple
                  label="Roles"
                  renderValue={(selected) =>
                    roles
                      .filter((role) => selected.includes(role.id))
                      .map((role) => role.name)
                      .join(", ")
                  }
                  onChange={(event) =>
                    field.onChange(event.target.value as number[])
                  }
                >
                  {compatibleRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Checkbox checked={field.value.includes(role.id)} />
                      <ListItemText
                        primary={role.name}
                        secondary={role.isSystem ? "System role" : undefined}
                      />
                    </MenuItem>
                  ))}
                </Select>
                {errors.roleIds && (
                  <FormHelperText>{errors.roleIds.message}</FormHelperText>
                )}
                {!errors.roleIds && accountType === "Employee" && (
                  <FormHelperText>
                    The employee workspace is assigned by Job Position. Select
                    only optional custom access roles here.
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="allowUnassigned"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} disabled />}
                label="Intentionally create an unassigned account"
              />
            )}
          />

          <Box
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 4,
            }}
          >
            <Typography variant="subtitle2">
              Module access from selected roles
            </Typography>
            {fullSystemAccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Full system access through the Super Admin role.
              </Alert>
            )}
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 2 }}
            >
              {accessibleModules.length ? (
                accessibleModules.map((module) => (
                  <Chip
                    key={module.key}
                    label={module.label}
                    color={module.color}
                    variant="tonal"
                    size="small"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No module access is currently assigned.
                </Typography>
              )}
            </Stack>
          </Box>

          {mode === "create" && (
            <>
              <Controller
                name="temporaryPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Temporary Password"
                    type={showPassword ? "text" : "password"}
                    size="small"
                    required
                    error={Boolean(errors.temporaryPassword)}
                    helperText={errors.temporaryPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                          >
                            <i
                              className={`bx ${showPassword ? "bx-hide" : "bx-show"}`}
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm Temporary Password"
                    type={showPassword ? "text" : "password"}
                    size="small"
                    required
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                  />
                )}
              />
            </>
          )}

          <Controller
            name="requirePasswordChange"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                }
                label="Require password change on first login"
              />
            )}
          />
        </Stack>

        <Stack direction="row" spacing={2} className="justify-end">
          <Button
            variant="outlined"
            disabled={pending}
            onClick={() => onRequestClose(isDirty)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={pending}
            startIcon={
              <i
                className={mode === "create" ? "bx bx-user-plus" : "bx bx-save"}
              />
            }
          >
            {pending
              ? "Saving..."
              : mode === "create"
                ? "Add User"
                : "Save Changes"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default UserFormDrawer;
