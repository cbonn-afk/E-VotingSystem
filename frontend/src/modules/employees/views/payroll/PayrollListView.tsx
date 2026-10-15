"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { toast } from "react-toastify";

import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import Link from "@components/Link";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import type {
  EmployeesStat,
  PayrollResource,
  PayrollRunType,
  PayrollStatus,
} from "../../api/types";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import EmployeesStatsCards from "../../components/shared/EmployeesStatsCards";
import PayrollBreakdownDrawer from "../../components/payroll/PayrollBreakdownDrawer";
import WorkflowStatusDialog from "../../components/shared/WorkflowStatusDialog";
import {
  CellBox,
  formatCurrency,
  renderStatusChip,
} from "../../components/shared/statusUtils";
import {
  useDeletePayroll,
  usePayrolls,
  useUpdatePayrollStatus,
} from "../../hooks/useEmployeesApi";
type PayrollDecision = {
  row: PayrollResource;
  status: Exclude<PayrollStatus, "Draft">;
  label: string;
  color: "success" | "error" | "warning" | "primary";
};

/** Renders "Jun 1 – Jun 30, 2026" from two ISO date strings (timezone-safe). */
const formatPeriodLabel = (start: string, end: string) => {
  const toLabel = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);

    return year && month && day
      ? new Date(year, month - 1, day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : iso;
  };

  return `${toLabel(start)} – ${toLabel(end)}, ${end.slice(0, 4)}`;
};

