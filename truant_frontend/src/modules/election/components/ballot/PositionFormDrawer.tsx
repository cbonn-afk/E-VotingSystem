"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { PositionResource } from "../../api/types";
import {
  positionSchema,
  type PositionFormValues,
} from "../../schemas/electionSchemas";

type Props = {
  open: boolean;
  position: PositionResource | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: PositionFormValues) => Promise<void>;
};

export default function PositionFormDrawer({
  open,
  position,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: { title: "", seats: 1 },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      position
        ? { title: position.title, seats: position.seats }
        : { title: "", seats: 1 },
    );
  }, [open, position, form]);

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={position ? "Edit Position" : "New Position"}
      subtitle="A position and how many candidates a member may vote for."
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
          name="title"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              label="Position Title"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="seats"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              type="number"
              required
              label="Number of Seats"
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
              error={Boolean(fieldState.error)}
              helperText={
                fieldState.error?.message ??
                "A member can vote for at most this many candidates."
              }
            />
          )}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {position ? "Save Changes" : "Create Position"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
