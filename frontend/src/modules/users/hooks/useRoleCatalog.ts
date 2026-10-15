import { useQuery } from "@tanstack/react-query";

import { userManagementApi } from "../api/userManagementApi";
import { mapRoleDtoToUserRole } from "../mappers/roleMappers";
import { userManagementKeys } from "../queryKeys";

export const useRoleCatalog = (enabled = true) =>
  useQuery({
    queryKey: userManagementKeys.roleCatalog(),
    queryFn: userManagementApi.listRoleCatalog,
    select: (roles) => roles.map(mapRoleDtoToUserRole),
    staleTime: 60_000,
    enabled,
  });
