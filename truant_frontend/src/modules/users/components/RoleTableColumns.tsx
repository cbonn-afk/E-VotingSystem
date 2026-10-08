"use client";

import { useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CustomTableColumn } from "@components/app/CustomTable";

import { getModulesFromRoles, hasSuperAdminRole } from "../data/accessSummary";
import type { UserRole } from "../types";

const RoleActions = ({
  role,
  assignedUsers,
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  role: UserRole;
  assignedUsers: number;
  canManage: boolean;
  onView: (role: UserRole) => void;
  onEdit: (role: UserRole) => void;
  onDelete: (role: UserRole) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const selectAction = (action: () => void) => {
    action();
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Actions for ${role.name}`}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <i className="bx bx-dots-vertical-rounded" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => selectAction(() => onView(role))}>
          <i className="bx bx-show mie-2" />
          View Permissions
        </MenuItem>
        {canManage && !role.isSystem && (
          <MenuItem onClick={() => selectAction(() => onEdit(role))}>
            <i className="bx bx-edit mie-2" />
            Edit Permissions
          </MenuItem>
        )}
        <MenuItem disabled>
          <i className="bx bx-copy mie-2" />
          Duplicate
        </MenuItem>
        <MenuItem disabled>
          <i
            className={`bx ${role.status === "Active" ? "bx-block" : "bx-check-circle"} mie-2`}
          />
          {role.status === "Active" ? "Deactivate" : "Activate"}
        </MenuItem>
        {canManage && !role.isSystem && (
          <Tooltip
            title={
              assignedUsers > 0
                ? "Remove this role from assigned users first."
                : ""
            }
            placement="left"
          >
            <span>
              <MenuItem
                disabled={assignedUsers > 0}
                onClick={() => selectAction(() => onDelete(role))}
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

export const getRoleTableColumns = ({
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  canManage: boolean;
  onView: (role: UserRole) => void;
  onEdit: (role: UserRole) => void;
  onDelete: (role: UserRole) => void;
}): CustomTableColumn<UserRole>[] => [
  {
    id: "name",
    label: "Role",
    minWidth: 280,
    flex: 1.35,
    sortable: true,
    render: (role) => (
      <Stack direction="row" spacing={2} className="items-center">
        <Chip
          icon={<i className={role.isSystem ? "bx bx-lock" : "bx bx-shield"} />}
          color={role.isSystem ? "primary" : "secondary"}
          variant="tonal"
          sx={{
            inlineSize: 34,
            blockSize: 34,
            borderRadius: 1,
            "& .MuiChip-label": { display: "none" },
            "& .MuiChip-icon": { m: 0 },
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.primary"
            fontWeight={600}
            noWrap
          >
            {role.name}
          </Typography>
          <Tooltip title={role.description} placement="bottom-start">
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block" }}
            >
              {role.description}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.disabled">
            {role.isSystem ? "Locked system role" : "Editable custom role"}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    id: "assignedUsers",
    label: "Assigned Users",
    width: 145,
    render: (role) => {
      const count = role.assignedUsersCount;

      return (
        <Stack direction="row" spacing={1} className="items-center">
          <i className="bx bx-group text-textSecondary" />
          <Typography variant="body2">
            {count} {count === 1 ? "user" : "users"}
          </Typography>
        </Stack>
      );
    },
  },
  {
    id: "access",
    label: "Access Summary",
    minWidth: 260,
    flex: 1.2,
    render: (role) => {
      const fullSystemAccess = hasSuperAdminRole([role]);
      const modules = getModulesFromRoles([role]);

      const moduleSummary = fullSystemAccess
        ? "Full system access"
        : modules.length
          ? modules.map((module) => module.label).join(", ")
          : "No module access";

      return (
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.primary">
            {fullSystemAccess
              ? "All permissions across all modules"
              : `${role.permissionIds.length} permissions across ${modules.length} ${
                  modules.length === 1 ? "module" : "modules"
                }`}
          </Typography>
          <Tooltip title={moduleSummary} placement="bottom-start">
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block" }}
            >
              {moduleSummary}
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
    render: (role) => (
      <Chip
        label={role.status}
        color={role.status === "Active" ? "success" : "default"}
        variant="tonal"
        size="small"
      />
    ),
  },
  {
    id: "actions",
    label: "",
    align: "center",
    width: 64,
    render: (role) => (
      <RoleActions
        role={role}
        assignedUsers={role.assignedUsersCount}
        canManage={canManage}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
];
