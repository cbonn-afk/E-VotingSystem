"use client";

import { useEffect } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";
import AccountingDatePicker from "../shared/AccountingDatePicker";

import type { FiscalYearPayload } from "../../api/types";
import {
  fiscalYearSchema,
  type FiscalYearFormValues,
} from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";

type Props = {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (payload: FiscalYearPayload) => Promise<unknown>;
};

const FiscalYearFormDrawer = ({
  open,
  onClose,
  isSubmitting,
  onSubmit,
}: Props) => {
  const year = new Date().getFullYear();

  const form = useForm<FiscalYearFormValues>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues: {
      code: `FY-${year}`,
      name: `Fiscal Year ${year}`,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      isCurrent: false,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      code: `FY-${year}`,
      name: `Fiscal Year ${year}`,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      isCurrent: false,
    });
  }, [open, form, year]);

  const submit = form.handleSubmit(async (values) => {
    const payload: FiscalYearPayload = {
      code: values.code,
      name: values.name,
      start_date: values.startDate,
      end_date: values.endDate,
      is_current: values.isCurrent,
    };

    try {
      await onSubmit(payload);
      toast.success("Fiscal year created.");
      onClose();
    } catch (error) {
      if (
        !applyApiErrorsToForm(error, form.setError, {
          start_date: "startDate",
          end_date: "endDate",
        })
      ) {
        toast.error(
          getAccountingErrorMessage(
            error,
            "The fiscal year could not be created.",
          ),
        );
      }
    }
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={460}
      title="New Fiscal Year"
      subtitle="Monthly periods are generated automatically."
    >
      <Stack component="form" onSubmit={submit} spacing={4} sx={{ p: 5 }}>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              label="Code"
              size="small"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              label="Name"
              size="small"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Stack direction="row" spacing={3}>
          <Controller
            control={form.control}
            name="startDate"
            render={({ field, fieldState }) => (
              <AccountingDatePicker
                label="Start"
                value={field.value}
                onChange={field.onChange}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="endDate"
            render={({ field, fieldState }) => (
              <AccountingDatePicker
                label="End"
                value={field.value}
                onChange={field.onChange}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
        <Controller
          control={form.control}
          name="isCurrent"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              }
              label="Set as current fiscal year"
            />
          )}
        />
        <Alert severity="info">
          A fiscal year spanning Jan–Dec generates 12 monthly periods.
        </Alert>

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
          <Button
            type="button"
            variant="tonal"
            color="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
};

export default FiscalYearFormDrawer;
