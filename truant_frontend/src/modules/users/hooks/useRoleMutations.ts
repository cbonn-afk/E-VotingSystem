import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userManagementApi } from "../api/userManagementApi";
import { userManagementKeys } from "../queryKeys";
import type { SaveRoleRequest } from "../types";

export const useRoleMutations = () => {
  const queryClient = useQueryClient();

  const invalidateRoleDependents = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userManagementKeys.roles() }),
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() }),
    ]);
  };

  return {
    createRole: useMutation({
      mutationFn: userManagementApi.createRole,
      onSuccess: invalidateRoleDependents,
    }),
    updateRole: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: SaveRoleRequest;
      }) => userManagementApi.updateRole(id, payload),
      onSuccess: async (role) => {
        queryClient.setQueryData(userManagementKeys.role(role.id), role);
        await invalidateRoleDependents();
      },
    }),
    deleteRole: useMutation({
      mutationFn: userManagementApi.deleteRole,
      onSuccess: async (_data, id) => {
        queryClient.removeQueries({ queryKey: userManagementKeys.role(id) });
        await invalidateRoleDependents();
      },
    }),
  };
};
