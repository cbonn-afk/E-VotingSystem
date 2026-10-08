import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthorizationGuard from "./AuthorizationGuard";

const { replace, useAuthorization } = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthorization: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/ordering/forms",
  useRouter: () => ({ replace }),
}));

vi.mock("@/modules/auth/hooks/useAuthorization", () => ({
  useAuthorization,
}));

describe("AuthorizationGuard", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("does not flash protected content while permissions load", () => {
    useAuthorization.mockReturnValue({
      isLoading: true,
      isAuthorized: () => false,
      user: undefined,
    });

    render(
      <AuthorizationGuard permission="ordering.orders.view">
        <div>Protected ordering content</div>
      </AuthorizationGuard>,
    );

    expect(
      screen.queryByText("Protected ordering content"),
    ).not.toBeInTheDocument();
  });

  it("does not render denied protected content", () => {
    useAuthorization.mockReturnValue({
      isLoading: false,
      isAuthorized: () => false,
      user: undefined,
    });

    render(
      <AuthorizationGuard permission="ordering.orders.view">
        <div>Protected ordering content</div>
      </AuthorizationGuard>,
    );

    expect(
      screen.queryByText("Protected ordering content"),
    ).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("redirects denied partner portal users back to their portal", () => {
    useAuthorization.mockReturnValue({
      isLoading: false,
      isAuthorized: () => false,
      user: {
        id: 10,
        name: "Portal Partner",
        email: "partner@example.com",
        phone: null,
        address: null,
        avatar_url: null,
        theme_preference: "system",
        email_verified_at: null,
        status: "active",
        account_type: "Partner",
        deactivated_at: null,
        is_super_admin: false,
        has_employee_profile: false,
        can_access_partner_portal: true,
        partner_portal_path: "/partner",
        roles: ["Partner"],
        permissions: ["partners.self_service.view"],
        modules: ["partners"],
        require_password_change: false,
        created_at: null,
        updated_at: null,
      },
    });

    render(
      <AuthorizationGuard permission="partners.records.view">
        <div>Protected partners content</div>
      </AuthorizationGuard>,
    );

    expect(screen.queryByText("Protected partners content")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/partner");
  });
});
