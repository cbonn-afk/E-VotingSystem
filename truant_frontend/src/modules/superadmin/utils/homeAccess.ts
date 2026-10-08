import { isAuthorized } from "@/modules/auth/authorization/authorization";
import { getRoutePolicy } from "@/modules/auth/authorization/routePolicies";
import type { AuthorizationUser } from "@/modules/auth/authorization/types";

import type { SuperAdminModule } from "../types";

/** Home cards the user is allowed to open (Election and Loan). */
export const getAuthorizedHomeModules = (
  user: AuthorizationUser | null | undefined,
  modules: readonly SuperAdminModule[],
): SuperAdminModule[] => {
  if (!user) return [];

  return modules
    .filter((module) => isAuthorized(user, module))
    .filter((module) => {
      const routePolicy = getRoutePolicy(module.href);

      return !routePolicy || isAuthorized(user, routePolicy);
    });
};

export const getSingleModuleHomePath = (
  user: AuthorizationUser | null | undefined,
  modules: readonly SuperAdminModule[],
): string | null => {
  if (!user || user.is_super_admin) return null;

  // Redirect only when there is exactly one distinct reachable module.
  const destinations = new Set(
    getAuthorizedHomeModules(user, modules).map((module) => module.href),
  );

  return destinations.size === 1 ? [...destinations][0] : null;
};

export const getHomeLandingPath = (
  user: AuthorizationUser | null | undefined,
  modules: readonly SuperAdminModule[],
): string | null => getSingleModuleHomePath(user, modules);