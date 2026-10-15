import { z } from "zod";

import type { ThemePreference } from "@/modules/auth/types";

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB — backend limit on the cropped upload
export const MAX_SOURCE_IMAGE_SIZE = 12 * 1024 * 1024; // 12 MB — source picked before cropping
export const ACCEPTED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  themePreference: z.enum(["light", "dark", "system"]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export type ProfileMutationInput = {
  values: ProfileFormValues;
  avatarFile?: File | null;
  removeAvatar?: boolean;
};

export const mapProfileRequest = ({
  values,
  avatarFile,
  removeAvatar,
}: ProfileMutationInput): FormData => {
  const formData = new FormData();

  formData.append("name", values.name);
  formData.append("email", values.email);
  formData.append("phone", values.phone ?? "");
  formData.append("address", values.address ?? "");
  formData.append("theme_preference", values.themePreference);

  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  if (removeAvatar) {
    formData.append("remove_avatar", "1");
  }

  return formData;
};

export const themePreferenceLabel: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};
