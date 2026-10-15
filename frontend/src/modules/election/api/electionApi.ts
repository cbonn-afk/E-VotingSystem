import { apiClient } from "@/libs/api/apiClient";

import type {
  AmendmentPayload,
  AmendmentResource,
  AssemblyPayload,
  AssemblyResource,
  AssemblyStatus,
  CandidateResource,
  CastBallotPayload,
  ElectionResults,
  ElectionSettingsPayload,
  ElectionSettingsResource,
  ListParams,
  MemberImportSummary,
  MemberOption,
  MemberPayload,
  MemberResource,
  PaginatedResponse,
  PositionPayload,
  PositionResource,
  RegistrationLookup,
  RegistrationResource,
  ResourceResponse,
  TokenLookup,
  TokenResource,
  VoterEligibility,
  VotingBallot,
} from "./types";

const BASE = "/api/election";

const query = (params: ListParams = {}): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => search.append(`${key}[]`, String(item)));

      return;
    }

    search.set(key, String(value));
  });

  const value = search.toString();

  return value ? `?${value}` : "";
};

const resource = <T>(path: string, init?: Parameters<typeof apiClient>[1]) =>
  apiClient<ResourceResponse<T>>(path, init);

const toForm = (values: Record<string, string | Blob | null | undefined>) => {
  const body = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, value);
  });

  return body;
};

export const electionApi = {
  assemblies: {
    list: () => resource<AssemblyResource[]>(`${BASE}/assemblies`),
    current: () =>
      resource<AssemblyResource | null>(`${BASE}/assemblies/current`),
    create: (payload: AssemblyPayload) =>
      resource<AssemblyResource>(`${BASE}/assemblies`, {
        method: "POST",
        body: payload,
      }),
    update: (id: number, payload: { name: string }) =>
      resource<AssemblyResource>(`${BASE}/assemblies/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    updateStatus: (id: number, status: AssemblyStatus) =>
      resource<AssemblyResource>(`${BASE}/assemblies/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/assemblies/${id}`, { method: "DELETE" }),
  },
  members: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<MemberResource>>(
        `${BASE}/members${query(params)}`,
      ),
    create: (payload: MemberPayload) =>
      resource<MemberResource>(`${BASE}/members`, {
        method: "POST",
        body: payload,
      }),
    update: (id: number, payload: Partial<MemberPayload>) =>
      resource<MemberResource>(`${BASE}/members/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/members/${id}`, { method: "DELETE" }),
    import: (file: File) =>
      resource<MemberImportSummary>(`${BASE}/members/import`, {
        method: "POST",
        body: toForm({ file }),
      }),
  },
  registrations: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<RegistrationResource>>(
        `${BASE}/registrations${query(params)}`,
      ),
    lookup: (memberCode: string) =>
      resource<RegistrationLookup>(
        `${BASE}/registrations/lookup/${encodeURIComponent(memberCode)}`,
      ),
    create: (memberCode: string) =>
      resource<RegistrationResource>(`${BASE}/registrations`, {
        method: "POST",
        body: { member_code: memberCode },
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/registrations/${id}`, { method: "DELETE" }),
    searchMembers: (term: string) =>
      resource<MemberOption[]>(
        `${BASE}/registrations/members${query({ search: term })}`,
      ),
  },
  positions: {
    list: (params: ListParams = {}) =>
      resource<PositionResource[]>(`${BASE}/positions${query(params)}`),
    create: (payload: PositionPayload) =>
      resource<PositionResource>(`${BASE}/positions`, {
        method: "POST",
        body: payload,
      }),
    update: (id: number, payload: Partial<PositionPayload>) =>
      resource<PositionResource>(`${BASE}/positions/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/positions/${id}`, { method: "DELETE" }),
  },
  candidates: {
    create: (positionId: number, values: { name: string; photo?: File | null }) =>
      resource<CandidateResource>(`${BASE}/positions/${positionId}/candidates`, {
        method: "POST",
        body: toForm({ name: values.name, photo: values.photo ?? undefined }),
      }),
    // POST (not PATCH) because the request may carry a photo file.
    update: (
      id: number,
      values: { name?: string; photo?: File | null; removePhoto?: boolean },
    ) =>
      resource<CandidateResource>(`${BASE}/candidates/${id}`, {
        method: "POST",
        body: toForm({
          name: values.name,
          photo: values.photo ?? undefined,
          remove_photo: values.removePhoto ? "1" : undefined,
        }),
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/candidates/${id}`, { method: "DELETE" }),
  },
  amendments: {
    list: (params: ListParams = {}) =>
      resource<AmendmentResource[]>(`${BASE}/amendments${query(params)}`),
    create: (payload: AmendmentPayload) =>
      resource<AmendmentResource>(`${BASE}/amendments`, {
        method: "POST",
        body: payload,
      }),
    update: (id: number, payload: AmendmentPayload) =>
      resource<AmendmentResource>(`${BASE}/amendments/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/amendments/${id}`, { method: "DELETE" }),
  },
  voting: {
    ballot: () => resource<VotingBallot>(`${BASE}/voting/ballot`),
    members: (term: string) =>
      resource<MemberOption[]>(`${BASE}/voting/members${query({ search: term })}`),
    eligibility: (memberCode: string) =>
      resource<VoterEligibility>(`${BASE}/voting/eligibility`, {
        method: "POST",
        body: { member_code: memberCode },
      }),
    cast: (payload: CastBallotPayload) =>
      apiClient<{ message: string }>(`${BASE}/voting/cast`, {
        method: "POST",
        body: payload,
      }),
  },
  results: {
    get: (params: ListParams = {}) =>
      resource<ElectionResults>(`${BASE}/results${query(params)}`),
  },
  tokens: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<TokenResource>>(
        `${BASE}/tokens${query(params)}`,
      ),
    lookup: (memberCode: string) =>
      resource<TokenLookup>(
        `${BASE}/tokens/lookup/${encodeURIComponent(memberCode)}`,
      ),
    create: (memberCode: string) =>
      resource<TokenResource>(`${BASE}/tokens`, {
        method: "POST",
        body: { member_code: memberCode },
      }),
    remove: (id: number) =>
      apiClient<void>(`${BASE}/tokens/${id}`, { method: "DELETE" }),
  },
  settings: {
    get: () => resource<ElectionSettingsResource>(`${BASE}/settings`),
    update: (payload: ElectionSettingsPayload) =>
      resource<ElectionSettingsResource>(`${BASE}/settings`, {
        method: "PUT",
        body: payload,
      }),
  },
  exports: {
    url: (report: "members" | "attendance" | "tokens", params: ListParams = {}) =>
      `${BASE}/exports/${report}${query(params)}`,
  },
};
