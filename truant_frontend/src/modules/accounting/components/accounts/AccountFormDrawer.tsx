"use client";

import { useEffect, useMemo } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import CustomTextField from "@core/components/mui/TextField";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import CustomDrawer from "@components/app/CustomDrawer";

import { useAccountTypes, useDetailTypes } from "../../hooks/useAccountingApi";
import type { AccountPayload, AccountResource } from "../../api/types";
import {
  accountDefaults,
  accountSchema,
  type AccountFormValues,
} from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { ACCOUNT_TYPES, type ParentOption } from "./accountsShared";

const errorKeyMap = {
  is_posting: "isPosting",
  is_contra: "isContra",
  parent_id: "parentId",
  account_type_id: "accountTypeId",
  detail_type_id: "detailTypeId",
} as const;

type AccountFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  editing: AccountResource | null;
  parentOptions: ParentOption[];
  isSubmitting: boolean;
  onSubmit: (payload: AccountPayload) => Promise<unknown>;
};

const toFormValues = (account: AccountResource): AccountFormValues => ({
  code: account.code,
  name: account.name,
  type: account.type,
  parentId: account.parentId ?? "",
  accountTypeId: account.accountTypeId ? String(account.accountTypeId) : "",
  detailTypeId: account.detailTypeId ? String(account.detailTypeId) : "",
  isPosting: account.isPosting,
  isContra: account.isContra,
  status: account.status,
  description: account.description ?? "",
});

const AccountFormDrawer = ({
  open,
  onClose,
  editing,
  parentOptions,
  isSubmitting,
  onSubmit,
}: AccountFormDrawerProps) => {
  const isEdit = Boolean(editing);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: accountDefaults,
  });

  const { control, handleSubmit, register, reset, setValue, setError, formState } =
    form;

  const coreType = useWatch({ control, name: "type" });
  const accountTypeId = useWatch({ control, name: "accountTypeId" });

  const accountTypesQuery = useAccountTypes();
  const detailTypesQuery = useDetailTypes(
    accountTypeId ? Number(accountTypeId) : null,
  );

  // Account types are filtered to the selected core type (their `category`).
  const filteredAccountTypes = useMemo(
    () =>
      (accountTypesQuery.data?.data ?? []).filter(
        (option) => option.category === coreType,
      ),
    [accountTypesQuery.data, coreType],
  );

  // Valid parents: same core type, non-posting (folder), and never itself.
  const availableParents = useMemo(
    () =>
      parentOptions.filter(
        (option) =>
          option.type === coreType &&
          !option.isPosting &&
          option.id !== editing?.id,
      ),
    [parentOptions, coreType, editing?.id],
  );

  useEffect(() => {
    if (open) {
      reset(editing ? toFormValues(editing) : accountDefaults);
    }
  }, [open, editing, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: AccountPayload = {
      code: values.code,
      name: values.name,
      type: values.type,
      parent_id: values.parentId || null,
      account_type_id: values.accountTypeId ? Number(values.accountTypeId) : null,
      detail_type_id: values.detailTypeId ? Number(values.detailTypeId) : null,
      is_posting: values.isPosting,
      is_contra: values.isContra,
      status: values.status,
      description: values.description || null,
    };

    try {
      await onSubmit(payload);
      toast.success(isEdit ? `${values.code} updated.` : `${values.code} created.`);
      onClose();
    } catch (error) {
      if (!applyApiErrorsToForm(error, setError, errorKeyMap)) {
        toast.error(
          getAccountingErrorMessage(error, "The account could not be saved."),
        );
      }
    }
  });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      width={460}
      title={isEdit ? "Edit Account" : "Create Account"}
      subtitle={
        isEdit
          ? "Update the details of this account."
          : "Add a new account to the chart."
      }
    >
      <Stack
        component="form"
        onSubmit={submit}
        spacing={4}
        sx={{ p: 5 }}
      >
        <Controller
          control={control}
          name="code"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              fullWidth
              label="Code"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
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
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <FormControl size="small" fullWidth error={Boolean(fieldState.error)}>
              <InputLabel>Core Type</InputLabel>
              <Select
                {...field}
                label="Core Type"
                disabled={isEdit}
                onChange={(event) => {
                  field.onChange(event.target.value);
                  // Dependent classification + parent must be re-picked.
                  setValue("accountTypeId", "");
                  setValue("detailTypeId", "");
                  setValue("parentId", "");
                }}
              >
                {ACCOUNT_TYPES.map((option) => (
                  <MenuItem key={option} value={option} className="capitalize">
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {fieldState.error?.message ??
                  (isEdit ? "Core type cannot be changed." : "Select the core type.")}
              </FormHelperText>
            </FormControl>
          )}
        />

        <Controller
          control={control}
          name="accountTypeId"
          render={({ field }) => (
            <FormControl size="small" fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                {...field}
                label="Account Type"
                onChange={(event) => {
                  field.onChange(event.target.value);
                  setValue("detailTypeId", "");
                }}
              >
                <MenuItem value="">None</MenuItem>
                {filteredAccountTypes.map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Optional classification.</FormHelperText>
            </FormControl>
          )}
        />

        <Controller
          control={control}
          name="detailTypeId"
          render={({ field }) => (
            <FormControl size="small" fullWidth>
              <InputLabel>Detail Type</InputLabel>
              <Select
                {...field}
                label="Detail Type"
                disabled={!accountTypeId}
              >
                <MenuItem value="">None</MenuItem>
                {(detailTypesQuery.data?.data ?? []).map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />

        <Controller
          control={control}
          name="parentId"
          render={({ field }) => (
            <FormControl size="small" fullWidth>
              <InputLabel>Parent Account</InputLabel>
              <Select
                {...field}
                label="Parent Account"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value)}
              >
                <MenuItem value="">None (top-level)</MenuItem>
                {availableParents.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    <Box sx={{ pl: option.level * 2 }}>
                      {option.code} — {option.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Only non-posting folders of the same type can be parents.
              </FormHelperText>
            </FormControl>
          )}
        />

        <Controller
          control={control}
          name="isPosting"
          render={({ field }) => (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label={field.value ? "Posting account" : "Non-posting folder"}
              />
              <FormHelperText sx={{ mt: -1 }}>
                Turn off for a folder that only groups child accounts.
              </FormHelperText>
            </Box>
          )}
        />

        <Controller
          control={control}
          name="isContra"
          render={({ field }) => (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    disabled={isEdit}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label="Contra account"
              />
              <FormHelperText sx={{ mt: -1 }}>
                {isEdit
                  ? "Contra setting is fixed after creation."
                  : "Reverses the normal balance for this account."}
              </FormHelperText>
            </Box>
          )}
        />

        <CustomTextField
          label="Description"
          fullWidth
          multiline
          minRows={2}
          {...register("description")}
          error={Boolean(formState.errors.description)}
          helperText={formState.errors.description?.message}
        />

        {isEdit && (
          <Controller
            control={control}
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
        )}

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

        <Typography variant="caption" color="text.secondary">
          Accounts with posted journal lines cannot be deleted — deactivate
          them instead.
        </Typography>
      </Stack>
    </CustomDrawer>
  );
};

export default AccountFormDrawer;
