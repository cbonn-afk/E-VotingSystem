"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import { Controller, useForm, type Path } from "react-hook-form";

import {
  applicationDetailsSchema,
  emptyDetails,
  toDetailsPayload,
  type ApplicationDetailsValues,
} from "../schemas/applicationSchema";
import type { ApplicationDetailsPayload, LoanProduct } from "../types";

type Props = {
  product: LoanProduct;
  defaultValues?: ApplicationDetailsValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (payload: ApplicationDetailsPayload) => void;
};

/** The same form is used to start an application and to edit a draft. */
export default function ApplicationDetailsForm({ product, defaultValues, submitLabel, pending, onSubmit }: Props) {
  const { control, handleSubmit } = useForm<ApplicationDetailsValues>({
    resolver: zodResolver(applicationDetailsSchema(product)),
    defaultValues: defaultValues ?? emptyDetails,
  });

  const field = (name: Path<ApplicationDetailsValues>, label: string, helper?: string, multiline = false) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField
          {...f}
          label={label}
          fullWidth
          multiline={multiline}
          minRows={multiline ? 2 : undefined}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helper}
        />
      )}
    />
  );

  return (
    <form noValidate onSubmit={handleSubmit((values) => onSubmit(toDetailsPayload(values)))}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          {field("amount", "Amount to borrow (PHP)", `Between ${Number(product.min_amount).toLocaleString("en-PH")} and ${Number(product.max_amount).toLocaleString("en-PH")}`)}
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          {field("term_months", "Term (months)", `Between ${product.term_min_months} and ${product.term_max_months}`)}
        </Grid>
        <Grid size={12}>{field("purpose", "Purpose of the loan", undefined, true)}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{field("monthly_income", "Monthly income (optional)")}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{field("employer_business", "Employer or business (optional)")}</Grid>
        {product.requires_collateral && (
          <>
            <Grid size={{ xs: 12, sm: 8 }}>{field("collateral_description", "Collateral", "What you are offering as security")}</Grid>
            <Grid size={{ xs: 12, sm: 4 }}>{field("collateral_value", "Estimated value (PHP)")}</Grid>
          </>
        )}
        <Grid size={12}>
          <Button type="submit" variant="contained" disabled={pending}>
            {submitLabel}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
