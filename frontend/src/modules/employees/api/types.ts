import type { ThemeColor } from "@core/types";

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
  path?: string;
  per_page: number;
  to: number | null;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

export type ListParams = Record<string, string | number | boolean | undefined>;

export type EmployeeStatus = "Active" | "Inactive" | "Deactivated";
export type EmployeePayrollStatus = "Eligible" | "Excluded" | "On Hold";
export type EmploymentType =
  | "Regular"
  | "Probationary"
  | "Contractual"
  | "Project-Based"
  | "Part-time";

export type CatalogOption = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  employeesCount: number;
  activeEmployeesCount: number;
  historicalProfilesCount: number;
  isSystem: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  workspaceRole: string | null;
  workspaceLabel: string | null;
  workspaceModule: string | null;
  workspaceHomePath: string | null;
};
export type PaySchemeOption = CatalogOption & { rateUnit: string };
export type PieceRateCardResource = {
  id: string;
  garmentType: string;
  operation: string;
  amount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
};
export type CompensationConfiguration = {
  jobPositions: CatalogOption[];
  employmentTypes: CatalogOption[];
  paySchemes: PaySchemeOption[];
  pieceRateCards: PieceRateCardResource[];
  workspaceOptions: WorkspaceOption[];
};
export type WorkspaceOption = {
  role: string;
  label: string;
  description: string;
  module: string;
  homePath: string;
};
export type CatalogPayload = {
  name: string;
  code?: string;
  is_active?: boolean;
  workspace_role?: string | null;
};
export type AttendanceApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";
export type AdvanceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Paid"
  | "Cancelled";
export type OvertimeStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
export type PayrollStatus =
  | "Draft"
  | "Prepared"
  | "Approved"
  | "Released"
  | "Voided";
export type PayrollRunType = "employee" | "tailor";
export type TailorPayrollFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";
export type EmployeeApprovalStatus =
  | AttendanceApprovalStatus
  | AdvanceStatus
  | OvertimeStatus
  | PayrollStatus;

export type EmployeeResource = {
  id: string;
  employeeNo: string;
  userId: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  branches: BranchSummary[];
  position: string | null;
  jobPositionId: string | null;
  jobPosition: string | null;
  workspace: {
    role: string;
    label: string;
    module: string;
    homePath: string;
  } | null;
  employmentType: EmploymentType | null;
  employmentTypeId: string | null;
  paySchemeId: string | null;
  payScheme: string | null;
  paySchemeCode: string | null;
  currentRate: number;
  currentRateUnit: string | null;
  linkedAccount: {
    id: number;
    name: string;
    email: string;
    status: string;
  } | null;
  hireDate: string | null;
  baseSalary: number;
  hourlyRate: number;
  tailorCompletedPieces: number;
  tailorApprovedPieces: number;
  tailorPendingPieces: number;
  tailorUnpaidAmount: number;
  status: EmployeeStatus;
  payrollStatus: EmployeePayrollStatus;
  attendanceTrackingEnabled: boolean;
  payrollExclusionReason: string | null;
  payrollStatusChangedAt: string | null;
  deactivatedAt: string | null;
  archivedAt: string | null;
  isArchived: boolean;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AttendanceEmployeeOption = {
  id: string;
  employeeNo: string;
  fullName: string;
  payScheme: string | null;
};

export type TailorPieceRateResource = {
  id: string;
  pieceType: string;
  rate: number;
  isActive: boolean;
  updatedAt: string | null;
};

export type EmployeeTypeRateResource = {
  id: string;
  jobPositionId: string;
  jobPosition: string;
  employeeType: string;
  employmentTypeId: string;
  employmentType: EmploymentType;
  paySchemeId: string;
  payScheme: string | null;
  paySchemeCode: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  baseRate: number;
  overtimeRate: number;
  allowanceAmount: number;
  allowanceBasis: "none" | "per_day" | "per_period";
  lateAllowanceEnabled: boolean;
  lateAllowanceThreshold: number;
  sssAmount: number | null;
  sssEmployeeAmount: number | null;
  philhealthAmount: number | null;
  philhealthEmployeeAmount: number | null;
  pagibigAmount: number | null;
  pagibigEmployeeAmount: number | null;
  isActive: boolean;
  matchedEmployeesCount: number;
  activeEmployeesCount: number;
  canDelete: boolean;
  canDeactivate: boolean;
  updatedAt: string | null;
};

export type EmployeeTypeRatePayload = {
  job_position_id: string;
  employment_type_id: string;
  pay_scheme_id: string;
  effective_from: string;
  effective_to?: string | null;
  base_rate: number;
  overtime_rate: number;
  allowance_amount?: number;
  allowance_basis?: "none" | "per_day" | "per_period";
  late_allowance_enabled?: boolean;
  late_allowance_threshold?: number;
  sss_amount?: number | null;
  sss_employee_amount?: number | null;
  philhealth_amount?: number | null;
  philhealth_employee_amount?: number | null;
  pagibig_amount?: number | null;
  pagibig_employee_amount?: number | null;
  is_active?: boolean;
};

export type TailorPieceRatePayload = {
  rate: number;
  is_active?: boolean;
};

export type EmployeesOverview = {
  totalEmployees: number;
  activeEmployees: number;
  attendanceExceptions: number;
  pendingAttendanceApprovals: number;
  pendingAdvances: number;
  pendingOvertimes: number;
  openPayrollRuns: number;
  payrollNetTotal: number;
  employeesByStatus: Record<EmployeeStatus, number>;
  payrollByStatus: Record<PayrollStatus, number>;
};

export type EmployeesStat = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  color: ThemeColor;
};

