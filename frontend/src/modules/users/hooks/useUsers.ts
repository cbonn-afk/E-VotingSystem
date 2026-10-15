import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { userManagementApi } from "../api/userManagementApi";
import { mapUserDtoToUserAccount } from "../mappers/userMappers";
import { userManagementKeys } from "../queryKeys";
import type { UserListFilters, UserRole } from "../types";

export const useUsers = (filters: UserListFilters, roles: UserRole[], enabled = true) =>
  useQuery({
    queryKey: userManagementKeys.userList(filters),
    queryFn: () => userManagementApi.listUsers(filters),
    select: (response) => ({
      users: response.data.map((user) =>
        mapUserDtoToUserAccount(user, roles),
      ),
      meta: response.meta,
    }),
    placeholderData: keepPreviousData,
    enabled,
  });
