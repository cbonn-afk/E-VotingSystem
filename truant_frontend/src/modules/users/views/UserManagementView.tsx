"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ApiError } from "@/libs/api/apiError";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { partnersApi } from "@/modules/partners/api/partnersApi";
import Link from "@components/Link";
import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import {
  type CustomTablePaginationModel,
  type CustomTableSortModel,
} from "@components/app/CustomTable";

import RoleDeleteDialog from "../components/RoleDeleteDialog";
import { getRoleTableColumns } from "../components/RoleTableColumns";
import RolesTab from "../components/tabs/RolesTab";
import UsersTab from "../components/tabs/UsersTab";
import UserDeleteDialog from "../components/UserDeleteDialog";
import UserDetailsDialog from "../components/UserDetailsDialog";
import UserFormDrawer from "../components/UserFormDrawer";
import UserManagementStats from "../components/UserManagementStats";
import UserPasswordResetDialog from "../components/UserPasswordResetDialog";
import UserStatusDialog, {
  type UserStatusAction,
} from "../components/UserStatusDialog";
import { getUserTableColumns } from "../components/UserTableColumns";
import { hasSuperAdminRoleName } from "../data/accessSummary";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useRoleCatalog } from "../hooks/useRoleCatalog";
import { useRoleMutations } from "../hooks/useRoleMutations";
import { useRoles } from "../hooks/useRoles";
import { useUserManagementStats } from "../hooks/useUserManagementStats";
import { useUserMutations } from "../hooks/useUserMutations";
import { useUsers } from "../hooks/useUsers";
import {
  mapCreateUserFormToRequest,
  mapStatusToDto,
  mapUserFormToProfileRequest,
} from "../mappers/userMappers";
import type { UserFormValues } from "../schemas/userSchemas";
import type { UserAccount, UserAccountStatus, UserRole } from "../types";
import { userManagementApi } from "../api/userManagementApi";

const arraysEqual = <T,>(left: T[], right: T[]): boolean =>
  left.length === right.length &&
  [...left].sort().every((value, index) => value === [...right].sort()[index]);

