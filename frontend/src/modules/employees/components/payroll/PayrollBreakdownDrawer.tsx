"use client";

import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTable, {
  type CustomTableColumn,
} from "@components/app/CustomTable";

import type {
  PayrollItemResource,
  PayrollItemUpdatePayload,
  PayrollResource,
} from "../../api/types";
import { formatCurrency } from "../shared/statusUtils";

type PayrollBreakdownDrawerProps = {
  open: boolean;
  payroll: PayrollResource | null;
  embedded?: boolean;
  editable?: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  onClose: () => void;
  onSave?: (items: PayrollItemUpdatePayload[]) => void;
  onPrepare?: (items: PayrollItemUpdatePayload[]) => void;
  onOpenPayslip?: (item: PayrollItemResource) => void;
  onItemChangesChange?: (hasChanges: boolean) => void;
  onDraftsChange?: (items: PayrollItemUpdatePayload[]) => void;
};

type EditableField = Exclude<keyof PayrollItemUpdatePayload, "id">;

// Keep the operational payroll columns readable. The viewport below owns the
// horizontal scroll instead of allowing the DataGrid to be clipped by a card.
const PAYROLL_TABLE_MIN_WIDTH = 1450;

const toDraft = (item: PayrollItemResource): PayrollItemUpdatePayload => ({
  id: item.id,
  basic_pay: item.basicPay,
  attendance_penalty: item.attendancePenalty,
  allowance: item.allowance,
  production_incentive: item.productionIncentive,
  bonus: item.bonus,
  overtime_pay: item.overtimePay,
  holiday_pay: item.holidayPay,
  advance_deduction: item.advanceDeduction,
  sss_employee: item.sssEmployee,
  philhealth_employee: item.philhealthEmployee,
  pagibig_employee: item.pagibigEmployee,
  withholding_tax: item.withholdingTax,
  company_loan: item.companyLoan,
  other_deductions: item.otherDeductions,
  sss_employer: item.sssEmployer,
  philhealth_employer: item.philhealthEmployer,
  pagibig_employer: item.pagibigEmployer,
  payment_method: item.paymentMethod,
  bank_name: item.bankName,
  account_last_four: item.accountLastFour,
  payment_date: item.paymentDate,
});

const toSavePayload = (
  draft: PayrollItemUpdatePayload,
): PayrollItemUpdatePayload => ({
  id: draft.id,
  basic_pay: draft.basic_pay,
  allowance: draft.allowance,
  bonus: draft.bonus,
  overtime_pay: draft.overtime_pay,
  sss_employee: draft.sss_employee,
  philhealth_employee: draft.philhealth_employee,
  pagibig_employee: draft.pagibig_employee,
  other_deductions: draft.other_deductions,
  sss_employer: draft.sss_employer,
  philhealth_employer: draft.philhealth_employer,
  pagibig_employer: draft.pagibig_employer,
});

const amount = (draft: PayrollItemUpdatePayload, field: EditableField) =>
  Number(draft[field] ?? 0);

const gross = (draft: PayrollItemUpdatePayload) =>
  amount(draft, "basic_pay") +
  amount(draft, "allowance") +
  amount(draft, "production_incentive") +
  amount(draft, "bonus") +
  amount(draft, "holiday_pay") +
  amount(draft, "overtime_pay");

const deductions = (draft: PayrollItemUpdatePayload) =>
  amount(draft, "advance_deduction") +
  amount(draft, "attendance_penalty") +
  amount(draft, "sss_employee") +
  amount(draft, "philhealth_employee") +
  amount(draft, "pagibig_employee") +
  amount(draft, "withholding_tax") +
  amount(draft, "company_loan") +
  amount(draft, "other_deductions");

const statutoryBenefits = (draft: PayrollItemUpdatePayload) =>
  amount(draft, "sss_employer") +
  amount(draft, "philhealth_employer") +
  amount(draft, "pagibig_employer");

const statutoryDeductions = (draft: PayrollItemUpdatePayload) =>
  amount(draft, "sss_employee") +
  amount(draft, "philhealth_employee") +
  amount(draft, "pagibig_employee");

const otherDeductions = (draft: PayrollItemUpdatePayload) =>
  deductions(draft) -
  amount(draft, "attendance_penalty") -
  statutoryDeductions(draft);

