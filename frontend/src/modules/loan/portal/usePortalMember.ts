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
