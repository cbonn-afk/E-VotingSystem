"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import CustomDrawer from "@components/app/CustomDrawer";
import CustomTextField from "@core/components/mui/TextField";

import type { AnnouncementPayload } from "../../api/inquiryApi";
import type { AnnouncementResource } from "../../api/types";
import { announcementSchema, type AnnouncementFormValues } from "../../schemas/inquirySchemas";

type Props = {
  open: boolean;
  announcement: AnnouncementResource | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: AnnouncementPayload) => Promise<void>;
};

const defaults: AnnouncementFormValues = { title: "", body: "", isPublished: true };

export default function AnnouncementFormDrawer({ open, announcement, saving, onClose, onSubmit }: Props) {
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: defaults,
  });
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImage(null);
    setRemoveImage(false);
    form.reset(
      announcement
        ? { title: announcement.title, body: announcement.body, isPublished: announcement.is_published }
        : defaults,
    );
  }, [open, announcement, form]);

  const currentImage = !removeImage ? announcement?.image_url : null;

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={announcement ? "Edit Announcement" : "New Announcement"}
      subtitle="Shown on the inquiry station when no member is signed in."
      width="min(92vw, 520px)"
    >
      <Stack
        component="form"
        spacing={3}
        sx={{ p: 5 }}
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ ...values, image, removeImage }),
        )}
      >
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              label="Title"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="body"
          render={({ field, fieldState }) => (
            <CustomTextField
              {...field}
              required
              multiline
              minRows={4}
              label="Message"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Image (optional, JPG, PNG or WebP, up to 4 MB)
          </Typography>
          {currentImage && !image && (
            <Box
              component="img"
              src={currentImage}
              alt=""
              sx={{ maxInlineSize: "100%", maxBlockSize: 180, objectFit: "cover", borderRadius: 1 }}
            />
          )}
          <Stack direction="row" spacing={2}>
            <Button component="label" variant="outlined" startIcon={<i className="bx bx-image-add" />}>
              {image ? image.name : "Choose image"}
              <input
                hidden
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  setImage(event.target.files?.[0] ?? null);
                  setRemoveImage(false);
                }}
              />
            </Button>
            {announcement?.image_url && !image && (
              <Button color="error" onClick={() => setRemoveImage((value) => !value)}>
                {removeImage ? "Keep image" : "Remove image"}
              </Button>
            )}
          </Stack>
        </Stack>

        <Controller
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormControlLabel
              label="Published (visible on the station)"
              control={
                <Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />
              }
            />
          )}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {announcement ? "Save Changes" : "Post Announcement"}
          </Button>
        </Stack>
      </Stack>
    </CustomDrawer>
  );
}
