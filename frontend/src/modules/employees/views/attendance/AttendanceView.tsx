"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomDatePicker from "@components/app/CustomDatePicker";
import CustomTimePicker from "@components/app/CustomTimePicker";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import type {
  AttendanceDayResource,
  AttendanceImportBatchResource,
  AttendanceImportRowResource,
  BiometricIdentityResource,
} from "../../api/types";
import AttendanceImportDialog from "../../components/attendance/AttendanceImportDialog";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import { CellBox, TableAvatar } from "../../components/shared/statusUtils";
import {
  useAttendanceDays,
  useAttendanceImportBatch,
  useAttendanceImports,
  useAttendanceEmployeeOptions,
  useAttendanceSchedule,
  useBiometricMappings,
  useCorrectAttendanceDay,
  useUpdateAttendanceDayStatus,
  useUpdateAttendanceSchedule,
} from "../../hooks/useEmployeesApi";

const tabs = [
  "Attendance Register",
  "Shift Schedule",
  "Import Batches",
  "Exceptions",
  "ID Mapping",
];
const hours = (minutes: number) => `${(minutes / 60).toFixed(2)}h`;
const localTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      })
    : "—";
const inputTime = (iso: string | null) => {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Manila",
  }).formatToParts(new Date(iso));
  return `${parts.find((part) => part.type === "hour")?.value ?? ""}:${parts.find((part) => part.type === "minute")?.value ?? ""}`;
};
const todayManila = () =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date());
const weekday = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PH", { weekday: "short" });
};

// Centered time value; dims to a placeholder dash when no punch was recorded.
const TimeCell = ({ iso }: { iso: string | null }) => (
  <CellBox justify="center">
    <Typography
      variant="body2"
      sx={{
        fontVariantNumeric: "tabular-nums",
        color: iso ? "text.primary" : "text.disabled",
      }}
    >
      {localTime(iso)}
    </Typography>
  </CellBox>
);

// Right-aligned metric; `warn` highlights a non-zero late/undertime figure.
const MetricCell = ({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "muted" | "warn";
}) => (
  <CellBox justify="flex-end">
    <Typography
      variant="body2"
      sx={{
        fontVariantNumeric: "tabular-nums",
        fontWeight: 500,
        color:
          tone === "warn"
            ? "warning.main"
            : tone === "muted"
              ? "text.disabled"
              : "text.primary",
      }}
    >
      {text}
    </Typography>
  </CellBox>
);

