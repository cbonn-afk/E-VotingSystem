export type PortalAccessMode = "network_only" | "online";

export type DiminishingMethod = "equal_installment" | "fixed_principal";
export type FeeHandling = "deduct_from_proceeds" | "collect_separately";
export type PaymentAllocation = "penalty_interest_principal" | "interest_penalty_principal";
export type PenaltyBasis = "installment" | "principal_balance";

export type LoanSettings = {
  portal_access_mode: PortalAccessMode;
  allowed_networks: string[];
  session_idle_minutes: number;
  signature_required: boolean;
  diminishing_method: DiminishingMethod;
  fee_handling: FeeHandling;
  payment_allocation: PaymentAllocation;
  penalty_basis: PenaltyBasis;
  agreement_terms: string;
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
  | "for_approval"
  | "approved"
  | "for_agreement"
  | "for_release"
  | "released"
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
  /** Set once the last required approver agrees; may be lower than the amount requested. */
  approved_amount: string | null;
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
  /** Staff-only fields below are never sent to the member portal. */
  can_evaluate?: boolean;
  can_generate_agreement?: boolean;
  can_release?: boolean;
  agreement?: LoanAgreement | null;
  loan?: LoanAccount | null;
  approval_chain?: ApprovalStep[];
  approval?: { next_step: ApprovalStep | null; can_decide: boolean; denial_reason: string | null };
  evaluation?: ApplicationEvaluation | null;
  approvals?: ApplicationApproval[];
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

export type Recommendation = "approve" | "approve_lower" | "reject";

export type ApplicationEvaluation = {
  evaluator_name: string;
  recommendation: Recommendation;
  recommended_amount: string | null;
  verified_income: string | null;
  existing_obligations: string | null;
  notes: string;
  created_at: string | null;
};

export type ApprovalStep = { sequence: number; name: string; role_id: number | null; role_name: string | null };

export type ApplicationApproval = {
  sequence: number;
  level_name: string;
  approver_name: string;
  decision: "approved" | "rejected";
  approved_amount: string | null;
  remarks: string | null;
  decided_at: string | null;
};

export type EvaluationPayload = {
  recommendation: Recommendation;
  recommended_amount: string | null;
  verified_income: string | null;
  existing_obligations: string | null;
  notes: string;
};

export type DecisionPayload = {
  decision: "approved" | "rejected";
  approved_amount: string | null;
  remarks: string | null;
};

export type ApprovalLevel = { sequence?: number; name: string; role_id: number | null; min_amount: string };
export type RoleOption = { id: number; name: string };

export type ScheduleItem = {
  number: number;
  due_date: string;
  principal: string;
  interest: string;
  total: string;
  balance_after: string;
};

export type LoanAgreement = {
  agreement_no: string | null;
  principal: string;
  interest_rate: string;
  interest_method: InterestMethod;
  diminishing_method: DiminishingMethod;
  payment_frequency: PaymentFrequency;
  term_months: number;
  installments_count: number;
  installment_amount: string;
  total_interest: string;
  processing_fee: string;
  service_fee: string;
  net_proceeds: string;
  fee_handling: FeeHandling;
  penalty_rate_percent: string;
  grace_period_days: number;
  first_due_date: string;
  maturity_date: string;
  schedule: ScheduleItem[];
  terms_text: string;
  generated_at: string | null;
  signed_at: string | null;
  signed_method: "portal" | "paper" | null;
  has_paper_copy: boolean;
  signature_required: boolean;
};

export type ReleaseMethod = "cash" | "check" | "bank_transfer" | "savings_credit";

export type LoanRelease = {
  receipt_no: string | null;
  method: ReleaseMethod;
  reference_no: string | null;
  amount_released: string;
  fees_total: string;
  fee_handling: FeeHandling;
  remarks: string | null;
  released_by_name: string;
  released_at: string | null;
};

export type LoanAccount = {
  loan_no: string | null;
  status: string;
  principal: string;
  total_interest: string;
  outstanding_balance: string;
  installments_count: number;
  first_due_date: string;
  maturity_date: string;
  released_at: string | null;
  release?: LoanRelease | null;
  schedule?: ScheduleItem[];
};

export type ReleasePayload = {
  method: ReleaseMethod;
  reference_no: string | null;
  remarks: string | null;
  fees_collected: boolean;
};

/** The agreement's figures for a first due date, before anything is saved. */
export type AgreementPreview = Omit<
  LoanAgreement,
  "agreement_no" | "generated_at" | "signed_at" | "signed_method" | "has_paper_copy" | "signature_required"
>;
