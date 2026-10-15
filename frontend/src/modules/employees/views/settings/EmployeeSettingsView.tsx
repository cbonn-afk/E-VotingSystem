"use client";

import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { toast } from "react-toastify";

import type { WorkspaceOption } from "../../api/types";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import WorkflowStatusDialog from "../../components/shared/WorkflowStatusDialog";
import {
  useCreateEmployeeTypeRate,
  useCompensationConfiguration,
  useCreateCompensationCatalog,
  useUpdateCompensationCatalog,
  useDeleteCompensationCatalog,
  useDeleteEmployeeTypeRate,
  useEmployeeTypeRates,
  useTailorPieceRates,
  useUpdateEmployeeTypeRate,
  useUpdateTailorPieceRate,
} from "../../hooks/useEmployeesApi";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const tableSurfaceSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
  maxWidth: "100%",
  overflowX: "auto",
  "& .MuiTableCell-head": {
    bgcolor: "action.hover",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  "& .MuiTableCell-root": {
    verticalAlign: "middle",
  },
};

const settingsTableSx = {
  "& .MuiTableCell-root": { py: 1.25 },
  "& .MuiInputBase-root": { fontSize: "0.8125rem" },
};

const rateInputSx = {
  minWidth: 112,
  "& input": { textAlign: "right" },
};

const settingIconByTab = {
  "job-positions": "bx-briefcase",
  "employment-types": "bx-id-card",
  "pay-schemes": "bx-wallet",
  "standard-rates": "bx-spreadsheet",
  "piece-rate-cards": "bx-purchase-tag",
} as const;

const SettingIcon = ({
  icon,
  color = "primary",
}: {
  icon: string;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}) => (
  <Avatar
    variant="rounded"
    sx={{
      width: 34,
      height: 34,
      bgcolor: `${color}.lighter`,
      color: `${color}.main`,
      border: "1px solid",
      borderColor: `${color}.light`,
    }}
  >
    <i className={`bx ${icon}`} />
  </Avatar>
);

// Multiple roles can share a workspace label (e.g. the three designer roles all
// open "Design / Production Queue"). The role is the unique identifier, so we
// lead with it and use the label + description to say what the workspace grants.
const NO_WORKSPACE_VALUE = "";

const renderWorkspaceValue = (
  options: WorkspaceOption[],
  role: string,
): string => {
  if (!role) return "No operational workspace";

  const option = options.find((item) => item.role === role);

  return option ? `${option.role} · ${option.label}` : role;
};

const workspaceMenuItems = (options: WorkspaceOption[]) => [
  <MenuItem key="__none__" value={NO_WORKSPACE_VALUE}>
    <Stack spacing={0.25} sx={{ py: 0.25 }}>
      <Typography variant="body2" fontWeight={600}>
        No operational workspace
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Record-only position — no app workspace or dashboard is opened.
      </Typography>
    </Stack>
  </MenuItem>,
  ...options.map((option) => (
    <MenuItem
      key={option.role}
      value={option.role}
      sx={{ alignItems: "flex-start", py: 1, whiteSpace: "normal" }}
    >
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexWrap: "wrap", rowGap: 0.5 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {option.role}
          </Typography>
          <Chip
            size="small"
            variant="tonal"
            color="primary"
            label={option.label}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {option.description}
        </Typography>
      </Stack>
    </MenuItem>
  )),
];

