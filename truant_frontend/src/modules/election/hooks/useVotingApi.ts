import { useMutation, useQuery } from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import { electionQueryKeys } from "../queryKeys";

/** Server-side member search used by the optional "auto search" code boxes. */
export const useMemberSearch = (
  scope: "registration" | "voting",
  term: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey:
      scope === "voting"
        ? electionQueryKeys.voting.members(term)
        : electionQueryKeys.registrations.members(term),
    queryFn: () =>
      scope === "voting"
        ? electionApi.voting.members(term)
        : electionApi.registrations.searchMembers(term),
    enabled: enabled && term.trim().length >= 2,
    staleTime: 30_000,
  });

export const useVotingMutations = () => ({
  eligibility: useMutation({ mutationFn: electionApi.voting.eligibility }),
  // Loaded fresh for every voter instead of cached.
  loadBallot: useMutation({ mutationFn: electionApi.voting.ballot }),
  cast: useMutation({ mutationFn: electionApi.voting.cast }),
});
