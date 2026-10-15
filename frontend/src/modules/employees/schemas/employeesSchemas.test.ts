import { describe, expect, it } from "vitest";

import { employeeSchema, payrollSchema } from "./employeesSchemas";

describe("employeesSchemas", () => {
  it("validates backend-shaped employee form values", () => {
    const result = employeeSchema.parse({
      employeeNo: "",
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com",
      phone: "",
      position: "PRODUCTION STAFF",
      employmentType: "Regular",
      hireDate: "2026-06-01",
      baseSalary: "505",
      hourlyRate: "82",
      notes: "",
    });

    expect(result.position).toBe("PRODUCTION STAFF");
    expect(result.baseSalary).toBe(505);
    expect(result.hourlyRate).toBe(82);
  });

  it("keeps payroll form limited to period, optional employees, and notes", () => {
    const result = payrollSchema.parse({
      periodStart: "2026-06-01",
      periodEnd: "2026-06-15",
      employeeIds: ["employee-uuid"],
      notes: "First half payroll",
    });

    expect(result).toEqual({
      periodStart: "2026-06-01",
      periodEnd: "2026-06-15",
      employeeIds: ["employee-uuid"],
      notes: "First half payroll",
    });
    expect(result).not.toHaveProperty("grossPay");
    expect(result).not.toHaveProperty("netPay");
  });

  it("rejects inverted payroll periods", () => {
    expect(() =>
      payrollSchema.parse({
        periodStart: "2026-06-15",
        periodEnd: "2026-06-01",
        employeeIds: [],
        notes: "",
      }),
    ).toThrow("Period end must be on or after period start.");
  });
});