const PayrollListView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authorization = useAuthorization();
  const [query, setQuery] = useState("");
  const [paginationModel, setPaginationModel] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [decision, setDecision] = useState<PayrollDecision | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayrollResource | null>(
    null,
  );
  const [breakdownTarget, setBreakdownTarget] =
    useState<PayrollResource | null>(null);
  const payrollType: PayrollRunType =
    searchParams.get("type") === "tailor" ? "tailor" : "employee";
  const isTailorPayroll = payrollType === "tailor";

  const debouncedSearch = useDebouncedValue(query.trim(), 350);
  const payrollsQuery = usePayrolls({
    search: debouncedSearch,
    payroll_type: payrollType,
    per_page: 100,
  });
  const updateStatus = useUpdatePayrollStatus();
  const deletePayroll = useDeletePayroll();
  const canPrepare = authorization.can("employees.payroll.prepare");
  const canApprove = authorization.can("employees.payroll.approve");
  const canRelease = authorization.can("employees.payroll.release");
  const isSaving = updateStatus.isPending || deletePayroll.isPending;

  const rows = payrollsQuery.data?.data ?? [];
  const viewedPayrollId = searchParams.get("view");

  useEffect(() => {
    if (!viewedPayrollId) {
      setBreakdownTarget(null);
      return;
    }

    const payroll = rows.find((row) => row.id === viewedPayrollId);

    if (payroll) setBreakdownTarget(payroll);
  }, [rows, viewedPayrollId]);

  const openBreakdown = (payroll: PayrollResource) => {
    setBreakdownTarget(payroll);
    router.push(`/employees/payrolls?type=${payrollType}&view=${payroll.id}`, {
      scroll: false,
    });
  };

  const closeBreakdown = () => {
    setBreakdownTarget(null);
    router.replace(
      isTailorPayroll
        ? "/employees/payrolls?type=tailor"
        : "/employees/payrolls",
      { scroll: false },
    );
  };

  const kpis = useMemo<EmployeesStat[]>(() => {
    const grossPay = rows.reduce((sum, row) => sum + row.grossTotal, 0);
    const netPay = rows.reduce((sum, row) => sum + row.netTotal, 0);
    const employeesIncluded = rows.reduce(
      (sum, row) => sum + (row.items?.length ?? 0),
      0,
    );
    const pendingRuns = rows.filter((row) => row.status === "Prepared").length;

    return [
      {
        label: "Payroll Runs",
        value: String(rows.length),
        helper: "Runs in the current result",
        icon: "bx-spreadsheet",
        color: "primary",
      },
      {
        label: isTailorPayroll ? "Tailors Included" : "Employees Included",
        value: String(employeesIncluded),
        helper: "Total headcount across runs",
        icon: isTailorPayroll ? "bx-cut" : "bx-group",
        color: "info",
      },
      {
        label: "Gross Pay",
        value: formatCurrency(grossPay),
        helper: "Before deductions",
        icon: "bx-wallet",
        color: "warning",
      },
      {
        label: "Net Pay",
        value: formatCurrency(netPay),
        helper: `${pendingRuns} run${pendingRuns === 1 ? "" : "s"} for review`,
        icon: "bx-money",
        color: "success",
      },
    ];
  }, [isTailorPayroll, rows]);

  const confirmDecision = () => {
    if (!decision) return;

    updateStatus
      .mutateAsync({
        id: decision.row.id,
        payload: { status: decision.status, notes: null },
      })
      .then(() => {
        toast.success(`Payroll ${decision.label.toLowerCase()}.`);
        setDecision(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Payroll status could not be updated.",
        ),
      );
  };

  const removePayroll = () => {
    if (!deleteTarget) return;

    deletePayroll
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Payroll run deleted.");
        setDeleteTarget(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Payroll run could not be deleted.",
        ),
      );
  };

  const columns = useMemo<CustomTableColumn<PayrollResource>[]>(
    () => [
      {
        id: "payrollNo",
        label: "Payroll No.",
        minWidth: 200,
        flex: 1.3,
        render: (row) => (
          <CellBox>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  inlineSize: 36,
                  blockSize: 36,
                  flexShrink: 0,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "primary.main",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                }}
              >
                <i className="bx bx-receipt" style={{ fontSize: "1.25rem" }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  letterSpacing: 0.3,
                }}
              >
                {row.payrollNo}
              </Typography>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "period",
        label: "Pay Period",
        minWidth: 200,
        flex: 1.2,
        render: (row) => (
          <CellBox>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                component="i"
                className="bx bx-calendar"
                sx={{ color: "text.secondary", fontSize: "1.1rem" }}
              />
              <Typography sx={{ fontSize: "0.85rem" }}>
                {formatPeriodLabel(row.periodStart, row.periodEnd)}
              </Typography>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "employees",
        label: "Employees",
        align: "center",
        minWidth: 120,
        flex: 0.7,
        render: (row) => (
          <CellBox justify="center">
            <Chip
              size="small"
              variant="tonal"
              color="info"
              icon={<i className="bx bx-group" />}
              label={row.items?.length ?? 0}
            />
          </CellBox>
        ),
      },
      {
        id: "grossTotal",
        label: "Gross Pay",
        align: "right",
        minWidth: 130,
        flex: 1,
        render: (row) => (
          <CellBox justify="flex-end">
            <Typography sx={{ fontSize: "0.85rem" }}>
              {formatCurrency(row.grossTotal)}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "advanceTotal",
        label: "Advances",
        align: "right",
        minWidth: 130,
        flex: 1,
        render: (row) => (
          <CellBox justify="flex-end">
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: row.advanceTotal > 0 ? "warning.main" : "text.secondary",
              }}
            >
              {row.advanceTotal > 0
                ? `– ${formatCurrency(row.advanceTotal)}`
                : formatCurrency(0)}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "netTotal",
        label: "Net Pay",
        align: "right",
        minWidth: 140,
        flex: 1,
        render: (row) => (
          <CellBox justify="flex-end">
            <Typography sx={{ fontWeight: 700, color: "success.main" }}>
              {formatCurrency(row.netTotal)}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "status",
        label: "Status",
        align: "center",
        minWidth: 130,
        flex: 0.9,
        render: (row) => (
          <CellBox justify="center">{renderStatusChip(row.status)}</CellBox>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        minWidth: 230,
        flex: 1.2,
        align: "right",
        render: (row) => (
          <CellBox justify="flex-end">
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="View employee breakdown">
                <span>
                  <IconButton
                    size="small"
                    disabled={(row.items?.length ?? 0) === 0}
                    onClick={() => openBreakdown(row)}
                  >
                    <i className="bx bx-table" />
                  </IconButton>
                </span>
              </Tooltip>
              {canPrepare && (
                <Tooltip title="Edit payroll">
                  <span>
                    <IconButton
                      size="small"
                      disabled={
                        !["Draft", "Prepared"].includes(row.status) || isSaving
                      }
                      onClick={() =>
                        router.push(`/employees/payrolls/${row.id}/edit`)
                      }
                    >
                      <i className="bx bx-pencil" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canApprove && (
                <Tooltip title="Approve payroll">
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      disabled={row.status !== "Prepared" || isSaving}
                      onClick={() =>
                        setDecision({
                          row,
                          status: "Approved",
                          label: "Approved",
                          color: "success",
                        })
                      }
                    >
                      <i className="bx bx-check" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canRelease && (
                <Tooltip title="Release payroll">
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={row.status !== "Approved" || isSaving}
                      onClick={() =>
                        setDecision({
                          row,
                          status: "Released",
                          label: "Released",
                          color: "primary",
                        })
                      }
                    >
                      <i className="bx bx-send" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canApprove && (
                <Tooltip title="Void payroll">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={
                        row.status === "Released" ||
                        row.status === "Voided" ||
                        isSaving
                      }
                      onClick={() =>
                        setDecision({
                          row,
                          status: "Voided",
                          label: "Voided",
                          color: "error",
                        })
                      }
                    >
                      <i className="bx bx-x" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canPrepare && (
                <Tooltip title="Delete payroll">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={row.status !== "Draft" || isSaving}
                      onClick={() => setDeleteTarget(row)}
                    >
                      <i className="bx bx-trash" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </CellBox>
        ),
      },
    ],
    [canApprove, canPrepare, canRelease, isSaving],
  );

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title={isTailorPayroll ? "Tailor Payroll" : "Employee Payroll"}
        description={
          isTailorPayroll
            ? "QC-approved piece output, flexible schedules, approvals, and release tracking."
            : "Attendance-based payroll runs, approval, and release tracking."
        }
      >
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
          <Can permission="employees.payroll.prepare">
            <Button
              component={Link}
              href={`/employees/payrolls/prepare?type=${payrollType}`}
              variant="contained"
              startIcon={<i className="bx bx-plus" />}
            >
              {isTailorPayroll ? "Prepare Tailor Payroll" : "Prepare Payroll"}
            </Button>
          </Can>
        </Stack>
      </EmployeesPageHeader>

      {payrollsQuery.isError && (
        <Alert severity="error">Payroll runs could not be loaded.</Alert>
      )}

      <Paper sx={{ px: { xs: 1, md: 2 } }}>
        <Tabs
          value={payrollType}
          onChange={(_, value: PayrollRunType) =>
            router.push(
              value === "tailor"
                ? "/employees/payrolls?type=tailor"
                : "/employees/payrolls",
            )
          }
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab
            value="employee"
            label="Employee Payroll"
            icon={<i className="bx bx-group" />}
            iconPosition="start"
          />
          <Tab
            value="tailor"
            label="Tailor Payroll"
            icon={<i className="bx bx-cut" />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <EmployeesStatsCards stats={kpis} />

      <Paper sx={{ overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          className="p-5 pb-0"
        >
          <Stack spacing={0.5}>
            <Typography variant="h5">
              {isTailorPayroll
                ? "Tailor Payroll Runs"
                : "Employee Payroll Runs"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rows.length} run{rows.length === 1 ? "" : "s"} shown.
            </Typography>
          </Stack>
          <TextField
            size="small"
            placeholder="Search payroll..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="bx bx-search" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", md: 300 } }}
          />
        </Stack>
        <CustomTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={payrollsQuery.isPending}
          emptyTitle="No payroll runs"
          emptyDescription="Prepared payroll runs will appear here."
          getRowHeight={() => 64}
          sx={{
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "action.hover",
            },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
            },
          }}
        />
      </Paper>

      <PayrollBreakdownDrawer
        open={Boolean(breakdownTarget)}
        payroll={
          breakdownTarget
            ? (rows.find((row) => row.id === breakdownTarget.id) ??
              breakdownTarget)
            : null
        }
        editable={false}
        onOpenPayslip={(item) => {
          if (!breakdownTarget) return;
          const returnTo = `/employees/payrolls?view=${breakdownTarget.id}`;

          router.push(
            `/employees/payrolls/${breakdownTarget.id}/payslips/${item.id}?returnTo=${encodeURIComponent(returnTo)}`,
          );
        }}
        onClose={closeBreakdown}
      />

      <WorkflowStatusDialog
        open={Boolean(decision)}
        title={`${decision?.label ?? "Update"} payroll?`}
        description={
          decision
            ? `${decision.row.payrollNo} for ${decision.row.periodStart} - ${decision.row.periodEnd} will be marked ${decision.label.toLowerCase()}.`
            : ""
        }
        confirmLabel={decision?.label ?? "Confirm"}
        confirmColor={decision?.color ?? "primary"}
        isSaving={updateStatus.isPending}
        onClose={() => {
          if (!updateStatus.isPending) setDecision(null);
        }}
        onConfirm={confirmDecision}
      />
      <WorkflowStatusDialog
        open={Boolean(deleteTarget)}
        title="Delete payroll run?"
        description={
          deleteTarget
            ? `${deleteTarget.payrollNo} will be removed if the backend allows deletion.`
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        isSaving={deletePayroll.isPending}
        onClose={() => {
          if (!deletePayroll.isPending) setDeleteTarget(null);
        }}
        onConfirm={removePayroll}
      />
    </Stack>
  );
};

export default PayrollListView;
