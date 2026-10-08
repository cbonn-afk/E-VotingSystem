"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomAvatar from "@core/components/mui/Avatar";
import CustomTextField from "@core/components/mui/TextField";
import { useSettings } from "@core/hooks/useSettings";
import type { Mode } from "@core/types";

import { ApiError } from "@/libs/api/apiError";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { useUpdateProfile } from "@/modules/auth/hooks/useUpdateProfile";
import { useChangePassword } from "@/modules/auth/hooks/useChangePassword";
import AvatarCropperDialog from "@/modules/auth/components/AvatarCropperDialog";
import {
  ACCEPTED_AVATAR_TYPES,
  MAX_SOURCE_IMAGE_SIZE,
  mapProfileRequest,
  profileSchema,
  type ProfileFormValues,
} from "@/modules/auth/schemas/profileSchema";
import {
  changePasswordSchema,
  mapChangePasswordRequest,
  type ChangePasswordFormValues,
} from "@/modules/auth/schemas/changePasswordSchema";

const profileFieldMap: Record<string, keyof ProfileFormValues> = {
  name: "name",
  email: "email",
  phone: "phone",
  address: "address",
  theme_preference: "themePreference",
};

const passwordFieldMap: Record<string, keyof ChangePasswordFormValues> = {
  current_password: "currentPassword",
  password: "password",
  password_confirmation: "passwordConfirmation",
};

