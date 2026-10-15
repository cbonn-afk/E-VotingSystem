"use client";

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import {
  describePermission,
  getModulePresentation,
  permissionResource,
} from "../data/accessCatalog";
import type { ErpModule, PermissionDefinition } from "../types";

type PermissionMatrixProps = {
  permissions: PermissionDefinition[];
  selectedPermissionIds: string[];
  onChange?: (permissionIds: string[]) => void;
  readOnly?: boolean;
  fullAccess?: boolean;
};

type ResourcePermissionGroup = {
  key: string;
  label: string;
  permissions: PermissionDefinition[];
};

const actionOrder = [
  "access",
  "view",
  "create",
  "update",
  "manage",
  "request",
  "prepare",
  "approve",
  "release",
  "record",
  "reconcile",
  "post",
  "reverse",
  "export",
  "import",
  "advance",
  "complete",
  "reject",
  "cancel",
  "void",
  "deactivate",
  "delete",
];

const actionSort = (left: string, right: string): number => {
  const leftIndex = actionOrder.indexOf(left);
  const rightIndex = actionOrder.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return (
      (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    );
  }

  return left.localeCompare(right);
};

const resourceKey = (permission: PermissionDefinition): string =>
  permission.action === "access"
    ? "__module_access__"
    : permissionResource(permission.name) || permission.module;

const groupPermissionsByResource = (
  modulePermissions: PermissionDefinition[],
): ResourcePermissionGroup[] => {
  const groups = new Map<string, PermissionDefinition[]>();

  modulePermissions.forEach((permission) => {
    const key = resourceKey(permission);

    groups.set(key, [...(groups.get(key) ?? []), permission]);
  });

  return Array.from(groups.entries())
    .map(([key, groupPermissions]) => ({
      key,
      permissions: groupPermissions.sort((left, right) =>
        actionSort(left.action, right.action),
      ),
      label: describePermission(groupPermissions[0]).subject,
    }))
    .sort((left, right) => {
      if (left.key === "__module_access__") return -1;
      if (right.key === "__module_access__") return 1;

      return left.label.localeCompare(right.label);
    });
};

const matchesQuery = (permission: PermissionDefinition, query: string) => {
  const { subject, actionLabel, description } = describePermission(permission);
  const moduleLabel = getModulePresentation(permission.module).label;

  return [permission.name, subject, actionLabel, description, moduleLabel]
    .join("   ")
    .toLowerCase()
    .includes(query);
};

type PermissionGroupCardProps = {
  group: ResourcePermissionGroup;
  selected: Set<string>;
  readOnly: boolean;
  onToggle: (permissionIds: string[], checked: boolean) => void;
  moduleBadge?: Pick<ErpModule, "label" | "color" | "icon">;
};

