import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { employeesApi } from "../api/employeesApi";
import type {
  AdvancePayload,
  AdvanceStatusPayload,
  AdvanceUpdatePayload,
  AttendanceApprovalPayload,
  AttendanceApprovalStatusPayload,
  AttendanceApprovalUpdatePayload,
  AttendanceCorrectionPayload,
  AttendanceSchedulePayload,
  EmployeePayload,
  EmployeeStatusPayload,
  RestoreEmployeePayload,
  EmployeeTypeRatePayload,
  ListParams,
  OvertimePayload,
  OvertimeBatchStatusPayload,
  OvertimeStatusPayload,
  OvertimeUpdatePayload,
  PayrollPayload,
  PayrollStatusPayload,
  PayrollUpdatePayload,
  TailorPieceRatePayload,
  CatalogPayload,
  BranchPayload,
} from "../api/types";
import { employeesQueryKeys } from "../queryKeys";

export const useEmployeesOverview = () =>
  useQuery({
    queryKey: employeesQueryKeys.overview(),
    queryFn: employeesApi.overview,
  });

export const useEmployees = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.records.list(params),
    queryFn: () => employeesApi.records.list(params),
  });

export const useEmployee = (id: string) =>
  useQuery({
    queryKey: employeesQueryKeys.records.detail(id),
    queryFn: () => employeesApi.records.get(id),
    enabled: Boolean(id),
  });

export const useEmployeeUserOptions = (
  includeUserId?: number | null,
  enabled = true,
) =>
  useQuery({
    queryKey: employeesQueryKeys.records.userOptions(includeUserId),
    queryFn: () => employeesApi.records.userOptions(includeUserId),
    enabled,
  });

export const useBranches = () =>
  useQuery({
    queryKey: employeesQueryKeys.branches.list(),
    queryFn: employeesApi.branches.list,
  });

export const useBranchOptions = (enabled = true) =>
  useQuery({
    queryKey: employeesQueryKeys.branches.options(),
    queryFn: employeesApi.branches.options,
    enabled,
  });

const useBranchInvalidation = () => {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.branches.all(),
      }),
      queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.records.all(),
      }),
    ]);
};

export const useCreateBranch = () => {
  const invalidate = useBranchInvalidation();

  return useMutation({
    mutationFn: (payload: BranchPayload) =>
      employeesApi.branches.create(payload),
    onSuccess: invalidate,
  });
};

export const useUpdateBranch = () => {
  const invalidate = useBranchInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BranchPayload>;
    }) => employeesApi.branches.update(id, payload),
    onSuccess: invalidate,
  });
};

export const useDeleteBranch = () => {
  const invalidate = useBranchInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.branches.remove(id),
    onSuccess: invalidate,
  });
};

export const useAttendanceApprovals = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.attendanceApprovals.list(params),
    queryFn: () => employeesApi.attendanceApprovals.list(params),
  });

export const useAttendanceDays = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.days(params),
    queryFn: () => employeesApi.attendance.days(params),
  });
export const useAttendanceSchedule = () =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.schedule(),
    queryFn: employeesApi.attendance.schedule,
  });
export const useAttendanceEmployeeOptions = () =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.employeeOptions(),
    queryFn: employeesApi.attendance.employeeOptions,
  });
export const useUpdateAttendanceSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceSchedulePayload) =>
      employeesApi.attendance.updateSchedule(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.attendance.all(),
      }),
  });
};

export const useCorrectAttendanceDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AttendanceCorrectionPayload;
    }) => employeesApi.attendance.correctDay(id, payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.attendance.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.payrolls.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.overview(),
        }),
      ]),
  });
};
export const useAttendanceImports = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.imports(params),
    queryFn: () => employeesApi.attendance.imports(params),
  });
export const useAttendanceImportBatch = (id: string) =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.importDetail(id),
    queryFn: () => employeesApi.attendance.importBatch(id),
    enabled: Boolean(id),
  });
export const useBiometricDevices = () =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.devices(),
    queryFn: employeesApi.attendance.devices,
  });
export const useBiometricMappings = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.attendance.mappings(params),
    queryFn: () => employeesApi.attendance.mappings(params),
  });
export const usePreviewAttendanceImport = () =>
  useMutation({
    mutationFn: ({ file, deviceId }: { file: File; deviceId: string }) =>
      employeesApi.attendance.previewImport(file, deviceId),
  });
export const useConfirmAttendanceImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      deviceId,
      preview,
      assignments,
    }: {
      file: File;
      deviceId: string;
      preview: import("../api/types").AttendanceImportPreview;
      assignments?: Record<string, string>;
    }) =>
      employeesApi.attendance.confirmImport(
        file,
        deviceId,
        preview,
        assignments,
      ),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.attendance.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.payrolls.all(),
        }),
      ]),
  });
};
export const useUpdateAttendanceDayStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "Pending" | "Approved" | "Rejected" | "Voided";
    }) => employeesApi.attendance.updateDayStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.attendance.all(),
      }),
  });
};

