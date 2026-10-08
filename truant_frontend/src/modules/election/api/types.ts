// Shared API envelope types (same shape as accounting: Laravel resources / pagination).
export type ResourceResponse<T> = { data: T };

export type PaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

export type ListParams = Record<
  string,
  string | number | boolean | null | undefined | Array<string | number>
>;

export type AssemblyStatus = "draft" | "registration" | "voting" | "closed";
export type AmendmentChoice = "agree" | "disagree";

export type AssemblyResource = {
  id: number;
  year: number;
  name: string;
  status: AssemblyStatus;
  registrations_count?: number;
  created_at: string;
  updated_at: string;
};
export type AssemblyPayload = { year: number; name: string };

export type MemberResource = {
  id: number;
  member_code: string;
  name: string;
  birth_date: string | null;
  address: string | null;
  is_delinquent: boolean;
  created_at: string;
  updated_at: string;
};
export type MemberPayload = {
  member_code: string;
  name: string;
  birth_date: string | null;
  address: string | null;
  is_delinquent: boolean;
};
export type MemberImportSummary = {
  created: number;
  updated: number;
  skipped: number;
};

export type RegistrationResource = {
  id: number;
  assembly_id: number;
  member_id: number;
  registered_at: string;
  election_voted_at: string | null;
  amendments_voted_at: string | null;
  member?: MemberResource;
};
export type RegistrationLookup = {
  member: MemberResource;
  registered: boolean;
};

export type CandidateResource = {
  id: number;
  position_id: number;
  name: string;
  photo_url: string | null;
  sort_order: number;
};
export type PositionResource = {
  id: number;
  assembly_id: number;
  title: string;
  seats: number;
  sort_order: number;
  candidates?: CandidateResource[];
};
export type PositionPayload = { title: string; seats: number };

export type AmendmentResource = {
  id: number;
  assembly_id: number;
  title: string;
  proposed_by: string | null;
  original_content: string;
  proposed_content: string;
  effect: string | null;
};
export type AmendmentPayload = {
  title: string;
  proposed_by: string | null;
  original_content: string;
  proposed_content: string;
  effect: string | null;
};

export type TokenResource = {
  id: number;
  assembly_id: number;
  member_id: number;
  issued_at: string;
  member?: MemberResource;
};

export type ElectionSettingsResource = {
  id: number;
  company_title: string | null;
  document_title: string | null;
  document_sub_title: string | null;
  registration_auto_search: boolean;
  registration_show_member_info: boolean;
  vote_auto_search: boolean;
  vote_show_member_info: boolean;
};
export type ElectionSettingsPayload = {
  company_title: string | null;
  document_title: string | null;
  document_sub_title: string | null;
  registration_auto_search: boolean;
  registration_show_member_info: boolean;
  vote_auto_search: boolean;
  vote_show_member_info: boolean;
};

export type MemberOption = { member_code: string; name: string };
export type TokenLookup = {
  member: MemberResource;
  registered: boolean;
  already_received: boolean;
};

export type VotingBallot = {
  assembly: { id: number; year: number; name: string };
  positions: PositionResource[];
  amendments: AmendmentResource[];
};
export type VoterEligibility = {
  member_code: string;
  name: string;
  sections: { election: boolean; amendments: boolean };
};
export type CastBallotPayload = {
  member_code: string;
  votes?: Array<{ position_id: number; candidate_ids: number[] }> | null;
  amendments?: Array<{ amendment_id: number; choice: AmendmentChoice }> | null;
};

export type ResultCandidate = {
  id: number;
  name: string;
  photo_url: string | null;
  votes: number;
  elected: boolean;
};
export type ResultPosition = {
  id: number;
  title: string;
  seats: number;
  total_votes: number;
  tie_for_last_seat: boolean;
  candidates: ResultCandidate[];
};
export type ResultAmendment = {
  id: number;
  title: string;
  proposed_by: string | null;
  agree: number;
  disagree: number;
  abstained: number;
  passed: boolean;
};
export type ElectionResults = {
  assembly: { id: number; year: number; name: string; status: AssemblyStatus };
  turnout: {
    registered: number;
    election_voters: number;
    amendment_voters: number;
  };
  positions: ResultPosition[];
  amendments: ResultAmendment[];
};
