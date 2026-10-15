import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type { ListParams } from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const useResults = (params: ListParams = {}) =>
  useQuery({
    queryKey: electionQueryKeys.results.get(params),
    queryFn: () => electionApi.results.get(params),
    placeholderData: keepPreviousData,
    // Results change while voting is open.
    refetchInterval: 30_000,
  });