const PermissionGroupCard = ({
  group,
  selected,
  readOnly,
  onToggle,
  moduleBadge,
}: PermissionGroupCardProps) => {
  const groupSelectedCount = group.permissions.filter((permission) =>
    selected.has(permission.id),
  ).length;
  const allGroupSelected =
    group.permissions.length > 0 &&
    groupSelectedCount === group.permissions.length;
  const partiallyGroupSelected = groupSelectedCount > 0 && !allGroupSelected;

  return (
    <Box>
      <Stack
        direction="row"
        className="items-center justify-between"
        spacing={2}
        sx={{ mb: 1.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          {moduleBadge && (
            <Chip
              size="small"
              variant="tonal"
              color={moduleBadge.color}
              icon={<i className={moduleBadge.icon} />}
              label={moduleBadge.label}
              sx={{ mb: 0.75 }}
            />
          )}
          <Typography variant="subtitle2" fontWeight={600}>
            {group.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {groupSelectedCount} of {group.permissions.length} selected
          </Typography>
        </Box>
        <Checkbox
          size="small"
          checked={allGroupSelected}
          indeterminate={partiallyGroupSelected}
          disabled={readOnly}
          inputProps={{
            "aria-label": `Select all ${group.label} permissions`,
          }}
          onChange={(event) =>
            onToggle(
              group.permissions.map((permission) => permission.id),
              event.target.checked,
            )
          }
        />
      </Stack>

      <Stack spacing={0.5}>
        {group.permissions.map((permission) => {
          const { actionLabel, actionColor, description } =
            describePermission(permission);
          const checked = selected.has(permission.id);

          return (
            <FormControlLabel
              key={permission.id}
              sx={{
                m: 0,
                alignItems: "flex-start",
                "& .MuiCheckbox-root": { pt: 0.25 },
              }}
              control={
                <Checkbox
                  size="small"
                  checked={checked}
                  disabled={readOnly}
                  inputProps={{ "aria-label": `Allow ${permission.name}` }}
                  sx={{ color: checked ? `${actionColor}.main` : undefined }}
                  onChange={(event) =>
                    onToggle([permission.id], event.target.checked)
                  }
                />
              }
              label={
                <Stack spacing={0} sx={{ minWidth: 0 }}>
                  <Typography variant="body2">{actionLabel}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {description}
                  </Typography>
                </Stack>
              }
            />
          );
        })}
      </Stack>
    </Box>
  );
};

const PermissionMatrix = ({
  permissions,
  selectedPermissionIds,
  onChange,
  readOnly = false,
  fullAccess = false,
}: PermissionMatrixProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [search, setSearch] = useState("");

  const effectivePermissionIds = fullAccess
    ? permissions.map((permission) => permission.id)
    : selectedPermissionIds;
  const selected = new Set(effectivePermissionIds);
  const moduleKeys = useMemo(
    () =>
      Array.from(new Set(permissions.map((permission) => permission.module))).sort(),
    [permissions],
  );
  const [activeModule, setActiveModule] = useState(moduleKeys[0] ?? "");
  const currentModuleKey = moduleKeys.includes(activeModule)
    ? activeModule
    : (moduleKeys[0] ?? "");

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  const updateMany = (permissionIds: string[], checked: boolean) => {
    if (readOnly || !onChange) return;

    const next = new Set(selectedPermissionIds);

    permissionIds.forEach((id) => {
      if (checked) next.add(id);
      else next.delete(id);
    });

    onChange(Array.from(next));
  };

  const activeModulePermissions = permissions
    .filter((permission) => permission.module === currentModuleKey)
    .sort((left, right) => actionSort(left.action, right.action));
  const activeGroups = groupPermissionsByResource(activeModulePermissions);
  const activeModulePresentation = getModulePresentation(currentModuleKey);
  const activeSelectedCount = activeModulePermissions.filter((permission) =>
    selected.has(permission.id),
  ).length;
  const activeAllSelected =
    activeModulePermissions.length > 0 &&
    activeSelectedCount === activeModulePermissions.length;
  const activePartiallySelected = activeSelectedCount > 0 && !activeAllSelected;

  const searchResults = isSearching
    ? moduleKeys.flatMap((moduleKey) => {
        const matches = permissions
          .filter(
            (permission) =>
              permission.module === moduleKey &&
              matchesQuery(permission, query),
          )
          .sort((left, right) => actionSort(left.action, right.action));

        if (matches.length === 0) return [];

        const module = getModulePresentation(moduleKey);

        return groupPermissionsByResource(matches).map((group) => ({
          group,
          module,
        }));
      })
    : [];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        className="items-start sm:items-center justify-between"
      >
        <Box>
          <Typography variant="h5">Permission Matrix</Typography>
          <Typography variant="body2" color="text.secondary">
            Open one module at a time and tick only the access this role needs.
          </Typography>
        </Box>
        <Chip
          label={
            fullAccess
              ? "All permissions"
              : `${selectedPermissionIds.length} permissions selected`
          }
          color="primary"
          variant="tonal"
          icon={<i className="bx bx-key" />}
        />
      </Stack>

      <Alert
        severity={readOnly ? "info" : "warning"}
        icon={<i className={readOnly ? "bx bx-info-circle" : "bx bx-shield"} />}
      >
        {fullAccess
          ? "Super Admin receives full system access through the authorization bypass. Explicit permission assignments are not required."
          : readOnly
            ? "This is a read-only summary. Selected items show the access currently granted to this role."
            : "Start with only the access this role needs. Permissions take effect for every user assigned to the role."}
      </Alert>

      <TextField
        size="small"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search permissions by module, resource, or action..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <i className="bx bx-search" />
            </InputAdornment>
          ),
          endAdornment: search && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <i className="bx bx-x" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {isSearching ? (
        <Paper variant="outlined" sx={{ p: 4 }}>
          {searchResults.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
              <i
                className="bx bx-search-alt"
                style={{ fontSize: 32, opacity: 0.5 }}
              />
              <Typography color="text.secondary">
                No permissions match &quot;{search}&quot;.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={3} divider={<Divider />}>
              {searchResults.map(({ group, module }) => (
                <PermissionGroupCard
                  key={`${module.key}-${group.key}`}
                  group={group}
                  selected={selected}
                  readOnly={readOnly}
                  onToggle={updateMany}
                  moduleBadge={module}
                />
              ))}
            </Stack>
          )}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Stack direction={{ xs: "column", md: "row" }}>
            <Box
              sx={{
                minWidth: { md: 264 },
                borderInlineEnd: { md: 1 },
                borderBlockEnd: { xs: 1, md: 0 },
                borderColor: "divider",
                bgcolor: "action.hover",
                py: 3,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 4,
                  mb: 1,
                  color: "text.disabled",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Modules
              </Typography>
              <List dense disablePadding sx={{ px: 2 }}>
                {moduleKeys.map((moduleKey) => {
                  const module = getModulePresentation(moduleKey);
                  const modulePermissions = permissions.filter(
                    (permission) => permission.module === moduleKey,
                  );
                  const moduleSelectedCount = modulePermissions.filter(
                    (permission) => selected.has(permission.id),
                  ).length;
                  const isActive = currentModuleKey === moduleKey;

                  return (
                    <ListItemButton
                      key={moduleKey}
                      selected={isActive}
                      onClick={() => setActiveModule(moduleKey)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        py: 2,
                        px: 3,
                        position: "relative",
                        "&.Mui-selected": {
                          bgcolor: `${module.color}.lightOpacity`,
                          color: `${module.color}.main`,
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            insetInlineEnd: 0,
                            insetBlockStart: "50%",
                            transform: "translateY(-50%)",
                            blockSize: "60%",
                            inlineSize: 3,
                            bgcolor: `${module.color}.main`,
                            borderStartStartRadius: 4,
                            borderEndStartRadius: 4,
                          },
                          "&:hover": {
                            bgcolor: `${module.color}.lightOpacity`,
                          },
                        },
                        "&:not(.Mui-selected):hover": {
                          bgcolor: "action.selected",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
                        <i
                          className={module.icon}
                          style={{ fontSize: "1.25rem" }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={module.label}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: isActive ? 600 : 500,
                          noWrap: true,
                        }}
                      />
                      {isDesktop && (
                        <Chip
                          size="small"
                          variant={isActive ? "filled" : "tonal"}
                          color={
                            moduleSelectedCount > 0 ? module.color : "secondary"
                          }
                          label={`${moduleSelectedCount}/${modulePermissions.length}`}
                          sx={{
                            height: 20,
                            ml: 1,
                            flexShrink: 0,
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      )}
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, p: 4 }}>
              <Stack
                direction="row"
                spacing={2}
                className="items-start justify-between"
                sx={{ mb: 3 }}
              >
                <Stack direction="row" spacing={2} sx={{ minWidth: 0 }}>
                  <Chip
                    color={activeModulePresentation.color}
                    variant="tonal"
                    icon={<i className={activeModulePresentation.icon} />}
                    sx={{
                      inlineSize: 36,
                      blockSize: 36,
                      borderRadius: 1,
                      flexShrink: 0,
                      "& .MuiChip-label": { display: "none" },
                      "& .MuiChip-icon": { m: 0 },
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1">
                      {activeModulePresentation.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activeModulePresentation.description}
                    </Typography>
                  </Box>
                </Stack>

                <FormControlLabel
                  label={activeAllSelected ? "Full access" : "Select all"}
                  labelPlacement="start"
                  sx={{
                    m: 0,
                    flexShrink: 0,
                    "& .MuiFormControlLabel-label": {
                      typography: "caption",
                      color: "text.secondary",
                    },
                  }}
                  control={
                    <Checkbox
                      size="small"
                      checked={activeAllSelected}
                      indeterminate={activePartiallySelected}
                      disabled={readOnly}
                      onChange={(event) =>
                        updateMany(
                          activeModulePermissions.map(
                            (permission) => permission.id,
                          ),
                          event.target.checked,
                        )
                      }
                    />
                  }
                />
              </Stack>

              <Stack spacing={3} divider={<Divider />}>
                {activeGroups.map((group) => (
                  <PermissionGroupCard
                    key={group.key}
                    group={group}
                    selected={selected}
                    readOnly={readOnly}
                    onToggle={updateMany}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default PermissionMatrix;