export type EmployeePayload = {
  employee_no?: string | null;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  branch_ids?: string[];
  position?: string | null;
  job_position_id?: string | null;
  employment_type?: EmploymentType;
  employment_type_id?: string | null;
  pay_scheme_id?: string | null;
  rate_effective_from?: string;
  hire_date?: string | null;
  base_salary?: number;
  hourly_rate?: number;
  payroll_status?: EmployeePayrollStatus;
  attendance_tracking_enabled?: boolean;
  payroll_exclusion_reason?: string | null;
  notes?: string | null;
};

export type BranchSummary = {
  id: string;
  code: string;
  name: string;
};

export type BranchEmployeeResource = {
  id: string;
  employeeNo: string;
  fullName: string;
  jobPosition: string | null;
  workspaceRole: string | null;
  accessRoles: string[];
  status: EmployeeStatus;
};

export type BranchResource = BranchSummary & {
  isActive: boolean;
  employeesCount: number;
  employees?: BranchEmployeeResource[];
};

export type BranchPayload = {
  name: string;
  is_active?: boolean;
};

export type EmployeeUserOption = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  accountType: "Employee" | "System" | "Partner";
  importable: boolean;
  unavailableReason: string | null;
};

export type EmployeeStatusPayload = {
  status: EmployeeStatus;
  notes?: string | null;
};
export type RestoreEmployeePayload = Partial<EmployeePayload> & {
  rehire?: boolean;
};

