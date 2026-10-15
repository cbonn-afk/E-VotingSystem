import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    password: z
      .string()
      .min(8, "Use at least 8 characters for the new password."),
    passwordConfirmation: z.string().min(1, "Confirm the new password."),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Password confirmation does not match.",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export type ChangePasswordRequest = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export const mapChangePasswordRequest = (
  values: ChangePasswordFormValues,
): ChangePasswordRequest => ({
  current_password: values.currentPassword,
  password: values.password,
  password_confirmation: values.passwordConfirmation,
});
