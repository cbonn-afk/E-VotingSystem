"use client";

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import type {
  EmployeePayload,
  EmployeeResource,
  EmployeeStatus,
} from "../../api/types";
import EmployeeFormDrawer from "../../components/employees/EmployeeFormDrawer";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import WorkflowStatusDialog from "../../components/shared/WorkflowStatusDialog";
import {
  CellBox,
  TableAvatar,
  formatCurrency,
  renderStatusChip,
} from "../../components/shared/statusUtils";
import {
  findEmployeeTypeDefinition,
  formatContribution,
} from "../../data/employeeTypes";
import {
  useBranchOptions,
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
  useUpdateEmployeeStatus,
  useRestoreEmployee,
} from "../../hooks/useEmployeesApi";
const statuses: Array<EmployeeStatus | ""> = [
  "",
  "Active",
  "Inactive",
  "Deactivated",
];

const EmployeeListView = () => {
  const authorization = useAuthorization();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [branchId, setBranchId] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<"exclude" | "only">(
    "exclude",
  );
  const [listType, setListType] = useState<"all" | "tailors">("all");
  const [paginationModel, setPaginationModel] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeResource | null>(null);
  const [viewing, setViewing] = useState<EmployeeResource | null>(null);
  const [statusTarget, setStatusTarget] = useState<EmployeeResource | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<EmployeeResource | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<{
    employee: EmployeeResource;
    rehire: boolean;
  } | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const employeesQuery = useEmployees({
    search: debouncedSearch,
    status,
    branch_id: branchId,
    pay_scheme_code: listType === "tailors" ? "piece_rate" : undefined,
    archived: archiveFilter,
    per_page: 100,
  });
  const createEmployee = useCreateEmployee();
  const branchOptionsQuery = useBranchOptions();
  const updateEmployee = useUpdateEmployee();
  const updateStatus = useUpdateEmployeeStatus();
  const deleteEmployee = useDeleteEmployee();
  const restoreEmployee = useRestoreEmployee();

  const rows = employeesQuery.data?.data ?? [];
  const canCreate = authorization.can("employees.records.create");
  const canUpdate = authorization.can("employees.records.update");
  const canDeactivate = authorization.can("employees.records.deactivate");
  const isSaving =
    createEmployee.isPending ||
    updateEmployee.isPending ||
    updateStatus.isPending ||
    deleteEmployee.isPending;
  const lifecycleSaving = isSaving || restoreEmployee.isPending;

  const openCreate = () => {
    if (!canCreate) return;

    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (employee: EmployeeResource) => {
    if (!canUpdate) return;

    setEditing(employee);
    setDrawerOpen(true);
  };

  const saveEmployee = (payload: EmployeePayload) => {
    const mutation = editing
      ? updateEmployee.mutateAsync({ id: editing.id, payload })
      : createEmployee.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Employee updated." : "Employee created.");
        setDrawerOpen(false);
        setEditing(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Employee could not be saved.",
        ),
      );
  };

  const toggleStatus = () => {
    if (!statusTarget) return;

    updateStatus
      .mutateAsync({
        id: statusTarget.id,
        payload: {
          status: statusTarget.status === "Inactive" ? "Active" : "Inactive",
          notes: null,
        },
      })
      .then(() => {
        toast.success("Employee status updated.");
        setStatusTarget(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Status could not be updated.",
        ),
      );
  };

  const removeEmployee = () => {
    if (!deleteTarget) return;

    deleteEmployee
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success(
          "Employee archived. Their identity and history were preserved.",
        );
        setDeleteTarget(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Employee could not be deleted.",
        ),
      );
  };

  const columns = useMemo<CustomTableColumn<EmployeeResource>[]>(
    () => [
      {
        id: "fullName",
        label: "Employee",
        minWidth: 270,
        flex: 1.55,
        sortable: true,
        render: (row) => (
          <CellBox>
            <Stack
              direction="row"
              spacing={1.75}
              alignItems="center"
              sx={{ py: 1.25 }}
            >
              <TableAvatar name={row.fullName} />
              <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                <Typography variant="body1" fontWeight={600} noWrap>
                  {row.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  <Box component="span" sx={{ fontFamily: "monospace", mr: 1 }}>
                    {row.employeeNo}
                  </Box>
                  · {row.employmentType ?? "Employment type not set"}
                </Typography>
                <Typography variant="caption" color="text.disabled" noWrap>
                  <Box
                    component="i"
                    className="bx bx-link"
                    sx={{ mr: 0.5, verticalAlign: "-1px" }}
                  />
                  {row.linkedAccount
                    ? `${row.linkedAccount.name} · ${row.linkedAccount.status}`
                    : "No linked account"}
                </Typography>
              </Stack>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "position",
        label: "Job Position",
        minWidth: 200,
        flex: 1.1,
        sortable: true,
        render: (row) => (
          <CellBox>
            <Stack spacing={0.5}>
              <Typography variant="body2" fontWeight={600}>
                {row.jobPosition ?? row.position ?? "Unassigned"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.workspace?.label ?? "No workspace assigned"}
              </Typography>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "branches",
        label: "Branches",
        minWidth: 205,
        flex: 1.1,
        render: (row) => (
          <CellBox>
            {row.branches.length > 0 ? (
              <Stack
                direction="row"
                useFlexGap
                flexWrap="wrap"
                gap={0.75}
                sx={{ py: 1.25 }}
              >
                {row.branches.map((branch) => (
                  <Chip
                    key={branch.id}
                    size="small"
                    variant="tonal"
                    color="info"
                    label={branch.name}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.disabled">
                Unassigned
              </Typography>
            )}
          </CellBox>
        ),
      },
      {
        id: "currentRate",
        label: "Compensation",
        minWidth: 220,
        flex: 1.25,
        render: (row) => (
          <CellBox>
            <Stack spacing={0.75} alignItems="flex-start">
              <Typography variant="body1" fontWeight={600}>
                {row.paySchemeCode === "piece_rate"
                  ? "Per completed piece"
                  : `${formatCurrency(row.currentRate ?? 0)}${row.currentRateUnit ? ` / ${row.currentRateUnit}` : ""}`}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  variant="tonal"
                  color={
                    row.paySchemeCode === "piece_rate" ? "primary" : "secondary"
                  }
                  label={row.payScheme ?? "Not set"}
                />
                {row.paySchemeCode !== "piece_rate" && (
                  <Typography variant="caption" color="text.secondary">
                    OT {formatCurrency(row.hourlyRate ?? 0)}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "status",
        label: "Status & Payroll",
        minWidth: 190,
        flex: 1.05,
        render: (row) => (
          <CellBox>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {renderStatusChip(row.status)}
              <Tooltip
                title={
                  row.payrollExclusionReason ??
                  "Included in payroll preparation"
                }
              >
                <Chip
                  size="small"
                  variant="tonal"
                  color={
                    row.payrollStatus === "Eligible"
                      ? "success"
                      : row.payrollStatus === "On Hold"
                        ? "warning"
                        : "default"
                  }
                  icon={<i className="bx bx-wallet" />}
                  label={row.payrollStatus}
                />
              </Tooltip>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        minWidth: 160,
        flex: 0.8,
        align: "right",
        render: (row) => (
          <CellBox justify="flex-end">
            <Stack direction="row" spacing={0.75} justifyContent="flex-end">
              <Tooltip title="View employee">
                <IconButton
                  size="small"
                  sx={{ bgcolor: "action.hover" }}
                  onClick={() => setViewing(row)}
                >
                  <i className="bx bx-show" />
                </IconButton>
              </Tooltip>
              {canUpdate && !row.isArchived && (
                <Tooltip title="Edit employee">
                  <IconButton
                    size="small"
                    sx={{ bgcolor: "action.hover" }}
                    onClick={() => openEdit(row)}
                  >
                    <i className="bx bx-pencil" />
                  </IconButton>
                </Tooltip>
              )}
              {canDeactivate && !row.isArchived && (
                <Tooltip
                  title={row.status === "Inactive" ? "Activate" : "Deactivate"}
                >
                  <span>
                    <IconButton
                      size="small"
                      color={row.status === "Inactive" ? "success" : "warning"}
                      disabled={isSaving || row.status === "Deactivated"}
                      onClick={() => setStatusTarget(row)}
                    >
                      <i
                        className={`bx ${
                          row.status === "Inactive"
                            ? "bx-lock-open-alt"
                            : "bx-lock-alt"
                        }`}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canDeactivate && !row.isArchived && (
                <Tooltip title="Archive employee">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={lifecycleSaving}
                      onClick={() => setDeleteTarget(row)}
                    >
                      <i className="bx bx-archive" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {canDeactivate && row.isArchived && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={lifecycleSaving}
                    onClick={() =>
                      setRestoreTarget({ employee: row, rehire: false })
                    }
                  >
                    Restore
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={lifecycleSaving}
                    onClick={() =>
                      setRestoreTarget({ employee: row, rehire: true })
                    }
                  >
                    Rehire
                  </Button>
                </>
              )}
            </Stack>
          </CellBox>
        ),
      },
    ],
    [canDeactivate, canUpdate, lifecycleSaving],
  );

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title="Employees List"
        description="Employee register with payroll-ready rates and status controls."
      >
        <Can permission="employees.records.create">
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={openCreate}
          >
            Add Employee
          </Button>
        </Can>
      </EmployeesPageHeader>

      <Paper sx={{ px: { xs: 1, md: 2 } }}>
        <Tabs
          value={listType}
          onChange={(_, value: "all" | "tailors") => {
            setListType(value);
            setPaginationModel((current) => ({ ...current, page: 0 }));
          }}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab
            value="all"
            label="All Employees"
            icon={<i className="bx bx-group" />}
            iconPosition="start"
          />
          <Tab
            value="tailors"
            label="Tailors"
            icon={<i className="bx bx-cut" />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {employeesQuery.isError && (
        <Alert severity="error">
          Employee records could not be loaded. Check the Employees API
          endpoint.
        </Alert>
      )}

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "minmax(320px, 1fr) repeat(3, minmax(170px, 210px))",
            },
            gap: 2,
          }}
        >
          <TextField
            size="small"
            label="Search employee"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="bx bx-search" />
                </InputAdornment>
              ),
            }}
            sx={{ gridColumn: { xs: "auto", sm: "1 / -1", lg: "auto" } }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as EmployeeStatus | "")
              }
            >
              {statuses.map((option) => (
                <MenuItem key={option || "All"} value={option}>
                  {option || "All Statuses"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {(branchOptionsQuery.data?.data ?? []).map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Records</InputLabel>
            <Select
              label="Records"
              value={archiveFilter}
              onChange={(event) =>
                setArchiveFilter(event.target.value as "exclude" | "only")
              }
            >
              <MenuItem value="exclude">Current Employees</MenuItem>
              <MenuItem value="only">Archived Employees</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ overflow: "hidden" }}>
        <Stack sx={{ px: { xs: 3, md: 4 }, pt: 4, pb: 1 }} spacing={0.5}>
          <Typography variant="h5" fontWeight={600}>
            Employee Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rows.length} employee{rows.length === 1 ? "" : "s"} shown.
          </Typography>
        </Stack>
        <CustomTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={employeesQuery.isPending}
          emptyTitle="No employees found"
          emptyDescription="Add an employee or adjust your search filters."
          getRowHeight={() => "auto"}
          sx={{
            px: { xs: 1, md: 3 },
            pb: 3,
            "& .MuiDataGrid-row": {
              minHeight: "82px !important",
            },
            "& .MuiDataGrid-cell": {
              py: 1.5,
              alignItems: "center",
            },
            "& .MuiDataGrid-columnHeaders": {
              minHeight: "52px !important",
            },
            "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
          }}
        />
      </Paper>

      <EmployeeFormDrawer
        open={drawerOpen}
        employee={editing}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving) return;
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={saveEmployee}
      />

      <WorkflowStatusDialog
        open={Boolean(statusTarget)}
        title={
          statusTarget?.status === "Inactive"
            ? "Activate employee?"
            : "Deactivate employee?"
        }
        description={
          statusTarget
            ? `${statusTarget.fullName} will ${
                statusTarget.status === "Inactive"
                  ? "return to active status"
                  : "be marked inactive"
              }.`
            : ""
        }
        confirmLabel={
          statusTarget?.status === "Inactive" ? "Activate" : "Deactivate"
        }
        confirmColor={
          statusTarget?.status === "Inactive" ? "success" : "warning"
        }
        isSaving={updateStatus.isPending}
        onClose={() => {
          if (!updateStatus.isPending) setStatusTarget(null);
        }}
        onConfirm={toggleStatus}
      />

      <WorkflowStatusDialog
        open={Boolean(deleteTarget)}
        title="Archive employee?"
        description={
          deleteTarget
            ? `${deleteTarget.fullName} will leave the active register. Employee number, account link, payroll, attendance, and production history will be preserved.`
            : ""
        }
        confirmLabel="Archive"
        confirmColor="error"
        isSaving={deleteEmployee.isPending}
        onClose={() => {
          if (!deleteEmployee.isPending) setDeleteTarget(null);
        }}
        onConfirm={removeEmployee}
      />

      <WorkflowStatusDialog
        open={Boolean(restoreTarget)}
        title={restoreTarget?.rehire ? "Rehire employee?" : "Restore employee?"}
        description={
          restoreTarget
            ? `${restoreTarget.employee.fullName} will return to the employee register${restoreTarget.rehire ? " as Active with a new effective compensation period" : " as Inactive"}.`
            : ""
        }
        confirmLabel={restoreTarget?.rehire ? "Rehire" : "Restore"}
        confirmColor="success"
        isSaving={restoreEmployee.isPending}
        onClose={() => {
          if (!restoreEmployee.isPending) setRestoreTarget(null);
        }}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreEmployee
            .mutateAsync({
              id: restoreTarget.employee.id,
              payload: {
                rehire: restoreTarget.rehire,
                hire_date: restoreTarget.rehire
                  ? new Date().toISOString().slice(0, 10)
                  : undefined,
                rate_effective_from: restoreTarget.rehire
                  ? new Date().toISOString().slice(0, 10)
                  : undefined,
              },
            })
            .then(() => {
              toast.success(
                restoreTarget.rehire
                  ? "Employee rehired."
                  : "Employee restored.",
              );
              setRestoreTarget(null);
            })
            .catch((error) =>
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Employee could not be restored.",
              ),
            );
        }}
      />

      <CustomDialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Employee Details"
        description={viewing?.fullName}
        closeAfterTransition
        actions={
          <Button variant="outlined" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <Stack spacing={2}>
            {(() => {
              const employeeType = findEmployeeTypeDefinition(viewing.position);

              return (
                <>
                  <Typography>Employee No.: {viewing.employeeNo}</Typography>
                  <Typography>
                    Employee Type: {viewing.position ?? "—"}
                  </Typography>
                  <Typography>
                    Employment Type: {viewing.employmentType ?? "—"}
                  </Typography>
                  <Typography>
                    Branches:{" "}
                    {viewing.branches.map((branch) => branch.name).join(", ") ||
                      "Unassigned"}
                  </Typography>
                  <Typography>Contact: {viewing.phone ?? "—"}</Typography>
                  <Typography>Email: {viewing.email ?? "—"}</Typography>
                  <Typography>
                    Base Rate: {formatCurrency(viewing.baseSalary ?? 0)}
                  </Typography>
                  <Typography>
                    OT Rate: {formatCurrency(viewing.hourlyRate ?? 0)}
                  </Typography>
                  <Typography>
                    SSS: {formatContribution(employeeType?.sss ?? null)}
                  </Typography>
                  <Typography>
                    PhilHealth:{" "}
                    {formatContribution(employeeType?.philHealth ?? null)}
                  </Typography>
                  <Typography>
                    Pag-IBIG:{" "}
                    {formatContribution(employeeType?.pagIbig ?? null)}
                  </Typography>
                  <Typography>Notes: {viewing.notes ?? "—"}</Typography>
                </>
              );
            })()}
          </Stack>
        )}
      </CustomDialog>
    </Stack>
  );
};

export default EmployeeListView;
