import type { ListParams } from "./api/types";

export const electionQueryKeys = {
  all: ["election"] as const,
  assemblies: {
    all: () => [...electionQueryKeys.all, "assemblies"] as const,
    list: () => [...electionQueryKeys.assemblies.all(), "list"] as const,
    current: () => [...electionQueryKeys.assemblies.all(), "current"] as const,
  },
  members: {
    all: () => [...electionQueryKeys.all, "members"] as const,
    list: (params: ListParams = {}) =>
      [...electionQueryKeys.members.all(), "list", params] as const,
  },
  registrations: {
    all: () => [...electionQueryKeys.all, "registrations"] as const,
    list: (params: ListParams = {}) =>
      [...electionQueryKeys.registrations.all(), "list", params] as const,
    members: (term: string) =>
      [...electionQueryKeys.registrations.all(), "members", term] as const,
  },
  positions: {
    all: () => [...electionQueryKeys.all, "positions"] as const,
    list: (params: ListParams = {}) =>
      [...electionQueryKeys.positions.all(), "list", params] as const,
  },
  amendments: {
    all: () => [...electionQueryKeys.all, "amendments"] as const,
    list: (params: ListParams = {}) =>
      [...electionQueryKeys.amendments.all(), "list", params] as const,
  },
  voting: {
    all: () => [...electionQueryKeys.all, "voting"] as const,
    ballot: () => [...electionQueryKeys.voting.all(), "ballot"] as const,
    members: (term: string) =>
      [...electionQueryKeys.voting.all(), "members", term] as const,
  },
  results: {
    all: () => [...electionQueryKeys.all, "results"] as const,
    get: (params: ListParams = {}) =>
      [...electionQueryKeys.results.all(), params] as const,
  },
  tokens: {
    all: () => [...electionQueryKeys.all, "tokens"] as const,
    list: (params: ListParams = {}) =>
      [...electionQueryKeys.tokens.all(), "list", params] as const,
  },
  settings: () => [...electionQueryKeys.all, "settings"] as const,
};
