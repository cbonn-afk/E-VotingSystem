import { useQueries } from "@tanstack/react-query";

import { userManagementApi } from "../api/userManagementApi";
import { userManagementKeys } from "../queryKeys";
import type { UserManagementStatsData } from "../types";

const baseUserFilters = {
  sort: "name" as const,
  direction: "asc" as const,
  page: 1,
  perPage: 1,
};

export const useUserManagementStats = (canViewUsers = true, canViewRoles = true) => {
  const results = useQueries({
    queries: [
      {
        queryKey: userManagementKeys.userList(baseUserFilters),
        queryFn: () => userManagementApi.listUsers(baseUserFilters),
        enabled: canViewUsers,
      },
      {
        queryKey: userManagementKeys.userList({
          ...baseUserFilters,
          status: "active",
        }),
        queryFn: () =>
          userManagementApi.listUsers({
            ...baseUserFilters,
            status: "active",
          }),
        enabled: canViewUsers,
      },
      {
        queryKey: userManagementKeys.userList({
          ...baseUserFilters,
          status: "inactive",
        }),
        queryFn: () =>
          userManagementApi.listUsers({
            ...baseUserFilters,
            status: "inactive",
          }),
        enabled: canViewUsers,
      },
      {
        queryKey: userManagementKeys.roleList({ page: 1, perPage: 1 }),
        queryFn: () =>
          userManagementApi.listRoles({ page: 1, perPage: 1 }),
        enabled: canViewRoles,
      },
    ],
  });

  const data: UserManagementStatsData = {
    totalUsers: results[0].data?.meta.total ?? 0,
    activeUsers: results[1].data?.meta.total ?? 0,
    inactiveUsers: results[2].data?.meta.total ?? 0,
    totalRoles: results[3].data?.meta.total ?? 0,
  };

  return {
    data,
    isLoading: results.some((result) => result.isLoading),
  };
};
