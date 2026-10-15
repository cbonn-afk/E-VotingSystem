// Type Imports
import type { ThemeColor } from "@core/types";
import type { AuthorizationNavigationItem } from "@/modules/auth/authorization/types";

export type EmployeesNavigationItem = AuthorizationNavigationItem;

export type EmployeeStatus =
  | "Active"
  | "Inactive"
  | "Deactivated"
  | "On Leave"
  | "Probation";
export type EmploymentType =
  | "Regular"
  | "Probationary"
  | "Contractual"
  | "Part-time"
  | "Part Time";
export type TimeLogStatus =
  | "Complete"
  | "Pending Correction"
  | "Missing Time Out"
  | "Approved";
export type AttendanceStatus = "Complete" | "With Issues" | "For Review";
export type PayrollStatus =
  | "Draft"
  | "Prepared"
  | "For Review"
  | "Approved"
  | "Released"
  | "Paid"
  | "Voided"
  | "Cancelled";
export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Payroll Included"
  | "Rejected"
  | "Denied"
  | "For Review"
  | "Paid"
  | "Cancelled";
export type ApprovalType =
  | "Overtime"
  | "Advance"
  | "Attendance Correction"
  | "Payroll Run";

export type Employee = {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  contactNumber: string;
  email: string;
  status: EmployeeStatus;
  dateHired: string;
  baseRate?: number;
  overtimeRate?: number;
  allowancePerDay?: number;
  payrollStatus?: PayrollStatus;
  currentNetPay?: number;
};

export type AttendanceSummary = {
  id: string;
  employeeName: string;
  payPeriod: string;
  presentDays: number;
  absentDays: number;
  lateCount: number;
  undertimeHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
};

export type PayrollRun = {
  id: string;
  runNo: string;
  payPeriod: string;
  employeesIncluded: number;
  grossPay: number;
  overtimePay: number;
  advancesDeducted: number;
  otherDeductions: number;
  netPay: number;
  status: PayrollStatus;
};

export type PayrollDailyEntry = {
  id: string;
  employeeId: string;
  date: string;
  day: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  regularHours: number;
  overtimeHours: number;
  allowance: number;
  extraIncome: number;
  deduction: number;
  total: number;
  status: "Included" | "Needs Review" | "Approved";
};

export type PayrollBreakdown = {
  grossPay: number;
  sss: number;
  philHealth: number;
  pagIbig: number;
  otherDeductions: number;
  extraIncome: number;
  totalDeductions: number;
  netPay: number;
};

export type EmployeePayrollDetail = {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  baseRate: number;
  overtimeRate: number;
  payPeriod: string;
  regularHours: number;
  overtimeHours: number;
  totalAllowance: number;
  entries: PayrollDailyEntry[];
  breakdown: PayrollBreakdown;
};

export type OvertimeRequest = {
  id: string;
  employeeName: string;
  date: string;
  requestedHours: number;
  reason: string;
  status: ApprovalStatus;
  approvedBy: string;
};

export type CashAdvance = {
  id: string;
  employeeName: string;
  requestedAmount: number;
  reason: string;
  repaymentMethod: string;
  requestedDate: string;
  status: ApprovalStatus;
  approvedBy: string;
};

export type ApprovalItem = {
  id: string;
  type: ApprovalType;
  referenceNo: string;
  employeeName: string;
  requestDate: string;
  amountOrHours: string;
  status: ApprovalStatus;
  submittedBy: string;
};

export type EmployeesStat = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  color: ThemeColor;
};

export type EmployeeFormValues = Pick<
  Employee,
  | "employeeId"
  | "fullName"
  | "position"
  | "employmentType"
  | "contactNumber"
  | "email"
  | "status"
  | "dateHired"
>;
