"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { CandidateResource } from "../../api/types";
import {
  candidateSchema,
  type CandidateFormValues,
} from "../../schemas/electionSchemas";

export type CandidateSubmit = CandidateFormValues & {
  photo: File | null;
  removePhoto: boolean;
};

type Props = {
  open: boolean;
  candidate: CandidateResource | null;
  positionTitle: string;
  saving: boolean;
  onClose: () => void;
  /** Resolve `true` when the save worked. */
  onSubmit: (values: CandidateSubmit) => Promise<boolean>;
};

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CandidateFormDrawer({
  open,
  candidate,
  positionTitle,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { name: "" },
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const preview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  useEffect(() => {
    if (!open) return;
    form.reset({ name: candidate?.name ?? "" });
    setPhoto(null);
    setRemovePhoto(false);
    setPhotoError(null);
  }, [open, candidate, form]);

  const shownPhoto = preview ?? (removePhoto ? null : candidate?.photo_url ?? null);

  const choosePhoto = (file: File | null) => {
    setPhotoError(null);
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Use a JPG, PNG or WebP image.");

      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("The photo must be 2 MB or smaller.");

      return;
    }

    setPhoto(file);
    setRemovePhoto(false);
  };

  const submit = (addAnother: boolean) =>
    form.handleSubmit(async (values) => {
      const saved = await onSubmit({ ...values, photo, removePhoto });

      if (saved && addAnother) {
        form.reset({ name: "" });
        setPhoto(null);
        setRemovePhoto(false);
      }
    });

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={candidate ? "Edit Candidate" : "New Candidate"}
      subtitle={positionTitle}
      width="min(92vw, 460px)"
    >
      <Stack
        component="form"
        spacing={3}
        sx={{ p: 5 }}
        onSubmit={submit(false)}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              label="Candidate Name"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Photo (optional, JPG/PNG/WebP, up to 2 MB)
          </Typography>
          {shownPhoto && (
            <Box
              component="img"
              src={shownPhoto}
              alt="Candidate"
              sx={{
                inlineSize: "100%",
                maxBlockSize: 280,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          )}
          <Stack direction="row" spacing={2}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<i className="bx bx-upload" />}
            >
              {shownPhoto ? "Change photo" : "Choose photo"}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  choosePhoto(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </Button>
            {shownPhoto && (
              <Button
                color="secondary"
                onClick={() => {
                  setPhoto(null);
                  setRemovePhoto(true);
                }}
              >
                Remove
              </Button>
            )}
          </Stack>
          {photoError && (
            <Typography variant="caption" color="error">
              {photoError}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {!candidate && (
            <Button
              variant="outlined"
              disabled={saving}
              onClick={() => void submit(true)()}
            >
              Save &amp; add another
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={saving}>
            {candidate ? "Save Changes" : "Save"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