const ProfileSection = () => {
  const currentUser = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const { settings, updateSettings } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [cropperSource, setCropperSource] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      themePreference: "system",
    },
  });

  // Hydrate the form once the current user is available.
  useEffect(() => {
    const user = currentUser.data;

    if (!user) return;

    reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      themePreference: user.theme_preference,
    });
  }, [currentUser.data, reset]);

  // Clean up object URLs created for the avatar preview / cropper source.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (cropperSource) URL.revokeObjectURL(cropperSource);
    };
  }, [cropperSource]);

  // Open the cropper with the freshly picked file.
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_SIZE) {
      toast.error("Image must be 12 MB or smaller.");
      return;
    }

    if (cropperSource) URL.revokeObjectURL(cropperSource);

    setCropperSource(URL.createObjectURL(file));
  };

  // Receive the cropped square image from the cropper dialog.
  const handleCropped = (file: File) => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);

    if (cropperSource) URL.revokeObjectURL(cropperSource);
    setCropperSource(null);
  };

  const handleCropCancel = () => {
    if (cropperSource) URL.revokeObjectURL(cropperSource);
    setCropperSource(null);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const user = await updateProfile.mutateAsync(
        mapProfileRequest({ values, avatarFile, removeAvatar }),
      );

      // Apply the saved theme to the live UI immediately.
      if (settings.mode !== (user.theme_preference as Mode)) {
        updateSettings({ mode: user.theme_preference as Mode });
      }

      setAvatarFile(null);
      setRemoveAvatar(false);

      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);

      toast.success("Profile updated.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        let hasFieldError = false;

        Object.entries(error.errors).forEach(([field, messages]) => {
          const formField = profileFieldMap[field];

          if (!formField || !messages[0]) return;
          hasFieldError = true;
          setError(formField, { type: "server", message: messages[0] });
        });

        if (hasFieldError) return;
      }

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile. Please try again.",
      );
    }
  });

  const displayedAvatar =
    avatarPreview ?? (removeAvatar ? undefined : currentUser.data?.avatar_url) ?? undefined;

  return (
    <Card>
      <CardContent>
        <Stack component="form" spacing={6} noValidate onSubmit={onSubmit}>
          <div>
            <Typography variant="h5">Profile</Typography>
            <Typography variant="body2" color="text.secondary">
              Update your contact details and profile photo.
            </Typography>
          </div>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={4}
            className="items-center sm:items-start"
          >
            <CustomAvatar size={90} alt="Profile photo" src={displayedAvatar}>
              {currentUser.data?.name?.charAt(0).toUpperCase()}
            </CustomAvatar>
            <Stack spacing={2} className="items-center sm:items-start">
              <Stack direction="row" spacing={2}>
                <Button
                  type="button"
                  variant="contained"
                  size="small"
                  startIcon={<i className="bx-upload" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload photo
                </Button>
                <Button
                  type="button"
                  variant="tonal"
                  color="secondary"
                  size="small"
                  disabled={!displayedAvatar}
                  onClick={handleRemoveAvatar}
                >
                  Remove
                </Button>
              </Stack>
              <Typography variant="body2" color="text.disabled">
                JPG, PNG, or WebP. You can crop and rotate before saving.
              </Typography>
            </Stack>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept={ACCEPTED_AVATAR_TYPES.join(",")}
              onChange={handleAvatarChange}
            />
          </Stack>

          <AvatarCropperDialog
            open={Boolean(cropperSource)}
            imageSrc={cropperSource}
            onCancel={handleCropCancel}
            onCropped={handleCropped}
          />

          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Full Name"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="email"
                    label="Email"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    placeholder="0917 123 4567"
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="themePreference"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Theme Preference"
                    error={Boolean(errors.themePreference)}
                    helperText={
                      errors.themePreference?.message ??
                      "Saved to your account and applied across devices."
                    }
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    multiline
                    minRows={2}
                    label="Address"
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box className="flex justify-end">
            <Button
              variant="contained"
              type="submit"
              disabled={updateProfile.isPending}
              startIcon={
                updateProfile.isPending ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <i className="bx-save" />
                )
              }
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const SecuritySection = () => {
  const changePassword = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      await changePassword.mutateAsync(mapChangePasswordRequest(values));
      reset();
      toast.success("Password updated.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        let hasFieldError = false;

        Object.entries(error.errors).forEach(([field, messages]) => {
          const formField = passwordFieldMap[field];

          if (!formField || !messages[0]) return;
          hasFieldError = true;
          setError(formField, { type: "server", message: messages[0] });
        });

        if (hasFieldError) return;
      }

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to change your password. Please try again.",
      );
    }
  });

  return (
    <Card>
      <CardContent>
        <Stack component="form" spacing={6} noValidate onSubmit={onSubmit}>
          <div>
            <Typography variant="h5">Security</Typography>
            <Typography variant="body2" color="text.secondary">
              Change the password you use to sign in.
            </Typography>
          </div>

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Grid container spacing={5}>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                type={showCurrent ? "text" : "password"}
                label="Current Password"
                autoComplete="current-password"
                placeholder="············"
                error={Boolean(errors.currentPassword)}
                helperText={errors.currentPassword?.message}
                {...register("currentPassword")}
                slotProps={{
                  input: {
                    endAdornment: (
                      <i
                        role="button"
                        aria-label="Toggle current password"
                        className={`cursor-pointer ${showCurrent ? "bx-hide" : "bx-show"}`}
                        onClick={() => setShowCurrent((value) => !value)}
                      />
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type={showNew ? "text" : "password"}
                label="New Password"
                autoComplete="new-password"
                placeholder="············"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register("password")}
                slotProps={{
                  input: {
                    endAdornment: (
                      <i
                        role="button"
                        aria-label="Toggle new password"
                        className={`cursor-pointer ${showNew ? "bx-hide" : "bx-show"}`}
                        onClick={() => setShowNew((value) => !value)}
                      />
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type={showNew ? "text" : "password"}
                label="Confirm New Password"
                autoComplete="new-password"
                placeholder="············"
                error={Boolean(errors.passwordConfirmation)}
                helperText={errors.passwordConfirmation?.message}
                {...register("passwordConfirmation")}
              />
            </Grid>
          </Grid>

          <Box className="flex justify-end">
            <Button
              variant="contained"
              type="submit"
              disabled={changePassword.isPending}
              startIcon={
                changePassword.isPending ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <i className="bx-lock-alt" />
                )
              }
            >
              {changePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const AccountSettings = () => {
  return (
    <Box className="p-6">
      <Stack spacing={6} className="mli-auto is-full max-is-[900px]">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          className="sm:items-center sm:justify-between"
        >
          <div>
            <Typography variant="h4">My User Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your personal details, appearance, and password.
            </Typography>
          </div>
          <Button
            component={Link}
            href="/home"
            variant="tonal"
            color="secondary"
            startIcon={<i className="bx-home-alt" />}
            className="self-start"
          >
            Back to Home
          </Button>
        </Stack>
        <Divider />
        <ProfileSection />
        <SecuritySection />
      </Stack>
    </Box>
  );
};

export default AccountSettings;
