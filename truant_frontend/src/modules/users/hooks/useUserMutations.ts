import { useMutation, useQueryClient } from "@tanstack/react-query";

import { employeesQueryKeys } from "@/modules/employees/queryKeys";

import { userManagementApi } from "../api/userManagementApi";
import { userManagementKeys } from "../queryKeys";
import type {
  CreateUserRequest,
  ResetUserPasswordRequest,
  SyncUserRolesRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
} from "../types";

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const refreshUsersAndRoles = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() }),
      queryClient.invalidateQueries({ queryKey: userManagementKeys.roles() }),
      queryClient.invalidateQueries({ queryKey: employeesQueryKeys.all }),
    ]);
  };

  return {
    createUser: useMutation({
      mutationFn: (payload: CreateUserRequest) =>
        userManagementApi.createUser(payload),
      onSuccess: refreshUsersAndRoles,
    }),
    updateUser: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: UpdateUserRequest;
      }) => userManagementApi.updateUser(id, payload),
      onSuccess: async (user) => {
        queryClient.setQueryData(userManagementKeys.user(user.id), user);
        await queryClient.invalidateQueries({
          queryKey: userManagementKeys.users(),
        });
        await queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.all,
        });
      },
    }),
    updateStatus: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: UpdateUserStatusRequest;
      }) => userManagementApi.updateUserStatus(id, payload),
      onSuccess: async (user) => {
        queryClient.setQueryData(userManagementKeys.user(user.id), user);
        await queryClient.invalidateQueries({
          queryKey: userManagementKeys.users(),
        });
      },
    }),
    syncRoles: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: SyncUserRolesRequest;
      }) => userManagementApi.syncUserRoles(id, payload),
      onSuccess: async (user) => {
        queryClient.setQueryData(userManagementKeys.user(user.id), user);
        await refreshUsersAndRoles();
      },
    }),
    resetPassword: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: ResetUserPasswordRequest;
      }) => userManagementApi.resetUserPassword(id, payload),
      onSuccess: async (user) => {
        queryClient.setQueryData(userManagementKeys.user(user.id), user);
        await queryClient.invalidateQueries({
          queryKey: userManagementKeys.users(),
        });
      },
    }),
    deleteUser: useMutation({
      mutationFn: userManagementApi.deleteUser,
      onSuccess: async (_data, id) => {
        queryClient.removeQueries({ queryKey: userManagementKeys.user(id) });
        await refreshUsersAndRoles();
      },
    }),
  };
};
