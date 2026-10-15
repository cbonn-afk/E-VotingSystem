"use client";

import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomTable, {
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomDatePicker from "@components/app/CustomDatePicker";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import type { OvertimeResource, OvertimeStatus } from "../../api/types";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import WorkflowStatusDialog from "../../components/shared/WorkflowStatusDialog";
import { formatCurrency } from "../../components/shared/statusUtils";
import { getOvertimeTableColumns } from "../../components/overtime/OvertimeTableColumns";
import {
  useBatchUpdateOvertimeStatus,
  useOvertimeEmployeeOptions,
  useOvertimes,
  useUpdateOvertimeStatus,
} from "../../hooks/useEmployeesApi";

type OvertimeDecision = {
  row: OvertimeResource;
  status: Exclude<OvertimeStatus, "Pending">;
};

const OvertimeView = () => {
  const authorization = useAuthorization();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OvertimeStatus | "">("");
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [source, setSource] = useState<"" | "Attendance Candidate" | "Manual">(
    "",
  );
  const [paginationModel, setPaginationModel] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [decision, setDecision] = useState<OvertimeDecision | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [batchDecision, setBatchDecision] = useState<
    "Approved" | "Rejected" | null
  >(null);

  const debouncedSearch = useDebouncedValue(query.trim(), 350);
  const overtimeQuery = useOvertimes({
    search: debouncedSearch,
    status: status || undefined,
    employee_id: employeeId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    source: source || undefined,
    per_page: 100,
  });
  const employeeOptionsQuery = useOvertimeEmployeeOptions();
  const updateStatus = useUpdateOvertimeStatus();
  const batchUpdateStatus = useBatchUpdateOvertimeStatus();
  const canApprove = authorization.can("employees.overtime.approve");
  const isSaving = updateStatus.isPending || batchUpdateStatus.isPending;

  const rows = overtimeQuery.data?.data ?? [];
  const employeeOptions = employeeOptionsQuery.data?.data ?? [];
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesStatus = !status || row.status === status;
        const matchesEmployee = !employeeId || row.employeeId === employeeId;
        const matchesSource =
          !source ||
          (source === "Attendance Candidate"
            ? row.isAttendanceCandidate
            : !row.isAttendanceCandidate);
        const matchesFrom = !dateFrom || row.workDate >= dateFrom;
        const matchesTo = !dateTo || row.workDate <= dateTo;

        return (
          matchesStatus &&
          matchesEmployee &&
          matchesSource &&
          matchesFrom &&
          matchesTo
        );
      }),
    [dateFrom, dateTo, employeeId, rows, source, status],
  );
  const hasFilters = Boolean(
    query || employeeId || status || source || dateFrom || dateTo,
  );
  const pendingCount = filteredRows.filter(
    (row) => row.status === "Pending",
  ).length;
  const approvedCount = filteredRows.filter(
    (row) => row.status === "Approved",
  ).length;
  const selectedPendingIds = selectedRowIds.filter((id) =>
    filteredRows.some((row) => row.id === id && row.status === "Pending"),
  );
  const totalAmount = filteredRows.reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  useEffect(() => {
    setPaginationModel((current) =>
      current.page === 0 ? current : { ...current, page: 0 },
    );
    setSelectedRowIds([]);
  }, [debouncedSearch, employeeId, status, source, dateFrom, dateTo]);

  const confirmDecision = () => {
    if (!decision) return;

    updateStatus
      .mutateAsync({
        id: decision.row.id,
        payload: { status: decision.status, resolution_notes: null },
      })
      .then(() => {
        toast.success(`Overtime ${decision.status.toLowerCase()}.`);
        setDecision(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Overtime status could not be updated.",
        ),
      );
  };

  const confirmBatchDecision = () => {
    if (!batchDecision || selectedPendingIds.length === 0) return;

    batchUpdateStatus
      .mutateAsync({ ids: selectedPendingIds, status: batchDecision })
      .then(() => {
        toast.success(
          `${selectedPendingIds.length} overtime request${selectedPendingIds.length === 1 ? "" : "s"} ${batchDecision.toLowerCase()}.`,
        );
        setSelectedRowIds([]);
        setBatchDecision(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Overtime requests could not be updated.",
        ),
      );
  };

  const columns = useMemo(
    () =>
      getOvertimeTableColumns({
        canApprove,
        isSaving,
        onDecision: (row, status) => setDecision({ row, status }),
      }),
    [canApprove, isSaving],
  );

  return (
    <Stack spacing={5} sx={{ width: "100%" }}>
      <EmployeesPageHeader
        title="Overtime"
        description="Review overtime requests before payroll and process pending records in batches."
      >
        <Chip
          color={pendingCount > 0 ? "warning" : "success"}
          variant="tonal"
          icon={
            <i
              className={
                pendingCount > 0 ? "bx bx-time-five" : "bx bx-check-circle"
              }
            />
          }
          label={`${pendingCount} pending`}
        />
      </EmployeesPageHeader>

      {overtimeQuery.isError && (
        <Alert severity="error">Overtime requests could not be loaded.</Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {[
          {
            label: "Total Requests",
            value: filteredRows.length,
            icon: "bx-list-check",
            color: "primary.main",
          },
          {
            label: "Pending Review",
            value: pendingCount,
            icon: "bx-time-five",
            color: "warning.main",
          },
          {
            label: "Approved",
            value: approvedCount,
            icon: "bx-check-circle",
            color: "success.main",
          },
          {
            label: "Total Amount",
            value: formatCurrency(totalAmount),
            icon: "bx-money",
            color: "info.main",
          },
        ].map((item) => (
          <Paper key={item.label} sx={{ p: 2.25 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  color: item.color,
                }}
              >
                <i className={`bx ${item.icon}`} style={{ fontSize: 21 }} />
              </Box>
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight={750} noWrap>
                  {item.value}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack spacing={0.25}>
              <Typography variant="subtitle1" fontWeight={700}>
                Filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Narrow overtime requests by employee, date, source, or status.
              </Typography>
            </Stack>
            {hasFilters && (
              <Button
                size="small"
                color="secondary"
                variant="outlined"
                startIcon={<i className="bx bx-reset" />}
                onClick={() => {
                  setQuery("");
                  setEmployeeId("");
                  setStatus("");
                  setSource("");
                  setDateFrom("");
                  setDateTo("");
                  setSelectedRowIds([]);
                }}
              >
                Clear filters
              </Button>
            )}
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "minmax(240px, 1.5fr) repeat(5, minmax(140px, 1fr))",
              },
              gap: 2,
              alignItems: "end",
              "& > *": { minWidth: 0 },
              "& .react-datepicker-wrapper": { width: "100%" },
            }}
          >
            <TextField
              size="small"
              label="Search overtime"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="bx bx-search" />
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              size="small"
              options={employeeOptions}
              value={
                employeeOptions.find(
                  (employee) => employee.id === employeeId,
                ) ?? null
              }
              loading={employeeOptionsQuery.isPending}
              getOptionLabel={(employee) =>
                `${employee.fullName} · ${employee.employeeNo}`
              }
              isOptionEqualToValue={(employee, value) =>
                employee.id === value.id
              }
              onChange={(_, employee) => setEmployeeId(employee?.id ?? "")}
              renderInput={(inputProps) => (
                <TextField
                  {...inputProps}
                  label="Employee"
                  placeholder="All employees"
                />
              )}
            />
            <CustomDatePicker
              label="From"
              value={dateFrom}
              onChange={setDateFrom}
              isClearable
            />
            <CustomDatePicker
              label="To"
              value={dateTo}
              onChange={setDateTo}
              isClearable
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as OvertimeStatus | "")
              }
            >
              <MenuItem value="">All statuses</MenuItem>
              {(["Pending", "Approved", "Rejected", "Cancelled"] as const).map(
                (option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ),
              )}
            </TextField>
            <TextField
              select
              size="small"
              label="Source"
              value={source}
              onChange={(event) =>
                setSource(
                  event.target.value as "" | "Attendance Candidate" | "Manual",
                )
              }
            >
              <MenuItem value="">All sources</MenuItem>
              <MenuItem value="Attendance Candidate">
                Attendance Candidate
              </MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
            </TextField>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: "center" }}
          className="p-5 pb-0"
        >
          <Stack spacing={0.5}>
            <Typography variant="h5">Overtime Requests</Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredRows.length} request
              {filteredRows.length === 1 ? "" : "s"} shown. Select pending rows
              for batch review.
            </Typography>
          </Stack>
          {canApprove && selectedPendingIds.length > 0 && (
            <ButtonGroup
              size="medium"
              variant="text"
              aria-label="Batch overtime actions"
              sx={{
                flexShrink: 0,
                width: { xs: "100%", lg: "auto" },
                "& .MuiButton-root": {
                  minWidth: { xs: 0, sm: 120 },
                  minHeight: 42,
                  px: 1.75,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flex: { xs: 1, sm: "initial" },
                },
              }}
            >
              <Button
                variant="tonal"
                color="info"
                tabIndex={-1}
                disableRipple
                startIcon={<i className="bx bx-select-multiple" />}
                aria-label={`${selectedPendingIds.length} overtime requests selected`}
                sx={{ cursor: "default" }}
              >
                {selectedPendingIds.length} selected
              </Button>
              <Button
                variant="tonal"
                color="success"
                disabled={isSaving}
                startIcon={<i className="bx bx-check-double" />}
                onClick={() => setBatchDecision("Approved")}
              >
                Approve
              </Button>
              <Button
                variant="tonal"
                color="error"
                disabled={isSaving}
                startIcon={<i className="bx bx-x" />}
                onClick={() => setBatchDecision("Rejected")}
              >
                Reject
              </Button>
            </ButtonGroup>
          )}
        </Stack>
        <CustomTable
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={overtimeQuery.isPending}
          emptyTitle="No overtime requests"
          emptyDescription="Approved attendance overtime candidates will appear here."
          checkboxSelection={canApprove}
          selectedRowIds={selectedRowIds}
          onSelectedRowIdsChange={setSelectedRowIds}
          isRowSelectable={(params) =>
            canApprove && params.row.status === "Pending"
          }
          getRowHeight={() => 64}
          sx={{
            "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <WorkflowStatusDialog
        open={Boolean(decision)}
        title={`${decision?.status ?? "Update"} overtime?`}
        description={
          decision
            ? `${decision.row.employee?.fullName ?? decision.row.employeeName ?? "This employee"}'s overtime will be marked ${decision.status.toLowerCase()}.`
            : ""
        }
        confirmLabel={decision?.status ?? "Confirm"}
        confirmColor={decision?.status === "Approved" ? "success" : "error"}
        isSaving={updateStatus.isPending}
        onClose={() => {
          if (!updateStatus.isPending) setDecision(null);
        }}
        onConfirm={confirmDecision}
      />

      <WorkflowStatusDialog
        open={Boolean(batchDecision)}
        title={`${batchDecision ?? "Update"} selected overtime?`}
        description={`${selectedPendingIds.length} pending overtime request${selectedPendingIds.length === 1 ? "" : "s"} will be marked ${batchDecision?.toLowerCase() ?? "updated"}.`}
        confirmLabel={batchDecision ?? "Confirm"}
        confirmColor={batchDecision === "Approved" ? "success" : "error"}
        isSaving={batchUpdateStatus.isPending}
        onClose={() => {
          if (!batchUpdateStatus.isPending) setBatchDecision(null);
        }}
        onConfirm={confirmBatchDecision}
      />
    </Stack>
  );
};

export default OvertimeView;
