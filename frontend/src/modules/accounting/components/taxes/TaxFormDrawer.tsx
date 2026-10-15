"use client";

import { useEffect } from "react";

import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { TaxPayload, TaxResource } from "../../api/types";
import { taxSchema, type TaxFormValues } from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";

const defaults: TaxFormValues = { name: "", code: "", rate: 0, status: "active" };

type Props = {
  open: boolean;
  onClose: () => void;
  editing: TaxResource | null;
  isSubmitting: boolean;
  onSubmit: (payload: TaxPayload) => Promise<unknown>;
};

const TaxFormDrawer = ({
  open,
  onClose,
  editing,
  isSubmitting,
  onSubmit,
}: Props) => {
  const isEdit = Boolean(editing);

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;

    form.reset(
      editing
        ? {
            name: editing.name,
            code: editing.code ?? "",
            rate: editing.rate,
            status: editing.status,
          }
        : defaults,
    );
  }, [open, editing, form]);

  const submit = form.handleSubmit(async (values) => {
    const payload: TaxPayload = {
      name: values.name,
      code: values.code || null,
      rate: values.rate,
      status: values.status,
    };

    try {
      await onSubmit(payload);
      toast.success(isEdit ? "Tax updated." : "Tax created.");
      onClose();
    } catch (error) {
      if (!applyApiErrorsToForm(error, form.setError)) {
        toast.error(
          getAccountingErrorMessage(error, "The tax could not be saved."),
        );
      }
    }
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={440}
      title={isEdit ? "Edit Tax" : "Create Tax"}
      subtitle={
        isEdit ? "Modify this tax rate." : "Add a tax rate for journal lines."
      }
    >
      <Stack component="form" onSubmit={submit} spacing={4} sx={{ p: 5 }}>
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
        <Controller
          control={form.control}
          name="rate"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              onChange={(event) => field.onChange(Number(event.target.value) || 0)}
              type="number"
              label="Rate (%)"
              size="small"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => (
            <CustomTextField {...field} fullWidth label="Code (optional)" />
          )}
        />
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value === "active"}
                  onChange={(event) =>
                    field.onChange(event.target.checked ? "active" : "inactive")
                  }
                />
              }
              label={field.value === "active" ? "Active" : "Inactive"}
            />
          )}
        />

        <Typography variant="caption" color="text.secondary">
          Taxes already used on entries cannot be deleted — deactivate instead.
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save" : "Create"}
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

export default TaxFormDrawer;