const EmployeeSettingsView = () => {
  const employeeTypeRatesQuery = useEmployeeTypeRates();
  const configurationQuery = useCompensationConfiguration();
  const createJobPosition = useCreateCompensationCatalog("job-position");
  const updateJobPosition = useUpdateCompensationCatalog("job-position");
  const deleteJobPosition = useDeleteCompensationCatalog("job-position");
  const createEmploymentType = useCreateCompensationCatalog("employment-type");
  const updateEmploymentType = useUpdateCompensationCatalog("employment-type");
  const deleteEmploymentType = useDeleteCompensationCatalog("employment-type");
  const tailorRatesQuery = useTailorPieceRates();
  const createEmployeeTypeRate = useCreateEmployeeTypeRate();
  const deleteEmployeeTypeRate = useDeleteEmployeeTypeRate();
  const updateEmployeeTypeRate = useUpdateEmployeeTypeRate();
  const updateTailorRate = useUpdateTailorPieceRate();
  const [activeTab, setActiveTab] = useState<
    | "job-positions"
    | "employment-types"
    | "pay-schemes"
    | "standard-rates"
    | "piece-rate-cards"
  >("standard-rates");
  const [draftTailorRates, setDraftTailorRates] = useState<
    Record<string, { rate: string; isActive: boolean }>
  >({});
  const [draftEmployeeRates, setDraftEmployeeRates] = useState<
    Record<
      string,
      {
        baseRate: string;
        overtimeRate: string;
        allowanceAmount: string;
        lateAllowanceEnabled: boolean;
        lateAllowanceThreshold: string;
        employmentTypeId: string;
        paySchemeId: string;
        effectiveFrom: string;
        effectiveTo: string;
        sssAmount: string;
        sssEmployeeAmount: string;
        philhealthAmount: string;
        philhealthEmployeeAmount: string;
        pagibigAmount: string;
        pagibigEmployeeAmount: string;
        isActive: boolean;
      }
    >
  >({});
  const [newEmployeeRate, setNewEmployeeRate] = useState({
    jobPositionId: "",
    employmentTypeId: "",
    paySchemeId: "",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "",
    baseRate: "",
    overtimeRate: "",
    allowanceAmount: "50",
    lateAllowanceEnabled: false,
    lateAllowanceThreshold: "3",
    sssAmount: "",
    sssEmployeeAmount: "",
    philhealthAmount: "",
    philhealthEmployeeAmount: "",
    pagibigAmount: "",
    pagibigEmployeeAmount: "",
  });
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newWorkspaceRole, setNewWorkspaceRole] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<null | {
    kind: "catalog" | "employee-rate";
    id: string;
    name: string;
  }>(null);

  const createCatalogItem = async () => {
    const name = newCatalogName.trim();
    if (!name || activeTab === "pay-schemes") return;
    try {
      await (
        activeTab === "job-positions" ? createJobPosition : createEmploymentType
      ).mutateAsync({
        name,
        is_active: true,
        ...(activeTab === "job-positions"
          ? { workspace_role: newWorkspaceRole || null }
          : {}),
      });
      setNewCatalogName("");
      setNewWorkspaceRole("");
      toast.success("Configuration item added.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Configuration item could not be added.",
      );
    }
  };

  const toggleCatalogItem = async (row: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }) => {
    try {
      await (
        activeTab === "job-positions" ? updateJobPosition : updateEmploymentType
      ).mutateAsync({
        id: row.id,
        payload: { name: row.name, code: row.code, is_active: !row.isActive },
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Configuration item could not be updated.",
      );
    }
  };

  const updatePositionWorkspace = async (
    row: { id: string; name: string; code: string; isActive: boolean },
    workspaceRole: string,
  ) => {
    try {
      await updateJobPosition.mutateAsync({
        id: row.id,
        payload: {
          name: row.name,
          code: row.code,
          is_active: row.isActive,
          workspace_role: workspaceRole || null,
        },
      });
      toast.success("Position workspace updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Position workspace could not be updated.",
      );
    }
  };

  const removeCatalogItem = async (id: string) => {
    try {
      await (
        activeTab === "job-positions" ? deleteJobPosition : deleteEmploymentType
      ).mutateAsync(id);
      toast.success("Configuration item deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Configuration item could not be deleted.",
      );
    }
  };

  useEffect(() => {
    const rows = tailorRatesQuery.data?.data ?? [];

    setDraftTailorRates(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          {
            rate: String(row.rate),
            isActive: row.isActive,
          },
        ]),
      ),
    );
  }, [tailorRatesQuery.data?.data]);

  useEffect(() => {
    const rows = employeeTypeRatesQuery.data?.data ?? [];

    setDraftEmployeeRates(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          {
            baseRate: String(row.baseRate),
            overtimeRate: String(row.overtimeRate),
            allowanceAmount: String(row.allowanceAmount),
            lateAllowanceEnabled: row.lateAllowanceEnabled,
            lateAllowanceThreshold: String(row.lateAllowanceThreshold || 3),
            employmentTypeId: row.employmentTypeId,
            paySchemeId: row.paySchemeId,
            effectiveFrom: row.effectiveFrom,
            effectiveTo: row.effectiveTo ?? "",
            sssAmount: row.sssAmount === null ? "" : String(row.sssAmount),
            sssEmployeeAmount:
              row.sssEmployeeAmount === null
                ? ""
                : String(row.sssEmployeeAmount),
            philhealthAmount:
              row.philhealthAmount === null ? "" : String(row.philhealthAmount),
            philhealthEmployeeAmount:
              row.philhealthEmployeeAmount === null
                ? ""
                : String(row.philhealthEmployeeAmount),
            pagibigAmount:
              row.pagibigAmount === null ? "" : String(row.pagibigAmount),
            pagibigEmployeeAmount:
              row.pagibigEmployeeAmount === null
                ? ""
                : String(row.pagibigEmployeeAmount),
            isActive: row.isActive,
          },
        ]),
      ),
    );
  }, [employeeTypeRatesQuery.data?.data]);

  const tailorRows = useMemo(
    () => tailorRatesQuery.data?.data ?? [],
    [tailorRatesQuery.data?.data],
  );
  const employeeRows = useMemo(
    () => employeeTypeRatesQuery.data?.data ?? [],
    [employeeTypeRatesQuery.data?.data],
  );
  const workspaceOptions = useMemo<WorkspaceOption[]>(
    () => configurationQuery.data?.data.workspaceOptions ?? [],
    [configurationQuery.data?.data.workspaceOptions],
  );

  const nullableNumber = (value: string) => {
    const trimmed = value.trim();

    return trimmed === "" ? null : Number(trimmed);
  };

  const saveTailorRate = async (id: string) => {
    const draft = draftTailorRates[id];

    if (!draft) return;

    try {
      await updateTailorRate.mutateAsync({
        id,
        payload: {
          rate: Number(draft.rate),
          is_active: draft.isActive,
        },
      });
      toast.success("Tailor rate updated.");
    } catch {
      toast.error("Tailor rate could not be updated.");
    }
  };

  const saveEmployeeRate = async (id: string) => {
    const draft = draftEmployeeRates[id];
    const row = employeeRows.find((item) => item.id === id);

    if (!draft || !row) return;

    try {
      await updateEmployeeTypeRate.mutateAsync({
        id,
        payload: {
          job_position_id: row.jobPositionId,
          employment_type_id: draft.employmentTypeId,
          pay_scheme_id: draft.paySchemeId,
          effective_from: draft.effectiveFrom,
          effective_to: draft.effectiveTo || null,
          base_rate: Number(draft.baseRate),
          overtime_rate: Number(draft.overtimeRate),
          allowance_amount: Number(draft.allowanceAmount || 0),
          allowance_basis: row.allowanceBasis,
          late_allowance_enabled: draft.lateAllowanceEnabled,
          late_allowance_threshold: Number(draft.lateAllowanceThreshold || 3),
          sss_amount: nullableNumber(draft.sssAmount),
          sss_employee_amount: nullableNumber(draft.sssEmployeeAmount),
          philhealth_amount: nullableNumber(draft.philhealthAmount),
          philhealth_employee_amount: nullableNumber(
            draft.philhealthEmployeeAmount,
          ),
          pagibig_amount: nullableNumber(draft.pagibigAmount),
          pagibig_employee_amount: nullableNumber(draft.pagibigEmployeeAmount),
          is_active: draft.isActive,
        },
      });
      toast.success("Employee type rate updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Employee type rate could not be updated.",
      );
    }
  };

  const createEmployeeRate = async () => {
    if (
      !newEmployeeRate.jobPositionId ||
      !newEmployeeRate.employmentTypeId ||
      !newEmployeeRate.paySchemeId
    ) {
      toast.error(
        "Job position, employment type, and pay scheme are required.",
      );

      return;
    }

    try {
      await createEmployeeTypeRate.mutateAsync({
        job_position_id: newEmployeeRate.jobPositionId,
        employment_type_id: newEmployeeRate.employmentTypeId,
        pay_scheme_id: newEmployeeRate.paySchemeId,
        effective_from: newEmployeeRate.effectiveFrom,
        effective_to: newEmployeeRate.effectiveTo || null,
        base_rate: Number(newEmployeeRate.baseRate || 0),
        overtime_rate: Number(newEmployeeRate.overtimeRate || 0),
        allowance_amount: Number(newEmployeeRate.allowanceAmount || 0),
        allowance_basis: "per_day",
        late_allowance_enabled: newEmployeeRate.lateAllowanceEnabled,
        late_allowance_threshold: Number(
          newEmployeeRate.lateAllowanceThreshold || 3,
        ),
        sss_amount: nullableNumber(newEmployeeRate.sssAmount),
        sss_employee_amount: nullableNumber(newEmployeeRate.sssEmployeeAmount),
        philhealth_amount: nullableNumber(newEmployeeRate.philhealthAmount),
        philhealth_employee_amount: nullableNumber(
          newEmployeeRate.philhealthEmployeeAmount,
        ),
        pagibig_amount: nullableNumber(newEmployeeRate.pagibigAmount),
        pagibig_employee_amount: nullableNumber(
          newEmployeeRate.pagibigEmployeeAmount,
        ),
        is_active: true,
      });
      setNewEmployeeRate({
        jobPositionId: "",
        employmentTypeId: "",
        paySchemeId: "",
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: "",
        baseRate: "",
        overtimeRate: "",
        allowanceAmount: "50",
        lateAllowanceEnabled: false,
        lateAllowanceThreshold: "3",
        sssAmount: "",
        sssEmployeeAmount: "",
        philhealthAmount: "",
        philhealthEmployeeAmount: "",
        pagibigAmount: "",
        pagibigEmployeeAmount: "",
      });
      toast.success("Employee type rate added.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Employee type rate could not be added.",
      );
    }
  };

  const deleteEmployeeRate = async (id: string) => {
    try {
      await deleteEmployeeTypeRate.mutateAsync(id);
      toast.success("Employee type rate deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Employee type rate could not be deleted.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "catalog")
      await removeCatalogItem(deleteTarget.id);
    else await deleteEmployeeRate(deleteTarget.id);

    setDeleteTarget(null);
  };

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title="Employee Settings"
        description="Configure the job positions, employment types, pay schemes, and rates that drive employee records and payroll."
      />

      <Paper sx={{ overflow: "hidden" }}>
        <Stack spacing={4}>
          <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, bgcolor: "action.hover" }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab
                value="job-positions"
                label="Job Positions"
                icon={<i className="bx-briefcase" />}
                iconPosition="start"
              />
              <Tab
                value="employment-types"
                label="Employment Types"
                icon={<i className="bx-id-card" />}
                iconPosition="start"
              />
              <Tab
                value="pay-schemes"
                label="Pay Schemes"
                icon={<i className="bx-wallet" />}
                iconPosition="start"
              />
              <Tab
                value="standard-rates"
                label="Standard Rates"
                icon={<i className="bx-user" />}
                iconPosition="start"
              />
              <Tab
                value="piece-rate-cards"
                label="Piece-Rate Cards"
                icon={<i className="bx-needle" />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Divider />

          <Box sx={{ px: { xs: 3, md: 5 }, pb: 5 }}>
            {(activeTab === "job-positions" ||
              activeTab === "employment-types" ||
              activeTab === "pay-schemes") &&
              (() => {
                const catalogMeta = {
                  "job-positions": {
                    title: "Job Positions",
                    description:
                      "Roles assigned to employees for records and reporting.",
                    unit: "positions",
                  },
                  "employment-types": {
                    title: "Employment Types",
                    description:
                      "Classifications used across rate cards and payroll.",
                    unit: "types",
                  },
                  "pay-schemes": {
                    title: "Pay Schemes",
                    description:
                      "How pay is calculated. Managed by the system and applied to rates.",
                    unit: "schemes",
                  },
                }[activeTab];
                const catalogRows =
                  (activeTab === "job-positions"
                    ? configurationQuery.data?.data.jobPositions
                    : activeTab === "employment-types"
                      ? configurationQuery.data?.data.employmentTypes
                      : configurationQuery.data?.data.paySchemes) ?? [];
                const isReadOnly = activeTab === "pay-schemes";
                const columnCount = isReadOnly
                  ? 4
                  : activeTab === "job-positions"
                    ? 6
                    : 5;

                return (
                  <Stack spacing={4}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <SettingIcon icon={settingIconByTab[activeTab]} />
                        <Box>
                          <Typography variant="h5">
                            {catalogMeta.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {catalogMeta.description}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        size="small"
                        color="primary"
                        variant="tonal"
                        label={`${catalogRows.length} ${catalogMeta.unit}`}
                        sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
                      />
                    </Stack>

                    {!isReadOnly && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          bgcolor: "background.paper",
                        }}
                      >
                        <TextField
                          size="small"
                          label={
                            activeTab === "job-positions"
                              ? "Position name"
                              : "Employment type name"
                          }
                          value={newCatalogName}
                          onChange={(event) =>
                            setNewCatalogName(event.target.value)
                          }
                          sx={{ maxWidth: { sm: 320 }, width: "100%" }}
                        />
                        {activeTab === "job-positions" && (
                          <TextField
                            select
                            size="small"
                            label="Assigned workspace"
                            value={newWorkspaceRole}
                            onChange={(event) =>
                              setNewWorkspaceRole(event.target.value)
                            }
                            sx={{ minWidth: 300 }}
                            SelectProps={{
                              displayEmpty: true,
                              renderValue: (value) =>
                                renderWorkspaceValue(
                                  workspaceOptions,
                                  value as string,
                                ),
                              MenuProps: {
                                PaperProps: { sx: { maxWidth: 400 } },
                              },
                            }}
                          >
                            {workspaceMenuItems(workspaceOptions)}
                          </TextField>
                        )}
                        <Button
                          variant="contained"
                          startIcon={<i className="bx-plus" />}
                          disabled={!newCatalogName.trim()}
                          onClick={createCatalogItem}
                        >
                          Add
                        </Button>
                      </Stack>
                    )}

                    {configurationQuery.isError && (
                      <Alert severity="error">
                        Compensation configuration could not be loaded.
                      </Alert>
                    )}

                    {configurationQuery.isPending ? (
                      <Stack direction="row" spacing={2} alignItems="center">
                        <CircularProgress size={22} />
                        <Typography variant="body2" color="text.secondary">
                          Loading configuration...
                        </Typography>
                      </Stack>
                    ) : (
                      <TableContainer sx={tableSurfaceSx}>
                        <Table
                          size="small"
                          sx={{ minWidth: 760, ...settingsTableSx }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell width={150}>Code</TableCell>
                              {activeTab === "job-positions" && (
                                <TableCell width={260}>
                                  Assigned Workspace
                                </TableCell>
                              )}
                              {isReadOnly && (
                                <TableCell width={150}>Rate Unit</TableCell>
                              )}
                              <TableCell width={120} align="center">
                                Status
                              </TableCell>
                              {!isReadOnly && (
                                <TableCell width={180}>Usage</TableCell>
                              )}
                              {!isReadOnly && (
                                <TableCell width={130} align="right">
                                  Actions
                                </TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {catalogRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={columnCount} align="center">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ py: 3 }}
                                  >
                                    No items configured yet.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              catalogRows.map((row) => (
                                <TableRow key={row.id} hover>
                                  <TableCell>
                                    <Stack
                                      direction="row"
                                      spacing={1.5}
                                      alignItems="center"
                                      sx={{ minWidth: 220 }}
                                    >
                                      <SettingIcon
                                        icon={
                                          activeTab === "job-positions"
                                            ? "bx-briefcase"
                                            : activeTab === "employment-types"
                                              ? "bx-id-card"
                                              : "bx-wallet"
                                        }
                                        color={
                                          row.isActive ? "primary" : "secondary"
                                        }
                                      />
                                      <Box>
                                        <Typography
                                          variant="body2"
                                          fontWeight={600}
                                        >
                                          {row.name}
                                        </Typography>
                                        {"rateUnit" in row && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            Per {String(row.rateUnit)}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {row.code}
                                    </Typography>
                                  </TableCell>
                                  {activeTab === "job-positions" && (
                                    <TableCell>
                                      <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        value={row.workspaceRole ?? ""}
                                        disabled={
                                          row.isSystem ||
                                          updateJobPosition.isPending
                                        }
                                        onChange={(event) =>
                                          updatePositionWorkspace(
                                            row,
                                            event.target.value,
                                          )
                                        }
                                        SelectProps={{
                                          displayEmpty: true,
                                          renderValue: (value) =>
                                            renderWorkspaceValue(
                                              workspaceOptions,
                                              value as string,
                                            ),
                                          MenuProps: {
                                            PaperProps: {
                                              sx: { maxWidth: 400 },
                                            },
                                          },
                                        }}
                                      >
                                        {workspaceMenuItems(workspaceOptions)}
                                      </TextField>
                                    </TableCell>
                                  )}
                                  {isReadOnly && (
                                    <TableCell>
                                      {"rateUnit" in row
                                        ? String(row.rateUnit)
                                        : "—"}
                                    </TableCell>
                                  )}
                                  <TableCell align="center">
                                    <Chip
                                      size="small"
                                      variant="tonal"
                                      color={
                                        row.isActive ? "success" : "secondary"
                                      }
                                      label={
                                        row.isActive ? "Active" : "Inactive"
                                      }
                                    />
                                  </TableCell>
                                  {!isReadOnly && (
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
                                        {row.employeesCount} assigned
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {row.historicalProfilesCount} historical
                                        profiles
                                      </Typography>
                                    </TableCell>
                                  )}
                                  {!isReadOnly && (
                                    <TableCell align="right">
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        justifyContent="flex-end"
                                      >
                                        <Tooltip
                                          title={
                                            row.isActive && !row.canDeactivate
                                              ? "Reassign active employees before deactivating"
                                              : row.isActive
                                                ? "Deactivate"
                                                : "Activate"
                                          }
                                        >
                                          <span>
                                            <IconButton
                                              size="small"
                                              color={
                                                row.isActive
                                                  ? "warning"
                                                  : "success"
                                              }
                                              disabled={
                                                row.isSystem ||
                                                (row.isActive &&
                                                  !row.canDeactivate)
                                              }
                                              onClick={() =>
                                                toggleCatalogItem(row)
                                              }
                                            >
                                              <i
                                                className={
                                                  row.isActive
                                                    ? "bx bx-pause-circle"
                                                    : "bx bx-play-circle"
                                                }
                                              />
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                        <Tooltip
                                          title={
                                            row.canDelete
                                              ? "Delete unused item"
                                              : row.isSystem
                                                ? "System configuration cannot be deleted"
                                                : "Assigned or historical configuration must be retained"
                                          }
                                        >
                                          <span>
                                            <IconButton
                                              size="small"
                                              color="error"
                                              disabled={!row.canDelete}
                                              onClick={() =>
                                                setDeleteTarget({
                                                  kind: "catalog",
                                                  id: row.id,
                                                  name: row.name,
                                                })
                                              }
                                            >
                                              <i className="bx bx-trash" />
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                      </Stack>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Stack>
                );
              })()}

            {activeTab === "standard-rates" && (
              <Stack spacing={4}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <SettingIcon icon={settingIconByTab["standard-rates"]} />
                    <Box>
                      <Typography variant="h5">Standard Rates</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rates by job position and employment type. Employee
                        payroll snapshots preserve history.
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    color="primary"
                    variant="tonal"
                    label={`${employeeRows.length} configured rates`}
                    sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
                  />
                </Stack>

                {employeeTypeRatesQuery.isError && (
                  <Alert severity="error">
                    Employee type rates could not be loaded.
                  </Alert>
                )}

                <Stack
                  spacing={2}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SettingIcon icon="bx-plus" color="success" />
                    <Box>
                      <Typography variant="subtitle2">
                        Add Standard Rate
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add one effective-dated rate for a position and
                        employment type.
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        xl: "repeat(4, minmax(150px, 1fr))",
                      },
                      gap: 2,
                      alignItems: "end",
                    }}
                  >
                    <TextField
                      size="small"
                      select
                      label="Job Position"
                      value={newEmployeeRate.jobPositionId}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          jobPositionId: event.target.value,
                        }))
                      }
                    >
                      {(configurationQuery.data?.data.jobPositions ?? [])
                        .filter(
                          (position) =>
                            position.isActive && position.code !== "unassigned",
                        )
                        .map((position) => (
                          <MenuItem key={position.id} value={position.id}>
                            {position.name}
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      size="small"
                      select
                      label="Employment Type"
                      value={newEmployeeRate.employmentTypeId}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          employmentTypeId: event.target.value,
                        }))
                      }
                    >
                      {(configurationQuery.data?.data.employmentTypes ?? [])
                        .filter((type) => type.isActive)
                        .map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      size="small"
                      select
                      label="Pay Scheme"
                      value={newEmployeeRate.paySchemeId}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          paySchemeId: event.target.value,
                        }))
                      }
                    >
                      {(configurationQuery.data?.data.paySchemes ?? [])
                        .filter((scheme) => scheme.isActive)
                        .map((scheme) => (
                          <MenuItem key={scheme.id} value={scheme.id}>
                            {scheme.name}
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      size="small"
                      type="number"
                      label="Base Rate"
                      value={newEmployeeRate.baseRate}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          baseRate: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="OT Rate"
                      value={newEmployeeRate.overtimeRate}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          overtimeRate: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Base Allowance / day"
                      value={newEmployeeRate.allowanceAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          allowanceAmount: event.target.value,
                        }))
                      }
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title="Disable the allowance after the threshold of qualifying late days in this cutoff.">
                        <Switch
                          size="small"
                          checked={newEmployeeRate.lateAllowanceEnabled}
                          onChange={(event) =>
                            setNewEmployeeRate((current) => ({
                              ...current,
                              lateAllowanceEnabled: event.target.checked,
                            }))
                          }
                        />
                      </Tooltip>
                      <TextField
                        size="small"
                        type="number"
                        label="Late days"
                        value={newEmployeeRate.lateAllowanceThreshold}
                        disabled={!newEmployeeRate.lateAllowanceEnabled}
                        inputProps={{ min: 1, max: 99, step: 1 }}
                        sx={{ width: 110 }}
                        onChange={(event) =>
                          setNewEmployeeRate((current) => ({
                            ...current,
                            lateAllowanceThreshold: event.target.value,
                          }))
                        }
                      />
                    </Stack>
                    <TextField
                      size="small"
                      type="number"
                      label="Employer SSS"
                      value={newEmployeeRate.sssAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          sssAmount: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Employer PhilHealth"
                      value={newEmployeeRate.philhealthAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          philhealthAmount: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Employer Pag-IBIG"
                      value={newEmployeeRate.pagibigAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          pagibigAmount: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Employee SSS"
                      value={newEmployeeRate.sssEmployeeAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          sssEmployeeAmount: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Employee PhilHealth"
                      value={newEmployeeRate.philhealthEmployeeAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          philhealthEmployeeAmount: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Employee Pag-IBIG"
                      value={newEmployeeRate.pagibigEmployeeAmount}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                      onChange={(event) =>
                        setNewEmployeeRate((current) => ({
                          ...current,
                          pagibigEmployeeAmount: event.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="contained"
                      startIcon={<i className="bx-plus" />}
                      disabled={createEmployeeTypeRate.isPending}
                      onClick={createEmployeeRate}
                    >
                      Add Rate
                    </Button>
                  </Box>
                </Stack>

                {employeeTypeRatesQuery.isPending ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={22} />
                    <Typography variant="body2" color="text.secondary">
                      Loading employee rates...
                    </Typography>
                  </Stack>
                ) : (
                  <TableContainer sx={tableSurfaceSx}>
                    <Table
                      size="small"
                      sx={{
                        minWidth: 2450,
                        ...settingsTableSx,
                        "& .MuiTableCell-root": {
                          ...settingsTableSx["& .MuiTableCell-root"],
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Job Position</TableCell>
                          <TableCell width={170}>Employment Type</TableCell>
                          <TableCell width={160}>Pay Scheme</TableCell>
                          <TableCell width={130}>Base Rate</TableCell>
                          <TableCell width={130}>OT Rate</TableCell>
                          <TableCell width={145}>Allowance / day</TableCell>
                          <TableCell width={240}>Late allowance rule</TableCell>
                          <TableCell width={145}>Employee SSS</TableCell>
                          <TableCell width={165}>Employee PhilHealth</TableCell>
                          <TableCell width={155}>Employee Pag-IBIG</TableCell>
                          <TableCell width={145}>Employer SSS</TableCell>
                          <TableCell width={165}>Employer PhilHealth</TableCell>
                          <TableCell width={155}>Employer Pag-IBIG</TableCell>
                          <TableCell width={110} align="center">
                            Active
                          </TableCell>
                          <TableCell width={190} align="right">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employeeRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={15} align="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ py: 3 }}
                              >
                                No standard rates configured yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          employeeRows.map((row) => {
                            const isPieceRate =
                              row.paySchemeCode === "piece_rate";
                            const activePieceRates = tailorRows.filter(
                              (rate) => rate.isActive,
                            );
                            const pieceRateAmounts = activePieceRates.map(
                              (rate) => rate.rate,
                            );
                            const pieceRateRange =
                              pieceRateAmounts.length > 0
                                ? `${currency.format(Math.min(...pieceRateAmounts))}–${currency.format(Math.max(...pieceRateAmounts))} / piece`
                                : "No active piece rates";
                            const draft = draftEmployeeRates[row.id] ?? {
                              baseRate: String(row.baseRate),
                              overtimeRate: String(row.overtimeRate),
                              allowanceAmount: String(row.allowanceAmount),
                              lateAllowanceEnabled: row.lateAllowanceEnabled,
                              lateAllowanceThreshold: String(
                                row.lateAllowanceThreshold || 3,
                              ),
                              employmentTypeId: row.employmentTypeId,
                              paySchemeId: row.paySchemeId,
                              effectiveFrom: row.effectiveFrom,
                              effectiveTo: row.effectiveTo ?? "",
                              sssAmount:
                                row.sssAmount === null
                                  ? ""
                                  : String(row.sssAmount),
                              sssEmployeeAmount:
                                row.sssEmployeeAmount === null
                                  ? ""
                                  : String(row.sssEmployeeAmount),
                              philhealthAmount:
                                row.philhealthAmount === null
                                  ? ""
                                  : String(row.philhealthAmount),
                              philhealthEmployeeAmount:
                                row.philhealthEmployeeAmount === null
                                  ? ""
                                  : String(row.philhealthEmployeeAmount),
                              pagibigAmount:
                                row.pagibigAmount === null
                                  ? ""
                                  : String(row.pagibigAmount),
                              pagibigEmployeeAmount:
                                row.pagibigEmployeeAmount === null
                                  ? ""
                                  : String(row.pagibigEmployeeAmount),
                              isActive: row.isActive,
                            };
                            const changed =
                              Number(draft.baseRate) !== row.baseRate ||
                              Number(draft.overtimeRate) !== row.overtimeRate ||
                              Number(draft.allowanceAmount) !==
                                row.allowanceAmount ||
                              draft.lateAllowanceEnabled !==
                                row.lateAllowanceEnabled ||
                              Number(draft.lateAllowanceThreshold) !==
                                row.lateAllowanceThreshold ||
                              draft.employmentTypeId !== row.employmentTypeId ||
                              draft.paySchemeId !== row.paySchemeId ||
                              draft.effectiveFrom !== row.effectiveFrom ||
                              draft.effectiveTo !== (row.effectiveTo ?? "") ||
                              nullableNumber(draft.sssAmount) !==
                                row.sssAmount ||
                              nullableNumber(draft.sssEmployeeAmount) !==
                                row.sssEmployeeAmount ||
                              nullableNumber(draft.philhealthAmount) !==
                                row.philhealthAmount ||
                              nullableNumber(draft.philhealthEmployeeAmount) !==
                                row.philhealthEmployeeAmount ||
                              nullableNumber(draft.pagibigAmount) !==
                                row.pagibigAmount ||
                              nullableNumber(draft.pagibigEmployeeAmount) !==
                                row.pagibigEmployeeAmount ||
                              draft.isActive !== row.isActive;

                            const updateDraft = (
                              patch: Partial<typeof draft>,
                            ) =>
                              setDraftEmployeeRates((current) => ({
                                ...current,
                                [row.id]: { ...draft, ...patch },
                              }));

                            const benefitInput = (
                              field:
                                | "sssAmount"
                                | "sssEmployeeAmount"
                                | "philhealthAmount"
                                | "philhealthEmployeeAmount"
                                | "pagibigAmount"
                                | "pagibigEmployeeAmount",
                              label: string,
                            ) =>
                              isPieceRate ? (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label="Not applicable"
                                />
                              ) : (
                                <TextField
                                  size="small"
                                  type="number"
                                  label={label}
                                  value={draft[field]}
                                  placeholder="N/A"
                                  inputProps={{ min: 0, step: "0.01" }}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        ₱
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{ ...rateInputSx, minWidth: 132 }}
                                  onChange={(event) =>
                                    updateDraft({
                                      [field]: event.target.value,
                                    })
                                  }
                                />
                              );

                            return (
                              <TableRow key={row.id} hover>
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                    sx={{ minWidth: 220 }}
                                  >
                                    <SettingIcon
                                      icon={
                                        isPieceRate
                                          ? "bx-purchase-tag"
                                          : "bx-briefcase"
                                      }
                                      color={
                                        isPieceRate ? "warning" : "primary"
                                      }
                                    />
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
                                        {row.jobPosition}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {row.payScheme ?? "No pay scheme"}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    select
                                    size="small"
                                    fullWidth
                                    value={draft.employmentTypeId}
                                    onChange={(event) =>
                                      updateDraft({
                                        employmentTypeId: event.target.value,
                                      })
                                    }
                                  >
                                    {(
                                      configurationQuery.data?.data
                                        .employmentTypes ?? []
                                    )
                                      .filter(
                                        (type) =>
                                          type.isActive ||
                                          type.id === draft.employmentTypeId,
                                      )
                                      .map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                          {type.name}
                                        </MenuItem>
                                      ))}
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    select
                                    size="small"
                                    fullWidth
                                    value={draft.paySchemeId}
                                    onChange={(event) =>
                                      updateDraft({
                                        paySchemeId: event.target.value,
                                      })
                                    }
                                  >
                                    {(
                                      configurationQuery.data?.data
                                        .paySchemes ?? []
                                    )
                                      .filter(
                                        (scheme) =>
                                          scheme.isActive ||
                                          scheme.id === draft.paySchemeId,
                                      )
                                      .map((scheme) => (
                                        <MenuItem
                                          key={scheme.id}
                                          value={scheme.id}
                                        >
                                          {scheme.name}
                                        </MenuItem>
                                      ))}
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  {isPieceRate ? (
                                    <Stack
                                      spacing={0.75}
                                      alignItems="flex-start"
                                    >
                                      <Chip
                                        size="small"
                                        color="primary"
                                        variant="tonal"
                                        label="Piece Rate"
                                      />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {pieceRateRange}
                                      </Typography>
                                      <Button
                                        size="small"
                                        startIcon={
                                          <i className="bx-link-external" />
                                        }
                                        onClick={() =>
                                          setActiveTab("piece-rate-cards")
                                        }
                                      >
                                        View rates
                                      </Button>
                                    </Stack>
                                  ) : (
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={draft.baseRate}
                                      inputProps={{ min: 0, step: "0.01" }}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            ₱
                                          </InputAdornment>
                                        ),
                                      }}
                                      sx={rateInputSx}
                                      onChange={(event) =>
                                        updateDraft({
                                          baseRate: event.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPieceRate ? (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label="Not applicable"
                                    />
                                  ) : (
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Tooltip title="Disable the allowance after the threshold of qualifying late days in this cutoff.">
                                        <Switch
                                          size="small"
                                          checked={draft.lateAllowanceEnabled}
                                          onChange={(event) =>
                                            updateDraft({
                                              lateAllowanceEnabled:
                                                event.target.checked,
                                            })
                                          }
                                        />
                                      </Tooltip>
                                      <TextField
                                        size="small"
                                        type="number"
                                        label="Late days"
                                        value={draft.lateAllowanceThreshold}
                                        disabled={!draft.lateAllowanceEnabled}
                                        inputProps={{
                                          min: 1,
                                          max: 99,
                                          step: 1,
                                        }}
                                        sx={{ ...rateInputSx, minWidth: 96 }}
                                        onChange={(event) =>
                                          updateDraft({
                                            lateAllowanceThreshold:
                                              event.target.value,
                                          })
                                        }
                                      />
                                    </Stack>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPieceRate ? (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label="Not applicable"
                                    />
                                  ) : (
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={draft.overtimeRate}
                                      inputProps={{ min: 0, step: "0.01" }}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            ₱
                                          </InputAdornment>
                                        ),
                                      }}
                                      sx={rateInputSx}
                                      onChange={(event) =>
                                        updateDraft({
                                          overtimeRate: event.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPieceRate ? (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label="Not applicable"
                                    />
                                  ) : (
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={draft.allowanceAmount}
                                      helperText="Per workday"
                                      inputProps={{ min: 0, step: "0.01" }}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            ₱
                                          </InputAdornment>
                                        ),
                                      }}
                                      sx={rateInputSx}
                                      onChange={(event) =>
                                        updateDraft({
                                          allowanceAmount: event.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {benefitInput(
                                    "sssEmployeeAmount",
                                    "Employee SSS",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {benefitInput(
                                    "philhealthEmployeeAmount",
                                    "Employee PhilHealth",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {benefitInput(
                                    "pagibigEmployeeAmount",
                                    "Employee Pag-IBIG",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isPieceRate ? (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label="Not applicable"
                                    />
                                  ) : (
                                    benefitInput("sssAmount", "Employer SSS")
                                  )}
                                </TableCell>
                                <TableCell>
                                  {benefitInput(
                                    "philhealthAmount",
                                    "Employer PhilHealth",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {benefitInput(
                                    "pagibigAmount",
                                    "Employer Pag-IBIG",
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip
                                    title={
                                      row.isActive && !row.canDeactivate
                                        ? `${row.activeEmployeesCount} active employees use this rate`
                                        : "Toggle rate status"
                                    }
                                  >
                                    <span>
                                      <Switch
                                        disabled={
                                          row.isActive && !row.canDeactivate
                                        }
                                        checked={draft.isActive}
                                        onChange={(event) =>
                                          updateDraft({
                                            isActive: event.target.checked,
                                          })
                                        }
                                      />
                                    </span>
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="right">
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-end"
                                  >
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disabled={
                                        !changed ||
                                        updateEmployeeTypeRate.isPending
                                      }
                                      startIcon={<i className="bx-save" />}
                                      onClick={() => saveEmployeeRate(row.id)}
                                    >
                                      Save
                                    </Button>
                                    <Tooltip
                                      title={
                                        row.canDelete
                                          ? "Delete unused rate"
                                          : `${row.matchedEmployeesCount} employee records use this rate`
                                      }
                                    >
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          disabled={
                                            !row.canDelete ||
                                            deleteEmployeeTypeRate.isPending
                                          }
                                          onClick={() =>
                                            setDeleteTarget({
                                              kind: "employee-rate",
                                              id: row.id,
                                              name: `${row.jobPosition} · ${row.employmentType}`,
                                            })
                                          }
                                        >
                                          <i className="bx bx-trash" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            )}

            {activeTab === "piece-rate-cards" && (
              <Stack spacing={4}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <SettingIcon icon={settingIconByTab["piece-rate-cards"]} />
                    <Box>
                      <Typography variant="h5">Tailor Piece Rates</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved production output uses the stored rate from the
                        piece when payroll is prepared.
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    color="primary"
                    variant="tonal"
                    label={`${tailorRows.length} piece types`}
                    sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
                  />
                </Stack>

                {tailorRatesQuery.isError && (
                  <Alert severity="error">
                    Tailor piece rates could not be loaded.
                  </Alert>
                )}

                {tailorRatesQuery.isPending ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={22} />
                    <Typography variant="body2" color="text.secondary">
                      Loading rates...
                    </Typography>
                  </Stack>
                ) : (
                  <TableContainer sx={tableSurfaceSx}>
                    <Table
                      size="small"
                      sx={{ minWidth: 760, ...settingsTableSx }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Piece Type</TableCell>
                          <TableCell width={180} align="right">
                            Current Rate
                          </TableCell>
                          <TableCell width={190}>Edit Rate</TableCell>
                          <TableCell width={120} align="center">
                            Active
                          </TableCell>
                          <TableCell width={120} align="right">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tailorRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ py: 3 }}
                              >
                                No tailor piece rates configured yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          tailorRows.map((row) => {
                            const draft = draftTailorRates[row.id] ?? {
                              rate: String(row.rate),
                              isActive: row.isActive,
                            };
                            const changed =
                              Number(draft.rate) !== row.rate ||
                              draft.isActive !== row.isActive;

                            return (
                              <TableRow key={row.id} hover>
                                <TableCell>
                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                  >
                                    <SettingIcon
                                      icon="bx-purchase-tag"
                                      color={
                                        row.isActive ? "warning" : "secondary"
                                      }
                                    />
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
                                        {row.pieceType}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Tailor output item
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell align="right">
                                  {currency.format(row.rate)}
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={draft.rate}
                                    inputProps={{ min: 0, step: "0.01" }}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          ₱
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={rateInputSx}
                                    onChange={(event) =>
                                      setDraftTailorRates((current) => ({
                                        ...current,
                                        [row.id]: {
                                          ...draft,
                                          rate: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Switch
                                    checked={draft.isActive}
                                    onChange={(event) =>
                                      setDraftTailorRates((current) => ({
                                        ...current,
                                        [row.id]: {
                                          ...draft,
                                          isActive: event.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disabled={
                                      !changed || updateTailorRate.isPending
                                    }
                                    startIcon={<i className="bx-save" />}
                                    onClick={() => saveTailorRate(row.id)}
                                  >
                                    Save
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>

      <WorkflowStatusDialog
        open={Boolean(deleteTarget)}
        title="Delete configuration?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be permanently removed. This is only allowed when no employee or historical record depends on it.`
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        isSaving={
          deleteJobPosition.isPending ||
          deleteEmploymentType.isPending ||
          deleteEmployeeTypeRate.isPending
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
};

export default EmployeeSettingsView;
