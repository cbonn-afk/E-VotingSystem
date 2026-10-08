"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormHelperText from "@mui/material/FormHelperText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import Link from "@components/Link";

import PermissionMatrix from "../components/PermissionMatrix";
import { hasSuperAdminRole } from "../data/accessSummary";
import { usePermissions } from "../hooks/usePermissions";
import { useRoleCatalog } from "../hooks/useRoleCatalog";
import { useRoleMutations } from "../hooks/useRoleMutations";
import { mapRoleFormToRequest } from "../mappers/roleMappers";
import { roleFormSchema, type RoleFormValues } from "../schemas/roleSchemas";

const ROLES_LIST_HREF = "/users?tab=roles";

const emptyValues: RoleFormValues = {
  name: "",
  description: "",
  permissionIds: [],
  status: "Active",
};

type RoleFormViewProps = {
  mode: "create" | "edit" | "view";
  roleId?: string;
};

const RoleFormView = ({ mode, roleId }: RoleFormViewProps) => {
  const router = useRouter();
  const authorization = useAuthorization();
  const canManageRoles = authorization.can("settings.roles.manage");

  const isExisting = mode !== "create";
  const numericRoleId = roleId ? Number(roleId) : undefined;

  const roleCatalogQuery = useRoleCatalog(isExisting);
  const permissionsQuery = usePermissions(true);
  const allPermissions = permissionsQuery.data ?? [];
  const role =
    isExisting && numericRoleId !== undefined
      ? (roleCatalogQuery.data?.find((item) => item.id === numericRoleId) ??
        null)
      : null;

  const { createRole, updateRole } = useRoleMutations();
  const saving = createRole.isPending || updateRole.isPending;

  const [pendingDiscard, setPendingDiscard] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (mode === "create") {
      reset(emptyValues);
      return;
    }
    if (role) {
      reset({
        name: role.name,
        description: role.description,
        permissionIds: role.permissionIds,
        status: "Active",
      });
    }
  }, [mode, role, reset]);

  const isSystemRole = Boolean(role?.isSystem);
  const permissions =
    isSystemRole || mode === "view"
      ? allPermissions
      : allPermissions.filter(
          (permission) =>
            permission.module !== "production" &&
            !permission.name.startsWith("ordering.production_handoffs."),
        );
  const readOnly = mode === "view" || isSystemRole || !canManageRoles;
  const fullAccess = role ? hasSuperAdminRole([role]) : false;

  const leave = () => router.push(ROLES_LIST_HREF);

  const requestLeave = () => {
    if (isDirty && !readOnly) {
      setPendingDiscard(true);
      return;
    }
    leave();
  };

  const submit = handleSubmit(async (values) => {
    try {
      if (mode === "edit" && role) {
        await updateRole.mutateAsync({
          id: role.id,
          payload: mapRoleFormToRequest(values),
        });
        toast.success(`${values.name} was updated.`);
      } else {
        await createRole.mutateAsync(mapRoleFormToRequest(values));
        toast.success(`${values.name} was created.`);
      }
      leave();
    } catch (error) {
      if (error instanceof ApiError) {
        const nameMessage = error.errors.name?.[0];
        const permissionMessage = error.errors.permissions?.[0];

        if (nameMessage)
          setError("name", { type: "server", message: nameMessage });
        if (permissionMessage) {
          setError("permissionIds", {
            type: "server",
            message: permissionMessage,
          });
        }
        if (!nameMessage && !permissionMessage) toast.error(error.message);
        return;
      }
      toast.error("The role could not be saved. Please try again.");
    }
  });

  const title =
    mode === "create"
      ? "Create Role"
      : mode === "view"
        ? role
          ? `Role: ${role.name}`
          : "Role Permissions"
        : role
          ? `Edit Role: ${role.name}`
          : "Edit Role";
  const description =
    mode === "view"
      ? "Review the access this role grants across each module."
      : "Name the role, then choose exactly the access people assigned to it should have.";

  const headerActions = (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<i className="bx bx-left-arrow-alt" />}
        onClick={requestLeave}
        disabled={saving}
      >
        Back to Roles
      </Button>
      {!readOnly && (
        <Button
          variant="contained"
          startIcon={<i className="bx bx-save" />}
          onClick={() => void submit()}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Create Role"
              : "Save Changes"}
        </Button>
      )}
    </Stack>
  );

  // ── Loading / not-found states for edit & view ──────────────────────
  if (isExisting && roleCatalogQuery.isPending) {
    return (
      <Stack spacing={5}>
        <CustomPageHeader title={title} description={description}>
          {headerActions}
        </CustomPageHeader>
        <Box className="flex items-center justify-center" sx={{ py: 10 }}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  if (isExisting && !role) {
    return (
      <Stack spacing={5}>
        <CustomPageHeader
          title="Role not found"
          description="The role you are looking for could not be loaded."
        >
          <Button
            component={Link}
            href={ROLES_LIST_HREF}
            variant="outlined"
            startIcon={<i className="bx bx-left-arrow-alt" />}
          >
            Back to Roles
          </Button>
        </CustomPageHeader>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => roleCatalogQuery.refetch()}
            >
              Retry
            </Button>
          }
        >
          This role may have been deleted, or you may not have access to it.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={5}>
      <CustomPageHeader title={title} description={description}>
        {headerActions}
      </CustomPageHeader>

      {isSystemRole && (
        <Alert severity="info" icon={<i className="bx bx-lock" />}>
          This is a locked system role and is shown in read-only mode.
        </Alert>
      )}

      {isSubmitted && Object.keys(errors).length > 0 && (
        <Alert severity="warning">
          Correct the highlighted fields before saving.
        </Alert>
      )}

      <Paper className="p-6">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5">Role Details</Typography>
            <Typography variant="body2" color="text.secondary">
              Give the role a clear, recognisable name.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{ alignItems: { md: "flex-start" } }}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Role Name"
                  placeholder="e.g. Billing Officer"
                  required
                  disabled={readOnly}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  sx={{ maxWidth: { md: 420 } }}
                />
              )}
            />
            {role && (
              <Stack direction="row" spacing={1.5} sx={{ pt: { md: 1 } }}>
                <Chip
                  variant="tonal"
                  color={role.isSystem ? "primary" : "secondary"}
                  icon={
                    <i
                      className={role.isSystem ? "bx bx-lock" : "bx bx-shield"}
                    />
                  }
                  label={role.isSystem ? "System role" : "Custom role"}
                />
                <Chip
                  variant="tonal"
                  color="info"
                  icon={<i className="bx bx-group" />}
                  label={`${role.assignedUsersCount} ${
                    role.assignedUsersCount === 1 ? "user" : "users"
                  }`}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper className="p-6">
        <Controller
          name="permissionIds"
          control={control}
          render={({ field }) => (
            <Stack spacing={2}>
              <PermissionMatrix
                permissions={permissions}
                selectedPermissionIds={field.value}
                readOnly={readOnly}
                fullAccess={fullAccess}
                onChange={field.onChange}
              />
              {errors.permissionIds && (
                <FormHelperText error>
                  {errors.permissionIds.message}
                </FormHelperText>
              )}
            </Stack>
          )}
        />
      </Paper>

      {!readOnly && (
        <Stack
          direction="row"
          spacing={2}
          className="justify-end"
          sx={{ pb: 2 }}
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={requestLeave}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<i className="bx bx-save" />}
            onClick={() => void submit()}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create Role"
                : "Save Changes"}
          </Button>
        </Stack>
      )}

      <CustomDialog
        open={pendingDiscard}
        onClose={() => setPendingDiscard(false)}
        closeAfterTransition
        title="Discard Unsaved Changes?"
        description="Changes made to this role have not been saved."
        icon={<i className="bx bx-error-circle" />}
        actions={
          <>
            <Button variant="outlined" onClick={() => setPendingDiscard(false)}>
              Keep Editing
            </Button>
            <Button variant="contained" color="error" onClick={leave}>
              Discard Changes
            </Button>
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          Leaving now will discard everything you changed on this role.
        </Typography>
      </CustomDialog>
    </Stack>
  );
};

export default RoleFormView;
