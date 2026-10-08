import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import CustomKpiCard from "@components/app/CustomKPICard";

import type { UserManagementStatsData } from "../types";

type UserManagementStatsProps = {
  data: UserManagementStatsData;
  loading?: boolean;
};

const UserManagementStats = ({
  data,
  loading = false,
}: UserManagementStatsProps) => {
  const stats = [
    {
      label: "System Users",
      value: data.totalUsers,
      helper: `${data.activeUsers} active accounts`,
      icon: "bx bx-user",
      color: "primary" as const,
    },
    {
      label: "Active Roles",
      value: data.totalRoles,
      helper: `${data.totalRoles} roles registered`,
      icon: "bx bx-shield",
      color: "success" as const,
    },
    {
      label: "Active Users",
      value: data.activeUsers,
      helper: "Accounts with sign-in access",
      icon: "bx bx-user-check",
      color: "warning" as const,
    },
    {
      label: "Inactive",
      value: data.inactiveUsers,
      helper: "Access currently blocked",
      icon: "bx bx-block",
      color: "error" as const,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        },
        gap: 4,
      }}
    >
      {stats.map((stat) => (
        <CustomKpiCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          loading={loading}
          iconString={stat.icon}
          iconColor={stat.color}
        >
          <Typography variant="caption" color="text.secondary">
            {stat.helper}
          </Typography>
        </CustomKpiCard>
      ))}
    </Box>
  );
};

export default UserManagementStats;
