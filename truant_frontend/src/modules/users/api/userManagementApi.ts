import { apiClient } from "@/libs/api/apiClient";

import type {
  ApiResourceResponse,
  CreateUserRequest,
  ManagedUserDto,
  PaginatedApiResponse,
  PermissionDto,
  RoleDto,
  RoleListFilters,
  ResetUserPasswordRequest,
  SaveRoleRequest,
  SyncUserRolesRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserListFilters,
  UnlinkedEmployeeOption,
} from "../types";

const toQueryString = (
  values: Record<string, string | number | boolean | undefined>,
): string => {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
};

export const userManagementApi = {
  async listUnlinkedEmployees(): Promise<UnlinkedEmployeeOption[]> {
    const response = await apiClient<ApiResourceResponse<UnlinkedEmployeeOption[]>>('/api/employees/unlinked/options');
    return response.data;
  },

  async linkEmployee(employeeId: string, userId: number | null): Promise<void> {
    await apiClient(`/api/employees/${employeeId}/link-user`, { method: 'PATCH', body: { user_id: userId } });
  },
  listUsers(
    filters: UserListFilters,
  ): Promise<PaginatedApiResponse<ManagedUserDto>> {
    const query = toQueryString({
      search: filters.search,
      status: filters.status,
      role: filters.role,
      sort: filters.sort,
      direction: filters.direction,
      page: filters.page,
      per_page: filters.perPage,
      exclude_partners: filters.excludePartners,
    });

    return apiClient(`/api/settings/users${query}`);
  },

  async getUser(id: number): Promise<ManagedUserDto> {
    const response = await apiClient<ApiResourceResponse<ManagedUserDto>>(
      `/api/settings/users/${id}`,
    );

    return response.data;
  },

  async createUser(payload: CreateUserRequest): Promise<ManagedUserDto> {
    const response = await apiClient<ApiResourceResponse<ManagedUserDto>>(
      "/api/settings/users",
      { method: "POST", body: payload },
    );

    return response.data;
  },

  async updateUser(
    id: number,
    payload: UpdateUserRequest,
  ): Promise<ManagedUserDto> {
    const response = await apiClient<ApiResourceResponse<ManagedUserDto>>(
      `/api/settings/users/${id}`,
      { method: "PATCH", body: payload },
    );

    return response.data;
  },

  async updateUserStatus(
    id: number,
    payload: UpdateUserStatusRequest,
  ): Promise<ManagedUserDto> {
    const response = await apiClient<ApiResourceResponse<ManagedUserDto>>(
      `/api/settings/users/${id}/status`,
      { method: "PATCH", body: payload },
    );

    return response.data;
  },

  async syncUserRoles(
    id: number,
    payload: SyncUserRolesRequest,
  ): Promise<ManagedUserDto> {
    const response = await apiClient<ApiResourceResponse<ManagedUserDto>>(
      `/api/settings/users/${id}/roles`,
      { method: "PUT", body: payload },
    );

    return response.data;
  },

  async resetUserPassword(
    id: number,
    payload: ResetUserPasswordRequest,
  ): Promise<ManagedUserDto> {
    const response = await apiClient<ApiResourceResponse<ManagedUserDto>>(
      `/api/settings/users/${id}/password`,
      { method: "PATCH", body: payload },
    );

    return response.data;
  },

  deleteUser(id: number): Promise<void> {
    return apiClient(`/api/settings/users/${id}`, { method: "DELETE" });
  },

  listRoles(filters: RoleListFilters): Promise<PaginatedApiResponse<RoleDto>> {
    const query = toQueryString({
      search: filters.search,
      page: filters.page,
      per_page: filters.perPage,
    });

    return apiClient(`/api/settings/roles${query}`);
  },

  async listRoleCatalog(): Promise<RoleDto[]> {
    const firstPage = await userManagementApi.listRoles({
      page: 1,
      perPage: 100,
    });

    if (firstPage.meta.last_page <= 1) return firstPage.data;

    const remainingPages = await Promise.all(
      Array.from(
        { length: firstPage.meta.last_page - 1 },
        (_, index) =>
          userManagementApi.listRoles({
            page: index + 2,
            perPage: 100,
          }),
      ),
    );

    return [
      ...firstPage.data,
      ...remainingPages.flatMap((page) => page.data),
    ];
  },

  async getRole(id: number): Promise<RoleDto> {
    const response = await apiClient<ApiResourceResponse<RoleDto>>(
      `/api/settings/roles/${id}`,
    );

    return response.data;
  },

  async createRole(payload: SaveRoleRequest): Promise<RoleDto> {
    const response = await apiClient<ApiResourceResponse<RoleDto>>(
      "/api/settings/roles",
      { method: "POST", body: payload },
    );

    return response.data;
  },

  async updateRole(id: number, payload: SaveRoleRequest): Promise<RoleDto> {
    const response = await apiClient<ApiResourceResponse<RoleDto>>(
      `/api/settings/roles/${id}`,
      { method: "PATCH", body: payload },
    );

    return response.data;
  },

  deleteRole(id: number): Promise<void> {
    return apiClient(`/api/settings/roles/${id}`, { method: "DELETE" });
  },

  async listPermissions(): Promise<PermissionDto[]> {
    const response =
      await apiClient<ApiResourceResponse<PermissionDto[]>>(
        "/api/settings/permissions",
      );

    return response.data;
  },
};
