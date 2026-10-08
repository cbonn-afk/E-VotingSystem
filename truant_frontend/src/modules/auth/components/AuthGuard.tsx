"use client";

import { useEffect, type ReactNode } from "react";

import { usePathname } from "next/navigation";

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import AuthorizationRealtimeSync from "@/modules/auth/components/AuthorizationRealtimeSync";
import AuthorizationLoadingScreen from "@/modules/auth/components/AuthorizationLoadingScreen";
import ThemePreferenceSync from "@/modules/auth/components/ThemePreferenceSync";
import {
  canRenderGuardedContent,
  getPasswordChangeGuardRedirect,
  getRequestedDestination,
  REQUIRED_PASSWORD_CHANGE_PATH,
} from "@/modules/auth/passwordChange";

type AuthGuardProps = {
  children: ReactNode;
};

const AuthGuard = ({ children }: AuthGuardProps) => {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const isPasswordChangePage = pathname === REQUIRED_PASSWORD_CHANGE_PATH;
  const requiresPasswordChange =
    currentUser.data?.require_password_change ?? false;

  useEffect(() => {
    if (currentUser.isPending) return;

    if (!currentUser.data) {
      const destination = isPasswordChangePage
        ? getRequestedDestination(window.location.search)
        : pathname;
      const next = encodeURIComponent(destination);

      window.location.replace(`/login?next=${next}`);
      return;
    }

    const redirect = getPasswordChangeGuardRedirect(
      currentUser.data,
      pathname,
      window.location.search,
    );

    if (redirect) window.location.replace(redirect);
  }, [
    currentUser.data,
    currentUser.isPending,
    isPasswordChangePage,
    pathname,
    requiresPasswordChange,
  ]);

  const isRedirecting = Boolean(
    currentUser.data && !canRenderGuardedContent(currentUser.data, pathname),
  );

  if (currentUser.isPending || isRedirecting) {
    return <AuthorizationLoadingScreen />;
  }

  if (!currentUser.data) return null;

  if (requiresPasswordChange) return children;

  return (
    <>
      <AuthorizationRealtimeSync userId={currentUser.data.id} />
      <ThemePreferenceSync />
      {children}
    </>
  );
};

export default AuthGuard;