const MoneyInput = ({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) => (
  <TextField
    type="number"
    size="small"
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
    inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }}
    sx={{ width: 124 }}
  />
);

const Summary = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) => (
  <Box
    sx={{
      minWidth: 0,
      px: 2,
      py: 1.5,
      borderRadius: 1,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" sx={{ mt: 0.35 }}>
      {value}
    </Typography>
    {helper && (
      <Typography variant="caption" color="text.secondary">
        {helper}
      </Typography>
    )}
  </Box>
);

const isPieceRateItem = (item: PayrollItemResource) =>
  item.employee?.paySchemeCode === "piece_rate" ||
  item.employee?.position?.toLowerCase().includes("tailor") === true;

const attendanceTotal = (
  item: PayrollItemResource,
  field: "regularMinutes" | "overtimeCandidateMinutes",
) => (item.attendanceLines ?? []).reduce((sum, line) => sum + line[field], 0);

const PayrollBreakdownDrawer = ({
  open,
  payroll,
  embedded = false,
  editable = false,
  isSaving = false,
  hasUnsavedChanges,
  onClose,
  onSave,
  onPrepare,
  onOpenPayslip,
  onItemChangesChange,
  onDraftsChange,
}: PayrollBreakdownDrawerProps) => {
  const [drafts, setDrafts] = useState<
    Record<string, PayrollItemUpdatePayload>
  >({});
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null);
  const items = payroll?.items ?? [];

  useEffect(() => {
    setDrafts(
      Object.fromEntries(items.map((item) => [item.id, toDraft(item)])),
    );
  }, [payroll?.id, payroll?.updatedAt]);

  const hasItemChanges = useMemo(() => {
    if (Object.keys(drafts).length !== items.length) return false;

    return items.some((item) => {
      const draft = drafts[item.id];
      const saved = toDraft(item);

      return Object.entries(saved).some(
        ([field, value]) =>
          draft?.[field as keyof PayrollItemUpdatePayload] !== value,
      );
    });
  }, [drafts, items]);

  useEffect(() => {
    onItemChangesChange?.(hasItemChanges);
  }, [hasItemChanges, onItemChangesChange]);

  useEffect(() => {
    onDraftsChange?.(Object.values(drafts).map(toSavePayload));
  }, [drafts, onDraftsChange]);

  useEffect(() => () => onItemChangesChange?.(false), [onItemChangesChange]);

  const updateField = (
    id: string,
    field: EditableField,
    value: PayrollItemUpdatePayload[EditableField],
  ) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], id, [field]: value },
    }));
  };

  const totalGross = Object.values(drafts).reduce(
    (sum, row) => sum + gross(row),
    0,
  );
  const totalDeductions = Object.values(drafts).reduce(
    (sum, row) => sum + deductions(row),
    0,
  );
  const totalAttendancePenalties = Object.values(drafts).reduce(
    (sum, row) => sum + amount(row, "attendance_penalty"),
    0,
  );
  const totalNonAttendanceDeductions =
    totalDeductions - totalAttendancePenalties;
  const detailItem = items.find((item) => item.id === detailsItemId) ?? null;
  const detailDraft = detailsItemId ? drafts[detailsItemId] : null;
  const detailIsPieceRate = detailItem ? isPieceRateItem(detailItem) : false;
  const canSave = Boolean(hasUnsavedChanges || hasItemChanges);

  const inputColumn = (
    id: string,
    label: string,
    field: EditableField,
    notApplicableForPieceRate = false,
  ): CustomTableColumn<PayrollItemResource> => ({
    id,
    label,
    width: 132,
    align: "right",
    render: (row) =>
      notApplicableForPieceRate && isPieceRateItem(row) ? (
        <Typography variant="caption" color="text.secondary">
          Not applicable
        </Typography>
      ) : (
        <MoneyInput
          value={amount(drafts[row.id] ?? toDraft(row), field)}
          disabled={!editable || isSaving}
          onChange={(value) => updateField(row.id, field, value)}
        />
      ),
  });

  const columns = useMemo<CustomTableColumn<PayrollItemResource>[]>(
    () => [
      {
        id: "employeeName",
        label: "Employee",
        width: 240,
        render: (row) => (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                bgcolor: "action.hover",
                color: "primary.main",
              }}
            >
              <i className="bx bx-user" style={{ fontSize: "1.1rem" }} />
            </Box>
            <Stack spacing={0.1} sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {row.employee?.fullName ?? "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {row.employee?.jobPosition ?? row.employee?.position ?? "—"}
              </Typography>
            </Stack>
          </Stack>
        ),
      },
      {
        id: "daysWorked",
        label: "Attendance & Impact",
        width: 230,
        render: (row) =>
          (() => {
            const days = (row.attendanceLines ?? []).filter(
              (line) => line.payableMinutes > 0,
            ).length;
            const regularHours = (
              attendanceTotal(row, "regularMinutes") / 60
            ).toFixed(2);
            const otHours = (
              attendanceTotal(row, "overtimeCandidateMinutes") / 60
            ).toFixed(2);
            const lateUndertimeMinutes = row.lateMinutes + row.undertimeMinutes;
            const hasOvertimeCandidate =
              attendanceTotal(row, "overtimeCandidateMinutes") > 0;
            const hasLateUndertime = lateUndertimeMinutes > 0;

            return (
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={700}>
                  {days} day{days === 1 ? "" : "s"} · {regularHours}h regular
                </Typography>
                {hasOvertimeCandidate && (
                  <Typography variant="caption" color="text.secondary">
                    {otHours}h OT candidate
                  </Typography>
                )}
                {hasLateUndertime && (
                  <Typography variant="caption" color="text.secondary">
                    {lateUndertimeMinutes} min late / UT · Penalty{" "}
                    {formatCurrency(row.attendancePenalty)}
                  </Typography>
                )}
              </Stack>
            );
          })(),
      },
      {
        id: "primaryEarnings",
        label: "Base / Piece Pay",
        width: 155,
        align: "right",
        render: (row) => {
          const draft = drafts[row.id] ?? toDraft(row);

          if (isPieceRateItem(row)) {
            return (
              <Stack spacing={0.15} alignItems="flex-end">
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(amount(draft, "production_incentive"))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Approved piece output
                </Typography>
              </Stack>
            );
          }

          return (
            <MoneyInput
              value={amount(draft, "basic_pay")}
              disabled={!editable || isSaving}
              onChange={(value) => updateField(row.id, "basic_pay", value)}
            />
          );
        },
      },
      {
        id: "allowance",
        label: "Allowance",
        width: 170,
        align: "right",
        render: (row) =>
          isPieceRateItem(row) ? (
            <Typography variant="caption" color="text.secondary">
              Not applicable
            </Typography>
          ) : (
            <Stack spacing={0.25} alignItems="flex-end">
              <MoneyInput
                value={amount(drafts[row.id] ?? toDraft(row), "allowance")}
                disabled={!editable || isSaving}
                onChange={(value) => updateField(row.id, "allowance", value)}
              />
              {row.allowanceSuppressed && (
                <Typography variant="caption" color="warning.main">
                  Disabled after {row.allowanceLateCount}/
                  {row.allowanceLateThreshold ?? "?"} late records
                </Typography>
              )}
            </Stack>
          ),
      },
      inputColumn("overtime", "OT Pay", "overtime_pay"),
      {
        id: "deductions",
        label: "Deductions",
        align: "right",
        width: 205,
        render: (row) => {
          const draft = drafts[row.id] ?? toDraft(row);
          return (
            <Stack spacing={0.25} alignItems="flex-end">
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(deductions(draft))}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Statutory {formatCurrency(statutoryDeductions(draft))} · Other{" "}
                {formatCurrency(otherDeductions(draft))}
              </Typography>
            </Stack>
          );
        },
      },
      {
        id: "netPay",
        label: "Net Pay",
        align: "right",
        width: 145,
        render: (row) => {
          const draft = drafts[row.id] ?? toDraft(row);
          return (
            <Typography fontWeight={800}>
              {formatCurrency(gross(draft) - deductions(draft))}
            </Typography>
          );
        },
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: 170,
        render: (row) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              variant="outlined"
              onClick={() => setDetailsItemId(row.id)}
            >
              Details
            </Button>
            <Button size="small" onClick={() => onOpenPayslip?.(row)}>
              Payslip
            </Button>
          </Stack>
        ),
      },
    ],
    [drafts, editable, isSaving, onOpenPayslip],
  );

  const additionalFields = (
    [
      ["Basic Pay", "basic_pay"],
      ["Allowance", "allowance"],
      ["Bonus", "bonus"],
      ["Cash Advance", "advance_deduction"],
      ["Late / Undertime Penalty", "attendance_penalty"],
      ["Other Deduction", "other_deductions"],
      ["SSS Employee", "sss_employee"],
      ["PhilHealth Employee", "philhealth_employee"],
      ["Pag-IBIG Employee", "pagibig_employee"],
      ["SSS Employer", "sss_employer"],
      ["PhilHealth Employer", "philhealth_employer"],
      ["Pag-IBIG Employer", "pagibig_employer"],
    ] as [string, EditableField][]
  ).filter(([, field]) =>
    detailIsPieceRate
      ? ![
          "basic_pay",
          "allowance",
          "attendance_penalty",
          "sss_employee",
          "philhealth_employee",
          "pagibig_employee",
          "sss_employer",
          "philhealth_employer",
          "pagibig_employer",
        ].includes(field)
      : field !== "basic_pay",
  );

  const editor = (
    <Stack
      spacing={3}
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        p: embedded ? 0 : { xs: 2, md: 4 },
      }}
    >
      {embedded && (
        <Paper
          className="p-4"
          sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75}>
              <Typography variant="h5">Payroll Adjustment Table</Typography>
              <Typography variant="body2" color="text.secondary">
                Review employee positions and adjust payroll amounts before
                submitting for approval.
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={1.5}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Button
                variant="outlined"
                startIcon={<i className="bx bx-save" />}
                disabled={isSaving || items.length === 0 || !canSave}
                onClick={() =>
                  onSave?.(Object.values(drafts).map(toSavePayload))
                }
              >
                {payroll?.status === "Draft" ? "Save Draft" : "Save Changes"}
              </Button>
              {onPrepare && (
                <Button
                  variant="contained"
                  startIcon={<i className="bx bx-check-circle" />}
                  disabled={isSaving || items.length === 0}
                  onClick={() =>
                    onPrepare(Object.values(drafts).map(toSavePayload))
                  }
                >
                  Mark Prepared
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
          gap: 1.5,
          width: "100%",
          minWidth: 0,
        }}
      >
        <Summary label="Gross Earnings" value={formatCurrency(totalGross)} />
        <Summary
          label="Attendance Penalties"
          value={formatCurrency(totalAttendancePenalties)}
          helper="Late and undertime at ₱1/minute"
        />
        <Summary
          label="Statutory & Other Deductions"
          value={formatCurrency(totalNonAttendanceDeductions)}
          helper="Excludes late and undertime penalties"
        />
        <Summary
          label="Net Payroll"
          value={formatCurrency(totalGross - totalDeductions)}
        />
      </Box>

      <Paper
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            "&::-webkit-scrollbar": { height: 10 },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 1,
              bgcolor: "action.disabled",
            },
          }}
        >
          <Box
            sx={{
              width: "fit-content",
              minWidth: PAYROLL_TABLE_MIN_WIDTH,
              mx: "auto",
            }}
          >
            <CustomTable
              rows={items}
              columns={columns}
              getRowId={(row) => row.id}
              emptyTitle="No employees"
              emptyDescription="This payroll run has no employee lines yet."
              density="compact"
              getRowHeight={() => "auto"}
              disableRowSelectionOnClick
              sx={{
                minHeight: 460,
                minWidth: PAYROLL_TABLE_MIN_WIDTH,
                p: { xs: 2, md: 2.5 },
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "action.hover",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "divider",
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "action.hover",
                },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                  outline: "none",
                },
              }}
            />
          </Box>
        </Box>
      </Paper>

      {editable && !embedded && (
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button
            color="secondary"
            variant="outlined"
            disabled={isSaving}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="contained"
            disabled={isSaving || items.length === 0 || !canSave}
            onClick={() => onSave?.(Object.values(drafts).map(toSavePayload))}
          >
            {isSaving ? "Saving…" : "Save Payroll"}
          </Button>
        </Stack>
      )}
    </Stack>
  );

  return (
    <>
      {embedded ? (
        editor
      ) : (
        <CustomDrawer
          open={open}
          onClose={onClose}
          width="min(96vw, 1500px)"
          title={
            payroll
              ? `Payroll Breakdown · ${payroll.payrollNo}`
              : "Payroll Breakdown"
          }
          subtitle={
            payroll
              ? `${payroll.periodStart} – ${payroll.periodEnd} · ${items.length} employee${items.length === 1 ? "" : "s"}`
              : undefined
          }
        >
          {editor}
        </CustomDrawer>
      )}

      <Dialog
        open={Boolean(detailDraft)}
        onClose={() => setDetailsItemId(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Payroll details · {detailItem?.employee?.fullName ?? "Employee"}
        </DialogTitle>
        {detailDraft && detailsItemId && (
          <DialogContent dividers>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Approved attendance breakdown
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Summary
                label="Days Worked"
                value={String(
                  (detailItem?.attendanceLines ?? []).filter(
                    (line) => line.payableMinutes > 0,
                  ).length,
                )}
              />
              <Summary
                label="Regular Hours"
                value={`${(detailItem ? attendanceTotal(detailItem, "regularMinutes") : 0) / 60}h`}
              />
              <Summary
                label="OT Candidate"
                value={`${(detailItem ? attendanceTotal(detailItem, "overtimeCandidateMinutes") : 0) / 60}h`}
              />
              <Summary
                label="Approved OT Pay"
                value={formatCurrency(detailItem?.overtimePay ?? 0)}
              />
              <Summary
                label="Late / Undertime Penalty"
                value={formatCurrency(detailItem?.attendancePenalty ?? 0)}
              />
              <Summary
                label="Statutory Benefits"
                value={formatCurrency(
                  detailDraft ? statutoryBenefits(detailDraft) : 0,
                )}
                helper="Employer-paid"
              />
              <Summary
                label="Employee Statutory"
                value={formatCurrency(
                  detailDraft ? statutoryDeductions(detailDraft) : 0,
                )}
                helper="Reduces net pay"
              />
            </Stack>
            <CustomTable
              rows={detailItem?.attendanceLines ?? []}
              columns={[
                { id: "workDate", label: "Date", minWidth: 115 },
                {
                  id: "time",
                  label: "Time In / Out",
                  minWidth: 180,
                  render: (row) =>
                    `${row.timeIn ? new Date(row.timeIn).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) : "—"} – ${row.timeOut ? new Date(row.timeOut).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) : "—"}`,
                },
                {
                  id: "gross",
                  label: "Payable",
                  minWidth: 90,
                  align: "right",
                  render: (row) => `${(row.payableMinutes / 60).toFixed(2)}h`,
                },
                {
                  id: "regular",
                  label: "Regular",
                  minWidth: 90,
                  align: "right",
                  render: (row) => `${(row.regularMinutes / 60).toFixed(2)}h`,
                },
                {
                  id: "ot",
                  label: "OT Candidate",
                  minWidth: 110,
                  align: "right",
                  render: (row) =>
                    `${(row.overtimeCandidateMinutes / 60).toFixed(2)}h`,
                },
                {
                  id: "rate",
                  label: "Effective Rate",
                  minWidth: 120,
                  align: "right",
                  render: (row) =>
                    `${formatCurrency(row.effectiveRate)} / ${row.rateUnit}`,
                },
                {
                  id: "amount",
                  label: "Daily Total",
                  minWidth: 110,
                  align: "right",
                  render: (row) => formatCurrency(row.amount),
                },
                { id: "status", label: "Status", minWidth: 130 },
              ]}
              getRowId={(row) => row.id}
              density="compact"
              emptyTitle="No approved attendance"
              emptyDescription="Monthly and piece-rate payroll may remain payable without attendance; hourly and daily employees require approved attendance."
            />
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Additional earnings and deductions
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {additionalFields.map(([label, field]) => (
                <TextField
                  key={field}
                  type="number"
                  label={label}
                  value={amount(detailDraft, field)}
                  disabled={
                    !editable ||
                    isSaving ||
                    field === "attendance_penalty" ||
                    field === "advance_deduction"
                  }
                  helperText={
                    field === "attendance_penalty"
                      ? "Calculated at ₱1 per late/undertime minute"
                      : field === "advance_deduction"
                        ? "Sourced from approved cash advances"
                        : undefined
                  }
                  onChange={(event) =>
                    updateField(
                      detailsItemId,
                      field,
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                  inputProps={{ min: 0, step: "0.01" }}
                />
              ))}
            </Box>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setDetailsItemId(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PayrollBreakdownDrawer;
