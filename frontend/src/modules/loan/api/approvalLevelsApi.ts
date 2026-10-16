import { apiClient } from "@/libs/api/apiClient";

import type { ApprovalLevel, RoleOption } from "../types";

export type ApprovalLevelsData = { levels: ApprovalLevel[]; roles: RoleOption[] };

export const approvalLevelsApi = {
  get: () => apiClient<{ data: ApprovalLevelsData }>("/api/loan/approval-levels"),

  update: (levels: ApprovalLevel[]) =>
    apiClient<{ data: ApprovalLevelsData }>("/api/loan/approval-levels", { method: "PUT", body: { levels } }),
};
