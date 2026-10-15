"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { AmendmentResource } from "../../api/types";
import {
  amendmentSchema,
  type AmendmentFormValues,
} from "../../schemas/electionSchemas";

type Props = {
  open: boolean;
  amendment: AmendmentResource | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: AmendmentFormValues) => Promise<void>;
};

const defaults: AmendmentFormValues = {
  proposedBy: "",
  title: "",
  originalContent: "",
  proposedContent: "",
  effect: "",
};

export default function AmendmentFormDrawer({
  open,
  amendment,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<AmendmentFormValues>({
    resolver: zodResolver(amendmentSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      amendment
        ? {
            proposedBy: amendment.proposed_by ?? "",
            title: amendment.title,
            originalContent: amendment.original_content,
            proposedContent: amendment.proposed_content,
            effect: amendment.effect ?? "",
          }
        : defaults,
    );
  }, [open, amendment, form]);

  const text = (
    name: keyof AmendmentFormValues,
    label: string,
    multiline = false,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <CustomTextField
          {...field}
          required
          multiline={multiline}
          minRows={multiline ? 4 : undefined}
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={amendment ? "Edit Amendment Proposal" : "New Amendment Proposal"}
      subtitle="Members will vote to agree or disagree."
      width="min(92vw, 640px)"
    >
      <Stack
        component="form"
        spacing={3}
        sx={{ p: 5 }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {text("proposedBy", "Proposed By")}
        {text("title", "Proposal Title")}
        {text("originalContent", "Original Content", true)}
        {text("proposedContent", "Proposed Content", true)}
        {text("effect", "Effect", true)}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {amendment ? "Save Changes" : "Create Proposal"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