const AttendanceView = () => {
  const authorization = useAuthorization();
  const [tab, setTab] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [correctionDay, setCorrectionDay] =
    useState<AttendanceDayResource | null>(null);
  const [voidDay, setVoidDay] = useState<AttendanceDayResource | null>(null);
  const [timeIn, setTimeIn] = useState("");
  const [lunchOut, setLunchOut] = useState("");
  const [lunchIn, setLunchIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    name: "Regular Shift",
    shiftStart: "08:00",
    shiftEnd: "17:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
    overtimeStartTime: "18:00",
    overtimeMinimumRegularHours: 8,
    gracePeriodMinutes: 5,
    effectiveFrom: todayManila(),
  });
  const [reason, setReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({
    page: 0,
    pageSize: 30,
  });

  const params = {
    per_page: 100,
    employee_id: employeeId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    status: status || undefined,
    source: source || undefined,
  };
  const attendance = useAttendanceDays(params);
  const schedule = useAttendanceSchedule();
  const imports = useAttendanceImports({ per_page: 100 });
  const batch = useAttendanceImportBatch(batchId);
  const mappings = useBiometricMappings({ per_page: 100 });
  const employees = useAttendanceEmployeeOptions();
  const updateDay = useUpdateAttendanceDayStatus();
  const updateSchedule = useUpdateAttendanceSchedule();
  const correctAttendance = useCorrectAttendanceDay();
  const days = attendance.data?.data ?? [];
  const exceptions = days.filter(
    (day) => day.calculationStatus === "Needs Review",
  );

  useEffect(() => {
    const value = schedule.data?.data;
    if (!value) return;
    setScheduleForm({
      name: value.name,
      shiftStart: value.shiftStart,
      shiftEnd: value.shiftEnd,
      lunchStart: value.lunchStart,
      lunchEnd: value.lunchEnd,
      overtimeStartTime: value.overtimeStartTime,
      overtimeMinimumRegularHours: value.overtimeMinimumRegularMinutes / 60,
      gracePeriodMinutes: value.gracePeriodMinutes,
      effectiveFrom: todayManila(),
    });
  }, [schedule.data?.data]);

  const dayColumns = useMemo<CustomTableColumn<AttendanceDayResource>[]>(
    () => [
      {
        id: "employee",
        label: "Employee",
        minWidth: 220,
        flex: 1.2,
        render: (row) => (
          <CellBox>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TableAvatar name={row.employee?.fullName ?? "—"} />
              <Stack sx={{ minWidth: 0 }}>
                <Typography fontWeight={600} noWrap>
                  {row.employee?.fullName ?? "—"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace" }}
                >
                  {row.employee?.employeeNo ?? "—"}
                </Typography>
              </Stack>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "workDate",
        label: "Date",
        minWidth: 130,
        render: (row) => (
          <CellBox>
            <Stack>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {row.workDate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {weekday(row.workDate)}
              </Typography>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "shiftIn",
        label: "Shift In",
        minWidth: 100,
        align: "center",
        render: (row) => <TimeCell iso={row.firstTimeIn} />,
      },
      {
        id: "lunchOut",
        label: "Lunch Out",
        minWidth: 100,
        align: "center",
        render: (row) => <TimeCell iso={row.lunchOut} />,
      },
      {
        id: "lunchIn",
        label: "Lunch In",
        minWidth: 100,
        align: "center",
        render: (row) => <TimeCell iso={row.lunchIn} />,
      },
      {
        id: "shiftOut",
        label: "Shift Out",
        minWidth: 100,
        align: "center",
        render: (row) => <TimeCell iso={row.lastTimeOut} />,
      },
      {
        id: "worked",
        label: "Worked",
        minWidth: 90,
        align: "right",
        render: (row) => <MetricCell text={`${hours(row.payableMinutes)} `} />,
      },
      {
        id: "break",
        label: "Break",
        minWidth: 90,
        align: "right",
        render: (row) => (
          <MetricCell
            text={hours(row.breakMinutes)}
            tone={row.breakMinutes > 0 ? "default" : "muted"}
          />
        ),
      },
      {
        id: "late",
        label: "Late",
        minWidth: 100,
        align: "right",
        render: (row) => (
          <MetricCell
            text={`${hours(row.lateMinutes)} `}
            tone={row.lateMinutes > 0 ? "warn" : "muted"}
          />
        ),
      },
      {
        id: "undertime",
        label: "Undertime",
        minWidth: 100,
        align: "right",
        render: (row) => (
          <MetricCell
            text={`${row.undertimeMinutes}m`}
            tone={row.undertimeMinutes > 0 ? "warn" : "muted"}
          />
        ),
      },
      {
        id: "status",
        label: "Status",
        minWidth: 210,
        flex: 1,
        render: (row) => {
          const isVoided = row.approvalStatus === "Voided";
          const statusLabel = isVoided
            ? "Voided"
            : row.calculationStatus === "Needs Review"
              ? "Needs Review"
              : row.source === "Adjusted"
                ? "Corrected"
                : "Ready";
          return (
            <CellBox>
              <Stack spacing={0.5} sx={{ py: 0.75, minWidth: 0 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip
                    size="small"
                    variant="tonal"
                    color={
                      isVoided
                        ? "secondary"
                        : row.calculationStatus === "Needs Review"
                          ? "warning"
                          : "success"
                    }
                    label={statusLabel}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <i className="bx bx-wallet" style={{ fontSize: "0.9rem" }} />
                  {row.payrollStatus}
                </Typography>
              </Stack>
            </CellBox>
          );
        },
      },
      {
        id: "actions",
        label: "Actions",
        minWidth: 200,
        align: "right",
        render: (row) => {
          const locked = row.payrollStatus !== "Available";
          const isVoided = row.approvalStatus === "Voided";
          const canCorrect =
            !isVoided &&
            !locked &&
            authorization.can("employees.attendance.update");
          const canVoid =
            !locked &&
            !isVoided &&
            authorization.can("employees.attendance.approve");
          const canRestore =
            !locked &&
            isVoided &&
            authorization.can("employees.attendance.approve");
          const hasAction = canCorrect || canVoid || canRestore;

          return (
            <CellBox justify="flex-end">
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                justifyContent="flex-end"
              >
                {canCorrect && (
                  <Tooltip title="Resolve this exception">
                    <Button
                      size="small"
                      variant="tonal"
                      color="warning"
                      startIcon={<i className="bx bx-wrench" />}
                      onClick={() => {
                        setCorrectionDay(row);
                        setTimeIn(inputTime(row.firstTimeIn));
                        setLunchOut(inputTime(row.lunchOut));
                        setLunchIn(inputTime(row.lunchIn));
                        setTimeOut(inputTime(row.lastTimeOut));
                        setReason(row.anomalyFlags.join(", "));
                      }}
                    >
                      Correct
                    </Button>
                  </Tooltip>
                )}
                {canRestore && (
                  <Tooltip title="Restore this voided day">
                    <Button
                      size="small"
                      variant="tonal"
                      color="secondary"
                      disabled={updateDay.isPending}
                      startIcon={<i className="bx bx-undo" />}
                      onClick={() =>
                        updateDay.mutate(
                          { id: row.id, status: "Approved" },
                          {
                            onSuccess: () =>
                              toast.success("Attendance day restored."),
                            onError: (error) => toast.error(error.message),
                          },
                        )
                      }
                    >
                      Restore
                    </Button>
                  </Tooltip>
                )}
                {canVoid && (
                  <Tooltip title="Void this attendance day">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setVoidDay(row)}
                    >
                      <i className="bx bx-x-circle" />
                    </IconButton>
                  </Tooltip>
                )}
                {!hasAction && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {locked ? (
                      <>
                        <i className="bx bx-lock-alt" /> Locked
                      </>
                    ) : (
                      "—"
                    )}
                  </Typography>
                )}
              </Stack>
            </CellBox>
          );
        },
      },
    ],
    [authorization, updateDay],
  );

  const batchColumns = useMemo<
    CustomTableColumn<AttendanceImportBatchResource>[]
  >(
    () => [
      { id: "originalFilename", label: "Filename", minWidth: 250, flex: 1 },
      {
        id: "period",
        label: "Period",
        minWidth: 190,
        render: (row) => `${row.periodStart} – ${row.periodEnd}`,
      },
      {
        id: "status",
        label: "Status",
        minWidth: 180,
        render: (row) => (
          <Chip
            size="small"
            color={row.invalidRows || row.unmatchedRows ? "warning" : "success"}
            label={row.status}
          />
        ),
      },
      {
        id: "counts",
        label: "Imported / Duplicate / Invalid / Unmatched",
        minWidth: 270,
        render: (row) =>
          `${row.importedRows} / ${row.duplicateRows} / ${row.invalidRows} / ${row.unmatchedRows}`,
      },
      { id: "uploadedBy", label: "Uploaded by", minWidth: 140 },
      {
        id: "actions",
        label: "",
        width: 100,
        align: "right",
        render: (row) => (
          <Button size="small" onClick={() => setBatchId(row.id)}>
            Details
          </Button>
        ),
      },
    ],
    [],
  );

  const mappingColumns = useMemo<
    CustomTableColumn<BiometricIdentityResource>[]
  >(
    () => [
      { id: "employeeName", label: "ERP Employee", minWidth: 220 },
      { id: "deviceName", label: "Device", minWidth: 200 },
      { id: "externalUserId", label: "Biometric ID", minWidth: 150 },
      { id: "externalDisplayName", label: "Scanner Name", minWidth: 200 },
      { id: "effectiveFrom", label: "Effective From", minWidth: 130 },
      {
        id: "status",
        label: "Status",
        minWidth: 110,
        render: (row) => (
          <Chip
            size="small"
            color={row.status === "Active" ? "success" : "default"}
            label={row.status}
          />
        ),
      },
    ],
    [],
  );

  const submitCorrection = async () => {
    if (!correctionDay || !timeIn || !lunchOut || !lunchIn || !timeOut) return;
    try {
      await correctAttendance.mutateAsync({
        id: correctionDay.id,
        payload: {
          time_in: timeIn,
          lunch_out: lunchOut,
          lunch_in: lunchIn,
          time_out: timeOut,
          reason: reason || null,
        },
      });
      toast.success("Attendance correction saved.");
      setCorrectionDay(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Attendance correction could not be saved.",
      );
    }
  };

  const saveSchedule = async () => {
    try {
      await updateSchedule.mutateAsync({
        name: scheduleForm.name,
        shift_start: scheduleForm.shiftStart,
        shift_end: scheduleForm.shiftEnd,
        lunch_start: scheduleForm.lunchStart,
        lunch_end: scheduleForm.lunchEnd,
        overtime_start_time: scheduleForm.overtimeStartTime,
        overtime_minimum_regular_minutes: Math.round(
          scheduleForm.overtimeMinimumRegularHours * 60,
        ),
        grace_period_minutes: scheduleForm.gracePeriodMinutes,
        effective_from: scheduleForm.effectiveFrom,
      });
      toast.success("Attendance schedule saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Schedule could not be saved.",
      );
    }
  };

  return (
    <Stack spacing={4}>
      <EmployeesPageHeader
        title="Attendance"
        description="Imported attendance is ready automatically; only exceptions need attention."
      >
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
          <Can permission="employees.attendance.import">
            <Button
              variant="contained"
              startIcon={<i className="bx bx-upload" />}
              onClick={() => setImportOpen(true)}
            >
              Import Time Report
            </Button>
          </Can>
        </Stack>
      </EmployeesPageHeader>

      <Paper>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Paper>

      {(tab === 0 || tab === 3) && (
        <Stack spacing={2}>
          <Paper className="p-4">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(5, 1fr)",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Autocomplete
                size="small"
                fullWidth
                options={employees.data?.data ?? []}
                value={
                  (employees.data?.data ?? []).find(
                    (employee) => employee.id === employeeId,
                  ) ?? null
                }
                loading={employees.isPending}
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
                    placeholder="Search employee…"
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
                onChange={(event) => setStatus(event.target.value)}
              >
                <MenuItem value="">All statuses</MenuItem>
                {[
                  ["Complete", "Ready"],
                  ["Needs Review", "Needs Review"],
                  ["Voided", "Voided"],
                  ["Reserved", "Reserved"],
                  ["Included in Payroll", "Included in Payroll"],
                ].map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                <MenuItem value="">All sources</MenuItem>
                <MenuItem value="Biometric">Biometric</MenuItem>
                <MenuItem value="Adjusted">Adjusted</MenuItem>
              </TextField>
            </Box>
          </Paper>
          {attendance.isError && (
            <Alert severity="error">
              Attendance records could not be loaded.
            </Alert>
          )}
          <Paper sx={{ overflow: "hidden" }}>
            <CustomTable
              rows={tab === 3 ? exceptions : days}
              columns={dayColumns}
              getRowId={(row) => row.id}
              paginationModel={pagination}
              onPaginationModelChange={setPagination}
              loading={attendance.isPending}
              emptyTitle={
                tab === 3 ? "No attendance exceptions" : "No attendance records"
              }
              emptyDescription={
                tab === 3
                  ? "Imported anomalies will appear here."
                  : "Confirm a biometric import to populate the register."
              }
              getRowHeight={() => 64}
              sx={{
                "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                  outline: "none",
                },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
              }}
            />
          </Paper>
        </Stack>
      )}

      {tab === 1 && (
        <Paper className="p-5">
          <Stack spacing={4}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              spacing={2}
            >
              <Stack spacing={0.5}>
                <Typography variant="h5">Shift Schedule</Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure shift and lunch punches in Asia/Manila. Effective
                  dates preserve historical attendance.
                </Typography>
              </Stack>
              {schedule.data?.data && (
                <Chip
                  color="primary"
                  variant="tonal"
                  label={`Effective ${schedule.data.data.effectiveFrom}`}
                />
              )}
            </Stack>

            {schedule.isError && (
              <Alert severity="error">
                The attendance schedule could not be loaded.
              </Alert>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 3,
                maxWidth: 760,
              }}
            >
              <TextField
                size="small"
                label="Schedule Name"
                value={scheduleForm.name}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(event) =>
                  setScheduleForm((value) => ({
                    ...value,
                    name: event.target.value,
                  }))
                }
              />
              <CustomDatePicker
                label="Effective From"
                value={scheduleForm.effectiveFrom}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(effectiveFrom) =>
                  setScheduleForm((value) => ({ ...value, effectiveFrom }))
                }
              />
              <CustomTimePicker
                label="Shift Start"
                value={scheduleForm.shiftStart}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(shiftStart) =>
                  setScheduleForm((value) => ({ ...value, shiftStart }))
                }
              />
              <CustomTimePicker
                label="Shift End"
                value={scheduleForm.shiftEnd}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(shiftEnd) =>
                  setScheduleForm((value) => ({ ...value, shiftEnd }))
                }
              />
              <CustomTimePicker
                label="Lunch Out"
                value={scheduleForm.lunchStart}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(lunchStart) =>
                  setScheduleForm((value) => ({ ...value, lunchStart }))
                }
              />
              <CustomTimePicker
                label="Lunch In"
                value={scheduleForm.lunchEnd}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(lunchEnd) =>
                  setScheduleForm((value) => ({ ...value, lunchEnd }))
                }
              />
              <TextField
                size="small"
                type="number"
                label="Grace Period (minutes)"
                inputProps={{ min: 0, max: 120 }}
                value={scheduleForm.gracePeriodMinutes}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(event) =>
                  setScheduleForm((value) => ({
                    ...value,
                    gracePeriodMinutes: Number(event.target.value),
                  }))
                }
              />
              <CustomTimePicker
                label="Overtime Starts"
                value={scheduleForm.overtimeStartTime}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(overtimeStartTime) =>
                  setScheduleForm((value) => ({ ...value, overtimeStartTime }))
                }
              />
              <TextField
                size="small"
                type="number"
                label="Minimum Regular Hours Before OT"
                helperText="OT counts only after both this threshold and the overtime start time."
                inputProps={{ min: 0.25, max: 24, step: 0.25 }}
                value={scheduleForm.overtimeMinimumRegularHours}
                disabled={!authorization.can("employees.settings.manage")}
                onChange={(event) =>
                  setScheduleForm((value) => ({
                    ...value,
                    overtimeMinimumRegularHours: Number(event.target.value),
                  }))
                }
              />
            </Box>

            {authorization.can("employees.settings.manage") && (
              <Stack direction="row">
                <Button
                  variant="contained"
                  startIcon={<i className="bx bx-save" />}
                  disabled={updateSchedule.isPending || schedule.isPending}
                  onClick={saveSchedule}
                >
                  Save Schedule
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ overflow: "hidden" }}>
          <CustomTable
            rows={imports.data?.data ?? []}
            columns={batchColumns}
            getRowId={(row) => row.id}
            loading={imports.isPending}
            emptyTitle="No import batches"
            emptyDescription="Imported XLS or XLSX reports will appear here."
          />
        </Paper>
      )}
      {tab === 4 && (
        <Paper sx={{ overflow: "hidden" }}>
          <CustomTable
            rows={mappings.data?.data ?? []}
            columns={mappingColumns}
            getRowId={(row) => row.id}
            loading={mappings.isPending}
            emptyTitle="No ID mappings"
            emptyDescription="Mappings saved during import will appear here."
          />
        </Paper>
      )}

      <AttendanceImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <Dialog
        open={Boolean(voidDay)}
        onClose={() => (updateDay.isPending ? undefined : setVoidDay(null))}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Void attendance day</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning">
            This drops <strong>{voidDay?.employee?.fullName}</strong>&apos;s
            attendance for <strong>{voidDay?.workDate}</strong> from payroll.
            The record and its punches are kept, and you can restore it later.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVoidDay(null)}
            disabled={updateDay.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={updateDay.isPending}
            startIcon={<i className="bx bx-x-circle" />}
            onClick={() => {
              if (!voidDay) return;
              updateDay.mutate(
                { id: voidDay.id, status: "Voided" },
                {
                  onSuccess: () => {
                    toast.success("Attendance day voided.");
                    setVoidDay(null);
                  },
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
          >
            Void day
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(correctionDay)}
        onClose={() => setCorrectionDay(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Correct attendance · {correctionDay?.employee?.fullName}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="warning">
              {correctionDay?.anomalyFlags.join(", ") ||
                "Review the attendance times before saving."}
              <br />
              Saving applies the correction immediately. The day is recalculated
              and becomes ready for payroll when the punches are valid.
            </Alert>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <CustomTimePicker
                label="Correct Time In"
                value={timeIn}
                onChange={setTimeIn}
              />
              <CustomTimePicker
                label="Lunch Out"
                value={lunchOut}
                onChange={setLunchOut}
              />
              <CustomTimePicker
                label="Lunch In"
                value={lunchIn}
                onChange={setLunchIn}
              />
              <CustomTimePicker
                label="Correct Time Out"
                value={timeOut}
                onChange={setTimeOut}
              />
            </Box>
            <TextField
              multiline
              minRows={3}
              label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrectionDay(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              !timeIn ||
              !lunchOut ||
              !lunchIn ||
              !timeOut ||
              correctAttendance.isPending
            }
            onClick={submitCorrection}
          >
            Save correction
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(batchId)}
        onClose={() => setBatchId("")}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Import Batch Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {batch.data?.data && (
              <>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>
                    <strong>{batch.data.data.originalFilename}</strong> ·{" "}
                    {batch.data.data.periodStart} – {batch.data.data.periodEnd}
                  </Typography>
                  <Button
                    component="a"
                    href={`${process.env.NEXT_PUBLIC_API_URL}/api/employees/attendance/imports/${batch.data.data.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<i className="bx bx-download" />}
                  >
                    Original file
                  </Button>
                </Stack>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  Checksum: {batch.data.data.checksum}
                </Typography>
                <CustomTable<AttendanceImportRowResource>
                  rows={batch.data.data.rows ?? []}
                  columns={[
                    { id: "sourceRowNumber", label: "Row", width: 70 },
                    { id: "workDate", label: "Date", minWidth: 120 },
                    {
                      id: "externalEmployeeName",
                      label: "Scanner Employee",
                      minWidth: 180,
                    },
                    {
                      id: "time",
                      label: "IN / OUT",
                      minWidth: 130,
                      render: (row) =>
                        `${row.timeIn ?? "—"} / ${row.timeOut ?? "—"}`,
                    },
                    { id: "status", label: "Status", minWidth: 150 },
                    {
                      id: "errorMessage",
                      label: "Result",
                      minWidth: 240,
                      flex: 1,
                    },
                  ]}
                  getRowId={(row) => row.id}
                  emptyTitle="No rows"
                  emptyDescription="This batch has no source rows."
                  density="compact"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchId("")}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default AttendanceView;
