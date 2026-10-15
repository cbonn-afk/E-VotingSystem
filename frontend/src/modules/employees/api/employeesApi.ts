import { apiClient } from "@/libs/api/apiClient";

import type {
  AdvancePayload,
  AdvanceResource,
  AdvanceStatusPayload,
  AdvanceUpdatePayload,
  AttendanceApprovalPayload,
  AttendanceApprovalResource,
  AttendanceApprovalStatusPayload,
  AttendanceApprovalUpdatePayload,
  AttendanceCorrectionPayload,
  AttendanceSchedulePayload,
  AttendanceScheduleResource,
  EmployeePayload,
  EmployeeResource,
  EmployeeStatusPayload,
  RestoreEmployeePayload,
  EmployeeTypeRatePayload,
  EmployeeTypeRateResource,
  EmployeesOverview,
  ListParams,
  OvertimePayload,
  OvertimeBatchStatusPayload,
  OvertimeEmployeeOption,
  OvertimeResource,
  OvertimeStatusPayload,
  OvertimeUpdatePayload,
  PaginatedResponse,
  PayrollPayload,
  PayrollResource,
  PayslipResource,
  PayrollStatusPayload,
  PayrollUpdatePayload,
  TailorPieceRatePayload,
  TailorPieceRateResource,
  ResourceResponse,
  CompensationConfiguration,
  CatalogOption,
  CatalogPayload,
  AttendanceDayResource,
  AttendanceImportBatchResource,
  AttendanceImportPreview,
  AttendanceEmployeeOption,
  BiometricDeviceResource,
  BiometricIdentityResource,
  EmployeeUserOption,
  BranchResource,
  BranchPayload,
} from "./types";

const BASE = "/api/employees";

const query = (params: ListParams = {}): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const value = search.toString();

  return value ? `?${value}` : "";
};

const resource = <T>(path: string, init?: Parameters<typeof apiClient>[1]) =>
  apiClient<ResourceResponse<T>>(path, init);

const assertNonEmptyPatch = (payload: object) => {
  if (Object.keys(payload).length === 0) {
    throw new Error("At least one field must be changed before saving.");
  }
};