export const useAdvances = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.advances.list(params),
    queryFn: () => employeesApi.advances.list(params),
  });

export const useOvertimes = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.overtimes.list(params),
    queryFn: () => employeesApi.overtimes.list(params),
  });

export const useOvertimeEmployeeOptions = () =>
  useQuery({
    queryKey: employeesQueryKeys.overtimes.employeeOptions(),
    queryFn: employeesApi.overtimes.employeeOptions,
  });

export const usePayrolls = (params: ListParams = {}) =>
  useQuery({
    queryKey: employeesQueryKeys.payrolls.list(params),
    queryFn: () => employeesApi.payrolls.list(params),
  });

export const usePayroll = (id: string) =>
  useQuery({
    queryKey: employeesQueryKeys.payrolls.detail(id),
    queryFn: () => employeesApi.payrolls.get(id),
    enabled: Boolean(id),
  });

export const useTailorPieceRates = () =>
  useQuery({
    queryKey: employeesQueryKeys.rates.tailorPieceRates(),
    queryFn: employeesApi.rates.tailorPieceRates,
  });

export const useEmployeeTypeRates = () =>
  useQuery({
    queryKey: employeesQueryKeys.rates.employeeTypeRates(),
    queryFn: employeesApi.rates.employeeTypeRates,
  });

export const useCompensationConfiguration = () =>
  useQuery({
    queryKey: employeesQueryKeys.rates.configuration(),
    queryFn: employeesApi.rates.configuration,
  });

export const useCreateCompensationCatalog = (
  kind: "job-position" | "employment-type",
) => {
  const invalidate = useEmployeesInvalidation();
  return useMutation({
    mutationFn: (payload: CatalogPayload) =>
      kind === "job-position"
        ? employeesApi.rates.createJobPosition(payload)
        : employeesApi.rates.createEmploymentType(payload),
    onSuccess: () => invalidate.rates(),
  });
};

export const useUpdateCompensationCatalog = (
  kind: "job-position" | "employment-type",
) => {
  const invalidate = useEmployeesInvalidation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CatalogPayload }) =>
      kind === "job-position"
        ? employeesApi.rates.updateJobPosition(id, payload)
        : employeesApi.rates.updateEmploymentType(id, payload),
    onSuccess: () => invalidate.rates(),
  });
};

export const useDeleteCompensationCatalog = (
  kind: "job-position" | "employment-type",
) => {
  const invalidate = useEmployeesInvalidation();
  return useMutation({
    mutationFn: (id: string) =>
      kind === "job-position"
        ? employeesApi.rates.deleteJobPosition(id)
        : employeesApi.rates.deleteEmploymentType(id),
    onSuccess: () => invalidate.rates(),
  });
};

const useEmployeesInvalidation = () => {
  const queryClient = useQueryClient();

  const overview = () =>
    queryClient.invalidateQueries({ queryKey: employeesQueryKeys.overview() });

  const invalidateSection = async (
    sectionKey: readonly string[],
    detailKey?: readonly string[],
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: sectionKey }),
      overview(),
      ...(detailKey
        ? [queryClient.invalidateQueries({ queryKey: detailKey })]
        : []),
    ]);
  };

  return {
    records: (id?: string) =>
      Promise.all([
        invalidateSection(
          employeesQueryKeys.records.all(),
          id ? employeesQueryKeys.records.detail(id) : undefined,
        ),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.branches.all(),
        }),
      ]),
    attendanceApprovals: (id?: string) =>
      invalidateSection(
        employeesQueryKeys.attendanceApprovals.all(),
        id ? employeesQueryKeys.attendanceApprovals.detail(id) : undefined,
      ),
    advances: (id?: string) =>
      invalidateSection(
        employeesQueryKeys.advances.all(),
        id ? employeesQueryKeys.advances.detail(id) : undefined,
      ),
    overtimes: (id?: string) =>
      invalidateSection(
        employeesQueryKeys.overtimes.all(),
        id ? employeesQueryKeys.overtimes.detail(id) : undefined,
      ),
    payrolls: (id?: string) =>
      invalidateSection(
        employeesQueryKeys.payrolls.all(),
        id ? employeesQueryKeys.payrolls.detail(id) : undefined,
      ),
    approvals: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.attendanceApprovals.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.advances.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.overtimes.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: employeesQueryKeys.payrolls.all(),
        }),
        overview(),
      ]);
    },
    rates: () =>
      queryClient.invalidateQueries({
        queryKey: employeesQueryKeys.rates.all(),
      }),
  };
};

export const useCreateEmployee = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: EmployeePayload) =>
      employeesApi.records.create(payload),
    onSuccess: ({ data }) => invalidate.records(data.id),
  });
};

export const useUpdateEmployee = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<EmployeePayload>;
    }) => employeesApi.records.update(id, payload),
    onSuccess: ({ data }) => invalidate.records(data.id),
  });
};

