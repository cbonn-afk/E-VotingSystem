"use client";

import { useEffect, useRef } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

import { Controller, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";

import CustomTextField from "@core/components/mui/TextField";

import type { AccountResource, TaxResource } from "../../api/types";
import type { JournalFormValues } from "../../schemas/accountingSchemas";

type JournalItemRowProps = {
  index: number;
  control: Control<JournalFormValues>;
  isLastRow: boolean;
  isSubmitting: boolean;
  onAppend: () => void;
  isDeleteDisabled: boolean;
  onRemove: () => void;
  accounts: AccountResource[];
  taxes: TaxResource[];
  shouldAutoFocus: boolean;
};

const JournalItemRow = ({
  index,
  control,
  isLastRow,
  isSubmitting,
  onAppend,
  isDeleteDisabled,
  onRemove,
  accounts,
  taxes,
  shouldAutoFocus,
}: JournalItemRowProps) => {
  const accountRef = useRef<HTMLInputElement>(null);

  // Focus the account field automatically when a fresh row is appended.
  useEffect(() => {
    if (index > 1 && shouldAutoFocus) accountRef.current?.focus();
  }, [index, shouldAutoFocus]);

  const debitValue = useWatch({ control, name: `items.${index}.debit` });
  const creditValue = useWatch({ control, name: `items.${index}.credit` });
  const hasDebit = Number(debitValue) > 0;
  const hasCredit = Number(creditValue) > 0;

  return (
    <TableRow>
      <TableCell sx={{ width: "22%" }}>
        <Controller
          name={`items.${index}.accountId`}
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              openOnFocus
              size="small"
              options={accounts}
              disabled={isSubmitting}
              groupBy={(option) => option.type}
              getOptionLabel={(account) => `(${account.code}) ${account.name}`}
              isOptionEqualToValue={(account, value) => account.id === value.id}
              value={accounts.find((account) => account.id === field.value) ?? null}
              onChange={(_, account) => field.onChange(account ? account.id : "")}
              renderInput={(params) => (
                <CustomTextField
                  {...params}
                  inputRef={accountRef}
                  error={Boolean(fieldState.error)}
                  placeholder="Select account"
                />
              )}
            />
          )}
        />
      </TableCell>

      <TableCell sx={{ width: "24%" }}>
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              fullWidth
              disabled={isSubmitting}
              placeholder="Description"
            />
          )}
        />
      </TableCell>

      <TableCell sx={{ width: "16%" }}>
        <Controller
          name={`items.${index}.taxId`}
          control={control}
          render={({ field }) => (
            <Autocomplete
              openOnFocus
              size="small"
              options={taxes}
              disabled={isSubmitting}
              getOptionLabel={(tax) => `${tax.name} [${tax.rate}%]`}
              isOptionEqualToValue={(tax, value) => tax.id === value.id}
              value={taxes.find((tax) => tax.id === field.value) ?? null}
              onChange={(_, tax) => field.onChange(tax ? tax.id : "")}
              renderInput={(params) => (
                <CustomTextField {...params} placeholder="Select tax" />
              )}
            />
          )}
        />
      </TableCell>

      <TableCell align="right" sx={{ width: "16%" }}>
        <Controller
          name={`items.${index}.debit`}
          control={control}
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              type="number"
              disabled={hasCredit || isSubmitting}
              error={Boolean(fieldState.error)}
              onChange={(event) => field.onChange(Number(event.target.value) || 0)}
              onFocus={(event) => event.target.select()}
              onKeyDown={(event) => {
                if (
                  event.key === "Tab" &&
                  !event.shiftKey &&
                  hasDebit &&
                  !hasCredit &&
                  isLastRow
                ) {
                  event.preventDefault();
                  onAppend();
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
              inputProps={{ style: { textAlign: "right" } }}
            />
          )}
        />
      </TableCell>

      <TableCell align="right" sx={{ width: "16%" }}>
        <Controller
          name={`items.${index}.credit`}
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              fullWidth
              type="number"
              disabled={hasDebit || isSubmitting}
              onChange={(event) => field.onChange(Number(event.target.value) || 0)}
              onFocus={(event) => event.target.select()}
              onKeyDown={(event) => {
                if (event.key === "Tab" && !event.shiftKey && isLastRow) {
                  event.preventDefault();
                  onAppend();
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
              inputProps={{ style: { textAlign: "right" } }}
            />
          )}
        />
      </TableCell>

      <TableCell align="center" sx={{ width: "6%" }}>
        <IconButton
          size="small"
          color="error"
          tabIndex={-1}
          onClick={onRemove}
          disabled={isDeleteDisabled || isSubmitting}
        >
          <i className="bx-trash" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default JournalItemRow;
