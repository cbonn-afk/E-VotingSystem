"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFieldArray, useForm, type Path } from "react-hook-form";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import { useSaveLoanProduct } from "../hooks/useLoanProducts";
import {
  emptyProductForm,
  loanProductSchema,
  toProductForm,
  toProductPayload,
  type LoanProductFormValues,
} from "../schemas/loanProductSchema";
import type { LoanProduct } from "../types";

type Props = { open: boolean; product: LoanProduct | null; onClose: () => void };

export default function LoanProductFormDialog({ open, product, onClose }: Props) {
  const save = useSaveLoanProduct();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<LoanProductFormValues>({ resolver: zodResolver(loanProductSchema), defaultValues: emptyProductForm });

  const documents = useFieldArray({ control, name: "documents" });
  const requiresGuarantor = watch("requires_guarantor");

  useEffect(() => {
    if (open) reset(product ? toProductForm(product) : emptyProductForm);
  }, [open, product, reset]);

  const field = (name: Exclude<Path<LoanProductFormValues>, `documents${string}`>, label: string, helper?: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField
          {...f}
          value={f.value as string}
          label={label}
          fullWidth
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helper}
        />
      )}
    />
  );

  const select = (
    name: "interest_method" | "payment_frequency" | "status",
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f }) => (
        <TextField {...f} select label={label} fullWidth>
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: product?.id ?? null, body: toProductPayload(values) });
      toast.success(product ? "Product updated." : "Product added.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // Show the server's field messages next to the matching inputs.
        Object.entries(error.errors).forEach(([name, messages]) =>
          setError(name as Path<LoanProductFormValues>, { message: messages[0] }),
        );

        return;
      }
      toast.error(error instanceof ApiError ? error.message : "The product could not be saved.");
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{product ? "Edit loan product" : "Add loan product"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4} sx={{ pt: 1 }}>
          {Object.keys(errors).length > 0 && <Alert severity="warning">Correct the highlighted fields before saving.</Alert>}

          <Typography variant="subtitle1">Basics</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>{field("code", "Code", "e.g. REG-01")}</Grid>
            <Grid size={{ xs: 12, sm: 8 }}>{field("name", "Name")}</Grid>
            <Grid size={12}>{field("description", "Description")}</Grid>
          </Grid>

          <Divider />
          <Typography variant="subtitle1">Amount, interest and term</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>{field("min_amount", "Minimum amount")}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("max_amount", "Maximum amount")}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("interest_rate", "Interest rate (% per year)")}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {select("interest_method", "Interest method", [
                { value: "diminishing", label: "Diminishing balance" },
                { value: "flat", label: "Flat rate" },
              ])}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>{field("term_min_months", "Minimum term (months)")}</Grid>
            <Grid size={{ xs: 12, sm: 4 }}>{field("term_max_months", "Maximum term (months)")}</Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {select("payment_frequency", "Payment frequency", [
                { value: "weekly", label: "Weekly" },
                { value: "semi_monthly", label: "Twice a month" },
                { value: "monthly", label: "Monthly" },
              ])}
            </Grid>
          </Grid>

          <Divider />
          <Typography variant="subtitle1">Fees and penalties</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 3 }}>{field("processing_fee_percent", "Processing fee (%)")}</Grid>
            <Grid size={{ xs: 12, sm: 3 }}>{field("service_fee_percent", "Service fee (%)")}</Grid>
            <Grid size={{ xs: 12, sm: 3 }}>{field("penalty_rate_percent", "Penalty (% per month)")}</Grid>
            <Grid size={{ xs: 12, sm: 3 }}>{field("grace_period_days", "Grace period (days)")}</Grid>
          </Grid>

          <Divider />
          <Typography variant="subtitle1">Eligibility and security</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>{field("min_membership_months", "Minimum membership (months)")}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="requires_collateral"
                control={control}
                render={({ field: f }) => (
                  <FormControlLabel
                    label="Requires collateral"
                    control={<Switch checked={f.value} onChange={(e) => f.onChange(e.target.checked)} />}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="requires_guarantor"
                control={control}
                render={({ field: f }) => (
                  <FormControlLabel
                    label="Requires guarantors"
                    control={<Switch checked={f.value} onChange={(e) => f.onChange(e.target.checked)} />}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {requiresGuarantor && field("guarantor_count", "Number of guarantors")}
            </Grid>
          </Grid>

          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Required documents</Typography>
            <Button size="small" onClick={() => documents.append({ name: "", is_required: true })}>
              Add document
            </Button>
          </Stack>
          {documents.fields.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No documents listed. Members will not be asked to upload anything for this product.
            </Typography>
          )}
          {documents.fields.map((row, index) => (
            <Stack key={row.id} direction="row" spacing={2} alignItems="flex-start">
              <Controller
                name={`documents.${index}.name`}
                control={control}
                render={({ field: f, fieldState }) => (
                  <TextField
                    {...f}
                    label="Document"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name={`documents.${index}.is_required`}
                control={control}
                render={({ field: f }) => (
                  <FormControlLabel
                    label="Required"
                    control={<Checkbox checked={f.value} onChange={(e) => f.onChange(e.target.checked)} />}
                  />
                )}
              />
              <IconButton aria-label="Remove document" onClick={() => documents.remove(index)}>
                <i className="bx bx-trash" />
              </IconButton>
            </Stack>
          ))}

          <Divider />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              {select("status", "Status", [
                { value: "active", label: "Active: members can apply" },
                { value: "inactive", label: "Inactive: hidden from members" },
              ])}
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={save.isPending} onClick={submit}>
          Save product
        </Button>
      </DialogActions>
    </Dialog>
  );
}
