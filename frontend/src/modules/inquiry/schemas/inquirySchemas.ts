import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(255),
  body: z.string().trim().min(1, "Message is required.").max(5000),
  isPublished: z.boolean(),
});
export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
