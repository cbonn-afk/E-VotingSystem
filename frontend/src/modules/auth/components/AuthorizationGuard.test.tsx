import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthorizationGuard from "./AuthorizationGuard";

const { replace, useAuthorization } = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthorization: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/loan/applications",
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
      <AuthorizationGuard permission="loan.applications.view">
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
      <AuthorizationGuard permission="loan.applications.view">
        <div>Protected ordering content</div>
      </AuthorizationGuard>,
    );

    expect(
      screen.queryByText("Protected ordering content"),
    ).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("lets authorized users through", () => {
    useAuthorization.mockReturnValue({
      isLoading: false,
      isAuthorized: () => true,
      user: undefined,
    });

    render(
      <AuthorizationGuard permission="loan.applications.view">
        <div>Protected loan content</div>
      </AuthorizationGuard>,
    );

    expect(screen.getByText("Protected loan content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
