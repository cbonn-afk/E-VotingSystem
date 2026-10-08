import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

import { getModulePresentation } from "../data/accessCatalog";
import { hasSuperAdminRoleName } from "../data/accessSummary";
import type { UserAccount, UserRole } from "../types";

const UserDetailsDialog = ({
  user,
  roles,
  onClose,
}: {
  user: UserAccount | null;
  roles: UserRole[];
  onClose: () => void;
}) => {
  const assignedRoles = roles.filter((role) => user?.roleIds.includes(role.id));
  const fullSystemAccess = hasSuperAdminRoleName(user?.roleNames ?? []);
  const modules = (user?.modules ?? []).map(getModulePresentation);

  return (
    <CustomDialog
      open={Boolean(user)}
      onClose={onClose}
      closeAfterTransition
      title="User Details"
      description={user?.email}
      icon={<i className="bx bx-user" />}
      width="620px"
      actions={
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      }
    >
      {user && (
        <Stack spacing={4} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.fullName}
              sx={{ inlineSize: 48, blockSize: 48 }}
            >
              {user.fullName.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {user.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Full Name
              </Typography>
              <Typography>{user.fullName}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Account Status
              </Typography>
              <Typography>{user.status}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Account Purpose
              </Typography>
              <Typography>{user.accountType}</Typography>
            </Box>
          </Stack>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Created Date
            </Typography>
            <Typography>
              {new Intl.DateTimeFormat("en-PH", {
                dateStyle: "medium",
              }).format(new Date(user.createdAt))}
            </Typography>
          </Box>
          <Divider />
          {user.employeeWorkspace && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Assigned Workspace
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={user.employeeWorkspace.label}
                  color="primary"
                  variant="tonal"
                  size="small"
                />
                <Chip
                  label={
                    getModulePresentation(user.employeeWorkspace.module).label
                  }
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label="Managed by Job Position"
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Box>
          )}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Assigned Roles
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {user.roleNames.length ? (
                user.roleNames.map((roleName) => {
                  const role = roles.find(
                    (candidate) => candidate.name === roleName,
                  );

                  return (
                    <Chip
                      key={roleName}
                      label={roleName}
                      variant="tonal"
                      color={role?.isSystem ? "primary" : "secondary"}
                      size="small"
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No roles assigned.
                </Typography>
              )}
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Accessible Modules
            </Typography>
            {fullSystemAccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Full system access through the Super Admin authorization bypass.
              </Alert>
            )}
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {modules.length ? (
                modules.map((module) => (
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
                  No module access.
                </Typography>
              )}
            </Stack>
          </Box>
          <Alert severity="info">
            Frontend visibility is provided for convenience. Laravel
            authorization remains authoritative.
          </Alert>
        </Stack>
      )}
    </CustomDialog>
  );
};

export default UserDetailsDialog;
