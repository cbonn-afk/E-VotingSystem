import { z } from "zod";

const baseUserSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(255),
  email: z.email("Enter a valid email address.").max(255),
  status: z.enum(["Active", "Inactive"]),
  accountType: z.enum(["System", "Employee", "Partner"]),
  roleIds: z.array(z.number()),
  temporaryPassword: z.string(),
  confirmPassword: z.string(),
  requirePasswordChange: z.boolean(),
  allowUnassigned: z.boolean(),
});

export const editUserSchema = baseUserSchema;

export const createUserSchema = baseUserSchema.superRefine(
  (values, context) => {
    if (values.temporaryPassword.length < 8) {
      context.addIssue({
        code: "custom",
        path: ["temporaryPassword"],
        message: "Use at least 8 characters for the temporary password.",
      });
    }

    if (values.confirmPassword !== values.temporaryPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Password confirmation does not match.",
      });
    }
  },
);

export type UserFormValues = z.infer<typeof baseUserSchema>;
