"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";
import type { VendorResource } from "../../api/types";
import { useBillPayableAccounts } from "../../hooks/useBillEntryApi";
import {
  vendorSchema,
  type VendorFormValues,
} from "../../schemas/accountingSchemas";

type Props = {
  open: boolean;
  vendor: VendorResource | null;
  initialName?: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: VendorFormValues) => Promise<void>;
};

const defaults: VendorFormValues = {
  name: "",
  legalName: "",
  tin: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  defaultPayableAccountId: "",
  notes: "",
  status: "active",
};

export default function VendorFormDrawer({
  open,
  vendor,
  initialName = "",
  saving,
  onClose,
  onSubmit,
}: Props) {
  const accountsQuery = useBillPayableAccounts();
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      vendor
        ? {
            name: vendor.name,
            legalName: vendor.legalName ?? "",
            tin: vendor.tin ?? "",
            contactPerson: vendor.contactPerson ?? "",
            email: vendor.email ?? "",
            phone: vendor.phone ?? "",
            address: vendor.address ?? "",
            defaultPayableAccountId: vendor.defaultPayableAccount?.id ?? "",
            notes: vendor.notes ?? "",
            status: vendor.status,
          }
        : { ...defaults, name: initialName },
    );
  }, [open, vendor, initialName, form]);

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={vendor ? "Edit Vendor" : "New Vendor"}
      subtitle="Vendor identity, contact details, and payable defaults."
      width="min(92vw, 620px)"
    >
      <Stack
        component="form"
        spacing={3}
        sx={{ p: 5 }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              label="Vendor Name"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="legalName"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              label="Legal Name"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          <Controller
            control={form.control}
            name="tin"
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                fullWidth
                label="TIN"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <CustomTextField {...field} fullWidth label="Contact Person" />
            )}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <CustomTextField
                {...field}
                fullWidth
                label="Email"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <CustomTextField {...field} fullWidth label="Phone" />
            )}
          />
        </Stack>
        <Controller
          control={form.control}
          name="address"
          render={({ field }) => (
            <CustomTextField {...field} multiline minRows={2} label="Address" />
          )}
        />
        <Controller
          control={form.control}
          name="defaultPayableAccountId"
          render={({ field }) => (
            <CustomTextField {...field} select label="Default Payable Account">
              <MenuItem value="">Use expense category default</MenuItem>
              {(accountsQuery.data?.data ?? []).map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.code} · {account.name}
                </MenuItem>
              ))}
            </CustomTextField>
          )}
        />
        <Controller
          control={form.control}
          name="notes"
          render={({ field }) => (
            <CustomTextField {...field} multiline minRows={3} label="Notes" />
          )}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {vendor ? "Save Changes" : "Create Vendor"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
