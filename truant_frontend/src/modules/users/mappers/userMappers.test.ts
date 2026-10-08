import { describe, expect, it } from "vitest";

import {
  mapCreateUserFormToRequest,
  mapUserAccountToFormValues,
  mapUserDtoToUserAccount,
  mapUserFormToProfileRequest,
} from "./userMappers";

describe("user mappers", () => {
  it("maps and submits the required password change setting", () => {
    const user = mapUserDtoToUserAccount(
      {
        id: 1,
        name: "ERP User",
        email: "user@example.com",
        avatar_url: "/storage/avatars/user.jpg",
        status: "active",
        deactivated_at: null,
        roles: [],
        permissions: [],
        modules: [],
        employee_workspace: null,
        partner: {
          id: "partner-1",
          partner_no: "PAR-2026-0001",
          name: "ERP Partner",
          status: "Active",
        },
        require_password_change: true,
        created_at: null,
        updated_at: null,
      },
      [],
    );

    expect(user.requirePasswordChange).toBe(true);
    expect(user.avatarUrl).toBe("/storage/avatars/user.jpg");
    expect(user.linkedPartner?.partnerNo).toBe("PAR-2026-0001");
    expect(
      mapUserFormToProfileRequest({
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        accountType: user.accountType,
        roleIds: [],
        temporaryPassword: "",
        confirmPassword: "",
        requirePasswordChange: true,
        allowUnassigned: false,
      }),
    ).toMatchObject({ require_password_change: true });
  });

  it("initializes edit values and create payloads with the flag", () => {
    const values = mapUserAccountToFormValues({
      id: 1,
      fullName: "ERP User",
      email: "user@example.com",
      avatarUrl: null,
      roleIds: [10],
      roleNames: ["Ordering Staff"],
      permissions: [],
      modules: ["ordering"],
      employeeWorkspace: null,
      accountType: "Employee",
      status: "Active",
      requirePasswordChange: true,
      createdAt: "",
      linkedEmployee: null,
      linkedPartner: null,
    });

    expect(values.requirePasswordChange).toBe(true);
    expect(
      mapCreateUserFormToRequest(
        {
          ...values,
          temporaryPassword: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
        },
        [
          {
            id: 10,
            name: "Ordering Staff",
            description: "",
            permissionIds: [],
            isSystem: true,
            status: "Active",
            assignedUsersCount: 1,
            createdAt: "",
          },
        ],
      ),
    ).toMatchObject({ require_password_change: true });
  });
});
