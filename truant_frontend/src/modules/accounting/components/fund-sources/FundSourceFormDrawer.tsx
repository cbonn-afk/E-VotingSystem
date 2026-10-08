"use client";

import { useEffect } from "react";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
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

import type { FundSourcePayload, FundSourceResource } from "../../api/types";
import {
  fundSourceSchema,
  type FundSourceFormValues,
} from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";

const defaults: FundSourceFormValues = { name: "", code: "", status: "active" };

type Props = {
  open: boolean;
  onClose: () => void;
  editing: FundSourceResource | null;
  isSubmitting: boolean;
  initialValues?: Partial<FundSourceFormValues>;
  onSubmit: (payload: FundSourcePayload) => Promise<unknown>;
};

const FundSourceFormDrawer = ({
  open,
  onClose,
  editing,
  isSubmitting,
  initialValues,
  onSubmit,
}: Props) => {
  const isEdit = Boolean(editing);
  const isProtected = Boolean(editing?.isUsed);

  const form = useForm<FundSourceFormValues>({
    resolver: zodResolver(fundSourceSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;

    form.reset(
      editing
        ? {
            name: editing.name,
            code: editing.code ?? "",
            status: editing.status,
          }
        : {
            ...defaults,
            ...initialValues,
          },
    );
  }, [open, editing, form, initialValues]);

  const submit = form.handleSubmit(async (values) => {
    const payload: FundSourcePayload = {
      name: values.name,
      code: values.code || null,
      status: values.status,
    };

    try {
      await onSubmit(payload);
      toast.success(isEdit ? "Fund source updated." : "Fund source created.");
      onClose();
    } catch (error) {
      if (!applyApiErrorsToForm(error, form.setError)) {
        toast.error(
          getAccountingErrorMessage(
            error,
            "The fund source could not be saved.",
          ),
        );
      }
    }
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={440}
      title={isEdit ? "Edit Fund Source" : "Create Fund Source"}
      subtitle={
        isProtected
          ? "This fund source is used by journal entries."
          : isEdit
            ? "Modify this fund source."
            : "Add a fund source for journal entries."
      }
    >
      <Stack component="form" onSubmit={submit} spacing={4} sx={{ p: 5 }}>
        {isProtected && (
          <Alert severity="warning">
            <AlertTitle>Protected fund source</AlertTitle>
            Name and code are locked because journal entries already reference
            this fund source. You can still deactivate it.
          </Alert>
        )}

        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              label="Name"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              disabled={isProtected}
            />
          )}
        />
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => (
            <CustomTextField
              {...field}
              fullWidth
              label="Code (optional)"
              disabled={isProtected}
            />
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
          Fund sources already used on entries cannot be deleted — deactivate
          instead.
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

export default FundSourceFormDrawer;
