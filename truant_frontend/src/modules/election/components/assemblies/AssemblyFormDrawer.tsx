"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { AssemblyResource } from "../../api/types";
import {
  assemblySchema,
  type AssemblyFormValues,
} from "../../schemas/electionSchemas";

type Props = {
  open: boolean;
  assembly: AssemblyResource | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: AssemblyFormValues) => Promise<void>;
};

export default function AssemblyFormDrawer({
  open,
  assembly,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<AssemblyFormValues>({
    resolver: zodResolver(assemblySchema),
    defaultValues: { year: "", name: "" },
  });

  useEffect(() => {
    if (!open) return;
    const year = new Date().getFullYear();

    form.reset(
      assembly
        ? { year: String(assembly.year), name: assembly.name }
        : { year: String(year), name: `General Assembly ${year}` },
    );
  }, [open, assembly, form]);

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={assembly ? "Rename Assembly" : "New Assembly"}
      subtitle="One assembly per year."
      width="min(92vw, 460px)"
    >
      <Stack
        component="form"
        spacing={3}
        sx={{ p: 5 }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Controller
          control={form.control}
          name="year"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              label="Year"
              disabled={Boolean(assembly)}
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
              label="Name"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {assembly ? "Save Changes" : "Create Assembly"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
