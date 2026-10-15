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
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomTable, {
  type CustomTableColumn,
} from "@components/app/CustomTable";
import type {
  AttendanceImportPreview,
  AttendanceImportPreviewRow,
  AttendanceEmployeeOption,
} from "../../api/types";
import {
  useConfirmAttendanceImport,
  useAttendanceEmployeeOptions,
  usePreviewAttendanceImport,
} from "../../hooks/useEmployeesApi";

type Props = { open: boolean; onClose: () => void; onImported?: () => void };
type PreviewRow = AttendanceImportPreviewRow;
const steps = ["File", "Mapping", "Preview", "Reconcile"];
const GENERIC_DEVICE_ID = "00000000-0000-0000-0000-000000000001";

const AttendanceImportDialog = ({ open, onClose, onImported }: Props) => {
  const employees = useAttendanceEmployeeOptions();
  const previewMutation = usePreviewAttendanceImport();
  const confirmMutation = useConfirmAttendanceImport();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AttendanceImportPreview | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setAssignments({});
      setComplete(false);
      previewMutation.reset();
      confirmMutation.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const employeeOptions = employees.data?.data ?? [];
  const previewEmployees = preview?.employees ?? [];
  const unmatched = previewEmployees.filter(
    (employee) => !employee.mapping.matched,
  );
  const allMapped = unmatched.every((employee) =>
    Boolean(assignments[employee.external_user_id]),
  );
  const step = complete ? 3 : preview ? (allMapped ? 2 : 1) : 0;

  const parse = async () => {
    if (!file) return;
    try {
      const response = await previewMutation.mutateAsync({
        file,
        deviceId: GENERIC_DEVICE_ID,
      });
      setPreview(response.data);
      setAssignments({});
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Time report could not be parsed.",
      );
    }
  };

  const assign = (externalUserId: string, employeeId: string) =>
    setAssignments((prev) => {
      const next = { ...prev };
      if (employeeId) next[externalUserId] = employeeId;
      else delete next[externalUserId];
      return next;
    });

  const confirm = async () => {
    if (!file || !preview || !allMapped) return;
    try {
      await confirmMutation.mutateAsync({
        file,
        deviceId: GENERIC_DEVICE_ID,
        preview,
        assignments,
      });
      setComplete(true);
      onImported?.();
      toast.success("Attendance import completed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Attendance import could not be completed.",
      );
    }
  };

  const columns = useMemo<CustomTableColumn<PreviewRow>[]>(
    () => [
      { id: "work_date", label: "Date", minWidth: 120 },
      { id: "day", label: "Day", minWidth: 80 },
      {
        id: "time",
        label: "IN / OUT",
        minWidth: 130,
        render: (row) => `${row.time_in ?? "—"} / ${row.time_out ?? "—"}`,
      },
      {
        id: "gross",
        label: "Gross",
        minWidth: 90,
        render: (row) => `${row.gross_minutes}m`,
      },
      {
        id: "status",
        label: "Status",
        minWidth: 140,
        render: (row) => (
          <Chip
            size="small"
            color={
              row.status === "Valid"
                ? "success"
                : row.status === "No Punch"
                  ? "default"
                  : "warning"
            }
            label={row.status}
          />
        ),
      },
      {
        id: "issues",
        label: "Issues",
        minWidth: 240,
        flex: 1,
        render: (row) => row.anomaly_flags.join(", ") || "—",
      },
    ],
    [],
  );

  return (
    <Dialog
      open={open}
      onClose={confirmMutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>Import Time Report</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stepper activeStep={step}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {!preview && !complete && (
            <Stack spacing={2}>
              <Alert severity="info">
                Attendance times are interpreted in Asia/Manila.
              </Alert>
              <Button
                component="label"
                variant="outlined"
                startIcon={<i className="bx bx-upload" />}
              >
                {file?.name ?? "Choose XLS or XLSX time report"}
                <input
                  hidden
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setPreview(null);
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                XLS or XLSX, up to 10 MB.
              </Typography>
            </Stack>
          )}

          {preview && !complete && (
            <>
              {preview.duplicate_file && (
                <Alert severity="error">
                  This exact workbook has already been imported.
                </Alert>
              )}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 2,
                }}
              >
                <Alert severity="info">
                  Period
                  <br />
                  <strong>
                    {preview.period_start} – {preview.period_end}
                  </strong>
                </Alert>
                <Alert
                  severity={
                    unmatched.length === 0
                      ? "success"
                      : allMapped
                        ? "info"
                        : "warning"
                  }
                >
                  Scanner employees
                  <br />
                  <strong>
                    {preview.totals.employees} in file · {unmatched.length} need
                    mapping
                  </strong>
                </Alert>
              </Box>
              {previewEmployees.map((employee) => {
                const assignedElsewhere = new Set(
                  Object.entries(assignments)
                    .filter(([id]) => id !== employee.external_user_id)
                    .map(([, value]) => value),
                );
                const options = employeeOptions.filter(
                  (option) => !assignedElsewhere.has(option.id),
                );
                const selected =
                  employeeOptions.find(
                    (option) =>
                      option.id === assignments[employee.external_user_id],
                  ) ?? null;

                return (
                  <Box
                    key={employee.external_user_id}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                      >
                        <Typography variant="subtitle1">
                          {employee.external_employee_name} (
                          {employee.external_user_id})
                        </Typography>
                        <Chip
                          size="small"
                          color={
                            employee.mapping.matched
                              ? "success"
                              : assignments[employee.external_user_id]
                                ? "info"
                                : "warning"
                          }
                          variant="tonal"
                          label={
                            employee.mapping.matched
                              ? `Mapped · ${employee.mapping.employee?.fullName}`
                              : assignments[employee.external_user_id]
                                ? `Will map · ${selected?.fullName ?? ""}`
                                : "Confirmation required"
                          }
                        />
                      </Stack>

                      {!employee.mapping.matched && (
                        <Autocomplete<AttendanceEmployeeOption>
                          options={options}
                          value={selected}
                          getOptionLabel={(option) =>
                            `${option.fullName} · ${option.employeeNo}`
                          }
                          onChange={(_, option) =>
                            assign(employee.external_user_id, option?.id ?? "")
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Map scanner user to employee"
                              helperText={
                                employee.mapping.suggested
                                  ? `Suggested by name: ${employee.mapping.employee?.fullName}. Select explicitly to confirm.`
                                  : "Name alone is never accepted automatically."
                              }
                            />
                          )}
                        />
                      )}

                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        <Chip
                          label={`${employee.totals.valid} valid`}
                          color="success"
                          variant="tonal"
                        />
                        <Chip
                          label={`${employee.totals.needs_review} needs review`}
                          color="warning"
                          variant="tonal"
                        />
                        <Chip label={`${employee.totals.no_punch} no punch`} />
                        <Chip
                          label={`${employee.totals.unmatched} unmatched`}
                          color={
                            employee.totals.unmatched ? "error" : "default"
                          }
                        />
                      </Stack>

                      <CustomTable
                        rows={employee.rows}
                        columns={columns}
                        getRowId={(row) => String(row.source_row_number)}
                        density="compact"
                        emptyTitle="No time rows"
                        emptyDescription="The workbook did not contain daily rows."
                      />
                    </Stack>
                  </Box>
                );
              })}
            </>
          )}

          {complete && (
            <Alert severity="success">
              <strong>Import reconciled.</strong> Valid rows are in the
              Attendance Register; ambiguous punches are in Exceptions and are
              excluded from payroll until corrected and approved.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{complete ? "Done" : "Cancel"}</Button>
        {!preview && !complete && (
          <Button
            variant="contained"
            disabled={!file || previewMutation.isPending}
            onClick={parse}
          >
            {previewMutation.isPending ? "Parsing…" : "Parse workbook"}
          </Button>
        )}
        {preview && !complete && (
          <>
            <Button
              onClick={() => setPreview(null)}
              disabled={confirmMutation.isPending}
            >
              Back
            </Button>
            <Button
              variant="contained"
              disabled={
                preview.duplicate_file ||
                !allMapped ||
                confirmMutation.isPending
              }
              onClick={confirm}
            >
              {confirmMutation.isPending ? "Importing…" : "Confirm import"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceImportDialog;
