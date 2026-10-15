"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomDatePicker from "@components/app/CustomDatePicker";
import { ApiError } from "@/libs/api/apiError";
import PayrollBreakdownDrawer from "../../components/payroll/PayrollBreakdownDrawer";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import { renderStatusChip } from "../../components/shared/statusUtils";
import type {
  PayrollItemUpdatePayload,
  PayrollResource,
  PayrollRunType,
  TailorPayrollFrequency,
} from "../../api/types";
import {
  useCreatePayroll,
  usePayroll,
  useUpdatePayroll,
  useUpdatePayrollStatus,
} from "../../hooks/useEmployeesApi";

type Props = { payrollId?: string };
type PayrollCutoffType =
  | "first_half"
  | "second_half"
  | "whole_month"
  | "custom";
type ContributionCutoff = "first" | "second" | "none";

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const currentMonthValue = () => {
  const today = new Date();
  return (
    today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0")
  );
};

const presetDates = (month: string, type: PayrollCutoffType) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const prefix = year + "-" + String(monthNumber).padStart(2, "0");

  if (type === "first_half")
    return { start: prefix + "-01", end: prefix + "-15" };
  if (type === "second_half") {
    return {
      start: prefix + "-16",
      end: prefix + "-" + String(lastDay).padStart(2, "0"),
    };
  }

  return {
    start: prefix + "-01",
    end: prefix + "-" + String(lastDay).padStart(2, "0"),
  };
};

const tailorPresetDates = (
  frequency: Exclude<TailorPayrollFrequency, "custom" | "monthly">,
) => {
  const today = new Date();

  if (frequency === "daily") {
    const date = toIsoDate(today);
    return { start: date, end: date };
  }

  const start = new Date(today);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(
    start.getDate() - daysSinceMonday - (frequency === "biweekly" ? 7 : 0),
  );
  const end = new Date(start);
  end.setDate(end.getDate() + (frequency === "biweekly" ? 13 : 6));

  return { start: toIsoDate(start), end: toIsoDate(end) };
};

