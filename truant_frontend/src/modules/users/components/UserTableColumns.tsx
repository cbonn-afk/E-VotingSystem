"use client";

import { useState } from "react";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { ChipProps } from "@mui/material/Chip";

import type { CustomTableColumn } from "@components/app/CustomTable";

import {
  getModulesFromRoles,
  hasSuperAdminRole,
  hasSuperAdminRoleName,
} from "../data/accessSummary";
import type { UserAccount, UserRole } from "../types";

type UserTableActionsProps = {
  user: UserAccount;
  canManage: boolean;
  canResetPassword: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
  onView: (user: UserAccount) => void;
  onEdit: (user: UserAccount) => void;
  onManageRoles: (user: UserAccount) => void;
  onLinkEmployee: (user: UserAccount) => void;
  onLinkPartner: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onStatusChange: (
    user: UserAccount,
    action: "reactivate" | "deactivate",
  ) => void;
  onDelete: (user: UserAccount) => void;
};

const UserTableActions = ({
  user,
  canManage,
  canResetPassword,
  canChangeStatus,
  canDelete,
  onView,
  onEdit,
  onManageRoles,
  onLinkEmployee,
  onLinkPartner,
  onResetPassword,
  onStatusChange,
  onDelete,
}: UserTableActionsProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const selectAction = (action: () => void) => {
    action();
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Actions for ${user.fullName}`}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <i className="bx bx-dots-vertical-rounded" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => selectAction(() => onView(user))}>
          <i className="bx bx-show mie-2" />
          View
        </MenuItem>
        {canManage && user.accountType === "Employee" && (
          <MenuItem onClick={() => selectAction(() => onLinkEmployee(user))}>
            <i className="bx bx-link mie-2" />
            Link Employee
          </MenuItem>
        )}
        {canManage && user.accountType === "Partner" && (
          <MenuItem onClick={() => selectAction(() => onLinkPartner(user))}>
            <i className="bx bx-link mie-2" />
            Link Partner
          </MenuItem>
        )}
        {canManage && (
          <MenuItem onClick={() => selectAction(() => onEdit(user))}>
            <i className="bx bx-edit mie-2" />
            Edit
          </MenuItem>
        )}
        {canManage && (
          <MenuItem onClick={() => selectAction(() => onManageRoles(user))}>
            <i className="bx bx-shield mie-2" />
            Manage Roles
          </MenuItem>
        )}
        {canResetPassword && (
          <MenuItem onClick={() => selectAction(() => onResetPassword(user))}>
            <i className="bx bx-key mie-2" />
            Reset Password
          </MenuItem>
        )}
        {canChangeStatus && user.status === "Inactive" ? (
          <MenuItem
            onClick={() =>
              selectAction(() => onStatusChange(user, "reactivate"))
            }
          >
            <i className="bx bx-check-circle mie-2" />
            Reactivate
          </MenuItem>
        ) : null}
        {canChangeStatus && user.status !== "Inactive" && (
          <MenuItem
            onClick={() =>
              selectAction(() => onStatusChange(user, "deactivate"))
            }
          >
            <i className="bx bx-user-x mie-2" />
            Deactivate
          </MenuItem>
        )}
        {canDelete && <Divider />}
        {canDelete && (
          <Tooltip
            title={
              user.status !== "Inactive"
                ? "Turn off this account before removing it"
                : ""
            }
            placement="left"
          >
            <span>
              <MenuItem
                disabled={user.status !== "Inactive"}
                onClick={() => selectAction(() => onDelete(user))}
                sx={{ color: "error.main" }}
              >
                <i className="bx bx-trash mie-2" />
                Delete
              </MenuItem>
            </span>
          </Tooltip>
        )}
      </Menu>
    </>
  );
};

const statusColors: Record<UserAccount["status"], ChipProps["color"]> = {
  Active: "success",
  Inactive: "default",
};

const formatDate = (value?: string) => {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(value.includes("T") ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
};

export const getUserTableColumns = ({
  roles,
  canManage,
  canChangeStatus,
  canDelete,
  canResetPassword,
  currentUserId,
  onView,
  onEdit,
  onManageRoles,
  onLinkEmployee,
  onLinkPartner,
  onResetPassword,
  onStatusChange,
  onDelete,
}: {
  roles: UserRole[];
  canManage: boolean;
  canChangeStatus: (user: UserAccount) => boolean;
  canDelete: (user: UserAccount) => boolean;
  canResetPassword: (user: UserAccount) => boolean;
  currentUserId: number | null;
  onView: (user: UserAccount) => void;
  onEdit: (user: UserAccount) => void;
  onManageRoles: (user: UserAccount) => void;
  onLinkEmployee: (user: UserAccount) => void;
  onLinkPartner: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onStatusChange: (
    user: UserAccount,
    action: "reactivate" | "deactivate",
  ) => void;
  onDelete: (user: UserAccount) => void;
}): CustomTableColumn<UserAccount>[] => [
  {
    id: "fullName",
    label: "User",
    minWidth: 230,
    flex: 1.25,
    sortable: true,
    value: (user) => user.fullName,
    render: (user) => (
      <Stack direction="row" spacing={2} className="items-center">
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt={user.fullName}
          sx={{ inlineSize: 36, blockSize: 36, flexShrink: 0 }}
        >
          {user.fullName.charAt(0)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.primary"
            fontWeight={600}
            noWrap
          >
            {user.fullName}
            {user.id === currentUserId && (
              <Typography
                component="span"
                variant="caption"
                color="primary.main"
                fontWeight={700}
                sx={{ ml: 1 }}
              >
                (me)
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    id: "accountType",
    label: "Account Type",
    minWidth: 140,
    render: (user) => (
      <Chip
        label={user.accountType}
        size="small"
        variant="tonal"
        color={
          user.accountType === "System"
            ? "primary"
            : user.accountType === "Partner"
              ? "secondary"
              : "info"
        }
      />
    ),
  },
  {
    id: "profile",
    label: "Linked Profile",
    minWidth: 210,
    flex: 1,
    render: (user) => {
      if (user.accountType === "Partner") {
        return user.linkedPartner ? (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {user.linkedPartner.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.linkedPartner.partnerNo} · {user.linkedPartner.status}
            </Typography>
          </Stack>
        ) : (
          <Chip label="Partner not linked" size="small" variant="outlined" />
        );
      }

      if (user.accountType !== "Employee") {
        return <Chip label="No portal profile" size="small" variant="tonal" />;
      }

      return user.linkedEmployee ? (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {user.linkedEmployee.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.linkedEmployee.employeeNo} ·{" "}
            {user.linkedEmployee.jobPosition ?? "Unassigned"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.linkedEmployee.employmentType ?? "Not set"}
          </Typography>
        </Stack>
      ) : (
        <Chip label="Employee not linked" size="small" variant="outlined" />
      );
    },
  },
  {
    id: "access",
    label: "Roles & Access",
    minWidth: 260,
    flex: 1.4,
    render: (user) => {
      const assignedRoles = roles.filter((role) =>
        user.roleIds.includes(role.id),
      );
      const assignedRoleNames = assignedRoles.length
        ? assignedRoles.map((role) => role.name)
        : user.roleNames;
      const fullSystemAccess =
        hasSuperAdminRole(assignedRoles) ||
        hasSuperAdminRoleName(assignedRoleNames);
      const modules = getModulesFromRoles(assignedRoles);
      const moduleSummary = fullSystemAccess
        ? "Full system access"
        : modules.length
          ? modules.map((module) => module.label).join(", ")
          : "No module access";

      return (
        <Stack spacing={0.75} sx={{ minWidth: 0, py: 1 }}>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {assignedRoleNames.length ? (
              <>
                {assignedRoleNames.slice(0, 2).map((roleName) => (
                  <Chip
                    key={roleName}
                    label={roleName}
                    size="small"
                    variant="tonal"
                    color="primary"
                  />
                ))}
                {assignedRoleNames.length > 2 && (
                  <Chip
                    label={`+${assignedRoleNames.length - 2} more`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </>
            ) : (
              <Chip label="Unassigned" size="small" variant="outlined" />
            )}
          </Stack>
          <Tooltip title={moduleSummary} placement="bottom-start">
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block" }}
            >
              {fullSystemAccess
                ? "All modules: Full system access"
                : `${modules.length} ${
                    modules.length === 1 ? "module" : "modules"
                  }: ${moduleSummary}`}
            </Typography>
          </Tooltip>
        </Stack>
      );
    },
  },
  {
    id: "status",
    label: "Status",
    width: 125,
    sortable: true,
    render: (user) => (
      <Stack spacing={0.5} className="items-start">
        <Chip
          label={user.status}
          color={statusColors[user.status]}
          variant="tonal"
          size="small"
        />
      </Stack>
    ),
  },
  {
    id: "lastLogin",
    label: "Account Activity",
    minWidth: 185,
    flex: 0.9,
    sortable: false,
    render: (user) => (
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.primary" noWrap>
          Activity unavailable
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          Added {formatDate(user.createdAt)}
        </Typography>
      </Stack>
    ),
  },
  {
    id: "actions",
    label: "",
    align: "center",
    width: 64,
    render: (user) => (
      <UserTableActions
        user={user}
        canManage={canManage}
        canResetPassword={canResetPassword(user)}
        canChangeStatus={canChangeStatus(user)}
        canDelete={canDelete(user)}
        onView={onView}
        onEdit={onEdit}
        onManageRoles={onManageRoles}
        onLinkEmployee={onLinkEmployee}
        onLinkPartner={onLinkPartner}
        onResetPassword={onResetPassword}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    ),
  },
];
