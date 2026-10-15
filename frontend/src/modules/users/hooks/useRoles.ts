import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { userManagementApi } from "../api/userManagementApi";
import { mapRoleDtoToUserRole } from "../mappers/roleMappers";
import { userManagementKeys } from "../queryKeys";
import type { RoleListFilters } from "../types";

export const useRoles = (filters: RoleListFilters, enabled = true) =>
  useQuery({
    queryKey: userManagementKeys.roleList(filters),
    queryFn: () => userManagementApi.listRoles(filters),
    select: (response) => ({
      roles: response.data.map(mapRoleDtoToUserRole),
      meta: response.meta,
    }),
    placeholderData: keepPreviousData,
    enabled,
  });
