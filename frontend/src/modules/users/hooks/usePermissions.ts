import { useQuery } from "@tanstack/react-query";

import { userManagementApi } from "../api/userManagementApi";
import { mapPermissionDtoToDefinition } from "../mappers/roleMappers";
import { userManagementKeys } from "../queryKeys";

export const usePermissions = (enabled = true) =>
  useQuery({
    queryKey: userManagementKeys.permissions(),
    queryFn: userManagementApi.listPermissions,
    select: (permissions) => permissions.map(mapPermissionDtoToDefinition),
    enabled,
  });
