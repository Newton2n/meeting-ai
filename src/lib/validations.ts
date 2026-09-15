import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Meeting title is required")
    .max(200, "Meeting title must be 200 characters or less"),

  transcript: z
    .string()
    .trim()
    .min(10, "Transcript must be at least 10 characters")
    .max(100_000, "Transcript is too long"),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;