import { describe, expect, it } from "vitest";

import {
  mapCreateUserFormToRequest,
  mapUserAccountToFormValues,
  mapUserDtoToUserAccount,
  mapUserFormToProfileRequest,
} from "./userMappers";
import type { ManagedUserDto, UserRole } from "../types";

const dto: ManagedUserDto = {
  id: 1,
  name: "Loan Officer",
  email: "officer@example.com",
  avatar_url: null,
  status: "active",
  deactivated_at: null,
  roles: ["Loan Officer"],
  permissions: ["loan.access"],
  modules: ["loan"],
  require_password_change: true,
  created_at: null,
  updated_at: null,
};

const roles: UserRole[] = [
  {
    id: 7,
    name: "Loan Officer",
    description: "",
    permissionIds: ["loan.access"],
    isSystem: false,
    status: "Active",
    assignedUsersCount: 1,
    createdAt: "",
  },
];

describe("user mappers", () => {
  it("maps a user and its role ids", () => {
    const user = mapUserDtoToUserAccount(dto, roles);

    expect(user.roleIds).toEqual([7]);
    expect(user.status).toBe("Active");
    expect(user.requirePasswordChange).toBe(true);
  });

  it("builds the create payload with role names and the password flag", () => {
    const values = {
      ...mapUserAccountToFormValues(mapUserDtoToUserAccount(dto, roles)),
      temporaryPassword: "Secret123!",
      confirmPassword: "Secret123!",
    };

    expect(mapCreateUserFormToRequest(values, roles)).toEqual({
      name: "Loan Officer",
      email: "officer@example.com",
      password: "Secret123!",
      status: "active",
      roles: ["Loan Officer"],
      require_password_change: true,
    });
  });

  it("builds the profile payload with name and email only", () => {
    const values = mapUserAccountToFormValues(mapUserDtoToUserAccount(dto, roles));

    expect(mapUserFormToProfileRequest(values)).toEqual({
      name: "Loan Officer",
      email: "officer@example.com",
    });
  });
});