const PayrollPreparationView = ({ payrollId = "" }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payrollQuery = usePayroll(payrollId);
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const updateStatus = useUpdatePayrollStatus();
  const [payroll, setPayroll] = useState<PayrollResource | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodMonth, setPeriodMonth] = useState(currentMonthValue);
  const [cutoffType, setCutoffType] = useState<PayrollCutoffType>("first_half");
  const [payrollType, setPayrollType] = useState<PayrollRunType>(
    searchParams.get("type") === "tailor" ? "tailor" : "employee",
  );
  const [tailorFrequency, setTailorFrequency] =
    useState<TailorPayrollFrequency>("weekly");
  const [contributionCutoff, setContributionCutoff] =
    useState<ContributionCutoff>("first");
  const [notes, setNotes] = useState("");
  const [hasItemChanges, setHasItemChanges] = useState(false);
  const [draftItems, setDraftItems] = useState<PayrollItemUpdatePayload[]>([]);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const [noWorkDialogOpen, setNoWorkDialogOpen] = useState(false);
  const [noWorkMessage, setNoWorkMessage] = useState("");
  const isSaving =
    createPayroll.isPending ||
    updatePayroll.isPending ||
    updateStatus.isPending;
  const isTailorPayroll = payrollType === "tailor";
  const payrollHomePath = isTailorPayroll
    ? "/employees/payrolls?type=tailor"
    : "/employees/payrolls";

  useEffect(() => {
    const loaded = payrollQuery.data?.data;
    if (!loaded) return;
    setPayroll(loaded);
    setPayrollType(loaded.payrollType);
    setPeriodStart(loaded.periodStart);
    setPeriodEnd(loaded.periodEnd);
    setCutoffType(
      ["first_half", "second_half", "whole_month", "custom"].includes(
        loaded.cutoffType ?? "",
      )
        ? (loaded.cutoffType as PayrollCutoffType)
        : "custom",
    );
    if (
      loaded.payrollType === "tailor" &&
      loaded.payrollFrequency !== "standard"
    ) {
      setTailorFrequency(loaded.payrollFrequency);
    }
    setContributionCutoff(loaded.contributionCutoff ?? "second");
    setPeriodMonth(loaded.periodStart.slice(0, 7));
    setNotes(loaded.notes ?? "");
    setHasItemChanges(false);
  }, [payrollQuery.data]);

  useEffect(() => {
    if (payroll) return;

    if (isTailorPayroll) {
      if (tailorFrequency === "custom") return;
      if (tailorFrequency === "monthly") {
        const dates = presetDates(periodMonth, "whole_month");
        setPeriodStart(dates.start);
        setPeriodEnd(dates.end);
        return;
      }

      const dates = tailorPresetDates(tailorFrequency);
      setPeriodStart(dates.start);
      setPeriodEnd(dates.end);
      return;
    }

    if (cutoffType === "custom" || !periodMonth) return;
    const dates = presetDates(periodMonth, cutoffType);
    setPeriodStart(dates.start);
    setPeriodEnd(dates.end);
    setContributionCutoff(cutoffType === "first_half" ? "first" : "second");
  }, [cutoffType, isTailorPayroll, payroll, periodMonth, tailorFrequency]);

  const handleItemChangesChange = useCallback((hasChanges: boolean) => {
    setHasItemChanges(hasChanges);
  }, []);

  const handleDraftsChange = useCallback(
    (items: PayrollItemUpdatePayload[]) => {
      setDraftItems(items);
    },
    [],
  );

  const hasNotesChanges = payroll !== null && notes !== (payroll.notes ?? "");
  const hasUnsavedChanges = hasItemChanges || hasNotesChanges;

  const createDraft = () => {
    if (!periodStart || !periodEnd) {
      toast.error("Select the complete payroll period.");
      return;
    }

    createPayroll
      .mutateAsync({
        period_start: periodStart,
        period_end: periodEnd,
        payroll_type: payrollType,
        cutoff_type: isTailorPayroll ? tailorFrequency : cutoffType,
        payroll_frequency: isTailorPayroll ? tailorFrequency : undefined,
        contribution_cutoff: isTailorPayroll ? "none" : contributionCutoff,
        notes: notes.trim() || null,
        as_draft: true,
      })
      .then(({ data }) => {
        setPayroll(data);
        toast.success(
          isTailorPayroll
            ? "Tailor payroll draft created from QC-approved output."
            : "Payroll draft created. Employee items are ready for review.",
        );
        router.replace(`/employees/payrolls/${data.id}/edit`);
      })
      .catch((error) => {
        const noWorkError =
          error instanceof ApiError &&
          error.status === 422 &&
          error.errors.employee_ids?.[0];

        if (noWorkError) {
          setNoWorkMessage(noWorkError);
          setNoWorkDialogOpen(true);
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Payroll draft could not be created.",
        );
      });
  };

  const saveItems = async (items: PayrollItemUpdatePayload[]) => {
    if (!payroll) return null;
    const response = await updatePayroll.mutateAsync({
      id: payroll.id,
      payload: { items, notes: notes.trim() || null },
    });
    setPayroll(response.data);
    return response.data;
  };

  const saveDraft = (items: PayrollItemUpdatePayload[]) => {
    saveItems(items)
      .then((data) => {
        if (data) {
          toast.success(
            data.status === "Draft"
              ? "Payroll draft saved."
              : "Payroll changes saved.",
          );
          router.push(payrollHomePath);
        }
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Payroll could not be saved.",
        ),
      );
  };

  const markPrepared = (items: PayrollItemUpdatePayload[]) => {
    saveItems(items)
      .then((saved) =>
        saved
          ? updateStatus.mutateAsync({
              id: saved.id,
              payload: { status: "Prepared", notes: notes.trim() || null },
            })
          : null,
      )
      .then((response) => {
        if (!response) return;
        toast.success("Payroll marked prepared and sent for approval.");
        router.push(payrollHomePath);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Payroll could not be prepared.",
        ),
      );
  };

  const returnToPayrolls = () => {
    setLeaveConfirmationOpen(false);
    router.push(payrollHomePath);
  };

  const requestReturnToPayrolls = () => {
    if (isSaving) return;

    if (payroll && hasUnsavedChanges) {
      setLeaveConfirmationOpen(true);
      return;
    }

    returnToPayrolls();
  };

  const openPayslip = (itemId: string) => {
    if (!payroll) return;

    const returnTo = `/employees/payrolls/${payroll.id}/edit`;

    router.push(
      `/employees/payrolls/${payroll.id}/payslips/${itemId}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title={
          payroll
            ? `Adjust ${isTailorPayroll ? "Tailor" : "Employee"} Payroll · ${payroll.payrollNo}`
            : `Prepare ${isTailorPayroll ? "Tailor" : "Employee"} Payroll`
        }
        description={
          isTailorPayroll
            ? "Build payroll from QC-approved tailoring output in the selected schedule."
            : "Review the payroll period and employee items in one preparation workspace."
        }
      >
        <Button
          color="secondary"
          variant="outlined"
          startIcon={<i className="bx bx-arrow-back" />}
          disabled={isSaving}
          onClick={requestReturnToPayrolls}
        >
          Back to {isTailorPayroll ? "Tailor" : "Employee"} Payroll
        </Button>
      </EmployeesPageHeader>

      {payrollQuery.isError && (
        <Alert severity="error">This payroll run could not be loaded.</Alert>
      )}

      <Paper sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            sx={{
              pb: 2.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h5" sx={{ lineHeight: 1.2 }}>
                  Payroll Period
                </Typography>
                {payroll && renderStatusChip(payroll.status)}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {payroll
                  ? `${payroll.items?.length ?? 0} ${isTailorPayroll ? "tailor" : "employee"}${payroll.items?.length === 1 ? "" : "s"} included`
                  : isTailorPayroll
                    ? "Select a schedule to load tailors with QC-approved output."
                    : "Select a period to load employees with approved working hours."}
              </Typography>
            </Stack>
            {payroll && (
              <Typography
                variant="caption"
                color="text.primary"
                sx={{
                  px: 1.25,
                  py: 0.75,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: 0.2,
                }}
              >
                {payroll.payrollNo}
              </Typography>
            )}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
              alignItems: "end",
              "& > *": { minWidth: 0 },
              "& .react-datepicker-wrapper": { width: "100%" },
            }}
          >
            {isTailorPayroll ? (
              <>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Tailor Schedule"
                  value={tailorFrequency}
                  disabled={Boolean(payroll) || isSaving}
                  onChange={(event) =>
                    setTailorFrequency(
                      event.target.value as TailorPayrollFrequency,
                    )
                  }
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly · Monday–Sunday</MenuItem>
                  <MenuItem value="biweekly">Biweekly · Two weeks</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </TextField>
                <CustomDatePicker
                  fullWidth
                  label="Schedule Month"
                  value={periodMonth}
                  disabled={
                    Boolean(payroll) ||
                    isSaving ||
                    tailorFrequency !== "monthly"
                  }
                  onChange={setPeriodMonth}
                  mode="month"
                />
                <CustomDatePicker
                  fullWidth
                  label="Period Start"
                  value={periodStart}
                  onChange={setPeriodStart}
                  disabled={
                    Boolean(payroll) || isSaving || tailorFrequency !== "custom"
                  }
                />
                <CustomDatePicker
                  fullWidth
                  label="Period End"
                  value={periodEnd}
                  onChange={setPeriodEnd}
                  disabled={
                    Boolean(payroll) || isSaving || tailorFrequency !== "custom"
                  }
                />
              </>
            ) : (
              <>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Payroll Period"
                  value={cutoffType}
                  disabled={Boolean(payroll) || isSaving}
                  onChange={(event) =>
                    setCutoffType(event.target.value as PayrollCutoffType)
                  }
                >
                  <MenuItem value="first_half">First Cutoff · 1–15</MenuItem>
                  <MenuItem value="second_half">
                    Second Cutoff · 16–End
                  </MenuItem>
                  <MenuItem value="whole_month">Whole Month</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </TextField>
                <CustomDatePicker
                  fullWidth
                  label="Contribution Month"
                  value={periodMonth}
                  disabled={
                    Boolean(payroll) || isSaving || cutoffType === "custom"
                  }
                  onChange={setPeriodMonth}
                  mode="month"
                />
                <CustomDatePicker
                  fullWidth
                  label="Period Start"
                  value={periodStart}
                  onChange={setPeriodStart}
                  disabled={
                    Boolean(payroll) || isSaving || cutoffType !== "custom"
                  }
                />
                <CustomDatePicker
                  fullWidth
                  label="Period End"
                  value={periodEnd}
                  onChange={setPeriodEnd}
                  disabled={
                    Boolean(payroll) || isSaving || cutoffType !== "custom"
                  }
                />
                {cutoffType === "custom" && (
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Statutory Treatment"
                    value={contributionCutoff}
                    disabled={Boolean(payroll) || isSaving}
                    onChange={(event) =>
                      setContributionCutoff(
                        event.target.value as ContributionCutoff,
                      )
                    }
                  >
                    <MenuItem value="first">First Cutoff Allocation</MenuItem>
                    <MenuItem value="second">Second Cutoff Allocation</MenuItem>
                    <MenuItem value="none">No Statutory Allocation</MenuItem>
                  </TextField>
                )}
              </>
            )}
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              disabled={
                isSaving || Boolean(payroll && payroll.status !== "Draft")
              }
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional payroll notes"
              sx={{ gridColumn: { lg: "span 2" } }}
            />
          </Box>
          {!payroll && (
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<i className="bx bx-table" />}
                disabled={isSaving}
                onClick={createDraft}
                sx={{ minWidth: 220, minHeight: 42 }}
              >
                Generate {isTailorPayroll ? "Tailor" : "Employee"} Payroll
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {payroll && (
        <PayrollBreakdownDrawer
          open
          embedded
          payroll={payroll}
          editable={["Draft", "Prepared"].includes(payroll.status)}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onClose={() => router.push(payrollHomePath)}
          onSave={saveDraft}
          onPrepare={payroll.status === "Draft" ? markPrepared : undefined}
          onOpenPayslip={(item) => openPayslip(item.id)}
          onItemChangesChange={handleItemChangesChange}
          onDraftsChange={handleDraftsChange}
        />
      )}

      <CustomDialog
        open={leaveConfirmationOpen}
        onClose={() => {
          if (!isSaving) setLeaveConfirmationOpen(false);
        }}
        closeAfterTransition
        icon={<i className="bx bx-error-circle" />}
        title="Leave payroll editing?"
        description="You have unsaved payroll changes. Choose whether to save them before returning to Payroll."
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={isSaving}
              onClick={() => setLeaveConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="tonal"
              color="error"
              disabled={isSaving}
              onClick={returnToPayrolls}
            >
              Discard & Return
            </Button>
            <Button
              variant="contained"
              startIcon={<i className="bx bx-save" />}
              disabled={isSaving || !hasUnsavedChanges}
              onClick={() => saveDraft(draftItems)}
            >
              {payroll?.status === "Draft"
                ? "Save Draft & Return"
                : "Save Changes & Return"}
            </Button>
          </>
        }
      >
        {null}
      </CustomDialog>

      <CustomDialog
        open={noWorkDialogOpen}
        onClose={() => setNoWorkDialogOpen(false)}
        closeAfterTransition
        icon={<i className="bx bx-time-five" />}
        title={
          isTailorPayroll
            ? "No approved tailor output"
            : "No approved working hours"
        }
        description={
          noWorkMessage ||
          (isTailorPayroll
            ? "No tailors made approved pieces during the selected period."
            : "No employees have approved working hours during the selected period.")
        }
        actions={
          <Button
            variant="contained"
            onClick={() => setNoWorkDialogOpen(false)}
          >
            Adjust Period
          </Button>
        }
      >
        {null}
      </CustomDialog>
    </Stack>
  );
};

export default PayrollPreparationView;