export type AttendanceApprovalResource = {
  id: string;
  employeeId: string;
  attendanceDayId?: string | null;
  employee?: EmployeeResource | null;
  employeeName?: string;
  attendanceDate: string;
  type: string | null;
  timeIn: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  timeOut: string | null;
  reason: string | null;
  status: AttendanceApprovalStatus;
  resolutionNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AttendanceApprovalPayload = {
  employee_id: string;
  attendance_day_id?: string | null;
  attendance_date: string;
  type?: string;
  time_in?: string | null;
  lunch_out?: string | null;
  lunch_in?: string | null;
  time_out?: string | null;
  reason?: string | null;
};

export type AttendanceApprovalUpdatePayload = Partial<
  Omit<AttendanceApprovalPayload, "employee_id">
>;

export type AttendanceApprovalStatusPayload = {
  status: Exclude<AttendanceApprovalStatus, "Pending">;
  resolution_notes?: string | null;
};

export type AttendanceCorrectionPayload = {
  time_in: string;
  lunch_out: string;
  lunch_in: string;
  time_out: string;
  reason?: string | null;
};

export type AdvanceResource = {
  id: string;
  employeeId: string;
  employee?: EmployeeResource | null;
  employeeName?: string;
  amount: number;
  approvedAmount: number | null;
  requestedAt: string | null;
  paymentDate: string | null;
  reason: string | null;
  status: AdvanceStatus;
  resolutionNotes: string | null;
  approvedBy?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdvancePayload = {
  employee_id: string;
  amount: number;
  requested_at?: string;
  payment_date?: string | null;
  reason?: string | null;
};

export type AdvanceUpdatePayload = Partial<Pick<AdvancePayload, "reason">>;

export type AdvanceStatusPayload = {
  status: Exclude<AdvanceStatus, "Pending">;
  approved_amount?: number | null;
  resolution_notes?: string | null;
  payment_date?: string | null;
};

export type OvertimeResource = {
  id: string;
  employeeId: string;
  employee?: EmployeeResource | null;
  employeeName?: string;
  attendanceDayId: string | null;
  source: "Manual" | "Attendance Candidate" | string;
  isAttendanceCandidate: boolean;
  workDate: string;
  hours: number;
  ratePerHour: number | null;
  amount: number;
  reason: string | null;
  status: OvertimeStatus;
  resolutionNotes: string | null;
  approvedBy?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OvertimeEmployeeOption = {
  id: string;
  employeeNo: string;
  fullName: string;
};

export type OvertimePayload = {
  employee_id: string;
  work_date: string;
  hours: number;
  rate_per_hour?: number | null;
  reason?: string | null;
};

export type OvertimeUpdatePayload = Partial<
  Omit<OvertimePayload, "employee_id">
>;

export type OvertimeStatusPayload = {
  status: Exclude<OvertimeStatus, "Pending">;
  resolution_notes?: string | null;
};

export type OvertimeBatchStatusPayload = {
  ids: string[];
  status: "Approved" | "Rejected";
  resolution_notes?: string | null;
};

export type PayrollItemResource = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  payslipNo: string | null;
  employee?: EmployeeResource | null;
  basicPay: number;
  lateMinutes: number;
  undertimeMinutes: number;
  attendancePenaltyRate: number;
  attendancePenalty: number;
  allowance: number;
  allowanceSuppressed: boolean;
  allowanceLateCount: number;
  allowanceLateThreshold: number | null;
  allowanceSuppressionReason: string | null;
  productionIncentive: number;
  bonus: number;
  grossPay: number;
  overtimePay: number;
  holidayPay: number;
  advanceDeduction: number;
  sssEmployee: number;
  philhealthEmployee: number;
  pagibigEmployee: number;
  withholdingTax: number;
  companyLoan: number;
  otherDeductions: number;
  sssEmployer: number;
  philhealthEmployer: number;
  pagibigEmployer: number;
  netPay: number;
  paymentMethod: string | null;
  bankName: string | null;
  accountLastFour: string | null;
  paymentDate: string | null;
  paymentStatus: "Pending" | "Paid";
  attendanceLines?: PayrollAttendanceLineResource[];
};

export type PayrollAttendanceLineResource = {
  id: string;
  attendanceDayId: string;
  workDate: string;
  timeIn: string | null;
  timeOut: string | null;
  payableMinutes: number;
  regularMinutes: number;
  overtimeCandidateMinutes: number;
  payableDays: number;
  effectiveRate: number;
  rateUnit: string;
  amount: number;
  status: string | null;
};

export type AttendanceDayResource = {
  id: string;
  employeeId: string;
  employee?: Pick<
    EmployeeResource,
    | "id"
    | "employeeNo"
    | "fullName"
    | "department"
    | "payScheme"
    | "paySchemeCode"
  > | null;
  workDate: string;
  firstTimeIn: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  lastTimeOut: string | null;
  grossMinutes: number;
  breakMinutes: number;
  payableMinutes: number;
  regularMinutes: number;
  overtimeCandidateMinutes: number;
  lateMinutes: number;
  undertimeMinutes: number;
  source: string;
  calculationStatus: "Complete" | "Needs Review";
  approvalStatus: "Pending" | "Approved" | "Rejected" | "Voided";
  payrollStatus: "Available" | "Reserved" | "Included in Payroll";
  anomalyFlags: string[];
  approvedAt: string | null;
  schedule?: AttendanceScheduleResource | null;
  segments?: Array<{
    id: string;
    timeIn: string | null;
    timeOut: string | null;
    grossMinutes: number;
    status: string;
    anomalyFlags: string[];
  }>;
};

export type AttendanceScheduleResource = {
  id: string;
  name: string;
  shiftStart: string;
  shiftEnd: string;
  lunchStart: string;
  lunchEnd: string;
  overtimeStartTime: string;
  overtimeMinimumRegularMinutes: number;
  gracePeriodMinutes: number;
  timezone: "Asia/Manila";
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type AttendanceSchedulePayload = {
  name: string;
  shift_start: string;
  shift_end: string;
  lunch_start: string;
  lunch_end: string;
  overtime_start_time: string;
  overtime_minimum_regular_minutes: number;
  grace_period_minutes: number;
  effective_from: string;
};

export type AttendanceImportRowResource = {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  externalUserId: string;
  externalEmployeeName: string;
  workDate: string | null;
  timeIn: string | null;
  timeOut: string | null;
  workTime: string | null;
  dailyTotal: string | null;
  sourceRowNumber: number;
  status: string;
  errorMessage: string | null;
};

export type AttendanceImportBatchResource = {
  id: string;
  originalFilename: string;
  checksum: string;
  deviceId: string;
  deviceName: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
  unmatchedRows: number;
  uploadedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  rows?: AttendanceImportRowResource[];
};

export type BiometricDeviceResource = {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  timezone: string;
  parserKey: string;
  status: string;
  lastImportedAt: string | null;
};
export type BiometricIdentityResource = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  deviceId: string;
  deviceName: string | null;
  externalUserId: string;
  externalDisplayName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: string;
};
export type AttendanceImportPreviewRow = {
  source_row_number: number;
  day: string;
  work_date: string;
  time_in: string | null;
  time_out: string | null;
  work_time: string | null;
  daily_total: string | null;
  note: string | null;
  status: string;
  gross_minutes: number;
  anomaly_flags: string[];
  error_message: string | null;
};
export type AttendanceImportPreviewMapping = {
  matched: boolean;
  method: string;
  employee: { id: string; employeeNo: string; fullName: string } | null;
  suggested: boolean;
};
export type AttendanceImportPreviewTotals = {
  total: number;
  valid: number;
  needs_review: number;
  no_punch: number;
  unmatched: number;
};
export type AttendanceImportPreviewEmployee = {
  external_user_id: string;
  external_employee_name: string;
  mapping: AttendanceImportPreviewMapping;
  rows: AttendanceImportPreviewRow[];
  totals: AttendanceImportPreviewTotals;
};
export type AttendanceImportPreview = {
  checksum: string;
  duplicate_file: boolean;
  period_start: string;
  period_end: string;
  employees: AttendanceImportPreviewEmployee[];
  totals: AttendanceImportPreviewTotals & { employees: number };
};

export type PayrollResource = {
  id: string;
  payrollNo: string;
  payrollType: PayrollRunType;
  periodStart: string;
  periodEnd: string;
  cutoffType:
    | "first_half"
    | "second_half"
    | "whole_month"
    | TailorPayrollFrequency
    | null;
  payrollFrequency: "standard" | TailorPayrollFrequency;
  contributionCutoff: "first" | "second" | "none" | null;
  status: PayrollStatus;
  grossTotal: number;
  overtimeTotal: number;
  advanceTotal: number;
  deductionTotal: number;
  netTotal: number;
  preparedById: number | null;
  approvedById: number | null;
  releasedById: number | null;
  preparedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  notes: string | null;
  items?: PayrollItemResource[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type PayrollPayload = {
  period_start: string;
  period_end: string;
  payroll_type?: PayrollRunType;
  cutoff_type?:
    | "first_half"
    | "second_half"
    | "whole_month"
    | TailorPayrollFrequency;
  payroll_frequency?: TailorPayrollFrequency;
  contribution_cutoff?: "first" | "second" | "none" | null;
  employee_ids?: string[];
  as_draft?: boolean;
  notes?: string | null;
};

export type PayrollItemUpdatePayload = {
  id: string;
  basic_pay?: number;
  attendance_penalty?: number;
  allowance?: number;
  production_incentive?: number;
  bonus?: number;
  overtime_pay?: number;
  holiday_pay?: number;
  advance_deduction?: number;
  sss_employee?: number;
  philhealth_employee?: number;
  pagibig_employee?: number;
  withholding_tax?: number;
  company_loan?: number;
  other_deductions?: number;
  sss_employer?: number;
  philhealth_employer?: number;
  pagibig_employer?: number;
  payment_method?: string | null;
  bank_name?: string | null;
  account_last_four?: string | null;
  payment_date?: string | null;
};

export type PayrollUpdatePayload = Partial<PayrollPayload> & {
  items?: PayrollItemUpdatePayload[];
};

export type PayslipResource = {
  employee: {
    id: string;
    employeeNo: string | null;
    name: string;
    position: string | null;
    department: string | null;
    employmentType: string | null;
    payType: string | null;
    isPieceRate: boolean;
  };
  payroll: {
    runId: string;
    payrollNo: string | null;
    payslipNo: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    payDate: string | null;
    status: string;
    releasedAt: string | null;
  };
  earnings: {
    basicPay: number;
    lateMinutes: number;
    undertimeMinutes: number;
    attendancePenaltyRate: number;
    attendancePenalty: number;
    allowance: number;
    allowanceSuppressed: boolean;
    allowanceLateCount: number;
    allowanceLateThreshold: number | null;
    allowanceSuppressionReason: string | null;
    productionIncentive: number;
    bonus: number;
    overtimePay: number;
    holidayPay: number;
    grossPay: number;
    lines: Array<{
      type: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  };
  deductions: {
    sssEmployee: number;
    philhealthEmployee: number;
    pagibigEmployee: number;
    withholdingTax: number;
    advanceDeduction: number;
    companyLoan: number;
    otherDeductions: number;
  };
  employerContributions: {
    sssEmployer: number;
    philhealthEmployer: number;
    pagibigEmployer: number;
  };
  payment: {
    method: string | null;
    bankName: string | null;
    accountLastFour: string | null;
    date: string | null;
    status: string;
  };
  netPay: number;
  tailorPieces: Array<{ pieceType: string; pieces: number; amount: number }>;
  posting: {
    journalEntryId: string | null;
    journalEntryNo: string | null;
    journalStatus: string | null;
    accountingEventStatus: string | null;
    postedAt: string | null;
  };
};

export type PayrollStatusPayload = {
  status: Exclude<PayrollStatus, "Draft">;
  notes?: string | null;
};