const UserManagementView = () => {
  const router = useRouter();
  const authorization = useAuthorization();
  const canViewUsers = authorization.can("settings.users.view");
  const canViewRoles = authorization.can("settings.roles.view");
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "All">("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState<
    UserAccountStatus | "All"
  >("All");
  const [roleQuery, setRoleQuery] = useState("");
  const [roleStatusFilter] = useState<"Active" | "All">("All");
  const [userPagination, setUserPagination] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [rolePagination, setRolePagination] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [userSort, setUserSort] = useState<CustomTableSortModel>({
    field: "fullName",
    direction: "asc",
  });

  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [userDrawerMode, setUserDrawerMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [viewingUser, setViewingUser] = useState<UserAccount | null>(null);
  const [statusUser, setStatusUser] = useState<UserAccount | null>(null);
  const [statusAction, setStatusAction] = useState<UserStatusAction | null>(
    null,
  );
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<UserAccount | null>(null);
  const [linkingUser, setLinkingUser] = useState<UserAccount | null>(null);
  const [linkEmployeeId, setLinkEmployeeId] = useState("");
  const [linkingPartnerUser, setLinkingPartnerUser] =
    useState<UserAccount | null>(null);
  const [partnerLinkMode, setPartnerLinkMode] = useState<"existing" | "create">(
    "existing",
  );
  const [linkPartnerId, setLinkPartnerId] = useState("");
  const [newPartnerShare, setNewPartnerShare] = useState("10");
  const [deletingRole, setDeletingRole] = useState<UserRole | null>(null);
  const [pendingUserDrawerClose, setPendingUserDrawerClose] = useState(false);

  const debouncedUserQuery = useDebouncedValue(userQuery);
  const debouncedRoleQuery = useDebouncedValue(roleQuery);
  const roleCatalogQuery = useRoleCatalog(
    canViewRoles || authorization.can("settings.users.manage"),
  );
  const roles = roleCatalogQuery.data ?? [];
  const selectedRoleName =
    roleFilter === "All"
      ? undefined
      : roles.find((role) => role.id === roleFilter)?.name;
  const backendSort =
    userSort.field === "fullName"
      ? "name"
      : userSort.field === "createdAt"
        ? "created_at"
        : userSort.field === "email" ||
            userSort.field === "status" ||
            userSort.field === "updated_at"
          ? userSort.field
          : "name";
  const usersQuery = useUsers(
    {
      search: debouncedUserQuery || undefined,
      status:
        userStatusFilter === "All"
          ? undefined
          : mapStatusToDto(userStatusFilter),
      role: selectedRoleName,
      sort: backendSort,
      direction: userSort.direction,
      page: userPagination.page + 1,
      perPage: userPagination.pageSize,
    },
    roles,
    canViewUsers,
  );
  const users = usersQuery.data?.users ?? [];
  const rolesQuery = useRoles(
    {
      search: debouncedRoleQuery || undefined,
      page: rolePagination.page + 1,
      perPage: rolePagination.pageSize,
    },
    canViewRoles,
  );
  const tableRoles = rolesQuery.data?.roles ?? [];
  const statsQuery = useUserManagementStats(canViewUsers, canViewRoles);
  const userMutations = useUserMutations();
  const unlinkedEmployeesQuery = useQuery({
    queryKey: ["users", "unlinked-employees"],
    queryFn: userManagementApi.listUnlinkedEmployees,
    enabled: Boolean(linkingUser),
  });
  const partnersQuery = useQuery({
    queryKey: ["users", "unlinked-partners"],
    queryFn: () => partnersApi.list({ per_page: 100 }),
    enabled: Boolean(linkingPartnerUser),
  });
  const unlinkedPartners = (partnersQuery.data?.data ?? []).filter(
    (partner) =>
      partner.userId === null || partner.id === linkingPartnerUser?.linkedPartner?.id,
  );
  const linkEmployeeMutation = useMutation({
    mutationFn: () =>
      userManagementApi.linkEmployee(linkEmployeeId, linkingUser?.id ?? null),
    onSuccess: async () => {
      await usersQuery.refetch();
      setLinkingUser(null);
      setLinkEmployeeId("");
      toast.success("Employee account linked.");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Employee could not be linked.",
      ),
  });
  const linkPartnerMutation = useMutation({
    mutationFn: async () => {
      if (!linkingPartnerUser) return;

      if (partnerLinkMode === "existing") {
        await partnersApi.update(linkPartnerId, {
          user_id: linkingPartnerUser.id,
        });
        return;
      }

      await partnersApi.create({
        user_id: linkingPartnerUser.id,
        name: linkingPartnerUser.fullName,
        email: linkingPartnerUser.email,
        default_share_percent: Number(newPartnerShare || 0),
      });
    },
    onSuccess: async () => {
      await usersQuery.refetch();
      setLinkingPartnerUser(null);
      setPartnerLinkMode("existing");
      setLinkPartnerId("");
      setNewPartnerShare("10");
      toast.success("Partner profile linked.");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Partner profile could not be linked.",
      ),
  });
  const roleMutations = useRoleMutations();

  const canManageUsers = authorization.can("settings.users.manage");
  const canManageRoles = authorization.can("settings.roles.manage");
  const operationLoading =
    userMutations.createUser.isPending ||
    userMutations.updateUser.isPending ||
    userMutations.updateStatus.isPending ||
    userMutations.syncRoles.isPending ||
    userMutations.resetPassword.isPending ||
    userMutations.deleteUser.isPending ||
    roleMutations.deleteRole.isPending;
  const loadError =
    roleCatalogQuery.error ?? usersQuery.error ?? rolesQuery.error;

  useEffect(() => {
    if (!canViewUsers && canViewRoles) setActiveTab("roles");
  }, [canViewRoles, canViewUsers]);

  // Land on the Roles tab when returning from a role page (?tab=roles).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "roles" && canViewRoles) setActiveTab("roles");
  }, [canViewRoles]);

  const showOperationError = (error: unknown) => {
    if (error instanceof ApiError) {
      toast.error(error.message);
      return;
    }
    toast.error("The operation could not be completed. Please try again.");
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserDrawerMode("create");
    setUserDrawerOpen(true);
  };

  const openEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setUserDrawerMode("edit");
    setUserDrawerOpen(true);
  };

  const submitUser = async (values: UserFormValues) => {
    if (!editingUser) {
      await userMutations.createUser.mutateAsync(
        mapCreateUserFormToRequest(values, roles),
      );
      toast.success(`${values.fullName} was added.`);
      setUserDrawerOpen(false);
      return;
    }

    const profileChanged =
      editingUser.fullName !== values.fullName.trim() ||
      editingUser.email !== values.email.trim().toLowerCase() ||
      editingUser.requirePasswordChange !== values.requirePasswordChange;
    const accountTypeChanged = editingUser.accountType !== values.accountType;
    const statusChanged = editingUser.status !== values.status;
    const rolesChanged = !arraysEqual(editingUser.roleIds, values.roleIds);

    try {
      if (profileChanged || accountTypeChanged) {
        await userMutations.updateUser.mutateAsync({
          id: editingUser.id,
          payload: mapUserFormToProfileRequest(values),
        });
      }
      if (statusChanged) {
        await userMutations.updateStatus.mutateAsync({
          id: editingUser.id,
          payload: { status: mapStatusToDto(values.status) },
        });
      }
      if (rolesChanged) {
        await userMutations.syncRoles.mutateAsync({
          id: editingUser.id,
          payload: {
            roles: roles
              .filter((role) => values.roleIds.includes(role.id))
              .map((role) => role.name),
          },
        });
      }
    } catch (error) {
      await usersQuery.refetch();
      throw error;
    }

    toast.success(`${values.fullName} was updated.`);
    setUserDrawerOpen(false);
    setEditingUser(null);
  };

  const confirmStatusChange = async () => {
    if (!statusUser || !statusAction) return;
    const status = statusAction === "reactivate" ? "active" : "inactive";

    try {
      await userMutations.updateStatus.mutateAsync({
        id: statusUser.id,
        payload: { status },
      });
      toast.success(
        statusAction === "reactivate"
          ? `${statusUser.fullName}'s account is active again.`
          : `${statusUser.fullName}'s account has been turned off.`,
      );
      setStatusUser(null);
      setStatusAction(null);
    } catch (error) {
      showOperationError(error);
    }
  };

  const confirmUserDelete = async () => {
    if (!deletingUser) return;

    try {
      await userMutations.deleteUser.mutateAsync(deletingUser.id);
      toast.success(`${deletingUser.fullName} has been removed.`);
      setDeletingUser(null);
    } catch (error) {
      showOperationError(error);
    }
  };

  const confirmPasswordReset = async (payload: {
    password: string;
    password_confirmation: string;
    require_password_change: boolean;
  }) => {
    if (!resetPasswordUser) return;

    try {
      await userMutations.resetPassword.mutateAsync({
        id: resetPasswordUser.id,
        payload,
      });
      toast.success(`${resetPasswordUser.fullName}'s password was reset.`);
      setResetPasswordUser(null);
    } catch (error) {
      showOperationError(error);
    }
  };

  const confirmRoleDelete = async () => {
    if (!deletingRole) return;

    try {
      await roleMutations.deleteRole.mutateAsync(deletingRole.id);
      toast.success(`${deletingRole.name} was deleted.`);
      setDeletingRole(null);
    } catch (error) {
      showOperationError(error);
    }
  };

  const closeUserDrawer = (hasUnsavedChanges: boolean) => {
    if (hasUnsavedChanges) {
      setPendingUserDrawerClose(true);
      return;
    }
    setUserDrawerOpen(false);
    setEditingUser(null);
  };

  const discardUserDrawer = () => {
    setUserDrawerOpen(false);
    setEditingUser(null);
    setPendingUserDrawerClose(false);
  };

  const userColumns = useMemo(
    () =>
      getUserTableColumns({
        roles,
        canManage: canManageUsers,
        currentUserId: authorization.user?.id ?? null,
        canResetPassword: (user) =>
          canManageUsers &&
          user.id !== authorization.user?.id &&
          (authorization.isSuperAdmin ||
            !hasSuperAdminRoleName(user.roleNames)),
        canChangeStatus: (user) =>
          canManageUsers && user.id !== authorization.user?.id,
        canDelete: (user) =>
          authorization.isSuperAdmin && user.id !== authorization.user?.id,
        onView: setViewingUser,
        onEdit: openEditUser,
        onManageRoles: openEditUser,
        onLinkEmployee: (user) => {
          setLinkingUser(user);
          setLinkEmployeeId("");
        },
        onLinkPartner: (user) => {
          setLinkingPartnerUser(user);
          setPartnerLinkMode(user.linkedPartner ? "existing" : "create");
          setLinkPartnerId(user.linkedPartner?.id ?? "");
          setNewPartnerShare("10");
        },
        onResetPassword: setResetPasswordUser,
        onStatusChange: (user, action) => {
          setStatusUser(user);
          setStatusAction(action);
        },
        onDelete: setDeletingUser,
      }),
    [authorization.isSuperAdmin, authorization.user?.id, canManageUsers, roles],
  );

  const roleColumns = useMemo(
    () =>
      getRoleTableColumns({
        canManage: canManageRoles,
        onView: (role) => router.push(`/users/roles/${role.id}`),
        onEdit: (role) => router.push(`/users/roles/${role.id}/edit`),
        onDelete: setDeletingRole,
      }),
    [canManageRoles, router],
  );

  const clearUserFilters = () => {
    setUserQuery("");
    setRoleFilter("All");
    setModuleFilter("All");
    setUserStatusFilter("All");
    setUserPagination((current) => ({ ...current, page: 0 }));
  };

  const retryData = async () => {
    await Promise.all([
      roleCatalogQuery.refetch(),
      usersQuery.refetch(),
      rolesQuery.refetch(),
    ]);
  };

  return (
    <Stack spacing={5}>
      <CustomPageHeader
        title="User Management"
        description="Manage system users, roles, and module access."
      >
        <Stack direction="row" spacing={2}>
          {activeTab === "roles" ? (
            <Can permission="settings.roles.manage">
              <Button
                component={Link}
                href="/users/roles/new"
                variant="contained"
                startIcon={<i className="bx bx-shield-plus" />}
              >
                Add Role
              </Button>
            </Can>
          ) : (
            <Can permission="settings.users.manage">
              <Button
                variant="contained"
                startIcon={<i className="bx bx-user-plus" />}
                disabled={roleCatalogQuery.isLoading}
                onClick={openCreateUser}
              >
                Add User
              </Button>
            </Can>
          )}
        </Stack>
      </CustomPageHeader>

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void retryData()}
            >
              Retry
            </Button>
          }
        >
          User management data could not be loaded. Please try again.
        </Alert>
      )}

      <UserManagementStats
        data={statsQuery.data}
        loading={statsQuery.isLoading}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: "users" | "roles") => setActiveTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {canViewUsers && (
            <Tab
              value="users"
              icon={<i className="bx bx-user" />}
              iconPosition="start"
              label="Users"
            />
          )}
          {canViewRoles && (
            <Tab
              value="roles"
              icon={<i className="bx bx-shield" />}
              iconPosition="start"
              label="Roles & Access"
            />
          )}
        </Tabs>
      </Box>

      {activeTab === "users" && canViewUsers && (
        <UsersTab
          users={users}
          roles={roles}
          columns={userColumns}
          query={userQuery}
          roleFilter={roleFilter}
          moduleFilter={moduleFilter}
          statusFilter={userStatusFilter}
          pagination={userPagination}
          sort={userSort}
          rowCount={usersQuery.data?.meta.total ?? 0}
          loading={usersQuery.isLoading || usersQuery.isFetching}
          onQueryChange={(value) => {
            setUserQuery(value);
            setUserPagination((current) => ({ ...current, page: 0 }));
          }}
          onRoleFilterChange={(value) => {
            setRoleFilter(value);
            setUserPagination((current) => ({ ...current, page: 0 }));
          }}
          onStatusFilterChange={(value) => {
            setUserStatusFilter(value);
            setUserPagination((current) => ({ ...current, page: 0 }));
          }}
          onPaginationChange={setUserPagination}
          onSortChange={(model) => {
            setUserSort(model);
            setUserPagination((current) => ({ ...current, page: 0 }));
          }}
          onClearFilters={clearUserFilters}
        />
      )}

      {activeTab === "roles" && canViewRoles && (
        <RolesTab
          roles={tableRoles}
          columns={roleColumns}
          query={roleQuery}
          statusFilter={roleStatusFilter}
          pagination={rolePagination}
          rowCount={rolesQuery.data?.meta.total ?? 0}
          loading={rolesQuery.isLoading || rolesQuery.isFetching}
          onQueryChange={(value) => {
            setRoleQuery(value);
            setRolePagination((current) => ({ ...current, page: 0 }));
          }}
          onPaginationChange={setRolePagination}
        />
      )}

      <UserFormDrawer
        open={userDrawerOpen}
        mode={userDrawerMode}
        user={editingUser}
        roles={roles}
        saving={operationLoading}
        onRequestClose={closeUserDrawer}
        onSubmit={submitUser}
      />

      <UserDetailsDialog
        user={viewingUser}
        roles={roles}
        onClose={() => setViewingUser(null)}
      />

      <CustomDialog
        open={Boolean(linkingUser)}
        onClose={() => setLinkingUser(null)}
        closeAfterTransition
        title="Link Employee"
        description={`Choose one unlinked employee for ${linkingUser?.fullName ?? "this user"}.`}
        actions={[
          <Button
            key="cancel"
            variant="outlined"
            onClick={() => setLinkingUser(null)}
          >
            Cancel
          </Button>,
          <Button
            key="link"
            variant="contained"
            disabled={!linkEmployeeId || linkEmployeeMutation.isPending}
            onClick={() => linkEmployeeMutation.mutate()}
          >
            Link
          </Button>,
        ]}
      >
        <TextField
          select
          fullWidth
          sx={{ mt: 3 }}
          label="Employee"
          value={linkEmployeeId}
          onChange={(event) => setLinkEmployeeId(event.target.value)}
        >
          {(unlinkedEmployeesQuery.data ?? []).map((employee) => (
            <MenuItem key={employee.id} value={employee.id}>
              {employee.name} · {employee.employeeNo} · {employee.jobPosition}
            </MenuItem>
          ))}
        </TextField>
      </CustomDialog>

      <CustomDialog
        open={Boolean(linkingPartnerUser)}
        onClose={() => setLinkingPartnerUser(null)}
        closeAfterTransition
        title="Link Partner Profile"
        description={`Connect ${linkingPartnerUser?.fullName ?? "this user"} to the partner portal profile they should use.`}
        actions={[
          <Button
            key="cancel"
            variant="outlined"
            onClick={() => setLinkingPartnerUser(null)}
          >
            Cancel
          </Button>,
          <Button
            key="link"
            variant="contained"
            disabled={
              linkPartnerMutation.isPending ||
              (partnerLinkMode === "existing" && !linkPartnerId) ||
              (partnerLinkMode === "create" &&
                (!newPartnerShare || Number(newPartnerShare) <= 0))
            }
            onClick={() => linkPartnerMutation.mutate()}
          >
            {partnerLinkMode === "create" ? "Create & Link" : "Link"}
          </Button>,
        ]}
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <TextField
            select
            fullWidth
            label="Link Action"
            value={partnerLinkMode}
            onChange={(event) => {
              setPartnerLinkMode(event.target.value as "existing" | "create");
              setLinkPartnerId("");
            }}
          >
            <MenuItem value="create">Create partner profile</MenuItem>
            <MenuItem value="existing">Use existing unlinked partner</MenuItem>
          </TextField>

          {partnerLinkMode === "existing" ? (
            <TextField
              select
              fullWidth
              label="Partner"
              value={linkPartnerId}
              onChange={(event) => setLinkPartnerId(event.target.value)}
              helperText={
                partnersQuery.isLoading
                  ? "Loading partners..."
                  : "Only unlinked partner records are shown."
              }
            >
              {unlinkedPartners.map((partner) => (
                <MenuItem key={partner.id} value={partner.id}>
                  {partner.name} · {partner.partnerNo}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <>
              <TextField
                fullWidth
                label="Partner Name"
                value={linkingPartnerUser?.fullName ?? ""}
                disabled
              />
              <TextField
                fullWidth
                label="Partner Email"
                value={linkingPartnerUser?.email ?? ""}
                disabled
              />
              <TextField
                fullWidth
                label="Default Share Percent"
                type="number"
                value={newPartnerShare}
                inputProps={{ min: 0.01, max: 100, step: 0.01 }}
                onChange={(event) => setNewPartnerShare(event.target.value)}
              />
            </>
          )}
        </Stack>
      </CustomDialog>

      <UserStatusDialog
        user={statusUser}
        action={statusAction}
        loading={operationLoading}
        onClose={() => {
          setStatusUser(null);
          setStatusAction(null);
        }}
        onConfirm={() => void confirmStatusChange()}
      />

      <UserPasswordResetDialog
        user={resetPasswordUser}
        loading={userMutations.resetPassword.isPending}
        onClose={() => setResetPasswordUser(null)}
        onConfirm={(payload) => void confirmPasswordReset(payload)}
      />

      <UserDeleteDialog
        user={deletingUser}
        loading={operationLoading}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => void confirmUserDelete()}
      />

      <RoleDeleteDialog
        role={deletingRole}
        assignedUsers={deletingRole?.assignedUsersCount ?? 0}
        loading={operationLoading}
        onClose={() => setDeletingRole(null)}
        onConfirm={() => void confirmRoleDelete()}
      />

      <CustomDialog
        open={pendingUserDrawerClose}
        onClose={() => setPendingUserDrawerClose(false)}
        closeAfterTransition
        title="Discard Unsaved Changes?"
        description="Changes made in this form have not been saved."
        icon={<i className="bx bx-error-circle" />}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setPendingUserDrawerClose(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={discardUserDrawer}
            >
              Discard Changes
            </Button>
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          Discarding will restore the record to its last saved state.
        </Typography>
      </CustomDialog>
    </Stack>
  );
};

export default UserManagementView;
