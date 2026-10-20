"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { paymentSchema, toPaymentPayload, type PaymentFormValues } from "../schemas/paymentSchema";
import type { LoanDetail, PaymentMethod } from "../types";
import { formatPeso, paymentMethodLabel } from "../utils/applicationStatus";

type Props = {
  loan: LoanDetail;
  pending: boolean;
  onSubmit: (payload: ReturnType<typeof toPaymentPayload>, onDone: () => void, onError: (error: unknown) => void) => void;
};

const trimMoney = (value: string): string => (Number(value) === 0 ? "" : value.replace(/\.00$/, ""));

/** The cashier records a payment. The server splits it penalty, interest, principal per the loan's rules. */
export default function RecordPaymentForm({ loan, pending, onSubmit }: Props) {
  const today = loan.summary.as_of;
  const lastPayment = (loan.payments ?? []).find((p) => p.status === "posted");
  const earliest = [loan.released_at?.slice(0, 10) ?? "", lastPayment?.paid_on ?? ""].sort().pop() ?? "";

  const { control, handleSubmit, reset, setValue, setError, watch } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema({ payoff: Number(loan.summary.payoff), today, earliest })),
    defaultValues: { amount: trimMoney(loan.summary.due_now), paid_on: today, method: "cash", reference_no: "", remarks: "" },
  });

  const method = watch("method");

  const submit = handleSubmit((values) =>
    onSubmit(
      toPaymentPayload(values),
      () => {
        toast.success("Payment recorded.");
        reset({ amount: "", paid_on: today, method: "cash", reference_no: "", remarks: "" });
      },
      (error) => {
        if (error instanceof ApiError && error.status === 422) {
          Object.entries(error.errors).forEach(([name, messages]) => {
            if (name === "status") toast.error(messages[0]);
            else setError(name as keyof PaymentFormValues, { message: messages[0] });
          });

          return;
        }
        toast.error(error instanceof ApiError ? error.message : "The payment could not be recorded.");
      },
    ),
  );

  return (
    <Paper className="p-6" component="form" noValidate onSubmit={submit}>
      <Stack spacing={3}>
        <Typography variant="h6">Record a payment</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Amount (PHP)" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" onClick={() => setValue("amount", trimMoney(loan.summary.due_now), { shouldValidate: true })}>
                Due now {formatPeso(loan.summary.due_now)}
              </Button>
              <Button size="small" onClick={() => setValue("amount", trimMoney(loan.summary.payoff), { shouldValidate: true })}>
                Pay off {formatPeso(loan.summary.payoff)}
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="paid_on"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} type="date" label="Payment date" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} slotProps={{ inputLabel: { shrink: true } }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Paid by" fullWidth>
                  {(Object.keys(paymentMethodLabel) as PaymentMethod[]).map((value) => (
                    <MenuItem key={value} value={value}>
                      {paymentMethodLabel[value]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          {method !== "cash" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="reference_no"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField {...field} label="Reference" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message ?? "Check number, transfer reference or deduction reference"} />
                )}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: method === "cash" ? 12 : 6 }}>
            <Controller name="remarks" control={control} render={({ field }) => <TextField {...field} label="Remarks (optional)" fullWidth />} />
          </Grid>
        </Grid>

        <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: "flex-start" }}>
          Record payment
        </Button>
      </Stack>
    </Paper>
  );
}
