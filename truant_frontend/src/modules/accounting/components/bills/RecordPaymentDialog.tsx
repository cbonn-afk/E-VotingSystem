"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";
import AccountingDatePicker from "../shared/AccountingDatePicker";
import { useBillPaymentAccounts } from "../../hooks/useBillEntryApi";
import {
  paymentRecordingSchema,
  type PaymentRecordingFormValues,
} from "../../schemas/accountingSchemas";
import { formatPeso } from "../../utils/accountingFormat";
import { paymentAmountError } from "../../utils/bills";

type Props = {
  open: boolean;
  outstanding: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (
    values: PaymentRecordingFormValues,
    postNow: boolean,
  ) => Promise<void>;
};

export default function RecordPaymentDialog({
  open,
  outstanding,
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const accountsQuery = useBillPaymentAccounts();
  const accounts = accountsQuery.data?.data;
  const form = useForm<PaymentRecordingFormValues>({
    resolver: zodResolver(paymentRecordingSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: outstanding,
      paidFromAccountId: "",
      reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: outstanding,
      paidFromAccountId: accounts?.[0]?.id ?? "",
      reference: "",
      notes: "",
    });
  }, [open, outstanding, accounts, form]);

  const submit = (postNow: boolean) =>
    form.handleSubmit(async (values) => {
      const amountError = paymentAmountError(values.amount, outstanding);
      if (amountError) {
        form.setError("amount", { message: amountError });
        return;
      }
      await onSubmit(values, postNow);
    })();

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      title="Record Payment"
      width="560px"
      description={`Outstanding balance: ${formatPeso(outstanding)}`}
      actions={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => void submit(false)}
            disabled={saving}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            onClick={() => void submit(true)}
            disabled={saving}
          >
            Post Payment
          </Button>
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Controller
          control={form.control}
          name="paymentDate"
          render={({ field, fieldState }) => (
            <AccountingDatePicker
              label="Payment Date"
              value={field.value}
              onChange={field.onChange}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              type="number"
              label="Amount"
              fullWidth
              inputProps={{ min: 0.01, max: outstanding, step: 0.01 }}
              onChange={(event) => field.onChange(Number(event.target.value))}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="paidFromAccountId"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              select
              label="Paid From"
              fullWidth
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            >
              {(accounts ?? []).map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.code} · {account.name} (
                  {formatPeso(account.currentBalance)})
                </MenuItem>
              ))}
            </CustomTextField>
          )}
        />
        <Controller
          control={form.control}
          name="reference"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              label="Reference"
              fullWidth
              error={Boolean(fieldState.error)}
              helperText={
                fieldState.error?.message ??
                "Cheque, transfer, or transaction reference."
              }
            />
          )}
        />
        <Controller
          control={form.control}
          name="notes"
          render={({ field }) => (
            <CustomTextField
              {...field}
              label="Notes"
              multiline
              minRows={2}
              fullWidth
            />
          )}
        />
        <Typography variant="caption" color="text.secondary">
          Posted payments are immutable. Corrections require voiding this
          payment and recording a replacement.
        </Typography>
      </Stack>
    </CustomDialog>
  );
}