export const useUpdateEmployeeStatus = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: EmployeeStatusPayload;
    }) => employeesApi.records.status(id, payload),
    onSuccess: ({ data }) => invalidate.records(data.id),
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.records.remove(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({
        queryKey: employeesQueryKeys.records.detail(id),
      });
      await invalidate.records();
    },
  });
};

export const useRestoreEmployee = () => {
  const invalidate = useEmployeesInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: RestoreEmployeePayload;
    }) => employeesApi.records.restore(id, payload),
    onSuccess: ({ data }) => invalidate.records(data.id),
  });
};

export const useUpdateTailorPieceRate = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TailorPieceRatePayload;
    }) => employeesApi.rates.updateTailorPieceRate(id, payload),
    onSuccess: () => invalidate.rates(),
  });
};

export const useUpdateEmployeeTypeRate = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: EmployeeTypeRatePayload;
    }) => employeesApi.rates.updateEmployeeTypeRate(id, payload),
    onSuccess: () => invalidate.rates(),
  });
};

export const useCreateEmployeeTypeRate = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: EmployeeTypeRatePayload) =>
      employeesApi.rates.createEmployeeTypeRate(payload),
    onSuccess: () => invalidate.rates(),
  });
};

export const useDeleteEmployeeTypeRate = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.rates.deleteEmployeeTypeRate(id),
    onSuccess: () => invalidate.rates(),
  });
};

export const useCreateAttendanceApproval = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: AttendanceApprovalPayload) =>
      employeesApi.attendanceApprovals.create(payload),
    onSuccess: ({ data }) => invalidate.attendanceApprovals(data.id),
  });
};

export const useUpdateAttendanceApproval = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AttendanceApprovalUpdatePayload;
    }) => employeesApi.attendanceApprovals.update(id, payload),
    onSuccess: ({ data }) => invalidate.attendanceApprovals(data.id),
  });
};

export const useUpdateAttendanceApprovalStatus = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AttendanceApprovalStatusPayload;
    }) => employeesApi.attendanceApprovals.status(id, payload),
    onSuccess: ({ data }) => invalidate.attendanceApprovals(data.id),
  });
};

export const useDeleteAttendanceApproval = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.attendanceApprovals.remove(id),
    onSuccess: () => invalidate.attendanceApprovals(),
  });
};

export const useCreateAdvance = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: AdvancePayload) =>
      employeesApi.advances.create(payload),
    onSuccess: ({ data }) => invalidate.advances(data.id),
  });
};

export const useUpdateAdvance = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdvanceUpdatePayload;
    }) => employeesApi.advances.update(id, payload),
    onSuccess: ({ data }) => invalidate.advances(data.id),
  });
};

export const useUpdateAdvanceStatus = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdvanceStatusPayload;
    }) => employeesApi.advances.status(id, payload),
    onSuccess: ({ data }) => invalidate.advances(data.id),
  });
};

export const useDeleteAdvance = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.advances.remove(id),
    onSuccess: () => invalidate.advances(),
  });
};

export const useCreateOvertime = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: OvertimePayload) =>
      employeesApi.overtimes.create(payload),
    onSuccess: ({ data }) => invalidate.overtimes(data.id),
  });
};

export const useUpdateOvertime = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: OvertimeUpdatePayload;
    }) => employeesApi.overtimes.update(id, payload),
    onSuccess: ({ data }) => invalidate.overtimes(data.id),
  });
};

export const useUpdateOvertimeStatus = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: OvertimeStatusPayload;
    }) => employeesApi.overtimes.status(id, payload),
    onSuccess: ({ data }) => invalidate.overtimes(data.id),
  });
};

export const useBatchUpdateOvertimeStatus = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: OvertimeBatchStatusPayload) =>
      employeesApi.overtimes.batchStatus(payload),
    onSuccess: () => invalidate.overtimes(),
  });
};

export const useDeleteOvertime = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.overtimes.remove(id),
    onSuccess: () => invalidate.overtimes(),
  });
};

export const useCreatePayroll = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (payload: PayrollPayload) =>
      employeesApi.payrolls.create(payload),
    onSuccess: ({ data }) => {
      void invalidate.payrolls(data.id);
    },
  });
};

export const useUpdatePayroll = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PayrollUpdatePayload;
    }) => employeesApi.payrolls.update(id, payload),
    onSuccess: ({ data }) => invalidate.payrolls(data.id),
  });
};

export const useUpdatePayrollStatus = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PayrollStatusPayload;
    }) => employeesApi.payrolls.status(id, payload),
    onSuccess: ({ data }) => invalidate.payrolls(data.id),
  });
};

export const useDeletePayroll = () => {
  const invalidate = useEmployeesInvalidation();

  return useMutation({
    mutationFn: (id: string) => employeesApi.payrolls.remove(id),
    onSuccess: () => invalidate.payrolls(),
  });
};
