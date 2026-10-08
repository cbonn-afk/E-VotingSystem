import { z } from "zod";

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .max(100)
    .regex(
      /^[A-Za-z][A-Za-z0-9 _-]*$/,
      "Use letters, numbers, spaces, underscores, or hyphens.",
    ),
  description: z.string(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission."),
  status: z.literal("Active"),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
