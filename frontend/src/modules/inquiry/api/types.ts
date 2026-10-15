export type ResourceResponse<T> = { data: T };

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
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: PaginationMeta;
};

export type ListParams = Record<string, string | number | boolean | null | undefined>;

/** Money arrives as a decimal string such as "1000.00". */
export type Money = string;

export type StatementType = "balances" | "transactions" | "loans";

export type BalanceResource = {
  id: number;
  member_code: string;
  member_name: string;
  share_capital: Money;
  savings_bonus: Money;
  regular_savings: Money;
  time_deposit: Money;
  dividend_to_share_capital: Money;
  dividend_to_savings: Money;
  as_of_date: string | null;
  /** Status in the Members list, or null when the code is not in Members. */
  member_status: string | null;
};

export type TransactionResource = {
  id: number;
  member_code: string;
  member_name: string | null;
  account_type: string;
  mode: "D" | "W";
  amount: Money;
  running_balance: Money;
  transacted_on: string;
};

export type LoanResource = {
  id: number;
  member_code: string;
  member_name: string | null;
  loan_code: string;
  loan_number: string;
  loan_type: string;
  principal: Money;
  interest: Money;
  principal_paid: Money;
  interest_paid: Money;
  principal_balance: Money;
  interest_balance: Money;
  released_on: string | null;
  start_on: string | null;
  maturity_on: string | null;
};

export type ImportRowError = { row: number; message: string };

export type ImportResult = {
  type: StatementType;
  total: number;
  importable: number;
  existing: number;
  errors: ImportRowError[];
  warnings: string[];
  as_of_date: string | null;
  committed: boolean;
  fatal: string | null;
};

export type LastImport = {
  file_name: string;
  row_count: number;
  as_of_date: string | null;
  imported_by: string | null;
  imported_at: string | null;
} | null;

export type InquirySummary = {
  balances: { members: number; share_capital: Money; savings: Money; as_of_date: string | null };
  transactions: { count: number; latest_date: string | null };
  loans: { count: number; borrowers: number; principal_balance: Money; interest_balance: Money };
  last_imports: Record<StatementType, LastImport>;
};

export type AnnouncementResource = {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type MemberStatement = {
  member: Omit<BalanceResource, "id" | "member_status">;
  /** False when the member is in the Members list but no balance file has been imported for them yet. */
  has_statement: boolean;
  loans: Omit<LoanResource, "id" | "member_code" | "member_name">[];
  transactions: Omit<TransactionResource, "member_code" | "member_name">[];
  idle_seconds: number;
  contact_note: string;
};
