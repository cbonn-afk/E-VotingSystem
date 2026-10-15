import { z } from "zod";

const optionalString = (max = 1000) =>
  z.preprocess(
    (value) => (value === null ? "" : value),
    z.string().trim().max(max).optional(),
  );

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0, "Amount cannot be negative.").optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().optional(),
);

export const employeeSchema = z
  .object({
    employeeNo: optionalString(50),
    userId: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
    firstName: z.string().trim().min(1, "First name is required.").max(120),
    lastName: z.string().trim().min(1, "Last name is required.").max(120),
    email: z.preprocess(
      (value) => (value === null ? "" : value),
      z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Enter a valid email address.")
        .max(255),
    ),
    phone: optionalString(50),
    branchIds: z.array(z.string().uuid()).max(20).default([]),
    position: z.string().trim().min(1, "Employee type is required.").max(120),
    employmentTypeId: z.string().uuid().optional(),
    paySchemeId: z.string().uuid().optional(),
    employmentType: z.enum([
      "Regular",
      "Probationary",
      "Contractual",
      "Project-Based",
      "Part-time",
    ]),
    hireDate: optionalDate,
    baseSalary: optionalMoney,
    hourlyRate: optionalMoney,
    payrollStatus: z
      .enum(["Eligible", "Excluded", "On Hold"])
      .default("Eligible"),
    attendanceTrackingEnabled: z.boolean().default(true),
    payrollExclusionReason: optionalString(2000),
    notes: optionalString(2000),
  })
  .superRefine((values, context) => {
    if (
      values.payrollStatus !== "Eligible" &&
      !values.payrollExclusionReason?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["payrollExclusionReason"],
        message:
          "Explain why this employee is not currently included in payroll.",
      });
    }
  });

export const attendanceApprovalSchema = z.object({
  employeeId: z.string().trim().min(1, "Select an employee."),
  attendanceDate: z.string().min(1, "Attendance date is required."),
  type: optionalString(120),
  timeIn: optionalString(5),
  timeOut: optionalString(5),
  reason: optionalString(1000),
});

export const advanceSchema = z.object({
  employeeId: z.string().trim().min(1, "Select an employee."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  requestedAt: optionalDate,
  paymentDate: optionalDate,
  reason: optionalString(1000),
});

export const overtimeSchema = z.object({
  employeeId: z.string().trim().min(1, "Select an employee."),
  workDate: z.string().min(1, "Work date is required."),
  hours: z.coerce
    .number()
    .positive("Hours must be greater than zero.")
    .max(24, "Hours cannot exceed 24."),
  ratePerHour: optionalMoney,
});

export const payrollSchema = z
  .object({
    periodStart: z.string().min(1, "Period start is required."),
    periodEnd: z.string().min(1, "Period end is required."),
    employeeIds: z.array(z.string()).optional(),
    notes: optionalString(2000),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    path: ["periodEnd"],
    message: "Period end must be on or after period start.",
  });

export type EmployeeFormInput = z.input<typeof employeeSchema>;
export type EmployeeFormValues = z.infer<typeof employeeSchema>;
export type AttendanceApprovalFormInput = z.input<
  typeof attendanceApprovalSchema
>;
export type AttendanceApprovalFormValues = z.infer<
  typeof attendanceApprovalSchema
>;
export type AdvanceFormInput = z.input<typeof advanceSchema>;
export type AdvanceFormValues = z.infer<typeof advanceSchema>;
export type OvertimeFormInput = z.input<typeof overtimeSchema>;
export type OvertimeFormValues = z.infer<typeof overtimeSchema>;
export type PayrollFormInput = z.input<typeof payrollSchema>;
export type PayrollFormValues = z.infer<typeof payrollSchema>;
