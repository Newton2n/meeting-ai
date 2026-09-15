import { z } from "zod";

export const updateActionItemSchema = z.object({
  task: z.string().trim().min(1).max(500).optional(),
  assignee: z.string().trim().max(200).nullable().optional(),
  dueDate: z.string().trim().max(100).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
});