export const employeesApi = {
  overview: () => resource<EmployeesOverview>(`${BASE}/overview`),

  records: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<EmployeeResource>>(`${BASE}${query(params)}`),
    get: (id: string) => resource<EmployeeResource>(`${BASE}/${id}`),
    create: (payload: EmployeePayload) =>
      resource<EmployeeResource>(BASE, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<EmployeePayload>) => {
      assertNonEmptyPatch(payload);

      return resource<EmployeeResource>(`${BASE}/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    status: (id: string, payload: EmployeeStatusPayload) =>
      resource<EmployeeResource>(`${BASE}/${id}/status`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/${id}`, { method: "DELETE" }),
    restore: (id: string, payload: RestoreEmployeePayload) =>
      resource<EmployeeResource>(`${BASE}/${id}/restore`, {
        method: "PATCH",
        body: payload,
      }),
    userOptions: (includeUserId?: number | null) =>
      resource<EmployeeUserOption[]>(
        `${BASE}/user-options${includeUserId ? `?include_user_id=${includeUserId}` : ""}`,
      ),
  },

  branches: {
    list: () =>
      apiClient<ResourceResponse<BranchResource[]>>(`${BASE}/branches`),
    options: () =>
      apiClient<ResourceResponse<BranchResource[]>>(`${BASE}/branches/options`),
    create: (payload: BranchPayload) =>
      resource<BranchResource>(`${BASE}/branches`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: Partial<BranchPayload>) =>
      resource<BranchResource>(`${BASE}/branches/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/branches/${id}`, { method: "DELETE" }),
  },

  attendanceApprovals: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<AttendanceApprovalResource>>(
        `${BASE}/attendance-approvals${query(params)}`,
      ),
    get: (id: string) =>
      resource<AttendanceApprovalResource>(
        `${BASE}/attendance-approvals/${id}`,
      ),
    create: (payload: AttendanceApprovalPayload) =>
      resource<AttendanceApprovalResource>(`${BASE}/attendance-approvals`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: AttendanceApprovalUpdatePayload) => {
      assertNonEmptyPatch(payload);

      return resource<AttendanceApprovalResource>(
        `${BASE}/attendance-approvals/${id}`,
        {
          method: "PATCH",
          body: payload,
        },
      );
    },
    status: (id: string, payload: AttendanceApprovalStatusPayload) =>
      resource<AttendanceApprovalResource>(
        `${BASE}/attendance-approvals/${id}/status`,
        {
          method: "PATCH",
          body: payload,
        },
      ),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/attendance-approvals/${id}`, {
        method: "DELETE",
      }),
  },

  attendance: {
    days: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<AttendanceDayResource>>(
        `${BASE}/attendance/days${query(params)}`,
      ),
    updateDayStatus: (
      id: string,
      status: "Pending" | "Approved" | "Rejected" | "Voided",
    ) =>
      resource<AttendanceDayResource>(`${BASE}/attendance/days/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    correctDay: (id: string, payload: AttendanceCorrectionPayload) =>
      resource<AttendanceDayResource>(
        `${BASE}/attendance/days/${id}/correction`,
        { method: "PUT", body: payload },
      ),
    schedule: () =>
      resource<AttendanceScheduleResource>(`${BASE}/attendance/schedule`),
    updateSchedule: (payload: AttendanceSchedulePayload) =>
      resource<AttendanceScheduleResource>(`${BASE}/attendance/schedule`, {
        method: "PUT",
        body: payload,
      }),
    employeeOptions: () =>
      resource<AttendanceEmployeeOption[]>(
        "/api/employees/attendance/employee-options",
      ),
    imports: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<AttendanceImportBatchResource>>(
        `${BASE}/attendance/imports${query(params)}`,
      ),
    importBatch: (id: string) =>
      resource<AttendanceImportBatchResource>(
        `${BASE}/attendance/imports/${id}`,
      ),
    devices: () =>
      apiClient<ResourceResponse<BiometricDeviceResource[]>>(
        `${BASE}/attendance/devices`,
      ),
    mappings: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<BiometricIdentityResource>>(
        `${BASE}/attendance/mappings${query(params)}`,
      ),
    previewImport: (file: File, deviceId: string) => {
      const body = new FormData();
      body.append("file", file);
      body.append("device_id", deviceId);
      return resource<AttendanceImportPreview>(
        `${BASE}/attendance/imports/preview`,
        { method: "POST", body },
      );
    },
    confirmImport: (
      file: File,
      deviceId: string,
      preview: AttendanceImportPreview,
      assignments: Record<string, string> = {},
    ) => {
      const body = new FormData();
      body.append("file", file);
      body.append("device_id", deviceId);
      body.append("file_checksum", preview.checksum);
      const mappings = preview.employees
        .filter(
          (employee) =>
            !employee.mapping.matched && assignments[employee.external_user_id],
        )
        .map((employee) => ({
          external_user_id: employee.external_user_id,
          external_display_name: employee.external_employee_name,
          employee_id: assignments[employee.external_user_id],
        }));
      body.append("mappings", JSON.stringify(mappings));
      return resource<AttendanceImportBatchResource>(
        `${BASE}/attendance/imports/confirm`,
        { method: "POST", body },
      );
    },
  },

  advances: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<AdvanceResource>>(
        `${BASE}/advances${query(params)}`,
      ),
    get: (id: string) => resource<AdvanceResource>(`${BASE}/advances/${id}`),
    create: (payload: AdvancePayload) =>
      resource<AdvanceResource>(`${BASE}/advances`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: AdvanceUpdatePayload) => {
      assertNonEmptyPatch(payload);

      return resource<AdvanceResource>(`${BASE}/advances/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    status: (id: string, payload: AdvanceStatusPayload) =>
      resource<AdvanceResource>(`${BASE}/advances/${id}/status`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/advances/${id}`, { method: "DELETE" }),
  },

  overtimes: {
    employeeOptions: () =>
      resource<OvertimeEmployeeOption[]>(`${BASE}/overtimes/employee-options`),
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<OvertimeResource>>(
        `${BASE}/overtimes${query(params)}`,
      ),
    get: (id: string) => resource<OvertimeResource>(`${BASE}/overtimes/${id}`),
    create: (payload: OvertimePayload) =>
      resource<OvertimeResource>(`${BASE}/overtimes`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: OvertimeUpdatePayload) => {
      assertNonEmptyPatch(payload);

      return resource<OvertimeResource>(`${BASE}/overtimes/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    status: (id: string, payload: OvertimeStatusPayload) =>
      resource<OvertimeResource>(`${BASE}/overtimes/${id}/status`, {
        method: "PATCH",
        body: payload,
      }),
    batchStatus: (payload: OvertimeBatchStatusPayload) =>
      resource<OvertimeResource[]>(`${BASE}/overtimes/batch-status`, {
        method: "POST",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/overtimes/${id}`, { method: "DELETE" }),
  },

  payrolls: {
    list: (params: ListParams = {}) =>
      apiClient<PaginatedResponse<PayrollResource>>(
        `${BASE}/payrolls${query(params)}`,
      ),
    get: (id: string) => resource<PayrollResource>(`${BASE}/payrolls/${id}`),
    payslip: (payrollId: string, itemId: string) =>
      resource<PayslipResource>(
        `${BASE}/payrolls/${payrollId}/items/${itemId}/payslip`,
      ),
    create: (payload: PayrollPayload) =>
      resource<PayrollResource>(`${BASE}/payrolls`, {
        method: "POST",
        body: payload,
      }),
    update: (id: string, payload: PayrollUpdatePayload) => {
      assertNonEmptyPatch(payload);

      return resource<PayrollResource>(`${BASE}/payrolls/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    status: (id: string, payload: PayrollStatusPayload) =>
      resource<PayrollResource>(`${BASE}/payrolls/${id}/status`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      apiClient<void>(`${BASE}/payrolls/${id}`, { method: "DELETE" }),
  },

  rates: {
    configuration: () =>
      resource<CompensationConfiguration>(`${BASE}/rates/configuration`),
    createJobPosition: (payload: CatalogPayload) =>
      resource<CatalogOption>(`${BASE}/rates/job-positions`, {
        method: "POST",
        body: payload,
      }),
    updateJobPosition: (id: string, payload: CatalogPayload) =>
      resource<CatalogOption>(`${BASE}/rates/job-positions/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteJobPosition: (id: string) =>
      apiClient<void>(`${BASE}/rates/job-positions/${id}`, {
        method: "DELETE",
      }),
    createEmploymentType: (payload: CatalogPayload) =>
      resource<CatalogOption>(`${BASE}/rates/employment-types`, {
        method: "POST",
        body: payload,
      }),
    updateEmploymentType: (id: string, payload: CatalogPayload) =>
      resource<CatalogOption>(`${BASE}/rates/employment-types/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    deleteEmploymentType: (id: string) =>
      apiClient<void>(`${BASE}/rates/employment-types/${id}`, {
        method: "DELETE",
      }),
    employeeTypeRates: () =>
      apiClient<{ data: EmployeeTypeRateResource[] }>(
        `${BASE}/rates/employee-type-rates`,
      ),
    createEmployeeTypeRate: (payload: EmployeeTypeRatePayload) =>
      resource<EmployeeTypeRateResource>(`${BASE}/rates/employee-type-rates`, {
        method: "POST",
        body: payload,
      }),
    updateEmployeeTypeRate: (id: string, payload: EmployeeTypeRatePayload) =>
      resource<EmployeeTypeRateResource>(
        `${BASE}/rates/employee-type-rates/${id}`,
        {
          method: "PATCH",
          body: payload,
        },
      ),
    deleteEmployeeTypeRate: (id: string) =>
      apiClient<void>(`${BASE}/rates/employee-type-rates/${id}`, {
        method: "DELETE",
      }),
    tailorPieceRates: () =>
      apiClient<{ data: TailorPieceRateResource[] }>(
        `${BASE}/rates/tailor-piece-rates`,
      ),
    updateTailorPieceRate: (id: string, payload: TailorPieceRatePayload) =>
      resource<TailorPieceRateResource>(
        `${BASE}/rates/tailor-piece-rates/${id}`,
        {
          method: "PATCH",
          body: payload,
        },
      ),
  },
};
