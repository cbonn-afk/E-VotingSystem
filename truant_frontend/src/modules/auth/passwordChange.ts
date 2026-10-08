import type { User } from "@/modules/auth/types";

export const REQUIRED_PASSWORD_CHANGE_PATH = "/change-password";
export const PASSWORD_CHANGE_REQUIRED_EVENT = "truant:password-change-required";

export const isSafeInternalPath = (path: string | null): path is string =>
  Boolean(path?.startsWith("/") && !path.startsWith("//"));

export const getRequestedDestination = (
  search: string,
  fallback = "/home",
): string => {
  const next = new URLSearchParams(search).get("next");

  return isSafeInternalPath(next) && next !== REQUIRED_PASSWORD_CHANGE_PATH
    ? next
    : fallback;
};

export const getRequiredPasswordChangePath = (destination: string): string => {
  const next =
    isSafeInternalPath(destination) &&
    destination !== REQUIRED_PASSWORD_CHANGE_PATH
      ? destination
      : "/home";

  return `${REQUIRED_PASSWORD_CHANGE_PATH}?next=${encodeURIComponent(next)}`;
};

/**
 * Every account lands on /home. There are no scoped workspaces or portals any
 * more, so this stays null; it exists so older imports keep compiling.
 */
export const getRoleHomePath = (_user: User): string | null => null;

export const getFallbackHomePath = (_user: User | null | undefined): string =>
  "/home";

export const getAuthenticatedDestination = (
  user: User,
  search: string,
): string => {
  const destination = getRequestedDestination(search);

  return user.require_password_change
    ? getRequiredPasswordChangePath(destination)
    : destination;
};

export const getPasswordChangeGuardRedirect = (
  user: User,
  pathname: string,
  search = "",
): string | null => {
  const isPasswordChangePage = pathname === REQUIRED_PASSWORD_CHANGE_PATH;

  if (user.require_password_change && !isPasswordChangePage) {
    return getRequiredPasswordChangePath(pathname);
  }

  if (!user.require_password_change && isPasswordChangePage) {
    return getRequestedDestination(search);
  }

  return null;
};

export const canRenderGuardedContent = (
  user: User,
  pathname: string,
): boolean =>
  user.require_password_change === (pathname === REQUIRED_PASSWORD_CHANGE_PATH);
