export type PortalAccessMode = "network_only" | "online";

export type LoanSettings = {
  portal_access_mode: PortalAccessMode;
  allowed_networks: string[];
  session_idle_minutes: number;
  signature_required: boolean;
};

/** What the member portal knows about the signed-in member. */
export type PortalMember = {
  id: number;
  member_code: string;
  name: string;
  mobile_masked: string | null;
  is_delinquent: boolean;
};

export type InterestMethod = "diminishing" | "flat";
export type PaymentFrequency = "weekly" | "semi_monthly" | "monthly";
export type ProductStatus = "active" | "inactive";

export type ProductDocument = { name: string; is_required: boolean };

/** Money and percentages arrive as decimal strings (e.g. "5000.00") so no precision is lost. */
export type LoanProduct = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  min_amount: string;
  max_amount: string;
  interest_rate: string;
  interest_method: InterestMethod;
  term_min_months: number;
  term_max_months: number;
  payment_frequency: PaymentFrequency;
  processing_fee_percent: string;
  service_fee_percent: string;
  penalty_rate_percent: string;
  grace_period_days: number;
  requires_guarantor: boolean;
  guarantor_count: number;
  requires_collateral: boolean;
  min_membership_months: number;
  status: ProductStatus;
  documents: ProductDocument[];
};

export type LoanProductPayload = Omit<LoanProduct, "id">;

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "document_review"
  | "returned"
  | "for_evaluation"
  | "rejected"
  | "cancelled";

export type DocumentStatus = "pending" | "accepted" | "rejected";

export type ApplicationDocument = {
  id: number;
  requirement: string;
  original_name: string;
  size: number;
  status: DocumentStatus;
  remarks: string | null;
};

export type ApplicationEvent = {
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  actor_type: "member" | "staff";
  actor_name: string | null;
  remarks: string | null;
  created_at: string | null;
};

export type LoanApplication = {
  id: number;
  reference_no: string | null;
  status: ApplicationStatus;
  /** True while the member may still change it (draft or returned). */
  editable: boolean;
  amount: string;
  term_months: number;
  purpose: string;
  monthly_income: string | null;
  employer_business: string | null;
  collateral_description: string | null;
  collateral_value: string | null;
  has_signature: boolean;
  signed_at: string | null;
  submitted_at: string | null;
  status_remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  member?: { id: number; member_code: string; name: string };
  product?: LoanProduct;
  /** The product's terms as they were when the member submitted. */
  product_snapshot?: { interest_rate: string; interest_method: InterestMethod } & Record<string, unknown>;
  documents?: ApplicationDocument[];
  guarantors?: { member_code: string; name: string }[];
  events?: ApplicationEvent[];
};

export type ApplicationDetailsPayload = {
  amount: string;
  term_months: number;
  purpose: string;
  monthly_income: string | null;
  employer_business: string | null;
  collateral_description: string | null;
  collateral_value: string | null;
};
