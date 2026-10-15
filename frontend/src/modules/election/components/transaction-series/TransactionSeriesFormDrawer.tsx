"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type {
  TransactionSeriesPayload,
  TransactionSeriesResource,
} from "../../api/types";
import {
  transactionSeriesSchema,
  type TransactionSeriesFormValues,
} from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";

const defaults: TransactionSeriesFormValues = {
  name: "",
  prefix: "",
  nextNumber: 1,
  padding: 4,
  resetInterval: "never",
  status: "active",
};

type Props = {
  open: boolean;
  onClose: () => void;
  editing: TransactionSeriesResource | null;
  isSubmitting: boolean;
  onSubmit: (payload: TransactionSeriesPayload) => Promise<unknown>;
};

const TransactionSeriesFormDrawer = ({
  open,
  onClose,
  editing,
  isSubmitting,
  onSubmit,
}: Props) => {
  const isEdit = Boolean(editing);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<TransactionSeriesFormValues | null>(
    null,
  );

  const form = useForm<TransactionSeriesFormValues>({
    resolver: zodResolver(transactionSeriesSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;

    form.reset(
      editing
        ? {
            name: editing.name,
            prefix: editing.prefix,
            nextNumber: editing.nextNumber,
            padding: editing.padding,
            resetInterval: editing.resetInterval,
            status: editing.status,
          }
        : defaults,
    );
  }, [open, editing, form]);

  const persist = async (values: TransactionSeriesFormValues) => {
    const payload: TransactionSeriesPayload = {
      name: values.name,
      prefix: values.prefix,
      next_number: values.nextNumber,
      padding: values.padding,
      reset_interval: values.resetInterval,
      status: values.status,
    };

    try {
      await onSubmit(payload);
      toast.success(isEdit ? "Series updated." : "Series created.");
      onClose();
    } catch (error) {
      if (!applyApiErrorsToForm(error, form.setError, { next_number: "nextNumber" })) {
        toast.error(
          getAccountingErrorMessage(error, "The series could not be saved."),
        );
      }
    }
  };

  const submit = form.handleSubmit((values) => {
    // Editing a series that already allocated numbers can shift future numbering.
    if (editing?.isUsed) {
      setPending(values);
      setConfirmOpen(true);

      return;
    }

    void persist(values);
  });

  const prefixPreview = `${(form.watch("prefix") || "JE").toUpperCase()}-${String(
    form.watch("nextNumber") || 1,
  ).padStart(Number(form.watch("padding")) || 4, "0")}`;

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={460}
      title={isEdit ? "Edit Series" : "Create Series"}
      subtitle={
        isEdit
          ? "Modify this numbering series."
          : "Configure a new journal numbering series."
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
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="prefix"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              label="Prefix"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Stack direction="row" spacing={3}>
          <Controller
            control={form.control}
            name="nextNumber"
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                type="number"
                label="Next number"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="padding"
            render={({ field }) => (
              <CustomTextField
                {...field}
                onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                type="number"
                label="Padding"
                fullWidth
              />
            )}
          />
        </Stack>
        <Controller
          control={form.control}
          name="resetInterval"
          render={({ field }) => (
            <FormControl size="small" fullWidth>
              <InputLabel>Reset interval</InputLabel>
              <Select {...field} label="Reset interval">
                <MenuItem value="never">Never</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
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

        <Box
          sx={{
            p: 3,
            borderRadius: 1,
            backgroundColor: "action.hover",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Preview
          </Typography>
          <Typography variant="h6">{prefixPreview}</Typography>
        </Box>

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

      <CustomDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        closeAfterTransition
        width="440px"
        title="Update a series in use?"
        icon={<i className="bx bx-error-circle text-warning" />}
        description="This series has already allocated numbers. Changing it may affect future numbering."
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setConfirmOpen(false);
                if (pending) void persist(pending);
              }}
            >
              Update anyway
            </Button>
          </>
        }
      >
        <span />
      </CustomDialog>
    </CustomDrawer>
  );
};

export default TransactionSeriesFormDrawer;
