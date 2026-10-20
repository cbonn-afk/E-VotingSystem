import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/libs/api/apiError";

import { portalApi, portalMemberKey } from "./portalApi";

/** The signed-in member, or an ApiError (401 = signed out, 403 = this network is not allowed). */
export const usePortalMember = () =>
  useQuery({
    queryKey: portalMemberKey,
    queryFn: portalApi.me,
    retry: false,
    staleTime: 60_000,
  });

export const portalErrorStatus = (error: unknown): number | null => (error instanceof ApiError ? error.status : null);

export const PORTAL_LOGIN_PATH = "/loan-portal";
export const PORTAL_CHANGE_PASSWORD_PATH = "/loan-portal/change-password";
export const PORTAL_DASHBOARD_PATH = "/loan-portal/dashboard";

/** The server answers 428 while the member still has the default password. */
export const portalPasswordChangeRequired = (error: unknown): boolean => portalErrorStatus(error) === 428;
