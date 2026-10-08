"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { MemberResource } from "../../api/types";
import {
  memberSchema,
  type MemberFormValues,
} from "../../schemas/electionSchemas";

type Props = {
  open: boolean;
  member: MemberResource | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => Promise<void>;
};

const defaults: MemberFormValues = {
  memberCode: "",
  name: "",
  birthDate: "",
  address: "",
  isDelinquent: false,
};

export default function MemberFormDrawer({
  open,
  member,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      member
        ? {
            memberCode: member.member_code,
            name: member.name,
            birthDate: member.birth_date?.slice(0, 10) ?? "",
            address: member.address ?? "",
            isDelinquent: member.is_delinquent,
          }
        : defaults,
    );
  }, [open, member, form]);

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={member ? "Edit Member" : "New Member"}
      subtitle="Member identity and voting standing."
      width="min(92vw, 520px)"
    >
      <Stack
        component="form"
        spacing={3}
        sx={{ p: 5 }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Controller
          control={form.control}
          name="memberCode"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              label="Member Code"
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
              required
              label="Full Name"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              type="date"
              label="Birth Date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(fieldState.error)}
              helperText={
                fieldState.error?.message ??
                "Members under 18 cannot vote. Leave blank to skip the age check."
              }
            />
          )}
        />
        <Controller
          control={form.control}
          name="address"
          render={({ field }) => (
            <CustomTextField {...field} multiline minRows={2} label="Address" />
          )}
        />
        <Controller
          control={form.control}
          name="isDelinquent"
          render={({ field }) => (
            <FormControlLabel
              label="Delinquent (past due) — cannot vote"
              control={
                <Switch
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              }
            />
          )}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {member ? "Save Changes" : "Create Member"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
