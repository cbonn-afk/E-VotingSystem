import { beforeEach, describe, expect, it, vi } from "vitest";

import { employeesApi } from "./employeesApi";

const { apiClient } = vi.hoisted(() => ({
  apiClient: vi.fn(),
}));

vi.mock("@/libs/api/apiClient", () => ({
  apiClient,
}));

describe("employeesApi", () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ data: [] });
  });

  it("builds employee list filters with Laravel pagination params", async () => {
    await employeesApi.records.list({
      page: 2,
      per_page: 25,
      search: "Maria",
      status: "Active",
      position: "PRODUCTION STAFF",
    });

    expect(apiClient).toHaveBeenCalledWith(
      "/api/employees?page=2&per_page=25&search=Maria&status=Active&position=PRODUCTION+STAFF",
    );
  });

  it("uses the verified employee record endpoints and payload shape", async () => {
    await employeesApi.records.create({
      employee_no: null,
      user_id: null,
      first_name: "Maria",
      last_name: "Santos",
      email: "maria@example.com",
      phone: null,
      department: null,
      branch_ids: ["branch-uuid"],
      position: "PRODUCTION STAFF",
      employment_type: "Regular",
      hire_date: "2026-06-01",
      base_salary: 505,
      hourly_rate: 82,
      notes: null,
    });
    await employeesApi.records.status("employee-uuid", {
      status: "Inactive",
      notes: "Seasonal offboarding",
    });

    expect(apiClient).toHaveBeenNthCalledWith(1, "/api/employees", {
      method: "POST",
      body: expect.objectContaining({
        first_name: "Maria",
        last_name: "Santos",
        position: "PRODUCTION STAFF",
        branch_ids: ["branch-uuid"],
        base_salary: 505,
        hourly_rate: 82,
      }),
    });
    expect(apiClient).toHaveBeenNthCalledWith(
      2,
      "/api/employees/employee-uuid/status",
      {
        method: "PATCH",
        body: {
          status: "Inactive",
          notes: "Seasonal offboarding",
        },
      },
    );
  });

  it("loads branch options and the branch employee directory", async () => {
    await employeesApi.branches.options();
    await employeesApi.branches.list();

    expect(apiClient).toHaveBeenNthCalledWith(
      1,
      "/api/employees/branches/options",
    );
    expect(apiClient).toHaveBeenNthCalledWith(2, "/api/employees/branches");
  });

  it("uses branch CRUD endpoints", async () => {
    await employeesApi.branches.create({ name: "Baguio" });
    await employeesApi.branches.update("branch-uuid", {
      name: "Baguio Central",
      is_active: true,
    });
    await employeesApi.branches.remove("branch-uuid");

    expect(apiClient).toHaveBeenNthCalledWith(1, "/api/employees/branches", {
      method: "POST",
      body: { name: "Baguio" },
    });
    expect(apiClient).toHaveBeenNthCalledWith(
      2,
      "/api/employees/branches/branch-uuid",
      {
        method: "PATCH",
        body: { name: "Baguio Central", is_active: true },
      },
    );
    expect(apiClient).toHaveBeenNthCalledWith(
      3,
      "/api/employees/branches/branch-uuid",
      { method: "DELETE" },
    );
  });

  it("targets attendance, advances, overtime, and payroll workflow endpoints", async () => {
    await employeesApi.attendanceApprovals.status("attendance-uuid", {
      status: "Approved",
      resolution_notes: null,
    });
    await employeesApi.advances.status("advance-uuid", {
      status: "Approved",
      approved_amount: 3000,
      resolution_notes: "Approved within the employee's repayment capacity.",
    });
    await employeesApi.overtimes.status("overtime-uuid", {
      status: "Rejected",
      resolution_notes: "Not pre-approved",
    });
    await employeesApi.payrolls.status("payroll-uuid", {
      status: "Released",
      notes: null,
    });

    expect(apiClient).toHaveBeenNthCalledWith(
      1,
      "/api/employees/attendance-approvals/attendance-uuid/status",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(apiClient).toHaveBeenNthCalledWith(
      2,
      "/api/employees/advances/advance-uuid/status",
      {
        method: "PATCH",
        body: {
          status: "Approved",
          approved_amount: 3000,
          resolution_notes:
            "Approved within the employee's repayment capacity.",
        },
      },
    );
    expect(apiClient).toHaveBeenNthCalledWith(
      3,
      "/api/employees/overtimes/overtime-uuid/status",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(apiClient).toHaveBeenNthCalledWith(
      4,
      "/api/employees/payrolls/payroll-uuid/status",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("posts a batch overtime status update", async () => {
    await employeesApi.overtimes.batchStatus({
      ids: ["overtime-1", "overtime-2"],
      status: "Approved",
    });

    expect(apiClient).toHaveBeenCalledWith(
      "/api/employees/overtimes/batch-status",
      {
        method: "POST",
        body: {
          ids: ["overtime-1", "overtime-2"],
          status: "Approved",
        },
      },
    );
  });

  it("does not send frontend payroll totals when creating payroll runs", async () => {
    await employeesApi.payrolls.create({
      period_start: "2026-06-01",
      period_end: "2026-06-15",
      employee_ids: ["employee-uuid"],
      notes: "First half payroll",
    });

    expect(apiClient).toHaveBeenCalledWith("/api/employees/payrolls", {
      method: "POST",
      body: {
        period_start: "2026-06-01",
        period_end: "2026-06-15",
        employee_ids: ["employee-uuid"],
        notes: "First half payroll",
      },
    });
    expect(apiClient.mock.calls[0][1].body).not.toHaveProperty("gross_total");
    expect(apiClient.mock.calls[0][1].body).not.toHaveProperty("net_total");
  });

  it("prevents empty patch requests", () => {
    expect(() => employeesApi.records.update("employee-uuid", {})).toThrow(
      "At least one field",
    );
    expect(() =>
      employeesApi.attendanceApprovals.update("attendance-uuid", {}),
    ).toThrow("At least one field");
    expect(() => employeesApi.advances.update("advance-uuid", {})).toThrow(
      "At least one field",
    );
    expect(() => employeesApi.overtimes.update("overtime-uuid", {})).toThrow(
      "At least one field",
    );
    expect(() => employeesApi.payrolls.update("payroll-uuid", {})).toThrow(
      "At least one field",
    );
  });

  it("uses multipart preview and confirmation without placing mappings in the URL", async () => {
    const file = new File(["workbook"], "timecard.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await employeesApi.attendance.previewImport(file, "device-uuid");

    const preview = {
      checksum: "a".repeat(64),
      duplicate_file: false,
      period_start: "2026-07-05",
      period_end: "2026-07-11",
      employees: [
        {
          external_user_id: "1",
          external_employee_name: "Joshua Timpac",
          mapping: {
            matched: false,
            method: "name_suggestion",
            employee: null,
            suggested: true,
          },
          rows: [],
          totals: {
            total: 0,
            valid: 0,
            needs_review: 0,
            no_punch: 0,
            unmatched: 0,
          },
        },
        {
          external_user_id: "2",
          external_employee_name: "Already Mapped",
          mapping: {
            matched: true,
            method: "device_user_id",
            employee: {
              id: "emp-2",
              employeeNo: "TRU-2",
              fullName: "Already Mapped",
            },
            suggested: false,
          },
          rows: [],
          totals: {
            total: 0,
            valid: 0,
            needs_review: 0,
            no_punch: 0,
            unmatched: 0,
          },
        },
      ],
      totals: {
        employees: 2,
        total: 0,
        valid: 0,
        needs_review: 0,
        no_punch: 0,
        unmatched: 0,
      },
    };
    await employeesApi.attendance.confirmImport(file, "device-uuid", preview, {
      "1": "employee-uuid",
    });

    expect(apiClient).toHaveBeenNthCalledWith(
      1,
      "/api/employees/attendance/imports/preview",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(apiClient).toHaveBeenNthCalledWith(
      2,
      "/api/employees/attendance/imports/confirm",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    const body = apiClient.mock.calls[1][1].body as FormData;
    expect(body.get("file_checksum")).toBe("a".repeat(64));
    expect(JSON.parse(String(body.get("mappings")))).toEqual([
      {
        external_user_id: "1",
        external_display_name: "Joshua Timpac",
        employee_id: "employee-uuid",
      },
    ]);
  });
});
