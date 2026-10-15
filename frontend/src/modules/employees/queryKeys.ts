import type { ListParams } from "./api/types";

const listKey = (base: readonly string[], params: ListParams = {}) =>
  [...base, "list", params] as const;

export const employeesQueryKeys = {
  all: ["employees"] as const,
  overview: () => [...employeesQueryKeys.all, "overview"] as const,
  records: {
    all: () => [...employeesQueryKeys.all, "records"] as const,
    list: (params: ListParams = {}) =>
      listKey(employeesQueryKeys.records.all(), params),
    detail: (id: string) =>
      [...employeesQueryKeys.records.all(), "detail", id] as const,
    userOptions: (includeUserId?: number | null) =>
      [
        ...employeesQueryKeys.records.all(),
        "user-options",
        includeUserId ?? null,
      ] as const,
  },
  branches: {
    all: () => [...employeesQueryKeys.all, "branches"] as const,
    list: () => [...employeesQueryKeys.branches.all(), "list"] as const,
    options: () => [...employeesQueryKeys.branches.all(), "options"] as const,
  },
  attendanceApprovals: {
    all: () => [...employeesQueryKeys.all, "attendance-approvals"] as const,
    list: (params: ListParams = {}) =>
      listKey(employeesQueryKeys.attendanceApprovals.all(), params),
    detail: (id: string) =>
      [...employeesQueryKeys.attendanceApprovals.all(), "detail", id] as const,
  },
  attendance: {
    all: () => [...employeesQueryKeys.all, "attendance"] as const,
    days: (params: ListParams = {}) =>
      listKey([...employeesQueryKeys.all, "attendance", "days"], params),
    schedule: () =>
      [...employeesQueryKeys.all, "attendance", "schedule"] as const,
    imports: (params: ListParams = {}) =>
      listKey([...employeesQueryKeys.all, "attendance", "imports"], params),
    importDetail: (id: string) =>
      [
        ...employeesQueryKeys.all,
        "attendance",
        "imports",
        "detail",
        id,
      ] as const,
    devices: () =>
      [...employeesQueryKeys.all, "attendance", "devices"] as const,
    mappings: (params: ListParams = {}) =>
      listKey([...employeesQueryKeys.all, "attendance", "mappings"], params),
    employeeOptions: () =>
      [...employeesQueryKeys.all, "attendance", "employee-options"] as const,
  },
  advances: {
    all: () => [...employeesQueryKeys.all, "advances"] as const,
    list: (params: ListParams = {}) =>
      listKey(employeesQueryKeys.advances.all(), params),
    detail: (id: string) =>
      [...employeesQueryKeys.advances.all(), "detail", id] as const,
  },
  overtimes: {
    all: () => [...employeesQueryKeys.all, "overtimes"] as const,
    employeeOptions: () =>
      [...employeesQueryKeys.overtimes.all(), "employee-options"] as const,
    list: (params: ListParams = {}) =>
      listKey(employeesQueryKeys.overtimes.all(), params),
    detail: (id: string) =>
      [...employeesQueryKeys.overtimes.all(), "detail", id] as const,
  },
  payrolls: {
    all: () => [...employeesQueryKeys.all, "payrolls"] as const,
    list: (params: ListParams = {}) =>
      listKey(employeesQueryKeys.payrolls.all(), params),
    detail: (id: string) =>
      [...employeesQueryKeys.payrolls.all(), "detail", id] as const,
  },
  rates: {
    all: () => [...employeesQueryKeys.all, "rates"] as const,
    employeeTypeRates: () =>
      [...employeesQueryKeys.rates.all(), "employee-type-rates"] as const,
    tailorPieceRates: () =>
      [...employeesQueryKeys.rates.all(), "tailor-piece-rates"] as const,
    configuration: () =>
      [...employeesQueryKeys.rates.all(), "configuration"] as const,
  },
};
